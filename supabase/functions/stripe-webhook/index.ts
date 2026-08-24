// Supabase Edge Function para manejar webhooks de Stripe
// Esta función se ejecuta cuando Stripe confirma un pago
// IMPORTANTE: Esta función NO requiere autenticación JWT
// Stripe verifica la autenticidad mediante la firma del webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Función para obtener el plan desde el price ID
function getPlanFromPriceId(priceId: string): string {
  const PRICE_IDS = {
    professionalMonth: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTH'),
    professionalYear: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_YEAR'),
    businessMonth: Deno.env.get('STRIPE_PRICE_BUSINESS_MONTH'),
    businessYear: Deno.env.get('STRIPE_PRICE_BUSINESS_YEAR'),
    enterpriseMonth: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTH'),
    enterpriseYear: Deno.env.get('STRIPE_PRICE_ENTERPRISE_YEAR'),
  };

  if (priceId === PRICE_IDS.professionalMonth || priceId === PRICE_IDS.professionalYear) {
    return 'professional';
  }
  
  if (priceId === PRICE_IDS.businessMonth || priceId === PRICE_IDS.businessYear) {
    return 'business';
  }
  
  if (priceId === PRICE_IDS.enterpriseMonth || priceId === PRICE_IDS.enterpriseYear) {
    return 'enterprise';
  }

  return 'basic';
}

// Función para actualizar el negocio desde la suscripción
async function updateBusinessFromSubscription(
  subscription: Stripe.Subscription,
  businessId: string,
  supabase: any
) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);
  const status = subscription.status;
  const billingInterval = subscription.items.data[0]?.price.recurring?.interval || 'month';

  console.log('[Update] Updating business:', businessId);
  console.log('[Update] Price ID:', priceId);
  console.log('[Update] Detected plan:', plan);
  console.log('[Update] Subscription status:', status);
  console.log('[Update] Billing interval:', billingInterval);

  // Mapear el estado de Stripe a nuestro estado
  let subscriptionStatus = 'inactive';
  if (status === 'active' || status === 'trialing') {
    subscriptionStatus = 'active';
  } else if (status === 'past_due') {
    subscriptionStatus = 'past_due';
  } else if (status === 'canceled' || status === 'unpaid') {
    subscriptionStatus = 'cancelled';
  }

  // Obtener settings actuales para preservarlos
  const { data: currentBusiness } = await supabase
    .from('businesses')
    .select('settings')
    .eq('id', businessId)
    .single();

  const currentSettings = currentBusiness?.settings || {};

  const updateData = {
    subscription_plan: plan,
    subscription_status: subscriptionStatus,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_ends_at: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    settings: {
      ...currentSettings,
      billing_period: billingInterval,
    },
    updated_at: new Date().toISOString(),
  };

  console.log('[Update] Update data:', JSON.stringify(updateData, null, 2));

  const { data: updatedBusiness, error: updateError } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId)
    .select()
    .single();

  if (updateError) {
    console.error('[Update] ❌ Error updating business:', updateError);
    throw updateError;
  }

  console.log('[Update] ✅ Business updated successfully!');
  console.log('[Update] New plan:', updatedBusiness.subscription_plan);
  console.log('[Update] New status:', updatedBusiness.subscription_status);
  console.log('[Update] Billing period:', billingInterval);

  return updatedBusiness;
}

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response(
        JSON.stringify({ error: 'Missing signature or webhook secret' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.businessId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        console.log('=== CHECKOUT SESSION COMPLETED ===');
        console.log('Session ID:', session.id);
        console.log('Business ID from metadata:', businessId);
        console.log('Subscription ID:', subscriptionId);
        console.log('Customer ID:', customerId);

        if (!businessId) {
          console.error('❌ ERROR: No businessId in session metadata!');
          break;
        }

        // Verificar que el negocio existe
        const { data: existingBusiness, error: fetchError } = await supabase
          .from('businesses')
          .select('id, name, subscription_plan, subscription_status')
          .eq('id', businessId)
          .single();

        if (fetchError || !existingBusiness) {
          console.error('❌ ERROR: Business not found:', fetchError);
          break;
        }

        console.log('✅ Business found:', existingBusiness.name);

        // Si hay suscripción, obtener detalles y actualizar
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          console.log('✅ Retrieved subscription:', subscription.id);
          
          await updateBusinessFromSubscription(subscription, businessId, supabase);
        } else {
          // Si no hay suscripción (pago único), solo actualizar el estado
          const { error: updateError } = await supabase
            .from('businesses')
            .update({
              stripe_customer_id: customerId,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', businessId);

          if (updateError) {
            console.error('❌ ERROR updating business:', updateError);
          } else {
            console.log('✅ Business updated successfully (no subscription)');
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('=== SUBSCRIPTION CREATED ===');
        console.log('Subscription ID:', subscription.id);
        console.log('Customer:', subscription.customer);

        // Buscar la empresa por customer ID
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (business) {
          console.log('✅ Found business:', business.id);
          await updateBusinessFromSubscription(subscription, business.id, supabase);
        } else {
          console.error('❌ No business found for customer:', subscription.customer);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('=== SUBSCRIPTION UPDATED ===');
        console.log('Subscription ID:', subscription.id);
        console.log('Customer ID:', subscription.customer);

        // Buscar por subscription_id primero
        let { data: business } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        // Si no se encuentra, buscar por customer_id
        if (!business) {
          const result = await supabase
            .from('businesses')
            .select('id, name')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();
          
          business = result.data;
        }

        if (business) {
          console.log('✅ Found business:', business.name);
          await updateBusinessFromSubscription(subscription, business.id, supabase);
        } else {
          console.error('❌ No business found for subscription:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('=== SUBSCRIPTION DELETED ===');
        console.log('Subscription ID:', subscription.id);

        // Buscar la empresa por subscription_id
        const { data: business } = await supabase
          .from('businesses')
          .select('id, settings')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (business) {
          console.log('✅ Cancelling subscription for business:', business.id);
          
          // Calcular fecha de fin del trial (30 días)
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 30);

          const currentSettings = business.settings || {};

          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_status: 'trial',
              subscription_plan: 'basic',
              stripe_subscription_id: null,
              subscription_end_date: trialEndsAt.toISOString(),
              trial_ends_at: trialEndsAt.toISOString(),
              settings: {
                ...currentSettings,
                billing_period: 'month',
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', business.id);

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription cancelled, downgraded to basic plan');
          }
        } else {
          console.error('❌ No business found for subscription:', subscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('=== PAYMENT SUCCEEDED ===');
        console.log('Invoice ID:', invoice.id);
        console.log('Subscription:', invoice.subscription);

        if (invoice.subscription) {
          // Buscar la empresa por subscription_id
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .single();

          if (business) {
            console.log('✅ Activating subscription for business:', business.id);
            
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );
            await updateBusinessFromSubscription(subscription, business.id, supabase);
          } else {
            console.error('❌ No business found for subscription:', invoice.subscription);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('=== PAYMENT FAILED ===');
        console.log('Invoice ID:', invoice.id);

        if (invoice.subscription) {
          // Buscar la empresa por subscription_id
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .single();

          if (business) {
            console.log('⚠️ Marking subscription as past_due for business:', business.id);
            
            const { error } = await supabase
              .from('businesses')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', business.id);

            if (error) {
              console.error('❌ Error updating payment status:', error);
            } else {
              console.log('✅ Payment status updated to past_due');
            }
          } else {
            console.error('❌ No business found for subscription:', invoice.subscription);
          }
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

