import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Límites según la estructura corregida
const PLAN_LIMITS = {
  basic: {
    users: 1,
    clients: 100,
    notifications: { email: true, sms: false, reminders: false }
  },
  professional: {
    users: 1,
    clients: 500,
    notifications: { email: true, sms: false, reminders: true }
  },
  business: {
    users: 5,
    clients: 1000,
    notifications: { email: true, sms: true, reminders: true }
  },
  enterprise: {
    users: 'unlimited',
    clients: 'unlimited',
    notifications: { email: true, sms: true, reminders: true }
  }
};

async function verifyPlanLimits() {
  console.log('🔍 Verificando límites de planes...\n');

  // Obtener todas las empresas
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, subscription_plan');

  if (error) {
    console.error('❌ Error al obtener empresas:', error);
    return;
  }

  console.log(`📊 Total de empresas: ${businesses.length}\n`);

  for (const business of businesses) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏢 Empresa: ${business.name}`);
    console.log(`📋 Plan: ${business.subscription_plan}`);
    console.log(`${'='.repeat(60)}`);

    const limits = PLAN_LIMITS[business.subscription_plan] || PLAN_LIMITS.basic;

    // Contar usuarios (staff)
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .in('role', ['business_owner', 'staff']);

    // Contar clientes
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id);

    console.log('\n👥 USUARIOS (Staff):');
    console.log(`   Actual: ${userCount || 0}`);
    console.log(`   Límite: ${limits.users === 'unlimited' ? 'Ilimitado' : limits.users}`);
    
    if (limits.users !== 'unlimited' && userCount > limits.users) {
      console.log(`   ⚠️  EXCEDE EL LÍMITE por ${userCount - limits.users} usuario(s)`);
    } else if (limits.users !== 'unlimited' && userCount === limits.users) {
      console.log(`   ⚠️  EN EL LÍMITE`);
    } else {
      console.log(`   ✅ Dentro del límite`);
    }

    console.log('\n👤 CLIENTES:');
    console.log(`   Actual: ${clientCount || 0}`);
    console.log(`   Límite: ${limits.clients === 'unlimited' ? 'Ilimitado' : limits.clients}`);
    
    if (limits.clients !== 'unlimited' && clientCount > limits.clients) {
      console.log(`   ⚠️  EXCEDE EL LÍMITE por ${clientCount - limits.clients} cliente(s)`);
    } else if (limits.clients !== 'unlimited' && clientCount === limits.clients) {
      console.log(`   ⚠️  EN EL LÍMITE`);
    } else {
      console.log(`   ✅ Dentro del límite`);
    }

    console.log('\n📧 NOTIFICACIONES:');
    console.log(`   Email: ${limits.notifications.email ? '✅ Habilitado' : '❌ Deshabilitado'}`);
    console.log(`   SMS: ${limits.notifications.sms ? '✅ Habilitado' : '❌ Deshabilitado'}`);
    console.log(`   Recordatorios: ${limits.notifications.reminders ? '✅ Habilitado' : '❌ Deshabilitado'}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('\n📋 RESUMEN DE LÍMITES POR PLAN:\n');

  Object.entries(PLAN_LIMITS).forEach(([plan, limits]) => {
    console.log(`${plan.toUpperCase()}:`);
    console.log(`  Usuarios: ${limits.users === 'unlimited' ? 'Ilimitado' : limits.users}`);
    console.log(`  Clientes: ${limits.clients === 'unlimited' ? 'Ilimitado' : limits.clients}`);
    console.log(`  Email: ${limits.notifications.email ? '✅' : '❌'}`);
    console.log(`  SMS: ${limits.notifications.sms ? '✅' : '❌'}`);
    console.log(`  Recordatorios: ${limits.notifications.reminders ? '✅' : '❌'}`);
    console.log('');
  });

  console.log('✅ Verificación completada\n');
}

verifyPlanLimits().catch(console.error);
