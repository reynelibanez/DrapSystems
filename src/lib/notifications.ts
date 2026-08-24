


import { Resend } from 'resend';
import twilio from 'twilio';
import { getNextAvailableNumber, incrementSmsCount } from './twilio-numbers';
import { generateAppointmentConfirmationEmail } from './email-service';
import {
  getAppointmentConfirmationMessage,
  getAppointmentReminderMessage,
  getAppointmentCancellationMessage,
  type NotificationLanguage
} from './notification-messages';
import { createClient } from '@supabase/supabase-js';
import { 
  sendPushNotification, 
  isPushNotificationSupported,
  getNotificationPermission,
  type PushNotificationType 
} from './push-notifications';

// Tipos de notificaciones
export type NotificationType = 'appointment_created' | 'appointment_reminder_24h' | 'appointment_reminder_2h' | 'appointment_cancelled' | 'appointment_expired';

export interface NotificationData {
  to: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  businessName: string;
  businessAddress?: string;
  notes?: string;
  type: NotificationType;
  preferredLanguage?: NotificationLanguage;
  businessId?: string;
}

// Inicializar Resend
export function getResendInstance(apiKey: string): Resend {
  return new Resend(apiKey);
}

// Inicializar Twilio
export function getTwilioInstance(accountSid: string, authToken: string) {
  return twilio(accountSid, authToken);
}

