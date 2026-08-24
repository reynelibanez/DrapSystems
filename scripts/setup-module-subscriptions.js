#!/usr/bin/env node

/**
 * Script de Configuración de Suscripciones Modulares
 * 
 * Este script ayuda a configurar el sistema de suscripciones modulares:
 * 1. Verifica variables de entorno
 * 2. Crea productos en Stripe (opcional)
 * 3. Despliega función de webhook
 * 4. Verifica configuración
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function checkEnvironmentVariables() {
  logSection('📋 Verificando Variables de Entorno');

  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const optional = [
    'STRIPE_MODULE_WEBHOOK_SECRET',
    'STRIPE_SERVICES_BASIC_MONTHLY_PRICE_ID',
    'STRIPE_SERVICES_BASIC_ANNUAL_PRICE_ID',
    'STRIPE_SERVICES_PROFESSIONAL_MONTHLY_PRICE_ID',
    'STRIPE_SERVICES_PROFESSIONAL_ANNUAL_PRICE_ID',
    'STRIPE_SERVICES_ENTERPRISE_MONTHLY_PRICE_ID',
    'STRIPE_SERVICES_ENTERPRISE_ANNUAL_PRICE_ID',
  ];

  let allPresent = true;

  log('Variables Requeridas:', 'cyan');
  for (const varName of required) {
    const value = process.env[varName];
    if (value) {
      log(`  ✓ ${varName}`, 'green');
    } else {
      log(`  ✗ ${varName} - FALTANTE`, 'red');
      allPresent = false;
    }
  }

  log('\nVariables Opcionales:', 'cyan');
  for (const varName of optional) {
    const value = process.env[varName];
    if (value) {
      log(`  ✓ ${varName}`, 'green');
    } else {
      log(`  ○ ${varName} - No configurada`, 'yellow');
    }
  }

  if (!allPresent) {
    log('\n⚠️  Faltan variables de entorno requeridas', 'red');
    process.exit(1);
  }

  log('\n✅ Todas las variables requeridas están presentes', 'green');
}

async function checkDatabaseSchema() {
  logSection('🗄️  Verificando Schema de Base de Datos');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Verificar si la tabla existe
    const { data, error } = await supabase
      .from('module_subscriptions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        log('✗ Tabla module_subscriptions no existe', 'red');
        log('\n📝 Ejecuta el siguiente comando para crear la tabla:', 'yellow');
        log('   psql -h db.xxx.supabase.co -U postgres -d postgres < CREATE_MODULE_SUBSCRIPTIONS_TABLE.sql', 'cyan');
        return false;
      }
      throw error;
    }

    log('✓ Tabla module_subscriptions existe', 'green');

    // Verificar funciones
    const functions = [
      'check_module_access',
      'get_module_plan',
      'create_module_subscription',
    ];

    for (const funcName of functions) {
      try {
        const { error: funcError } = await supabase.rpc(funcName, {
          p_business_id: '00000000-0000-0000-0000-000000000000',
          p_module_name: 'services',
        });

        // Si no hay error o el error es por parámetros, la función existe
        if (!funcError || funcError.message.includes('invalid input')) {
          log(`✓ Función ${funcName} existe`, 'green');
        }
      } catch (err) {
        log(`✗ Función ${funcName} no existe`, 'red');
      }
    }

    return true;
  } catch (error) {
    log(`✗ Error verificando schema: ${error.message}`, 'red');
    return false;
  }
}

async function checkStripeProducts() {
  logSection('💳 Verificando Productos de Stripe');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  });

  try {
    const products = await stripe.products.list({
      limit: 100,
    });

    const servicesProducts = products.data.filter(p => 
      p.name.toLowerCase().includes('services') ||
      p.metadata?.module === 'services'
    );

    if (servicesProducts.length === 0) {
      log('⚠️  No se encontraron productos para el módulo de servicios', 'yellow');
      log('\n📝 Crea productos en Stripe:', 'cyan');
      log('   1. Ir a https://dashboard.stripe.com/products', 'cyan');
      log('   2. Crear productos para: Basic, Professional, Enterprise', 'cyan');
      log('   3. Crear precios mensuales y anuales para cada uno', 'cyan');
      return false;
    }

    log(`✓ Encontrados ${servicesProducts.length} productos de servicios:`, 'green');
    for (const product of servicesProducts) {
      log(`  - ${product.name} (${product.id})`, 'cyan');
      
      // Listar precios del producto
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 10,
      });

      for (const price of prices.data) {
        const interval = price.recurring?.interval || 'one-time';
        const amount = (price.unit_amount / 100).toFixed(2);
        log(`    • ${amount} ${price.currency.toUpperCase()} / ${interval} (${price.id})`, 'blue');
      }
    }

    return true;
  } catch (error) {
    log(`✗ Error verificando productos: ${error.message}`, 'red');
    return false;
  }
}

async function checkWebhook() {
  logSection('🔗 Verificando Webhook de Stripe');

  const webhookSecret = process.env.STRIPE_MODULE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log('⚠️  STRIPE_MODULE_WEBHOOK_SECRET no configurado', 'yellow');
    log('\n📝 Configura el webhook:', 'cyan');
    log('   1. Ir a https://dashboard.stripe.com/webhooks', 'cyan');
    log('   2. Crear nuevo endpoint', 'cyan');
    log('   3. URL: https://tu-proyecto.supabase.co/functions/v1/stripe-module-webhook', 'cyan');
    log('   4. Eventos: customer.subscription.*, checkout.session.completed', 'cyan');
    log('   5. Copiar el webhook secret a .env', 'cyan');
    return false;
  }

  log('✓ STRIPE_MODULE_WEBHOOK_SECRET configurado', 'green');
  log(`  Secret: ${webhookSecret.substring(0, 10)}...`, 'cyan');

  return true;
}

async function showNextSteps() {
  logSection('🚀 Próximos Pasos');

  log('1. Aplicar el schema SQL:', 'cyan');
  log('   psql -h db.xxx.supabase.co -U postgres -d postgres < CREATE_MODULE_SUBSCRIPTIONS_TABLE.sql\n', 'blue');

  log('2. Configurar productos en Stripe:', 'cyan');
  log('   - Crear productos para módulo de servicios', 'blue');
  log('   - Crear precios mensuales y anuales', 'blue');
  log('   - Agregar Price IDs a .env\n', 'blue');

  log('3. Configurar webhook en Stripe:', 'cyan');
  log('   - Crear endpoint en Stripe Dashboard', 'blue');
  log('   - Agregar STRIPE_MODULE_WEBHOOK_SECRET a .env\n', 'blue');

  log('4. Desplegar función de Supabase:', 'cyan');
  log('   supabase functions deploy stripe-module-webhook\n', 'blue');

  log('5. Probar el flujo:', 'cyan');
  log('   - Ir a /register-services', 'blue');
  log('   - Crear una cuenta de prueba', 'blue');
  log('   - Verificar creación de suscripción\n', 'blue');
}

async function main() {
  log('\n🎯 CONFIGURACIÓN DE SUSCRIPCIONES MODULARES\n', 'bright');

  await checkEnvironmentVariables();
  const schemaOk = await checkDatabaseSchema();
  const productsOk = await checkStripeProducts();
  const webhookOk = await checkWebhook();

  logSection('📊 Resumen de Configuración');

  const checks = [
    { name: 'Variables de Entorno', status: true },
    { name: 'Schema de Base de Datos', status: schemaOk },
    { name: 'Productos de Stripe', status: productsOk },
    { name: 'Webhook de Stripe', status: webhookOk },
  ];

  for (const check of checks) {
    const icon = check.status ? '✓' : '✗';
    const color = check.status ? 'green' : 'red';
    log(`${icon} ${check.name}`, color);
  }

  const allOk = checks.every(c => c.status);

  if (allOk) {
    log('\n✅ ¡Todo configurado correctamente!', 'green');
    log('El sistema de suscripciones modulares está listo para usar.', 'cyan');
  } else {
    log('\n⚠️  Configuración incompleta', 'yellow');
    await showNextSteps();
  }
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
