#!/usr/bin/env node

/**
 * Script para verificar la configuración del módulo de servicios
 * Verifica que todas las variables de entorno necesarias estén configuradas
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('\n🔍 Verificando configuración del módulo de servicios...\n');

const checks = {
  stripe: {
    name: '💳 Stripe Configuration',
    vars: [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ]
  },
  servicesPrices: {
    name: '💰 Services Module Price IDs',
    vars: [
      'STRIPE_SERVICES_PROFESSIONAL_MONTHLY_PRICE_ID',
      'STRIPE_SERVICES_PROFESSIONAL_YEARLY_PRICE_ID',
      'STRIPE_SERVICES_ENTERPRISE_MONTHLY_PRICE_ID',
      'STRIPE_SERVICES_ENTERPRISE_YEARLY_PRICE_ID',
    ]
  },
  supabase: {
    name: '🗄️  Supabase Configuration',
    vars: [
      'PUBLIC_SUPABASE_URL',
      'PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
  },
  site: {
    name: '🌐 Site Configuration',
    vars: [
      'PUBLIC_SITE_URL',
    ]
  }
};

let allPassed = true;
const missingVars = [];

for (const [key, check] of Object.entries(checks)) {
  console.log(`\n${check.name}`);
  console.log('─'.repeat(50));
  
  for (const varName of check.vars) {
    const value = process.env[varName];
    const isConfigured = value && value.trim() !== '' && !value.includes('xxxxx');
    
    if (isConfigured) {
      // Mostrar solo los primeros y últimos caracteres para seguridad
      const maskedValue = value.length > 20 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`❌ ${varName}: NOT CONFIGURED`);
      allPassed = false;
      missingVars.push(varName);
    }
  }
}

console.log('\n' + '═'.repeat(50));

if (allPassed) {
  console.log('\n✅ ¡Todas las configuraciones están correctas!\n');
  console.log('🚀 El módulo de servicios está listo para usar.\n');
  process.exit(0);
} else {
  console.log('\n❌ Faltan configuraciones:\n');
  missingVars.forEach(varName => {
    console.log(`   • ${varName}`);
  });
  console.log('\n📖 Consulta CONFIGURAR_PRECIOS_SERVICIOS_STRIPE.md para más información.\n');
  process.exit(1);
}