// Plantillas de email
const emailTemplates = {
  appointment_created: async (data: NotificationData, siteUrl?: string, appointmentId?: string) => {
    const message = getAppointmentConfirmationMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      staffName: undefined,
      location: data.businessAddress,
      notes: data.notes
    }, data.preferredLanguage || 'es');

    // Generar enlace de confirmación si tenemos el appointmentId
    let confirmationUrl: string | undefined;
    if (appointmentId && siteUrl) {
      const { generateAppointmentConfirmationLink } = await import('./encryption');
      confirmationUrl = generateAppointmentConfirmationLink(appointmentId, siteUrl);
      console.log('🔐 Confirmation link generated in notifications:', confirmationUrl);
    }

    return {
      subject: message.subject || `Confirmación de Cita - ${data.businessName}`,
      html: generateAppointmentConfirmationEmail({
        clientName: data.clientName,
        serviceName: data.serviceName,
        date: data.appointmentDate,
        time: data.appointmentTime,
        notes: data.notes,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        siteUrl,
        language: data.preferredLanguage || 'es',
        appointmentId,
        confirmationUrl
      }),
    };
  },
  appointment_reminder_24h: (data: NotificationData) => {
    const message = getAppointmentReminderMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      location: data.businessAddress,
      hoursUntil: 24
    }, data.preferredLanguage || 'es');

    return {
      subject: message.subject || `Recordatorio de Cita - ${data.businessName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5AC1FF;">${data.preferredLanguage === 'en' ? 'Appointment Reminder' : 'Recordatorio de Cita'}</h2>
        <p>${data.preferredLanguage === 'en' ? 'Hello' : 'Hola'} ${data.clientName},</p>
        <p>${data.preferredLanguage === 'en' ? 'We remind you that you have an appointment tomorrow:' : 'Te recordamos que tienes una cita mañana:'}</p>
        <div style="background-color: #f6f7f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.preferredLanguage === 'en' ? 'Service' : 'Servicio'}:</strong> ${data.serviceName}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Date' : 'Fecha'}:</strong> ${data.appointmentDate}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Time' : 'Hora'}:</strong> ${data.appointmentTime}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Business' : 'Empresa'}:</strong> ${data.businessName}</p>
        </div>
        <p>${data.preferredLanguage === 'en' ? "Don't forget to attend!" : '¡No olvides asistir!'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ${data.preferredLanguage === 'en' ? 'This is an automated email, please do not reply.' : 'Este es un correo automático, por favor no responder.'}
        </p>
      </div>
    `,
    };
  },
  appointment_reminder_2h: (data: NotificationData) => {
    const message = getAppointmentReminderMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      location: data.businessAddress,
      hoursUntil: 2
    }, data.preferredLanguage || 'es');

    return {
      subject: message.subject || `Recordatorio de Cita - ${data.businessName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5AC1FF;">${data.preferredLanguage === 'en' ? 'Your appointment is soon!' : '¡Tu cita es pronto!'}</h2>
        <p>${data.preferredLanguage === 'en' ? 'Hello' : 'Hola'} ${data.clientName},</p>
        <p>${data.preferredLanguage === 'en' ? 'Your appointment is in 2 hours:' : 'Tu cita es en 2 horas:'}</p>
        <div style="background-color: #f6f7f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.preferredLanguage === 'en' ? 'Service' : 'Servicio'}:</strong> ${data.serviceName}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Date' : 'Fecha'}:</strong> ${data.appointmentDate}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Time' : 'Hora'}:</strong> ${data.appointmentTime}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Business' : 'Empresa'}:</strong> ${data.businessName}</p>
        </div>
        <p>${data.preferredLanguage === 'en' ? 'We look forward to seeing you!' : '¡Te esperamos!'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ${data.preferredLanguage === 'en' ? 'This is an automated email, please do not reply.' : 'Este es un correo automático, por favor no responder.'}
        </p>
      </div>
    `,
    };
  },
  appointment_cancelled: (data: NotificationData) => {
    const message = getAppointmentCancellationMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      staffName: undefined,
      location: data.businessAddress,
      notes: data.notes
    }, data.preferredLanguage || 'es');

    return {
      subject: message.subject || `Cita Cancelada - ${data.businessName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF5C5C;">${data.preferredLanguage === 'en' ? 'Appointment Cancelled' : 'Cita Cancelada'}</h2>
        <p>${data.preferredLanguage === 'en' ? 'Hello' : 'Hola'} ${data.clientName},</p>
        <p>${data.preferredLanguage === 'en' ? 'Your appointment has been cancelled:' : 'Tu cita ha sido cancelada:'}</p>
        <div style="background-color: #f6f7f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.preferredLanguage === 'en' ? 'Service' : 'Servicio'}:</strong> ${data.serviceName}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Date' : 'Fecha'}:</strong> ${data.appointmentDate}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Time' : 'Hora'}:</strong> ${data.appointmentTime}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Business' : 'Empresa'}:</strong> ${data.businessName}</p>
        </div>
        <p>${data.preferredLanguage === 'en' ? 'If you have any questions, please contact us.' : 'Si tienes alguna pregunta, por favor contacta con nosotros.'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ${data.preferredLanguage === 'en' ? 'This is an automated email, please do not reply.' : 'Este es un correo automático, por favor no responder.'}
        </p>
      </div>
    `,
    };
  },
  appointment_expired: (data: NotificationData) => ({
    subject: data.preferredLanguage === 'en' ? `Appointment expired - ${data.businessName}` : `Cita expirada - ${data.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF5C5C;">${data.preferredLanguage === 'en' ? 'Appointment Expired' : 'Cita Expirada'}</h2>
        <p>${data.preferredLanguage === 'en' ? 'Hello' : 'Hola'} ${data.clientName},</p>
        <p>${data.preferredLanguage === 'en' ? 'Your appointment has expired and has been automatically cancelled:' : 'Tu cita ha expirado y ha sido cancelada automáticamente:'}</p>
        <div style="background-color: #f6f7f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.preferredLanguage === 'en' ? 'Service' : 'Servicio'}:</strong> ${data.serviceName}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Date' : 'Fecha'}:</strong> ${data.appointmentDate}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Time' : 'Hora'}:</strong> ${data.appointmentTime}</p>
          <p><strong>${data.preferredLanguage === 'en' ? 'Business' : 'Empresa'}:</strong> ${data.businessName}</p>
        </div>
        <p>${data.preferredLanguage === 'en' ? 'Please schedule a new appointment if you are still interested.' : 'Por favor, agenda una nueva cita si aún estás interesado.'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ${data.preferredLanguage === 'en' ? 'This is an automated email, please do not reply.' : 'Este es un correo automático, por favor no responder.'}
        </p>
      </div>
    `,
  }),
};

