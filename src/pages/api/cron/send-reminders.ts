import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/database.types';
import { sendNotification, type NotificationData } from '../../../lib/notifications';

export const prerender = false;

/**
 * Cron job para enviar recordatorios de citas
 * Se ejecuta cada hora para verificar citas próximas
 * 
 * Configuración de recordatorios por plan:
 * - Basic: Sin recordatorios
 * - Professional: 24 horas antes
 * - Business: 24 horas y 2 horas antes
 * - Enterprise: 72 horas, 24 horas y 2 horas antes
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    const cronSecret = locals?.runtime?.env?.CRON_SECRET || import.meta.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@bookingsuite.com';

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    console.log('[Reminders] Starting reminder job...');

    const now = new Date();
    const maxHoursAhead = 73; // 72 horas + 1 hora de margen
    const endTime = new Date(now.getTime() + maxHoursAhead * 60 * 60 * 1000);

    // Obtener citas confirmadas en las próximas 73 horas
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        business_id,
        client_id,
        service_id,
        start_time,
        end_time,
        status,
        businesses (
          id,
          name,
          subscription_plan,
          subscription_status
        ),
        clients (
          id,
          email,
          full_name,
          phone
        ),
        services (
          id,
          name,
          duration_minutes
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_time', now.toISOString())
      .lte('start_time', endTime.toISOString());

    if (appointmentsError) {
      console.error('[Reminders] Error fetching appointments:', appointmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Reminders] Found ${appointments?.length || 0} confirmed appointments`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Configuración de recordatorios por plan
    const reminderConfig: Record<string, number[]> = {
      basic: [],
      professional: [24],
      business: [24, 2],
      enterprise: [72, 24, 2],
    };

    // Procesar cada cita
    for (const appointment of appointments || []) {
      try {
        const business = appointment.businesses;
        const client = appointment.clients;
        const service = appointment.services;

        if (!business || !client || !service) {
          console.log(`[Reminders] Skipping appointment ${appointment.id}: missing data`);
          skippedCount++;
          continue;
        }

        // Verificar suscripción activa
        if (business.subscription_status !== 'active' && business.subscription_status !== 'trial') {
          console.log(`[Reminders] Skipping appointment ${appointment.id}: subscription not active`);
          skippedCount++;
          continue;
        }

        // Obtener configuración de recordatorios para el plan
        const hoursBeforeList = reminderConfig[business.subscription_plan || 'basic'] || [];

        if (hoursBeforeList.length === 0) {
          skippedCount++;
          continue;
        }

        // Calcular horas hasta la cita
        const appointmentTime = new Date(appointment.start_time);
        const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Verificar si debemos enviar recordatorio
        let shouldSend = false;
        let reminderType: 'appointment_reminder_24h' | 'appointment_reminder_2h' = 'appointment_reminder_24h';
        let reminderLabel = '';

        for (const hoursBefore of hoursBeforeList) {
          // Enviar si estamos dentro de una ventana de 1 hora del tiempo de recordatorio
          if (hoursUntil <= hoursBefore && hoursUntil > (hoursBefore - 1)) {
            shouldSend = true;
            reminderLabel = hoursBefore === 72 ? '72h' : hoursBefore === 24 ? '24h' : '2h';
            reminderType = hoursBefore === 2 ? 'appointment_reminder_2h' : 'appointment_reminder_24h';
            break;
          }
        }

        if (!shouldSend) {
          continue;
        }

        // Verificar si ya enviamos este recordatorio
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('type', 'email')
          .eq('status', 'sent')
          .ilike('message', `%${reminderLabel}%`)
          .maybeSingle();

        if (existingNotification) {
          console.log(`[Reminders] Already sent ${reminderLabel} reminder for appointment ${appointment.id}`);
          skippedCount++;
          continue;
        }

        // Preparar datos de notificación
        const notificationData: NotificationData = {
          to: client.email,
          clientName: client.full_name || 'Cliente',
          appointmentDate: appointmentTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          appointmentTime: appointmentTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          serviceName: service.name,
          businessName: business.name,
          type: reminderType,
        };

        // Determinar plan de notificaciones
        const plan = {
          email: true,
          sms: ['business', 'enterprise'].includes(business.subscription_plan || ''),
          reminders: true,
        };

        // Enviar notificación
        const result = await sendNotification(
          notificationData,
          plan,
          { resendApiKey, fromEmail }
        );

        if (result.email?.success) {
          // Registrar notificación enviada
          await supabase
            .from('notifications')
            .insert({
              business_id: business.id,
              user_id: client.id,
              appointment_id: appointment.id,
              type: 'email',
              message: JSON.stringify({
                ...notificationData,
                reminderLabel,
              }),
              status: 'sent',
              sent_at: new Date().toISOString(),
            });

          sentCount++;
          console.log(`[Reminders] Sent ${reminderLabel} reminder for appointment ${appointment.id}`);
        } else {
          throw new Error('Failed to send reminder');
        }
      } catch (error) {
        console.error(`[Reminders] Error processing appointment ${appointment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`[Reminders] Job completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Reminders] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



