

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/database.types';
import { getPublicSiteUrl, baseUrl } from '../../../../lib/base-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('=== INICIO DE CREACIÓN DE CITA PÚBLICA ===');
    
    // 1. Parsear el body
    const body = await request.json();
    const { businessId: encryptedBusinessId, serviceId, date, time, clientName, clientEmail, clientPhone, notes, smsConsent } = body;

    // 2. Validar datos requeridos
    if (!encryptedBusinessId || !serviceId || !date || !time || !clientName || !clientEmail || !clientPhone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Desencriptar el ID del negocio
    const { decryptBusinessId } = await import('../../../../lib/encryption');
    const businessId = decryptBusinessId(encryptedBusinessId);

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Invalid business ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Configurar Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // 5. Obtener información del servicio
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, name')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return new Response(JSON.stringify({ error: 'Service not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, owner_id, subscription_plan, subscription_status, address, email')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Obtener el primer staff disponible
    console.log('🔍 Buscando staff para business_id:', businessId);
    
    // ===== NUEVA LÓGICA: Buscar trabajadores asociados al servicio =====
    const { data: serviceStaff, error: serviceStaffError } = await supabase
      .from('service_staff')
      .select('staff_id')
      .eq('service_id', serviceId)
      .eq('business_id', businessId);

    let candidateStaffIds: string[] = [];

    if (serviceStaffError) {
      console.warn('⚠️ Error al obtener service_staff:', serviceStaffError);
    }

    if (serviceStaff && serviceStaff.length > 0) {
      // Si hay trabajadores asociados, usar esos
      candidateStaffIds = serviceStaff.map(ss => ss.staff_id);
      console.log('✅ Trabajadores asociados al servicio:', candidateStaffIds.length);
    } else {
      // Fallback: Si no hay asociaciones, usar todos los staff del negocio
      console.log('⚠️ No hay trabajadores asociados al servicio, usando todos los staff');
      
      const { data: allStaff } = await supabase
        .from('profiles')
        .select('id')
        .eq('business_id', businessId)
        .in('role', ['staff', 'business_owner']);

      if (allStaff && allStaff.length > 0) {
        candidateStaffIds = allStaff.map(s => s.id);
      } else {
        // Último fallback: usar el owner
        candidateStaffIds = [business.owner_id];
      }
    }

    console.log('👥 Candidatos de staff:', candidateStaffIds);

    // 8. Calcular tiempos
    console.log('🕐 Datos recibidos:', { date, time });
    
    // Parsear fecha y hora como hora LOCAL (igual que en AppointmentForm)
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Crear Date object en hora local
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    const endDateTime = new Date(startDateTime.getTime() + service.duration_minutes * 60000);
    
    // Convertir a ISO string (UTC) para guardar en la base de datos
    const startTime = startDateTime.toISOString();
    const endTime = endDateTime.toISOString();
    
    console.log('🕐 Start time (local):', startDateTime.toLocaleString());
    console.log('🕐 Start time (UTC/ISO):', startTime);
    console.log('🕐 End time (local):', endDateTime.toLocaleString());
    console.log('🕐 End time (UTC/ISO):', endTime);
    console.log('🕐 Duración del servicio:', service.duration_minutes, 'minutos');

    // ===== NUEVA LÓGICA: Buscar el primer staff disponible en este horario =====
    console.log('🔍 Buscando staff disponible en el horario seleccionado...');
    
    let staffId: string | null = null;
    
    for (const candidateId of candidateStaffIds) {
      // Verificar si este trabajador tiene conflictos en este horario
      const { data: conflictingAppointments, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('business_id', businessId)
        .eq('staff_id', candidateId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);

      if (conflictError) {
        console.error('❌ Error checking conflicts for staff', candidateId, ':', conflictError);
        continue;
      }

      if (!conflictingAppointments || conflictingAppointments.length === 0) {
        // Este trabajador está disponible
        staffId = candidateId;
        console.log('✅ Staff disponible encontrado:', staffId);
        break;
      } else {
        console.log('⚠️ Staff', candidateId, 'tiene conflictos:', conflictingAppointments.length);
      }
    }

    if (!staffId) {
      console.log('❌ Ningún trabajador disponible en este horario');
      return new Response(JSON.stringify({ 
        error: 'No staff available',
        message: 'No hay trabajadores disponibles en este horario. Por favor selecciona otro horario.',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Horario disponible con staff:', staffId);

    // 8.5. Verificar que el horario no esté ocupado
    console.log('🔍 Verificando disponibilidad del horario...');
    
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('business_id', businessId)
      .eq('staff_id', staffId)
      .in('status', ['pending', 'confirmed'])
      .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);

    if (conflictError) {
      console.error('❌ Error checking conflicts:', conflictError);
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      console.log('⚠️ Horario ocupado:', conflictingAppointments);
      return new Response(JSON.stringify({ 
        error: 'Time slot not available',
        message: 'Este horario ya está ocupado. Por favor selecciona otro horario.',
        conflicts: conflictingAppointments
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Horario disponible');

    // 9. Buscar o crear cliente
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, preferred_language')
      .eq('business_id', businessId)
      .eq('email', clientEmail)
      .maybeSingle();

    let clientId: string;
    let clientLanguage: string = 'es'; // Default

    if (existingClient) {
      clientId = existingClient.id;
      clientLanguage = existingClient.preferred_language || 'es';
      
      // Actualizar información del cliente
      await supabase
        .from('clients')
        .update({
          full_name: clientName,
          phone: clientPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          full_name: clientName,
          email: clientEmail,
          phone: clientPhone,
          is_active: true,
          preferred_language: 'es' // Default para nuevos clientes
        })
        .select()
        .single();

      if (clientError || !newClient) {
        return new Response(JSON.stringify({ 
          error: 'Failed to create client',
          details: clientError?.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      clientId = newClient.id;
      clientLanguage = newClient.preferred_language || 'es';
    }

    // 10. Crear la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        client_id: clientId,
        staff_id: staffId,
        service_id: serviceId,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single();

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create appointment',
        details: appointmentError?.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 11. Enviar notificaciones (sin bloquear la respuesta)
    try {
      const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
      const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@bookingsuite.com';
      
      // Configuración de Twilio para SMS
      const twilioAccountSid = locals?.runtime?.env?.TWILIO_ACCOUNT_SID || import.meta.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = locals?.runtime?.env?.TWILIO_AUTH_TOKEN || import.meta.env.TWILIO_AUTH_TOKEN;
      const twilioFromPhone = locals?.runtime?.env?.TWILIO_FROM_PHONE || import.meta.env.TWILIO_FROM_PHONE;

      // Obtener la URL base del sitio desde el request
      const url = new URL(request.url);
      const siteUrl = getPublicSiteUrl(request); // Ya incluye el baseUrl

      // Determinar qué canales están disponibles según el plan
      const plan = {
        email: true, // Email siempre disponible
        sms: ['business', 'enterprise'].includes(business.subscription_plan || '') && 
             business.subscription_status === 'active' && 
             smsConsent === true,
        reminders: ['business', 'enterprise'].includes(business.subscription_plan || ''),
      };

      console.log('📧 Configuración de notificaciones:', {
        email: plan.email,
        sms: plan.sms,
        smsConsent,
        plan: business.subscription_plan,
        subscriptionStatus: business.subscription_status,
        clientEmail,
        clientPhone,
        hasResendKey: !!resendApiKey,
        hasTwilioConfig: !!(twilioAccountSid && twilioAuthToken)
      });

      // Preparar datos para las notificaciones
      // Crear fecha local para mostrar correctamente en las notificaciones
      const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0);
      
      // IMPORTANTE: Para el token, usar la fecha en formato UTC para consistencia
      // Esto debe coincidir con cómo se valida en el endpoint de confirmación
      const tokenDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      
      const appointmentData = {
        appointmentDate: appointmentDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        appointmentTime: appointmentDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        serviceName: service.name,
        businessName: business.name,
        businessAddress: business.address,
        clientName: clientName,
        to: clientEmail,
        notes: notes,
        type: 'appointment_created' as const,
      };

      // Enviar EMAIL AL CLIENTE
      if (plan.email && resendApiKey) {
        try {
          const { generateAppointmentConfirmationEmail } = await import('../../../../lib/email-service');
          const { generateAppointmentConfirmationLink } = await import('../../../../lib/encryption');
          
          // Generar enlace de confirmación usando encriptación
          const confirmationUrl = generateAppointmentConfirmationLink(appointment.id, siteUrl);
          
          console.log('🔐 Confirmation link generated:');
          console.log('  - Appointment ID:', appointment.id);
          console.log('  - Confirmation URL:', confirmationUrl);
          console.log('  - Site URL:', siteUrl);
          
          const clientEmailHtml = generateAppointmentConfirmationEmail({
            clientName: clientName,
            serviceName: service.name,
            date: appointmentData.appointmentDate,
            time: appointmentData.appointmentTime,
            notes: notes,
            businessName: business.name,
            businessAddress: business.address,
            siteUrl: siteUrl,
            language: clientLanguage,
            appointmentId: appointment.id,
            confirmationUrl: confirmationUrl
          });

          const { sendEmail: sendEmailDirect } = await import('../../../../lib/email-service');
          
          const emailSubject = clientLanguage === 'en' 
            ? `Appointment Confirmation - ${business.name}`
            : `Confirmación de Cita - ${business.name}`;
          
          const clientEmailResult = await sendEmailDirect(
            {
              to: clientEmail,
              subject: emailSubject,
              html: clientEmailHtml,
            },
            resendApiKey,
            fromEmail
          );

          console.log('📧 Resultado Email (Cliente):', clientEmailResult);
        } catch (emailError) {
          console.error('❌ Error enviando email al cliente:', emailError);
        }
      }

      // Enviar EMAIL AL NEGOCIO
      if (plan.email && resendApiKey && business.email) {
        try {
          const { generateBusinessAppointmentNotificationEmail } = await import('../../../../lib/email-service');
          
          const businessEmailHtml = generateBusinessAppointmentNotificationEmail({
            clientName: clientName,
            clientEmail: clientEmail,
            clientPhone: clientPhone,
            serviceName: service.name,
            date: appointmentData.appointmentDate,
            time: appointmentData.appointmentTime,
            notes: notes,
            businessName: business.name,
            appointmentId: appointment.id
          });

          const { sendEmail: sendEmailDirect } = await import('../../../../lib/email-service');
          
          const businessEmailResult = await sendEmailDirect(
            {
              to: business.email,
              subject: `Nueva Cita Agendada - ${business.name}`,
              html: businessEmailHtml,
            },
            resendApiKey,
            fromEmail
          );

          console.log('📧 Resultado Email (Negocio):', businessEmailResult);
        } catch (emailError) {
          console.error('❌ Error enviando email al negocio:', emailError);
        }
      } else if (!business.email) {
        console.log('⚠️ El negocio no tiene email configurado');
      }

      // Enviar SMS (solo si el plan lo permite Y el cliente dio consentimiento Y la suscripción está activa)
      if (plan.sms && clientPhone) {
        try {
          console.log('📱 Intentando enviar SMS al cliente...');
          
          // Generar mensaje SMS en el idioma preferido del cliente
          const smsMessage = clientLanguage === 'en'
            ? `Hello ${clientName}, your appointment at ${business.name} has been confirmed for ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}. Service: ${service.name}`
            : `Hola ${clientName}, tu cita en ${business.name} ha sido confirmada para el ${appointmentData.appointmentDate} a las ${appointmentData.appointmentTime}. Servicio: ${service.name}`;

          // Asegurar que el teléfono tenga el formato E.164 (+1234567890)
          let phoneNumber = clientPhone.trim();
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }

          const smsPayload = {
            to: phoneNumber,
            message: smsMessage,
            type: 'appointment_created',
            businessId: businessId,
            appointmentId: appointment.id,
            clientId: clientId,
            preferredLanguage: clientLanguage
          };

          // Usar el endpoint de la API para enviar SMS
          const smsUrl = `${siteUrl}/api/notifications/send-sms`;

          const smsResponse = await fetch(smsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(smsPayload),
          });

          const smsResponseText = await smsResponse.text();

          if (smsResponse.ok) {
            try {
              const smsResult = JSON.parse(smsResponseText);
              console.log('📱 SMS enviado exitosamente:', smsResult);
            } catch (e) {
              console.log('📱 SMS enviado exitosamente');
            }
          } else {
            try {
              const errorData = JSON.parse(smsResponseText);
              console.warn('⚠️ Error al enviar SMS:', errorData);
            } catch (e) {
              console.warn('⚠️ Error al enviar SMS:', smsResponseText);
            }
          }
        } catch (smsError) {
          console.error('❌ Error enviando SMS:', smsError);
        }
      } else {
        if (!plan.sms) {
          console.log('⚠️ SMS no disponible:', {
            planIncludesSMS: ['business', 'enterprise'].includes(business.subscription_plan || ''),
            subscriptionActive: business.subscription_status === 'active',
            smsConsent: smsConsent
          });
        }
        if (!clientPhone) {
          console.log('⚠️ Cliente no tiene teléfono configurado');
        }
      }
    } catch (notificationError) {
      console.error('❌ Error general en notificaciones:', notificationError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      appointment,
      message: 'Cita agendada exitosamente. Recibirás un correo de confirmación.'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('ERROR CRÍTICO:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      type: error?.name || 'UnknownError'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};































