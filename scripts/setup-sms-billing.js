


/**
 * Script de Configuración: Sistema de Facturación de SMS
 * 
 * Configura automáticamente el sistema de facturación por SMS:
 * 1. Verifica que el SQL se haya ejecutado
 * 2. Configura límites según planes
 * 3. Verifica funciones de Supabase
 * 4. Muestra checklist de configuración
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('\nAsegúrate de tener estas variables en .env:');
  console.log('- PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSMSBilling() {
  console.log('🚀 Configurando Sistema de Facturación de SMS\n');

  let allChecks = true;

  try {
    // 1. Verificar que existan los campos en businesses
    console.log('📋 1. Verificando campos en tabla businesses...');
    const { data: columns, error: columnsError } = await supabase
      .from('businesses')
      .select('sms_limit, sms_used_current_month, sms_billing_period_start, sms_price_per_unit')
      .limit(1);

    if (columnsError) {
      console.error('❌ Error: Los campos de SMS no existen en la tabla businesses');
      console.log('   Ejecuta el archivo ADD_SMS_BILLING_SYSTEM.sql en Supabase SQL Editor');
      allChecks = false;
    } else {
      console.log('✅ Campos de SMS encontrados en businesses');
    }

    // 2. Verificar que exista la tabla sms_charges
    console.log('\n📋 2. Verificando tabla sms_charges...');
    const { data: charges, error: chargesError } = await supabase
      .from('sms_charges')
      .select('id')
      .limit(1);

    if (chargesError) {
      console.error('❌ Error: La tabla sms_charges no existe');
      console.log('   Ejecuta el archivo ADD_SMS_BILLING_SYSTEM.sql en Supabase SQL Editor');
      allChecks = false;
    } else {
      console.log('✅ Tabla sms_charges encontrada');
    }

    // 3. Verificar funciones de Supabase
    console.log('\n📋 3. Verificando funciones de Supabase...');
    
    // Probar increment_business_sms_count
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);

    if (businesses && businesses.length > 0) {
      const testId = businesses[0].id;
      
      const { error: funcError } = await supabase
        .rpc('get_business_sms_stats', {
          p_business_id: testId
        });

      if (funcError) {
        console.error('❌ Error: Las funciones de Supabase no están creadas');
        console.log('   Ejecuta el archivo ADD_SMS_BILLING_SYSTEM.sql en Supabase SQL Editor');
        allChecks = false;
      } else {
        console.log('✅ Funciones de Supabase funcionando correctamente');
      }
    }

    // 4. Configurar límites según planes
    console.log('\n📋 4. Configurando límites de SMS según planes...');
    const { data: updateResult, error: updateError } = await supabase
      .from('businesses')
      .update({
        sms_limit: supabase.raw(`
          CASE 
            WHEN subscription_plan = 'basic' THEN 0
            WHEN subscription_plan = 'professional' THEN 0
            WHEN subscription_plan = 'business' THEN 9999
            WHEN subscription_plan = 'enterprise' THEN 9999
            ELSE 0
          END
        `),
        sms_price_per_unit: 0.10
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Actualizar todos

    if (updateError) {
      console.error('❌ Error configurando límites:', updateError);
      allChecks = false;
    } else {
      console.log('✅ Límites de SMS configurados según planes');
    }

    // 5. Mostrar resumen de configuración
    console.log('\n📊 5. Resumen de configuración:');
    const { data: summary } = await supabase
      .from('businesses')
      .select('subscription_plan, sms_limit, sms_used_current_month');

    if (summary) {
      const planSummary = summary.reduce((acc, business) => {
        const plan = business.subscription_plan || 'unknown';
        if (!acc[plan]) {
          acc[plan] = { count: 0, limit: 0 };
        }
        acc[plan].count++;
        acc[plan].limit = business.sms_limit;
        return acc;
      }, {});

      Object.entries(planSummary).forEach(([plan, data]) => {
        const smsStatus = data.limit >= 9999 ? '✅ Ilimitado' : data.limit === 0 ? '❌ No incluido' : `${data.limit} SMS`;
        console.log(`   ${plan}: ${data.count} negocios - ${smsStatus}`);
      });
    }

    // 6. Verificar variables de entorno
    console.log('\n📋 6. Verificando variables de entorno...');
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET_SMS',
      'CRON_SECRET'
    ];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}`);
      } else {
        console.log(`   ⚠️  ${varName} - No configurada`);
        if (varName === 'STRIPE_WEBHOOK_SECRET_SMS' || varName === 'CRON_SECRET') {
          console.log(`      (Opcional para desarrollo, requerida para producción)`);
        }
      }
    });

    // 7. Checklist final
    console.log('\n📝 Checklist de Configuración:\n');
    
    const checklist = [
      {
        item: 'SQL ejecutado en Supabase',
        done: !columnsError && !chargesError,
        action: 'Ejecutar ADD_SMS_BILLING_SYSTEM.sql en Supabase SQL Editor'
      },
      {
        item: 'Funciones de Supabase creadas',
        done: allChecks,
        action: 'Incluido en ADD_SMS_BILLING_SYSTEM.sql'
      },
      {
        item: 'Límites configurados por plan',
        done: !updateError,
        action: 'Ejecutado automáticamente por este script'
      },
      {
        item: 'Variables de entorno configuradas',
        done: process.env.STRIPE_SECRET_KEY && process.env.SUPABASE_URL,
        action: 'Configurar en .env'
      },
      {
        item: 'Webhook de Stripe configurado',
        done: false,
        action: 'Crear en https://dashboard.stripe.com/webhooks'
      },
      {
        item: 'Cron job configurado',
        done: false,
        action: 'Configurar en Cloudflare Workers Dashboard'
      },
      {
        item: 'Componente UI agregado',
        done: false,
        action: 'Agregar <SMSUsageCard /> al dashboard'
      }
    ];

    checklist.forEach(({ item, done, action }) => {
      const status = done ? '✅' : '⬜';
      console.log(`${status} ${item}`);
      if (!done) {
        console.log(`   → ${action}`);
      }
    });

    // Resultado final
    console.log('\n' + '='.repeat(60));
    if (allChecks) {
      console.log('✅ Sistema de Facturación de SMS configurado correctamente');
      console.log('\nPróximos pasos:');
      console.log('1. Configurar webhook en Stripe Dashboard');
      console.log('2. Configurar cron job en Cloudflare');
      console.log('3. Agregar componente SMSUsageCard al dashboard');
      console.log('4. Ejecutar: npm run test-sms-billing');
    } else {
      console.log('⚠️  Configuración incompleta');
      console.log('\nPrimero ejecuta:');
      console.log('1. ADD_SMS_BILLING_SYSTEM.sql en Supabase SQL Editor');
      console.log('2. Vuelve a ejecutar este script');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

async function updateBusinessLimits() {
  console.log('\n📊 Actualizando límites de SMS por plan...');
  
  const planLimits = {
    free: { limit: 0, price: 0.00, enabled: false },
    basic: { limit: 0, price: 0.00, enabled: false },
    business: { limit: 1500, price: 0.05, enabled: true },
    enterprise: { limit: 4500, price: 0.035, enabled: true }
  };

  for (const [plan, config] of Object.entries(planLimits)) {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        sms_limit: config.limit,
        sms_price_per_unit: config.price
      })
      .eq('subscription_plan', plan);

    if (error) {
      console.error(`   ❌ Error actualizando plan ${plan}:`, error.message);
    } else {
      const status = config.enabled ? '✅ SMS Habilitado' : '❌ SMS Deshabilitado';
      console.log(`   ${status} - Plan ${plan}: ${config.limit} SMS, $${config.price}/exceso`);
    }
  }
}

// Ejecutar configuración
setupSMSBilling();



