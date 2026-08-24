





/**
 * Servicio de envío de emails
 * Centraliza la lógica de envío de emails usando Resend
 */

import { Resend } from 'resend';
import { baseUrl } from './base-url';
import { type Language, getEmailTranslations } from './notification-messages';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un email usando Resend
 */
export async function sendEmail(
  options: EmailOptions,
  apiKey?: string,
  fromEmail?: string
): Promise<EmailResult> {
  try {
    // Usar las credenciales proporcionadas o las del entorno
    const resendApiKey = apiKey || import.meta.env.RESEND_API_KEY;
    const defaultFrom = fromEmail || import.meta.env.RESEND_FROM_EMAIL;

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY no configurada');
      return {
        success: false,
        error: 'RESEND_API_KEY not configured'
      };
    }

    if (!defaultFrom) {
      console.error('❌ RESEND_FROM_EMAIL no configurado');
      return {
        success: false,
        error: 'RESEND_FROM_EMAIL not configured'
      };
    }

    // Inicializar Resend
    const resend = new Resend(resendApiKey);

    // Enviar el email
    const result = await resend.emails.send({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Verificar si hay error en la respuesta
    if (result.error) {
      console.error('❌ Error de Resend:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email'
      };
    }

    console.log('✅ Email enviado exitosamente:', result.data?.id);

    return {
      success: true,
      messageId: result.data?.id
    };

  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Genera el contenido de un archivo ICS para calendarios
 */
export function generateICSContent(data: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}): string {
  // Función auxiliar para formatear fechas en formato ICS
  const formatICSDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const now = new Date();
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DRAP Appointment//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(data.startDate)}`,
    `DTEND:${formatICSDate(data.endDate)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `SUMMARY:${data.title}`,
    `DESCRIPTION:${data.description}`,
    data.location ? `LOCATION:${data.location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');

  return icsContent;
}

/**
 * Genera URLs para agregar eventos a diferentes calendarios
 */
export function generateCalendarLinks(data: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  siteUrl?: string; // URL base del sitio (ej: https://www.drapsystems.com)
}) {
  // Función auxiliar para formatear fechas para Google Calendar
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // URL para Google Calendar
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${formatGoogleDate(data.startDate)}/${formatGoogleDate(data.endDate)}&details=${encodeURIComponent(data.description)}${data.location ? `&location=${encodeURIComponent(data.location)}` : ''}`;

  // Generar contenido ICS para Apple Calendar y Outlook
  const icsContent = generateICSContent(data);
  
  // Construir URL del endpoint de la API para generar el archivo ICS
  const icsParams = new URLSearchParams({
    title: data.title,
    description: data.description,
    start: data.startDate.toISOString(),
    end: data.endDate.toISOString()
  });
  
  if (data.location) {
    icsParams.append('location', data.location);
  }
  
  // Construir URL absoluta o relativa según el contexto
  // Nota: data.siteUrl ya incluye el baseUrl si está presente
  const basePath = data.siteUrl 
    ? data.siteUrl 
    : baseUrl;
  
  const icsUrl = `${basePath}/api/calendar/generate-ics?${icsParams.toString()}`;

  return {
    google: googleCalendarUrl,
    apple: icsUrl,
    outlook: icsUrl,
    icsContent
  };
}

/**
 * Genera el HTML para un email de confirmación de cita
 */
export function generateAppointmentConfirmationEmail(data: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
  businessName?: string;
  businessAddress?: string;
  siteUrl?: string; // URL base del sitio para enlaces absolutos
  language?: Language;
  appointmentId?: string; // ID de la cita para generar el enlace de confirmación
  confirmationUrl?: string; // URL completa de confirmación (ya encriptada)
}): string {
  const lang = data.language || 'es';
  const t = getEmailTranslations(lang);

  // Parsear la fecha y hora para crear el evento de calendario
  const [day, month, year] = data.date.split('/');
  const [hours, minutes] = data.time.split(':');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Duración de 1 hora por defecto

  // Generar enlaces de calendario
  const calendarLinks = generateCalendarLinks({
    title: `${lang === 'en' ? 'Appointment' : 'Cita'}: ${data.serviceName}`,
    description: `${lang === 'en' ? 'Confirmed appointment for' : 'Cita confirmada para'} ${data.serviceName}${data.notes ? `\n\n${lang === 'en' ? 'Notes' : 'Notas'}: ${data.notes}` : ''}`,
    location: data.businessAddress || '',
    startDate,
    endDate,
    siteUrl: data.siteUrl
  });
  
  // Generar URL de confirmación si está disponible
  const confirmationUrl = data.confirmationUrl;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5AC1FF 0%, #3F9BE0 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 28px;">✓ ${t.appointmentConfirmed}</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">${t.hello} <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">${lang === 'en' ? 'Your appointment has been successfully scheduled.' : 'Tu cita ha sido agendada exitosamente.'}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #5AC1FF;">
          <h3 style="color: #2C3E50; margin-top: 0; font-size: 18px;">${t.appointmentDetails}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📋 ${t.service}:</td>
              <td style="padding: 8px 0; color: #333;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📅 ${t.date}:</td>
              <td style="padding: 8px 0; color: #333;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">🕐 ${t.time}:</td>
              <td style="padding: 8px 0; color: #333;">${data.time}</td>
            </tr>
            ${data.businessAddress ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📍 ${t.location}:</td>
              <td style="padding: 8px 0; color: #333;">${data.businessAddress}</td>
            </tr>
            ` : ''}
            ${data.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">📝 ${t.notes}:</td>
              <td style="padding: 8px 0; color: #333;">${data.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${confirmationUrl ? `
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #856404; margin: 0 0 15px 0; font-size: 14px; text-align: center;">
            ${lang === 'en' 
              ? 'Please confirm your attendance by clicking the button below:' 
              : 'Por favor confirma tu asistencia haciendo clic en el botón de abajo:'}
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${confirmationUrl}" 
               style="display: inline-block; background-color: #28a745; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ✓ ${lang === 'en' ? 'Confirm Appointment' : 'Confirmar Cita'}
            </a>
          </div>
          
          <p style="text-align: center; color: #856404; font-size: 12px; margin-top: 15px;">
            ${lang === 'en' 
              ? 'This confirmation helps us prepare better for your visit.' 
              : 'Esta confirmación nos ayuda a prepararnos mejor para tu visita.'}
          </p>
        </div>
        ` : ''}

        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #2C3E50; margin-top: 0; font-size: 18px; text-align: center;">📲 ${t.addToCalendar}</h3>
          <p style="text-align: center; color: #666; margin-bottom: 15px; font-size: 14px;">
            ${lang === 'en' ? 'Sync this appointment with your favorite calendar:' : 'Sincroniza esta cita con tu calendario favorito:'}
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <!-- Google Calendar -->
            <a href="${calendarLinks.google}" 
               target="_blank" 
               style="display: inline-block; background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              📅 ${t.googleCalendar}
            </a>
            
            <!-- Apple Calendar -->
            <a href="${calendarLinks.apple}" 
               download="cita.ics"
               style="display: inline-block; background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              🍎 ${t.appleCalendar}
            </a>
            
            <!-- Outlook -->
            <a href="${calendarLinks.outlook}" 
               download="cita.ics"
               style="display: inline-block; background-color: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              📧 ${t.outlookCalendar}
            </a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 15px;">
            <strong>${lang === 'en' ? 'Note' : 'Nota'}:</strong> ${lang === 'en' ? 'For Apple Calendar and Outlook, click the button and a .ics file will be downloaded that you can open with your calendar application.' : 'Para Apple Calendar y Outlook, haz clic en el botón y se descargará un archivo .ics que podrás abrir con tu aplicación de calendario.'}
          </p>
        </div>

        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            <strong>💡 ${lang === 'en' ? 'Reminder' : 'Recordatorio'}:</strong> ${lang === 'en' ? "You'll receive notifications before your appointment so you don't forget." : 'Recibirás notificaciones antes de tu cita para que no la olvides.'}
          </p>
        </div>

        <p style="font-size: 16px; color: #333; margin-top: 25px;">
          ${t.thankYou}
        </p>
        
        ${data.businessName ? `
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          <strong>${data.businessName}</strong>
        </p>
        ` : ''}
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 5px 0;">${lang === 'en' ? 'This is an automated message, please do not reply to this email.' : 'Este es un mensaje automático, por favor no responder a este correo.'}</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} DRAP Appointment. ${lang === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p>
      </div>
    </div>
  `;
}

/**
 * Genera el HTML para un email de notificación al negocio cuando se crea una cita
 */
export function generateBusinessAppointmentNotificationEmail(data: {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
  businessName: string;
  businessAddress?: string;
  siteUrl?: string;
}): string {
  // Parsear la fecha y hora para crear el evento de calendario
  const [day, month, year] = data.date.split('/');
  const [hours, minutes] = data.time.split(':');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Duración de 1 hora por defecto

  // Generar enlaces de calendario
  const calendarLinks = generateCalendarLinks({
    title: `Appointment: ${data.serviceName}`,
    description: `Client: ${data.clientName}${data.clientEmail ? `\nEmail: ${data.clientEmail}` : ''}${data.clientPhone ? `\nPhone: ${data.clientPhone}` : ''}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
    location: data.businessAddress || '',
    startDate,
    endDate,
    siteUrl: data.siteUrl
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5AC1FF 0%, #3F9BE0 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 28px;">📅 New Appointment Booked</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${data.businessName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">A new appointment has been scheduled in your calendar.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #5AC1FF;">
          <h3 style="color: #2C3E50; margin-top: 0; font-size: 18px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">👤 Client:</td>
              <td style="padding: 8px 0; color: #333;">${data.clientName}</td>
            </tr>
            ${data.clientEmail ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📧 Email:</td>
              <td style="padding: 8px 0; color: #333;">${data.clientEmail}</td>
            </tr>
            ` : ''}
            ${data.clientPhone ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📱 Phone:</td>
              <td style="padding: 8px 0; color: #333;">${data.clientPhone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📋 Service:</td>
              <td style="padding: 8px 0; color: #333;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📅 Date:</td>
              <td style="padding: 8px 0; color: #333;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">🕐 Time:</td>
              <td style="padding: 8px 0; color: #333;">${data.time}</td>
            </tr>
            ${data.businessAddress ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">📍 Location:</td>
              <td style="padding: 8px 0; color: #333;">${data.businessAddress}</td>
            </tr>
            ` : ''}
            ${data.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">📝 Notes:</td>
              <td style="padding: 8px 0; color: #333;">${data.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #2C3E50; margin-top: 0; font-size: 18px; text-align: center;">📲 Add to Your Calendar</h3>
          <p style="text-align: center; color: #666; margin-bottom: 15px; font-size: 14px;">
            Sync this appointment with your calendar:
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <!-- Google Calendar -->
            <a href="${calendarLinks.google}" 
               target="_blank" 
               style="display: inline-block; background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              📅 Google Calendar
            </a>
            
            <!-- Apple Calendar -->
            <a href="${calendarLinks.apple}" 
               download="appointment.ics"
               style="display: inline-block; background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              🍎 Apple Calendar
            </a>
            
            <!-- Outlook -->
            <a href="${calendarLinks.outlook}" 
               download="appointment.ics"
               style="display: inline-block; background-color: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: bold; font-size: 14px;">
              📧 Outlook
            </a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 15px;">
            <strong>Note:</strong> For Apple Calendar and Outlook, click the button and a .ics file will be downloaded that you can open with your calendar application.
          </p>
        </div>

        <p style="font-size: 16px; color: #333; margin-top: 25px;">
          You can manage this appointment from your dashboard.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} DRAP Appointment. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Genera el HTML para un email de recordatorio de cita
 */
export function generateAppointmentReminderEmail(data: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  hoursUntil: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C3E50;">Recordatorio de Cita</h2>
      <p>Hola ${data.clientName},</p>
      <p>Te recordamos que tienes una cita en ${data.hoursUntil} horas:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Fecha:</strong> ${data.date}</p>
        <p><strong>Hora:</strong> ${data.time}</p>
      </div>
      <p>Te esperamos!</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Este es un mensaje automatico, por favor no responder a este correo.
      </p>
    </div>
  `;
}

/**
 * Genera el HTML para un email de cancelación de cita
 */
export function generateAppointmentCancellationEmail(data: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C3E50;">Cita Cancelada</h2>
      <p>Hola ${data.clientName},</p>
      <p>Tu cita ha sido cancelada:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Fecha:</strong> ${data.date}</p>
        <p><strong>Hora:</strong> ${data.time}</p>
      </div>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Este es un mensaje automatico, por favor no responder a este correo.
      </p>
    </div>
  `;
}














