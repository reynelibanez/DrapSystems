import type { APIRoute } from 'astro';
import { sendEmail, generateAppointmentConfirmationEmail } from '../../../lib/email-service';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('🔵 [send-confirmation] Endpoint llamado');
  console.log('🔵 [send-confirmation] Method:', request.method);
  console.log('🔵 [send-confirmation] URL:', request.url);
  console.log('🔵 [send-confirmation] Headers:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log('🔵 [send-confirmation] Body recibido:', body);
    
    const { clientEmail, clientName, serviceName, date, time, notes, businessName, businessAddress, appointmentId } = body;

    // Validar campos requeridos
    if (!clientEmail || !clientName || !serviceName || !date || !time) {
      console.error('❌ [send-confirmation] Campos faltantes:', {
        clientEmail: !!clientEmail,
        clientName: !!clientName,
        serviceName: !!serviceName,
        date: !!date,
        time: !!time
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener credenciales
    const apiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL;

    console.log('🔵 [send-confirmation] Credenciales:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
      fromEmail: fromEmail || 'N/A'
    });

    if (!apiKey || !fromEmail) {
      console.error('❌ [send-confirmation] Credenciales faltantes');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generar el HTML del email
    console.log('🔵 [send-confirmation] Generando HTML del email...');
    
    // Obtener la URL base del sitio desde el request
    const url = new URL(request.url);
    const siteUrl = `${url.protocol}//${url.host}`;
    console.log('🔵 [send-confirmation] Site URL:', siteUrl);
    
    // Generar enlace de confirmación si tenemos el appointmentId
    let confirmationUrl: string | undefined;
    if (appointmentId) {
      const { generateAppointmentConfirmationLink } = await import('../../../lib/encryption');
      confirmationUrl = generateAppointmentConfirmationLink(appointmentId, siteUrl);
      console.log('🔵 [send-confirmation] Confirmation URL generada:', confirmationUrl);
    }
    
    const html = generateAppointmentConfirmationEmail({
      clientName,
      serviceName,
      date,
      time,
      notes,
      businessName,
      businessAddress,
      siteUrl,
      appointmentId,
      confirmationUrl
    });

    // Enviar el email
    console.log('🔵 [send-confirmation] Enviando email a:', clientEmail);
    const result = await sendEmail(
      {
        to: clientEmail,
        subject: `Confirmacion de Cita - ${serviceName}`,
        html
      },
      apiKey,
      fromEmail
    );

    console.log('🔵 [send-confirmation] Resultado:', result);

    if (!result.success) {
      console.error('❌ [send-confirmation] Error al enviar:', result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [send-confirmation] Email enviado exitosamente:', result.messageId);
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: result.messageId
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [send-confirmation] Error en el endpoint:', error);
    console.error('❌ [send-confirmation] Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};




