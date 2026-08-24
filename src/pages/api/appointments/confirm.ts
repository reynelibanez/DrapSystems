import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, generateBusinessAppointmentNotificationEmail } from '../../../lib/email-service';
import { decryptAppointmentId } from '../../../lib/encryption';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const encryptedId = url.searchParams.get('id');

  console.log('🔍 Confirmation request received:');
  console.log('  - URL:', request.url);
  console.log('  - Encrypted ID:', encryptedId ? `${encryptedId.substring(0, 20)}...` : 'MISSING');
  console.log('  - All params:', Array.from(url.searchParams.entries()));

  if (!encryptedId) {
    console.error('❌ Missing encrypted appointment ID');
    return new Response(
      JSON.stringify({ error: 'Missing appointment ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Desencriptar el ID de la cita
    const appointmentId = decryptAppointmentId(encryptedId);
    
    if (!appointmentId) {
      console.error('❌ Failed to decrypt appointment ID');
      return new Response(
        JSON.stringify({ error: 'Invalid appointment ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Appointment ID decrypted:', appointmentId.substring(0, 8) + '...');

    // Obtener credenciales de Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar la cita
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          name,
          email,
          phone,
          preferred_language
        ),
        services (
          name
        ),
        businesses (
          name,
          email,
          address
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error('❌ Error fetching appointment:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Appointment found:', {
      id: appointment.id,
      status: appointment.status,
      client: appointment.clients?.name
    });

    // Formatear fecha y hora para la respuesta
    const startDate = new Date(appointment.start_time);
    const formattedDate = startDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Verificar si la cita ya está confirmada
    if (appointment.status === 'confirmed') {
      console.log('ℹ️  Appointment already confirmed');
      
      return new Response(
        JSON.stringify({ 
          alreadyConfirmed: true,
          appointment: {
            clientName: appointment.clients?.name,
            serviceName: appointment.services?.name,
            date: formattedDate,
            time: formattedTime
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar el estado de la cita a "confirmed"
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('❌ Error updating appointment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to confirm appointment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Appointment confirmed:', appointmentId);

    // Enviar email al negocio
    if (appointment.businesses?.email) {
      try {
        const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
        const resendFromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL;
        const siteUrl = locals?.runtime?.env?.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL;

        const emailHtml = generateBusinessAppointmentNotificationEmail({
          clientName: appointment.clients?.name || 'Unknown',
          clientEmail: appointment.clients?.email,
          clientPhone: appointment.clients?.phone,
          serviceName: appointment.services?.name || 'Unknown',
          date: formattedDate,
          time: formattedTime,
          notes: appointment.notes,
          businessName: appointment.businesses?.name || 'Business',
          businessAddress: appointment.businesses?.address,
          siteUrl
        });

        await sendEmail(
          {
            to: appointment.businesses.email,
            subject: `✅ Appointment Confirmed - ${appointment.clients?.name}`,
            html: emailHtml
          },
          resendApiKey,
          resendFromEmail
        );

        console.log('✅ Business notification email sent');
      } catch (emailError) {
        console.error('❌ Error sending business email:', emailError);
        // No fallar la confirmación si el email falla
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        appointment: {
          clientName: appointment.clients?.name,
          serviceName: appointment.services?.name,
          date: formattedDate,
          time: formattedTime
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error confirming appointment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};












