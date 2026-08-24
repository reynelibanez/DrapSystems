#!/usr/bin/env node

/**
 * Script para sincronizar suscripciones de Stripe con la base de datos
 * Útil cuando el webhook no se ejecutó correctamente
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

// Función para obtener el plan desde el price ID
function getPlanFromPriceId(priceId) {
  const PRICE_IDS = {
    professional: process.env.STRIPE_PRICE_PROFESSIONAL,
    professionalMonth: process.env.STRIPE_PRICE_PROFESSIONAL_MONTH || process.env.STRIPE_PRICE_PROFESSIONAL,
    professionalYear: process.env.STRIPE_PRICE_PROFESSIONAL_YEAR,
    business: process.env.STRIPE_PRICE_BUSINESS,
    businessMonth: process.env.STRIPE_PRICE_BUSINESS_MONTH || process.env.STRIPE_PRICE_BUSINESS,
    businessYear: process.env.STRIPE_PRICE_BUSINESS_YEAR,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    enterpriseMonth: process.env.STRIPE_PRICE_ENTERPRISE_MONTH || process.env.STRIPE_PRICE_ENTERPRISE,
    enterpriseYear: process.env.STRIPE_PRICE_ENTERPRISE_YEAR,
  };

  if (priceId === PRICE_IDS.professional || 
      priceId === PRICE_IDS.professionalMonth || 
      priceId === PRICE_IDS.professionalYear) {
    return 'professional';
  }
  
  if (priceId === PRICE_IDS.business || 
      priceId === PRICE_IDS.businessMonth || 
      priceId === PRICE_IDS.businessYear) {
    return 'business';
  }
  
  if (priceId === PRICE_IDS.enterprise || 
      priceId === PRICE_IDS.enterpriseMonth || 
      priceId === PRICE_IDS.enterpriseYear) {
    return 'enterprise';
  }

  return 'basic';
}

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

async function syncStripeSubscriptions() {
  console.log('🔄 Sincronizando suscripciones de Stripe con la base de datos...\n');

  try {
    // 1. Obtener todos los negocios con customer ID
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, email, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, settings')
      .not('stripe_customer_id', 'is', null);

    if (fetchError) {
      console.error('❌ Error al obtener negocios:', fetchError.message);
      process.exit(1);
    }

    if (!businesses || businesses.length === 0) {
      console.log('⚠️  No se encontraron negocios con Customer ID de Stripe');
      return;
    }

    console.log(`✅ Se encontraron ${businesses.length} negocio(s) con Customer ID\n`);

    const businessesToUpdate = [];

    // 2. Verificar cada negocio en Stripe
    for (const business of businesses) {
      // Validar que el customer ID sea válido
      if (!business.stripe_customer_id.startsWith('cus_')) {
        console.log(`⚠️  ${business.name}: Customer ID inválido (${business.stripe_customer_id})`);
        continue;
      }

      try {
        // Obtener suscripciones del customer
        const subscriptions = await stripe.subscriptions.list({
          customer: business.stripe_customer_id,
          limit: 10
        });

        if (subscriptions.data.length === 0) {
          console.log(`ℹ️  ${business.name}: No tiene suscripciones en Stripe`);
          continue;
        }

        // Buscar la suscripción activa
        const activeSubscription = subscriptions.data.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        );

        if (!activeSubscription) {
          console.log(`ℹ️  ${business.name}: No tiene suscripciones activas`);
          continue;
        }

        // Obtener datos de la suscripción
        const priceId = activeSubscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);
        const interval = activeSubscription.items.data[0]?.price.recurring?.interval || 'month';
        
        // Mapear estado
        let subscriptionStatus = 'inactive';
        if (activeSubscription.status === 'active' || activeSubscription.status === 'trialing') {
          subscriptionStatus = 'active';
        } else if (activeSubscription.status === 'past_due') {
          subscriptionStatus = 'past_due';
        }

        // Verificar si necesita actualización
        const needsUpdate = 
          business.subscription_plan !== plan ||
          business.subscription_status !== subscriptionStatus ||
          business.stripe_subscription_id !== activeSubscription.id ||
          business.settings?.billing_period !== interval;

        if (needsUpdate) {
          businessesToUpdate.push({
            business,
            subscription: activeSubscription,
            newPlan: plan,
            newStatus: subscriptionStatus,
            newInterval: interval
          });

          console.log(`🔄 ${business.name}:`);
          console.log(`   Plan actual: ${business.subscription_plan} → Nuevo: ${plan}`);
          console.log(`   Estado actual: ${business.subscription_status} → Nuevo: ${subscriptionStatus}`);
          console.log(`   Billing: ${business.settings?.billing_period || 'no configurado'} → ${interval}`);
          console.log(`   Subscription ID: ${business.stripe_subscription_id || 'null'} → ${activeSubscription.id}`);
          console.log();
        } else {
          console.log(`✅ ${business.name}: Ya está sincronizado`);
        }

      } catch (error) {
        console.error(`❌ ${business.name}: Error al verificar en Stripe:`, error.message);
      }
    }

    if (businessesToUpdate.length === 0) {
      console.log('\n✅ Todos los negocios están sincronizados correctamente!');
      return;
    }

    // 3. Pedir confirmación
    console.log('\n─'.repeat(70));
    console.log(`\n⚠️  Se encontraron ${businessesToUpdate.length} negocio(s) que necesitan actualización\n`);
    
    const confirmed = await askConfirmation('¿Deseas continuar con la sincronización? (y/n): ');

    if (!confirmed) {
      console.log('\n❌ Sincronización cancelada por el usuario');
      process.exit(0);
    }

    // 4. Actualizar negocios
    console.log('\n🔄 Actualizando negocios...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const item of businessesToUpdate) {
      const { business, subscription, newPlan, newStatus, newInterval } = item;

      try {
        const currentSettings = business.settings || {};

        const updateData = {
          subscription_plan: newPlan,
          subscription_status: newStatus,
          stripe_subscription_id: subscription.id,
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null,
          settings: {
            ...currentSettings,
            billing_period: newInterval
          },
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('businesses')
          .update(updateData)
          .eq('id', business.id);

        if (updateError) {
          console.error(`❌ ${business.name}: Error al actualizar:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ ${business.name}: Actualizado correctamente`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ ${business.name}: Error:`, error.message);
        errorCount++;
      }
    }

    // 5. Resumen
    console.log('\n─'.repeat(70));
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log(`   ✅ Actualizados correctamente: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📊 Total procesados: ${businessesToUpdate.length}`);
    console.log('\n─'.repeat(70));

    if (successCount > 0) {
      console.log('\n✅ Sincronización completada exitosamente!');
      console.log('\n💡 PRÓXIMOS PASOS:');
      console.log('   1. Verifica los cambios en la aplicación');
      console.log('   2. Revisa que los planes se muestren correctamente');
      console.log('   3. Configura el webhook para evitar problemas futuros');
    }

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar sincronización
syncStripeSubscriptions();
