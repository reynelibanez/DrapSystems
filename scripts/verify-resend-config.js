/**
 * Script para verificar la configuración de Resend
 * Uso: node scripts/verify-resend-config.js
 */

import 'dotenv/config';
import { Resend } from 'resend';

async function verifyResendConfig() {
  console.log('🔍 Verificando configuración de Resend...\n');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  console.log('📋 Variables de entorno:');
  console.log('   RESEND_API_KEY:', apiKey ? apiKey.substring(0, 8) + '...' : '❌ NO CONFIGURADO');
  console.log('   RESEND_FROM_EMAIL:', fromEmail || '❌ NO CONFIGURADO');

  if (!apiKey) {
    console.error('\n❌ Error: RESEND_API_KEY no está configurado');
    process.exit(1);
  }

  if (!fromEmail) {
    console.error('\n❌ Error: RESEND_FROM_EMAIL no está configurado');
    process.exit(1);
  }

  console.log('\n🔄 Inicializando cliente de Resend...');
  const resend = new Resend(apiKey);

  try {
    console.log('\n📤 Enviando email de prueba...');
    const result = await resend.emails.send({
      from: fromEmail,
      to: 'delivered@resend.dev', // Email de prueba de Resend
      subject: 'Test Email - DRAP Appointment',
      html: '<h1>Email de Prueba</h1><p>Este es un email de prueba para verificar la configuración de Resend.</p>',
    });

    if (result.error) {
      console.error('\n❌ Error al enviar email:');
      console.error('   Mensaje:', result.error.message);
      console.error('   Código:', result.error.statusCode);
      console.error('   Detalles:', JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Email enviado exitosamente!');
    console.log('   Message ID:', result.data?.id);
    console.log('\n📝 Notas:');
    console.log('   - El email fue enviado a delivered@resend.dev (email de prueba de Resend)');
    console.log('   - Si ves este mensaje, tu configuración de Resend está correcta');
    console.log('   - Verifica que el dominio', fromEmail.split('@')[1], 'esté verificado en Resend');

  } catch (error) {
    console.error('\n❌ Error al enviar email:');
    console.error('   Nombre:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.response) {
      console.error('   Respuesta:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

verifyResendConfig();
