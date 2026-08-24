#!/usr/bin/env node

/**
 * Script de Verificación de Configuración de Emails
 * Verifica que todas las variables necesarias estén configuradas
 */

import 'dotenv/config';

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE EMAILS\n');
console.log('='.repeat(60));

// Variables requeridas
const requiredVars = {
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
  'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
};

let allConfigured = true;
let warnings = [];

// Verificar cada variable
console.log('\n📋 Variables de Entorno:\n');

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`❌ ${key}: NO CONFIGURADA`);
    allConfigured = false;
  } else {
    // Mostrar valor parcial para seguridad
    let displayValue = value;
    if (key.includes('KEY') || key.includes('SECRET')) {
      displayValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    }
    console.log(`✅ ${key}: ${displayValue}`);
    
    // Validaciones específicas
    if (key === 'RESEND_API_KEY' && !value.startsWith('re_')) {
      warnings.push(`⚠️  ${key} no parece ser una API key válida de Resend (debe empezar con 're_')`);
    }
    
    if (key === 'RESEND_FROM_EMAIL' && !value.includes('@')) {
      warnings.push(`⚠️  ${key} no parece ser un email válido`);
    }
  }
}

// Mostrar advertencias
if (warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:\n');
  warnings.forEach(warning => console.log(warning));
}

// Resultado final
console.log('\n' + '='.repeat(60));

if (allConfigured && warnings.length === 0) {
  console.log('\n✅ CONFIGURACIÓN COMPLETA Y VÁLIDA\n');
  console.log('Puedes proceder a probar el envío de emails.\n');
  process.exit(0);
} else if (allConfigured && warnings.length > 0) {
  console.log('\n⚠️  CONFIGURACIÓN COMPLETA PERO CON ADVERTENCIAS\n');
  console.log('Revisa las advertencias antes de continuar.\n');
  process.exit(0);
} else {
  console.log('\n❌ CONFIGURACIÓN INCOMPLETA\n');
  console.log('Configura las variables faltantes:\n');
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.log(`# En .env (desarrollo):`);
      console.log(`${key}=tu_valor_aqui\n`);
      console.log(`# En Cloudflare (producción):`);
      console.log(`npx wrangler secret put ${key}\n`);
    }
  }
  
  process.exit(1);
}
