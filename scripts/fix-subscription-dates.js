
/**
 * Script para corregir fechas de suscripción faltantes o vencidas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubscriptionDates() {
  console.log('=== CORRIGIENDO FECHAS DE SUSCRIPCIÓN ===\n');

  // 1. Obtener empresas con problemas
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, subscription_plan, subscription_status, subscription_end_date, trial_ends_at, settings')
    .neq('subscription_plan', 'basic');

  if (error) {
    console.error('❌ Error obteniendo empresas:', error);
    return;
  }

  console.log(`📊 Revisando ${businesses.length} empresas con planes de pago...\n`);

  let fixed = 0;
  let errors = 0;

  for (const business of businesses) {
    const now = new Date();
    let needsUpdate = false;
    let subscriptionEndDate = business.subscription_end_date;
    let trialEndsAt = business.trial_ends_at;

    // Verificar si necesita actualización
    const hasNoEndDate = !business.subscription_end_date;
    const isExpired = business.subscription_end_date && new Date(business.subscription_end_date) < now;

    if (hasNoEndDate || isExpired) {
      needsUpdate = true;
      
      console.log(`\n🔧 Corrigiendo: ${business.name}`);
      console.log(`   Plan: ${business.subscription_plan}`);
      console.log(`   Estado: ${business.subscription_status}`);
      
      if (hasNoEndDate) {
        console.log(`   Problema: Sin fecha de vencimiento`);
      } else {
        console.log(`   Problema: Suscripción vencida (${new Date(business.subscription_end_date).toLocaleDateString()})`);
      }

      // Calcular nuevas fechas
      if (business.subscription_status === 'trial') {
        // Trial de 14 días
        trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        subscriptionEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        console.log(`   ✅ Nueva fecha (trial): ${new Date(subscriptionEndDate).toLocaleDateString()}`);
      } else {
        // Suscripción activa
        let billingPeriod = 'month'; // Default
        
        // Parsear settings si existe
        if (business.settings) {
          try {
            const settings = typeof business.settings === 'string' 
              ? JSON.parse(business.settings) 
              : business.settings;
            billingPeriod = settings.billing_period || 'month';
          } catch (e) {
            console.log(`   ⚠️  Error parseando settings, usando periodo mensual por defecto`);
          }
        }
        
        if (billingPeriod === 'year') {
          // Anual: 365 días
          subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
          console.log(`   ✅ Nueva fecha (anual): ${new Date(subscriptionEndDate).toLocaleDateString()}`);
        } else {
          // Mensual: 30 días
          subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          console.log(`   ✅ Nueva fecha (mensual): ${new Date(subscriptionEndDate).toLocaleDateString()}`);
        }
        
        trialEndsAt = null;
      }

      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          subscription_end_date: subscriptionEndDate,
          trial_ends_at: trialEndsAt
        })
        .eq('id', business.id);

      if (updateError) {
        console.log(`   ❌ Error actualizando: ${updateError.message}`);
        errors++;
      } else {
        console.log(`   ✅ Actualizado correctamente`);
        fixed++;
      }
    }
  }

  // Resumen
  console.log('\n\n=== RESUMEN ===\n');
  console.log(`✅ Empresas corregidas: ${fixed}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📊 Total revisadas: ${businesses.length}`);

  if (fixed > 0) {
    console.log('\n💡 Ejecuta "npm run check-subscription-dates" para verificar los cambios');
  }
}

// Ejecutar
fixSubscriptionDates()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

