/**
 * Script para enviar SMS de prueba
 * Uso: node scripts/send-test-sms.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const PHONE_NUMBER = '+13059227437'; // Número de destino
const MESSAGE = 'Hola! Este es un mensaje de prueba desde DRAP Appointment. Sistema funcionando correctamente. 📱✅';

async function sendTestSMS() {
  console.log('🚀 Iniciando envío de SMS de prueba...\n');
  console.log('📱 Número de destino:', PHONE_NUMBER);
  console.log('💬 Mensaje:', MESSAGE);
  console.log('─'.repeat(60));

  try {
    // Verificar credenciales
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('❌ Error: Credenciales de Twilio no configuradas');
      console.error('   Verifica que TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN estén en .env');
      process.exit(1);
    }

    console.log('✅ Credenciales de Twilio encontradas');
    console.log('   Account SID:', twilioAccountSid.substring(0, 10) + '...');

    // Preparar payload
    const payload = {
      to: PHONE_NUMBER,
      message: MESSAGE,
      type: 'test'
    };

    console.log('\n📤 Enviando SMS...');

    // Enviar SMS usando el endpoint local
    const response = await fetch('http://localhost:4321/api/notifications/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('\n📥 Respuesta recibida:');
    console.log('   Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('\n❌ Error al enviar SMS');
      console.error('   Status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('   Error:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('   Respuesta:', responseText);
      }
      process.exit(1);
    }

    // Parsear respuesta exitosa
    try {
      const result = JSON.parse(responseText);
      console.log('\n✅ SMS enviado exitosamente!');
      console.log('─'.repeat(60));
      console.log('📊 Detalles:');
      console.log('   Message SID:', result.messageSid);
      console.log('   Estado:', result.status);
      console.log('   Desde:', result.from);
      console.log('   Hacia:', result.to);
      console.log('   SMS enviados:', result.smsCount + '/' + result.smsLimit);
      console.log('   SMS restantes:', result.remaining);
      console.log('─'.repeat(60));
      console.log('\n🎉 ¡Mensaje enviado! Revisa el teléfono', PHONE_NUMBER);
    } catch (e) {
      console.log('\n✅ SMS enviado (respuesta no JSON)');
      console.log('   Respuesta:', responseText);
    }

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar
sendTestSMS();
