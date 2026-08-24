import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Manejar preflight requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('📧 [send-email] Endpoint llamado');
  
  try {
    const body = await request.json();
    const { to, subject, html, type, appointmentData } = body;

    console.log('📋 Datos recibidos:', { 
      to, 
      subject: subject?.substring(0, 50) + '...', 
      type,
      htmlLength: html?.length,
      hasAppointmentData: !!appointmentData
    });

    // Validación básica de campos (to y subject siempre requeridos)
    if (!to || !subject) {
      console.error('❌ Faltan campos requeridos: to o subject');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers }
      );
    }

    // Si es un email de confirmación de cita y tenemos appointmentData, generar el HTML
    let finalHtml = html;
    if (type === 'appointment_created' && appointmentData) {
      console.log('🎫 Generando email de confirmación de cita');
      console.log('   - Appointment ID:', appointmentData.appointmentId);
      console.log('   - Has confirmationUrl:', !!appointmentData.confirmationUrl);
      
      // Importar la función de generación de email
      const { generateAppointmentConfirmationEmail } = await import('../../../lib/email-service');
      
      // Generar el HTML con el confirmationUrl si está disponible
      finalHtml = generateAppointmentConfirmationEmail({
        ...appointmentData,
        confirmationUrl: appointmentData.confirmationUrl // Usar el confirmationUrl que viene del cliente
      });
      
      console.log('✅ HTML de confirmación generado con enlace de confirmación');
    } else if (type === 'business_appointment_notification' && appointmentData) {
      console.log('📧 Generando email de notificación para el negocio');
      
      // Importar la función de generación de email para el negocio
      const { generateBusinessAppointmentNotificationEmail } = await import('../../../lib/email-service');
      
      // Generar el HTML
      finalHtml = generateBusinessAppointmentNotificationEmail(appointmentData);
      
      console.log('✅ HTML de notificación al negocio generado');
    }

    // Validar que tengamos HTML después de la generación
    if (!finalHtml) {
      console.error('❌ No se pudo generar el contenido HTML del email');
      return new Response(
        JSON.stringify({ error: 'Missing email content (html)' }),
        { status: 400, headers }
      );
    }

    // Obtener las variables de entorno - IGUAL QUE EN PASSWORD RESET
    const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'DRAP Systems <noreply@drapsystems.com>';
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;

    console.log('🔑 Variables de entorno:', {
      hasApiKey: !!resendApiKey,
      apiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 8) + '...' : 'NO CONFIGURADO',
      fromEmail,
      isProduction: !!locals?.runtime?.env,
      isDevelopment: !locals?.runtime?.env
    });

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY no configurada');
      console.error('   locals.runtime.env:', !!locals?.runtime?.env);
      console.error('   import.meta.env:', !!import.meta.env.RESEND_API_KEY);
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY not configured',
          details: 'Email service is not properly configured. Please check environment variables.'
        }),
        { status: 500, headers }
      );
    }

    // Inicializar Resend
    console.log('🔄 Inicializando Resend...');
    const resend = new Resend(resendApiKey);

    // Enviar el email
    console.log('📤 Enviando email...');
    console.log('   From:', fromEmail);
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: finalHtml,
    });

    console.log('📥 Respuesta de Resend:', {
      hasError: !!result.error,
      hasData: !!result.data,
      dataId: result.data?.id
    });

    // Verificar si hay error en la respuesta
    if (result.error) {
      console.error('❌ Error de Resend:', result.error);
      return new Response(
        JSON.stringify({ 
          error: 'Resend API error',
          details: result.error.message || result.error,
          statusCode: result.error.statusCode || 500
        }),
        { status: result.error.statusCode || 500, headers }
      );
    }

    console.log('✅ Email enviado exitosamente:', result.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.data?.id,
        message: 'Email sent successfully' 
      }),
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    console.error('   Nombre:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Status:', error.statusCode || error.status);
    console.error('   Stack:', error.stack);
    
    // Si el error tiene información de Resend
    if (error.response) {
      console.error('   Respuesta:', error.response);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message,
        statusCode: error.statusCode || error.status || 500,
        name: error.name
      }),
      { status: error.statusCode || error.status || 500, headers }
    );
  }
};