// Plantillas de SMS
const smsTemplates = {
  appointment_created: (data: NotificationData) => {
    const message = getAppointmentConfirmationMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      staffName: undefined,
      location: data.businessAddress,
      notes: data.notes
    }, data.preferredLanguage || 'es');
    return message.body;
  },
  
  appointment_reminder_24h: (data: NotificationData) => {
    const message = getAppointmentReminderMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      location: data.businessAddress,
      hoursUntil: 24
    }, data.preferredLanguage || 'es');
    return message.body;
  },
  
  appointment_reminder_2h: (data: NotificationData) => {
    const message = getAppointmentReminderMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      location: data.businessAddress,
      hoursUntil: 2
    }, data.preferredLanguage || 'es');
    return message.body;
  },
  
  appointment_cancelled: (data: NotificationData) => {
    const message = getAppointmentCancellationMessage({
      clientName: data.clientName,
      businessName: data.businessName,
      serviceName: data.serviceName,
      date: data.appointmentDate,
      time: data.appointmentTime,
      staffName: undefined,
      location: data.businessAddress,
      notes: data.notes
    }, data.preferredLanguage || 'es');
    return message.body;
  },
  
  appointment_expired: (data: NotificationData) =>
    data.preferredLanguage === 'en'
      ? `Your appointment at ${data.businessName} for ${data.appointmentDate} has expired and was automatically cancelled.`
      : `Tu cita en ${data.businessName} para el ${data.appointmentDate} ha expirado y fue cancelada automáticamente.`,
};

// Enviar email
export async function sendEmail(
  resend: Resend,
  data: NotificationData,
  fromEmail: string = 'noreply@bookingsuite.com',
  siteUrl?: string,
  appointmentId?: string
) {
  const template = data.type === 'appointment_created' 
    ? await emailTemplates[data.type](data, siteUrl, appointmentId)
    : emailTemplates[data.type](data);
  
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: template.subject,
      html: template.html,
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Verifica si el negocio puede enviar SMS (solo Business y Enterprise)
 */
async function canSendSMS(businessId: string): Promise<{
  canSend: boolean;
  reason?: string;
  usage?: {
    used: number;
    limit: number;
    remaining: number;
  };
}> {
  try {
    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Obtener información del negocio
    const { data: business, error } = await supabase
      .from('businesses')
      .select('subscription_plan, sms_limit, sms_used_current_month')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return {
        canSend: false,
        reason: 'Business not found'
      };
    }

    // Solo Business y Enterprise tienen SMS
    const plan = business.subscription_plan?.toLowerCase();
    if (plan !== 'business' && plan !== 'enterprise') {
      return {
        canSend: false,
        reason: 'SMS not available. Please upgrade to Business or Enterprise plan.',
        usage: {
          used: 0,
          limit: 0,
          remaining: 0
        }
      };
    }

    // Si el límite es 0, no pueden enviar SMS (configuración incorrecta)
    const limit = business.sms_limit || 0;
    if (limit === 0) {
      return {
        canSend: false,
        reason: 'SMS not configured. Please contact support.',
        usage: { used: 0, limit: 0, remaining: 0 }
      };
    }

    const used = business.sms_used_current_month || 0;
    const remaining = Math.max(0, limit - used);

    // Pueden enviar SMS (incluso si exceden, se les cobrará)
    return {
      canSend: true,
      usage: { used, limit, remaining }
    };

  } catch (error) {
    console.error('Error checking SMS limit:', error);
    return {
      canSend: false,
      reason: 'Error checking SMS limit'
    };
  }
}

/**
 * Incrementa el contador de SMS del negocio
 */
async function incrementSMSCounter(businessId: string): Promise<void> {
  try {
    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Incrementar contador
    const { error } = await supabase.rpc('increment_business_sms_count', {
      p_business_id: businessId
    });

    if (error) {
      console.error('Error incrementing SMS counter:', error);
    }
  } catch (error) {
    console.error('Error incrementing SMS counter:', error);
  }
}

