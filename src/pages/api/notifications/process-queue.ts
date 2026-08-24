
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/database.types';
import { sendNotification, type NotificationData } from '../../../lib/notifications';

export const prerender = false;

/**
 * Endpoint para procesar la cola de notificaciones pendientes
 * Se ejecuta mediante cron job cada hora
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verificar autorización (solo permitir desde cron jobs o con token)
    const authHeader = request.headers.get('authorization');
    const cronSecret = locals?.runtime?.env?.CRON_SECRET || import.meta.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = locals?.runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@bookingsuite.com';

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    console.log('[Queue] Processing notification queue...');

    // Obtener notificaciones pendientes (máximo 50 por ejecución)
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[Queue] Error fetching notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('[Queue] No pending notifications');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Queue] Found ${pendingNotifications.length} pending notifications`);

    let successCount = 0;
    let failedCount = 0;

    // Procesar cada notificación
    for (const notification of pendingNotifications) {
      try {
        // Obtener información del negocio y su plan
        const { data: business } = await supabase
          .from('businesses')
          .select('name, subscription_plan, subscription_status')
          .eq('id', notification.business_id)
          .single();

        if (!business || (business.subscription_status !== 'active' && business.subscription_status !== 'trial')) {
          console.log(`[Queue] Skipping notification ${notification.id}: business not active`);
          
          // Marcar como fallida
          await supabase
            .from('notifications')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          
          failedCount++;
          continue;
        }

        // Determinar plan de notificaciones
        const plan = {
          email: true,
          sms: ['business', 'enterprise'].includes(business.subscription_plan || ''),
          reminders: ['business', 'enterprise'].includes(business.subscription_plan || ''),
        };

        // Enviar notificación según el tipo
        if (notification.type === 'email') {
          // Parsear el mensaje como JSON si es posible
          let messageData;
          try {
            messageData = JSON.parse(notification.message);
          } catch {
            messageData = { html: notification.message };
          }

          const result = await sendNotification(
            {
              to: messageData.to || '',
              clientName: messageData.clientName || 'Cliente',
              appointmentDate: messageData.appointmentDate || '',
              appointmentTime: messageData.appointmentTime || '',
              serviceName: messageData.serviceName || '',
              businessName: business.name,
              type: messageData.type || 'appointment_created',
            } as NotificationData,
            plan,
            { resendApiKey, fromEmail }
          );

          if (result.email?.success) {
            await supabase
              .from('notifications')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', notification.id);
            
            successCount++;
            console.log(`[Queue] Sent notification ${notification.id}`);
          } else {
            throw new Error('Failed to send email');
          }
        }
      } catch (error) {
        console.error(`[Queue] Error processing notification ${notification.id}:`, error);
        
        // Marcar como fallida
        await supabase
          .from('notifications')
          .update({ status: 'failed', sent_at: new Date().toISOString() })
          .eq('id', notification.id);
        
        failedCount++;
      }
    }

    console.log(`[Queue] Processed: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount + failedCount,
        sent: successCount,
        failed: failedCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Queue] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

