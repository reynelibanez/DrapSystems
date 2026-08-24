import type { APIRoute } from 'astro';
import { getTwilioInstance } from '../../../lib/notifications';
import { getNextAvailableNumber, incrementSmsCount, hasAvailableNumbers } from '../../../lib/twilio-numbers';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('📱 [send-sms] Endpoint llamado');
  
  try {
    // Obtener credenciales de Twilio
    const twilioAccountSid = locals?.runtime?.env?.TWILIO_ACCOUNT_SID || import.meta.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = locals?.runtime?.env?.TWILIO_AUTH_TOKEN || import.meta.env.TWILIO_AUTH_TOKEN;

    console.log('🔑 Variables de entorno Twilio:', {
      hasAccountSid: !!twilioAccountSid,
      accountSidPrefix: twilioAccountSid ? twilioAccountSid.substring(0, 8) + '...' : 'NO CONFIGURADO',
      hasAuthToken: !!twilioAuthToken,
      authTokenPrefix: twilioAuthToken ? twilioAuthToken.substring(0, 8) + '...' : 'NO CONFIGURADO',
      isProduction: !!locals?.runtime?.env,
      isDevelopment: !locals?.runtime?.env
    });

    // Verificar variables de Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔑 Variables de entorno Supabase:', {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NO CONFIGURADO',
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 8) + '...' : 'NO CONFIGURADO',
    });

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('❌ Credenciales de Twilio no configuradas');
      console.error('   locals.runtime.env:', !!locals?.runtime?.env);
      console.error('   import.meta.env ACCOUNT_SID:', !!import.meta.env.TWILIO_ACCOUNT_SID);
      console.error('   import.meta.env AUTH_TOKEN:', !!import.meta.env.TWILIO_AUTH_TOKEN);
      return new Response(
        JSON.stringify({
          error: 'Twilio credentials not configured',
          details: 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return new Response(
        JSON.stringify({
          error: 'Supabase credentials not configured',
          details: 'Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. SMS service requires database access.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parsear el body
    const body = await request.json();
    const { to, message, type, businessId, appointmentId, clientId } = body;

    console.log('📋 Datos recibidos:', { 
      to, 
      messageLength: message?.length, 
      type,
      businessId,
      appointmentId,
      clientId
    });

    if (!to || !message) {
      console.error('❌ Faltan campos requeridos');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de número de teléfono (debe empezar con +)
    if (!to.startsWith('+')) {
      console.error('❌ Formato de número inválido:', to);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid phone number format',
          details: 'Phone number must be in E.164 format (e.g., +1234567890)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el número sea de Estados Unidos
    const isUSNumber = to.startsWith('+1');
    if (!isUSNumber) {
      console.log(`⚠️ SMS no enviado: Número ${to} no es de US. SMS solo disponible para números US (+1).`);
      return new Response(
        JSON.stringify({ 
          error: 'SMS only available for US phone numbers',
          details: 'SMS notifications are only available for United States phone numbers (+1)',
          skipped: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si hay números disponibles
    console.log('🔍 Verificando números disponibles...');
    console.log('   Llamando a hasAvailableNumbers()...');
    
    const available = await hasAvailableNumbers(supabaseUrl, supabaseServiceKey);
    
    console.log('📊 Resultado de hasAvailableNumbers():', available);
    
    if (!available) {
      console.error('❌ No hay números disponibles');
      console.error('   Esto puede deberse a:');
      console.error('   1. Todos los números alcanzaron el límite de 75 SMS');
      console.error('   2. No hay números activos en la tabla twilio_numbers');
      console.error('   3. Error de conexión con Supabase');
      console.error('   4. La función RPC get_next_available_twilio_number() no existe');
      
      // Intentar obtener el número directamente para más info
      console.log('🔍 Intentando obtener número directamente...');
      const directNumber = await getNextAvailableNumber(supabaseUrl, supabaseServiceKey);
      console.log('📊 Resultado de getNextAvailableNumber():', directNumber);
      
      return new Response(
        JSON.stringify({
          error: 'No available phone numbers',
          details: 'All Twilio numbers have reached their SMS limit (75 per number). Please add more numbers or reset counters.',
          debug: {
            hasAvailableNumbers: available,
            directNumberAttempt: directNumber ? 'Found number' : 'No number found',
            supabaseConfigured: !!supabaseUrl && !!supabaseServiceKey
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el siguiente número disponible
    console.log('📞 Obteniendo siguiente número disponible...');
    const availableNumber = await getNextAvailableNumber(supabaseUrl, supabaseServiceKey);
    if (!availableNumber) {
      console.error('❌ No se pudo obtener número disponible');
      return new Response(
        JSON.stringify({
          error: 'Failed to get available phone number',
          details: 'Could not retrieve an available Twilio number from database'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Usando número Twilio: ${availableNumber.phone_number} (${availableNumber.sms_sent_count}/${availableNumber.sms_limit} SMS enviados)`);

    // Inicializar cliente de Twilio
    console.log('🔄 Inicializando cliente Twilio...');
    const twilioClient = getTwilioInstance(twilioAccountSid, twilioAuthToken);

    // Enviar SMS
    console.log('📤 Enviando SMS...');
    console.log('   From:', availableNumber.phone_number);
    console.log('   To:', to);
    console.log('   Message:', message.substring(0, 50) + '...');
    
    const result = await twilioClient.messages.create({
      body: message,
      from: availableNumber.phone_number,
      to: to,
    });

    console.log('📥 Respuesta de Twilio:', {
      sid: result.sid,
      status: result.status
    });

    // Incrementar el contador de SMS
    console.log('📊 Incrementando contador de SMS...');
    const incremented = await incrementSmsCount(availableNumber.id, supabaseUrl, supabaseServiceKey);
    if (!incremented) {
      console.warn(`⚠️ No se pudo incrementar contador para número ${availableNumber.id}`);
    } else {
      console.log('✅ Contador incrementado exitosamente');
    }

    // Registrar el SMS en la tabla notifications
    console.log('💾 Registrando SMS en la tabla notifications...');
    console.log('   businessId:', businessId || 'NO PROPORCIONADO');
    console.log('   appointmentId:', appointmentId || 'NO PROPORCIONADO');
    console.log('   clientId:', clientId || 'NO PROPORCIONADO');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Si no hay businessId, intentar obtenerlo del appointmentId
      let finalBusinessId = businessId;
      if (!finalBusinessId && appointmentId) {
        console.log('🔍 businessId no proporcionado, intentando obtenerlo del appointmentId...');
        const { data: appointment } = await supabase
          .from('appointments')
          .select('business_id')
          .eq('id', appointmentId)
          .single();
        
        if (appointment) {
          finalBusinessId = appointment.business_id;
          console.log('✅ businessId obtenido del appointment:', finalBusinessId);
        }
      }
      
      // Si aún no hay businessId, intentar obtenerlo del clientId
      if (!finalBusinessId && clientId) {
        console.log('🔍 businessId no proporcionado, intentando obtenerlo del clientId...');
        const { data: client } = await supabase
          .from('clients')
          .select('business_id')
          .eq('id', clientId)
          .single();
        
        if (client) {
          finalBusinessId = client.business_id;
          console.log('✅ businessId obtenido del client:', finalBusinessId);
        }
      }
      
      if (!finalBusinessId) {
        console.error('❌ No se pudo determinar businessId para registrar el SMS');
        console.error('   Datos disponibles:', { businessId, appointmentId, clientId });
        // No fallar el envío, solo advertir
        console.warn('⚠️ SMS enviado pero NO registrado en notifications (falta businessId)');
      } else {
        const notificationData = {
          business_id: finalBusinessId,
          type: 'sms' as const,
          status: (result.status === 'queued' || result.status === 'sent' ? 'sent' : result.status) as 'sent' | 'failed' | 'delivered',
          recipient: to,
          message: message,
          sent_at: new Date().toISOString(),
          appointment_id: appointmentId || null,
          client_id: clientId || null,
          user_id: null  // NULL para notificaciones del sistema
        };
        
        console.log('📝 Datos a insertar en notifications:', {
          business_id: notificationData.business_id,
          type: notificationData.type,
          status: notificationData.status,
          recipient: notificationData.recipient,
          has_appointment: !!notificationData.appointment_id,
          has_client: !!notificationData.client_id,
          user_id: notificationData.user_id
        });
        
        const { data: insertedNotification, error: insertError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error registrando SMS en notifications:', insertError);
          console.error('   Código:', insertError.code);
          console.error('   Mensaje:', insertError.message);
          console.error('   Detalles:', insertError.details);
          console.error('   Hint:', insertError.hint);
        } else {
          console.log('✅ SMS registrado en notifications exitosamente');
          console.log('   ID de notificación:', insertedNotification?.id);
        }
      }
    } catch (notifError: any) {
      console.error('❌ Error al intentar registrar en notifications:', notifError);
      console.error('   Mensaje:', notifError.message);
      console.error('   Stack:', notifError.stack);
      // No fallar el envío del SMS por un error en el registro
    }

    console.log('✅ SMS enviado exitosamente:', {
      sid: result.sid,
      to: result.to,
      from: availableNumber.phone_number,
      status: result.status,
      type: type || 'unknown',
      smsCount: `${availableNumber.sms_sent_count + 1}/${availableNumber.sms_limit}`
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageSid: result.sid,
        status: result.status,
        to: result.to,
        from: availableNumber.phone_number,
        smsCount: availableNumber.sms_sent_count + 1,
        smsLimit: availableNumber.sms_limit,
        remaining: availableNumber.sms_limit - (availableNumber.sms_sent_count + 1)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error enviando SMS:', error);
    console.error('   Nombre:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    
    // Errores específicos de Twilio
    if (error.code) {
      console.error('   Código Twilio:', error.code);
      console.error('   Más info:', error.moreInfo);
      return new Response(
        JSON.stringify({
          error: 'Twilio error',
          code: error.code,
          message: error.message,
          details: error.moreInfo
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to send SMS',
        message: error.message || 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
