// Enviar SMS con sistema de números rotativos
export async function sendSMS(
  twilioClient: ReturnType<typeof twilio>,
  data: NotificationData,
  fromPhone?: string // Ahora es opcional, se obtiene de la base de datos
) {
  const message = smsTemplates[data.type](data);
  
  try {
    // Verificar si puede enviar SMS
    const smsCheck = await canSendSMS(data.businessId);
    
    if (!smsCheck.canSend) {
      console.warn(`❌ Cannot send SMS: ${smsCheck.reason}`);
      return {
        success: false,
        error: smsCheck.reason || 'Cannot send SMS'
      };
    }

    // Advertir si está cerca del límite o lo excedió
    if (smsCheck.usage) {
      const { used, limit, remaining } = smsCheck.usage;
      
      if (limit < 9999) { // Solo para planes con límite
        if (used >= limit) {
          console.warn(`⚠️  Business ${data.businessId} has exceeded SMS limit (${used}/${limit}). Additional charges will apply.`);
        } else if (remaining <= 10) {
          console.warn(`⚠️  Business ${data.businessId} is near SMS limit (${used}/${limit}, ${remaining} remaining)`);
        }
      }
    }

    // Validar que el número sea de Estados Unidos
    const phoneNumber = data.to.trim();
    const isUSNumber = phoneNumber.startsWith('+1') || phoneNumber.startsWith('1');
    
    if (!isUSNumber) {
      console.log(`SMS not sent: Phone number ${phoneNumber} is not a US number. SMS only available for US numbers (+1).`);
      return { 
        success: false, 
        error: 'SMS only available for US phone numbers (+1)',
        skipped: true 
      };
    }

    // Si no se proporciona un número, obtener el siguiente disponible
    let phoneToUse = fromPhone;
    let numberId: string | null = null;

    if (!phoneToUse) {
      const availableNumber = await getNextAvailableNumber();
      
      if (!availableNumber) {
        console.error('No available Twilio numbers. All numbers have reached their SMS limit.');
        return { 
          success: false, 
          error: 'No available phone numbers. All numbers have reached their SMS limit (75 per number).' 
        };
      }

      phoneToUse = availableNumber.phone_number;
      numberId = availableNumber.id;

      console.log(`Using Twilio number: ${phoneToUse} (${availableNumber.sms_sent_count}/${availableNumber.sms_limit} SMS sent)`);
    }

    // Enviar el SMS
    const result = await twilioClient.messages.create({
      body: message,
      from: phoneToUse,
      to: data.to,
    });

    // Después de enviar exitosamente, incrementar contador
    await incrementSMSCounter(data.businessId);

    // Incrementar el contador si usamos un número de la base de datos
    if (numberId) {
      const incremented = await incrementSmsCount(numberId);
      if (!incremented) {
        console.warn(`Failed to increment SMS count for number ${numberId}`);
      }
    }
    
    return { success: true, data: result, phoneUsed: phoneToUse };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}

// Función principal para enviar notificaciones según el plan
export async function sendNotification(
  data: NotificationData,
  plan: {
    email: boolean;
    sms: boolean;
    reminders: boolean;
  },
  config: {
    resendApiKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromPhone?: string;
    fromEmail?: string;
    siteUrl?: string;
  },
  appointmentId?: string
) {
  const results: { email?: any; sms?: any } = {};

  // Verificar si el tipo de notificación es un recordatorio
  const isReminder = data.type === 'appointment_reminder_24h' || data.type === 'appointment_reminder_2h';

  // Si es un recordatorio y el plan no tiene recordatorios, no enviar
  if (isReminder && !plan.reminders) {
    return { success: false, message: 'Plan does not include reminders' };
  }

  // Enviar email si está habilitado
  if (plan.email && config.resendApiKey) {
    const resend = getResendInstance(config.resendApiKey);
    results.email = await sendEmail(resend, data, config.fromEmail, config.siteUrl, appointmentId);
  }

  // Enviar SMS si está habilitado
  if (plan.sms && config.twilioAccountSid && config.twilioAuthToken && config.twilioFromPhone) {
    const twilioClient = getTwilioInstance(config.twilioAccountSid, config.twilioAuthToken);
    results.sms = await sendSMS(twilioClient, data, config.twilioFromPhone);
  }

  return results;
}

// Función helper para enviar emails desde el cliente a través del API
export async function sendEmailViaAPI(
  data: NotificationData,
  baseUrl: string = '',
  appointmentId?: string,
  siteUrl?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const template = data.type === 'appointment_created' 
    ? await emailTemplates[data.type](data, siteUrl, appointmentId)
    : emailTemplates[data.type](data);
  
  try {
    const response = await fetch(`${baseUrl}/api/notifications/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.to,
        subject: template.subject,
        html: template.html,
        type: data.type,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending email via API:', result);
      return { success: false, error: result.error || 'Failed to send email' };
    }

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Error calling email API:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// Función helper para enviar SMS desde el cliente a través del API
export async function sendSMSViaAPI(
  data: NotificationData,
  baseUrl: string = '',
  businessId?: string,
  appointmentId?: string,
  clientId?: string
): Promise<{ success: boolean; error?: string; messageSid?: string; skipped?: boolean }> {
  // Validar que el número sea de Estados Unidos
  const phoneNumber = data.to.trim();
  const isUSNumber = phoneNumber.startsWith('+1') || phoneNumber.startsWith('1');
  
  if (!isUSNumber) {
    console.log(`SMS not sent: Phone number ${phoneNumber} is not a US number. SMS only available for US numbers (+1).`);
    return { 
      success: false, 
      error: 'SMS only available for US phone numbers (+1)',
      skipped: true 
    };
  }

  const message = smsTemplates[data.type](data);
  
  try {
    const response = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.to,
        message: message,
        type: data.type,
        businessId,
        appointmentId,
        clientId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending SMS via API:', result);
      return { success: false, error: result.error || 'Failed to send SMS' };
    }

    return { success: true, messageSid: result.messageSid };
  } catch (error: any) {
    console.error('Error calling SMS API:', error);
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}

/**
 * Envía una notificación push del navegador si está disponible
 */
export async function sendBrowserPushNotification(
  data: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar soporte
    if (!isPushNotificationSupported()) {
      return { success: false, error: 'Push notifications not supported' };
    }

    // Verificar permiso
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Push notification permission not granted' };
    }

    // Mapear tipo de notificación
    const pushType = data.type as PushNotificationType;

    // Enviar notificación push
    const success = await sendPushNotification(pushType, {
      clientName: data.clientName,
      serviceName: data.serviceName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      businessName: data.businessName,
      language: data.preferredLanguage || 'es',
    });

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to show push notification' };
    }
  } catch (error: any) {
    console.error('Error sending browser push notification:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Función principal para enviar notificaciones completas (email + SMS + push)
 */
export async function sendNotificationWithPush(
  data: NotificationData,
  plan: {
    email: boolean;
    sms: boolean;
    reminders: boolean;
    push?: boolean; // Nuevo: soporte para notificaciones push
  },
  config: {
    resendApiKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromPhone?: string;
    fromEmail?: string;
    siteUrl?: string;
  },
  appointmentId?: string
) {
  const results: { email?: any; sms?: any; push?: any } = {};

  // Verificar si el tipo de notificación es un recordatorio
  const isReminder = data.type === 'appointment_reminder_24h' || data.type === 'appointment_reminder_2h';

  // Si es un recordatorio y el plan no tiene recordatorios, no enviar
  if (isReminder && !plan.reminders) {
    return { success: false, message: 'Plan does not include reminders' };
  }

  // Enviar email si está habilitado
  if (plan.email && config.resendApiKey) {
    const resend = getResendInstance(config.resendApiKey);
    results.email = await sendEmail(resend, data, config.fromEmail, config.siteUrl, appointmentId);
  }

  // Enviar SMS si está habilitado
  if (plan.sms && config.twilioAccountSid && config.twilioAuthToken && config.twilioFromPhone) {
    const twilioClient = getTwilioInstance(config.twilioAccountSid, config.twilioAuthToken);
    results.sms = await sendSMS(twilioClient, data, config.twilioFromPhone);
  }

  // Enviar notificación push si está habilitado y soportado
  if (plan.push !== false) { // Por defecto habilitado
    results.push = await sendBrowserPushNotification(data);
  }

  return results;
}

/**
 * Función helper mejorada para enviar notificaciones completas (email + SMS + push) desde el cliente
 */
export async function sendNotificationViaAPI(
  data: NotificationData,
  plan: {
    email: boolean;
    sms: boolean;
    reminders: boolean;
    push?: boolean; // Nuevo: soporte para notificaciones push
  },
  baseUrl: string = '',
  businessId?: string,
  appointmentId?: string,
  clientId?: string,
  siteUrl?: string
): Promise<{ email?: any; sms?: any; push?: any }> {
  const results: { email?: any; sms?: any; push?: any } = {};

  // Verificar si el tipo de notificación es un recordatorio
  const isReminder = data.type === 'appointment_reminder_24h' || data.type === 'appointment_reminder_2h';

  // Si es un recordatorio y el plan no tiene recordatorios, no enviar
  if (isReminder && !plan.reminders) {
    return { email: { success: false, message: 'Plan does not include reminders' } };
  }

  // Enviar email si está habilitado
  if (plan.email) {
    results.email = await sendEmailViaAPI(data, baseUrl, appointmentId, siteUrl);
  }

  // Enviar SMS si está habilitado
  if (plan.sms) {
    results.sms = await sendSMSViaAPI(data, baseUrl, businessId, appointmentId, clientId);
  }

  // Enviar notificación push si está habilitado y soportado
  if (plan.push !== false) { // Por defecto habilitado
    results.push = await sendBrowserPushNotification(data);
  }

  return results;
}


























