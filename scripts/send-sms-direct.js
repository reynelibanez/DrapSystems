/**
 * Script para enviar SMS directamente usando Twilio
 * Uso: node scripts/send-sms-direct.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const PHONE_NUMBER = '+13059227437'; // Número de destino
const MESSAGE = 'Hola! Este es un mensaje de prueba desde DRAP Appointment. Sistema funcionando correctamente. 📱✅';

async function sendDirectSMS() {
  console.log('🚀 Iniciando envío de SMS directo...\n');
  console.log('📱 Número de destino:', PHONE_NUMBER);
  console.log('💬 Mensaje:', MESSAGE);
  console.log('─'.repeat(60));

  try {
    // 1. Verificar credenciales de Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('❌ Error: Credenciales de Twilio no configuradas');
      console.error('   Verifica que TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN estén en .env');
      process.exit(1);
    }

    console.log('✅ Credenciales de Twilio encontradas');
    console.log('   Account SID:', twilioAccountSid.substring(0, 10) + '...');

    // 2. Verificar credenciales de Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Error: Credenciales de Supabase no configuradas');
      console.error('   Verifica que PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén en .env');
      process.exit(1);
    }

    console.log('✅ Credenciales de Supabase encontradas');

    // 3. Conectar a Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Obtener número de Twilio disponible
    console.log('\n🔍 Buscando número de Twilio disponible...');
    
    const { data: numbers, error: numbersError } = await supabase
      .from('twilio_numbers')
      .select('*')
      .eq('is_active', true)
      .lt('sms_sent_count', 75)
      .order('sms_sent_count', { ascending: true })
      .limit(1);

    if (numbersError) {
      console.error('❌ Error obteniendo números de Twilio:', numbersError);
      process.exit(1);
    }

    if (!numbers || numbers.length === 0) {
      console.error('❌ No hay números de Twilio disponibles');
      console.error('   Todos los números han alcanzado el límite de 75 SMS');
      process.exit(1);
    }

    const availableNumber = numbers[0];
    console.log('✅ Número disponible encontrado:', availableNumber.phone_number);
    console.log('   SMS enviados:', availableNumber.sms_sent_count + '/' + availableNumber.sms_limit);

    // 5. Inicializar cliente de Twilio
    console.log('\n📡 Inicializando cliente de Twilio...');
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

    // 6. Enviar SMS
    console.log('📤 Enviando SMS...');
    const result = await twilioClient.messages.create({
      body: MESSAGE,
      from: availableNumber.phone_number,
      to: PHONE_NUMBER,
    });

    console.log('✅ SMS enviado a Twilio!');
    console.log('   Message SID:', result.sid);
    console.log('   Estado:', result.status);

    // 7. Incrementar contador en la base de datos
    console.log('\n📊 Actualizando contador...');
    const { error: updateError } = await supabase
      .from('twilio_numbers')
      .update({ 
        sms_sent_count: availableNumber.sms_sent_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', availableNumber.id);

    if (updateError) {
      console.warn('⚠️ Advertencia: No se pudo actualizar el contador:', updateError);
    } else {
      console.log('✅ Contador actualizado');
    }

    // 8. Mostrar resumen
    console.log('\n' + '─'.repeat(60));
    console.log('🎉 ¡SMS ENVIADO EXITOSAMENTE!');
    console.log('─'.repeat(60));
    console.log('📊 Detalles:');
    console.log('   Message SID:', result.sid);
    console.log('   Estado:', result.status);
    console.log('   Desde:', availableNumber.phone_number);
    console.log('   Hacia:', PHONE_NUMBER);
    console.log('   SMS enviados:', (availableNumber.sms_sent_count + 1) + '/' + availableNumber.sms_limit);
    console.log('   SMS restantes:', (availableNumber.sms_limit - availableNumber.sms_sent_count - 1));
    console.log('─'.repeat(60));
    console.log('\n📱 Revisa el teléfono', PHONE_NUMBER, 'para ver el mensaje!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Código Twilio:', error.code);
      console.error('   Más info:', error.moreInfo);
    }
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar
sendDirectSMS();
