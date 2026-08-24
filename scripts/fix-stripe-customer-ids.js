#!/usr/bin/env node

/**
 * Script para limpiar IDs de clientes de Stripe inválidos
 * Establece a NULL los stripe_customer_id que no comienzan con 'cus_'
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para preguntar confirmación
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function fixStripeCustomerIds() {
  console.log('🔧 Limpiando IDs de clientes de Stripe inválidos...\n');

  try {
    // 1. Identificar negocios con IDs inválidos
    const { data: invalidBusinesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, email, stripe_customer_id, subscription_plan')
      .not('stripe_customer_id', 'is', null)
      .not('stripe_customer_id', 'like', 'cus_%');

    if (fetchError) {
      console.error('❌ Error al obtener negocios:', fetchError.message);
      process.exit(1);
    }

    if (!invalidBusinesses || invalidBusinesses.length === 0) {
      console.log('✅ No se encontraron IDs inválidos. Todo está correcto!');
      process.exit(0);
    }

    // Mostrar negocios afectados
    console.log(`⚠️  Se encontraron ${invalidBusinesses.length} negocio(s) con IDs inválidos:\n`);
    console.log('─'.repeat(70));
    
    invalidBusinesses.forEach((business, index) => {
      console.log(`${index + 1}. ${business.name || 'Sin nombre'}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Email: ${business.email || 'Sin email'}`);
      console.log(`   Stripe ID inválido: ${business.stripe_customer_id}`);
      console.log(`   Plan: ${business.subscription_plan || 'Sin plan'}`);
      console.log();
    });
    
    console.log('─'.repeat(70));
    console.log();
    console.log('📝 ACCIÓN A REALIZAR:');
    console.log('   Se establecerá stripe_customer_id = NULL para estos negocios');
    console.log('   Esto permitirá que el sistema cree nuevos clientes válidos en Stripe');
    console.log();

    // Pedir confirmación
    const confirmed = await askConfirmation('¿Deseas continuar? (y/n): ');

    if (!confirmed) {
      console.log('\n❌ Operación cancelada por el usuario');
      process.exit(0);
    }

    console.log('\n🔄 Limpiando IDs inválidos...');

    // 2. Actualizar los registros
    const businessIds = invalidBusinesses.map(b => b.id);
    
    const { data: updatedBusinesses, error: updateError } = await supabase
      .from('businesses')
      .update({ stripe_customer_id: null })
      .in('id', businessIds)
      .select();

    if (updateError) {
      console.error('❌ Error al actualizar negocios:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ Se limpiaron ${updatedBusinesses?.length || 0} registros exitosamente\n`);

    // 3. Verificar el resultado
    const { data: remainingInvalid, error: verifyError } = await supabase
      .from('businesses')
      .select('id')
      .not('stripe_customer_id', 'is', null)
      .not('stripe_customer_id', 'like', 'cus_%');

    if (verifyError) {
      console.error('⚠️  Error al verificar resultado:', verifyError.message);
    } else if (remainingInvalid && remainingInvalid.length > 0) {
      console.log(`⚠️  Aún quedan ${remainingInvalid.length} IDs inválidos`);
      console.log('   Ejecuta el script nuevamente o revisa manualmente');
    } else {
      console.log('✅ Verificación completada: No quedan IDs inválidos');
    }

    // 4. Mostrar estadísticas finales
    const { data: allBusinesses, error: statsError } = await supabase
      .from('businesses')
      .select('stripe_customer_id');

    if (!statsError && allBusinesses) {
      const stats = {
        total: allBusinesses.length,
        withId: allBusinesses.filter(b => b.stripe_customer_id !== null).length,
        validIds: allBusinesses.filter(b => b.stripe_customer_id?.startsWith('cus_')).length,
        nullIds: allBusinesses.filter(b => b.stripe_customer_id === null).length
      };

      console.log('\n📊 ESTADÍSTICAS FINALES:');
      console.log('─'.repeat(50));
      console.log(`Total de negocios:           ${stats.total}`);
      console.log(`Con Stripe Customer ID:      ${stats.withId}`);
      console.log(`  ✅ IDs válidos (cus_*):    ${stats.validIds}`);
      console.log(`Sin Stripe Customer ID:      ${stats.nullIds}`);
      console.log('─'.repeat(50));
    }

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Los negocios afectados podrán crear nuevas suscripciones');
    console.log('   2. El webhook de Stripe actualizará automáticamente los IDs');
    console.log('   3. Verifica los logs con: npm run logs');
    console.log();

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar limpieza
fixStripeCustomerIds();
