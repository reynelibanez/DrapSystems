// =====================================================
// STRIPE MODULE WEBHOOK - Supabase Edge Function
// Maneja webhooks de Stripe para suscripciones modulares
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Mapeo de Price IDs a módulos y planes
const PRICE_TO_MODULE_MAP: Record<string, { module: string; plan: string; billing: string }> = {
  // Módulo de Servicios
  'price_services_basic_monthly': { module: 'services', plan: 'basic', billing: 'monthly' },
  'price_services_basic_annual': { module: 'services', plan: 'basic', billing: 'annual' },
  'price_services_professional_monthly': { module: 'services', plan: 'professional', billing: 'monthly' },
  'price_services_professional_annual': { module: 'services', plan: 'professional', billing: 'annual' },
  'price_services_enterprise_monthly': { module: 'services', plan: 'enterprise', billing: 'monthly' },
  'price_services_enterprise_annual': { module: 'services', plan: 'enterprise', billing: 'annual' },
  
  // Módulo de Citas (existente - para compatibilidad)
  'price_appointments_basic_monthly': { module: 'appointments', plan: 'basic', billing: 'monthly' },
  'price_appointments_basic_annual': { module: 'appointments', plan: 'basic', billing: 'annual' },
  'price_appointments_professional_monthly': { module: 'appointments', plan: 'professional', billing: 'monthly' },
  'price_appointments_professional_annual': { module: 'appointments', plan: 'professional', billing: 'annual' },
  'price_appointments_enterprise_monthly': { module: 'appointments', plan: 'enterprise', billing: 'monthly' },
  'price_appointments_enterprise_annual': { module: 'appointments', plan: 'enterprise', billing: 'annual' },
};

interface WebhookEvent {
  type: string;
  data: {
    object: Stripe.Subscription | Stripe.Invoice | Stripe.Checkout.Session;
  };
}

async function updateModuleSubscription(
  supabaseUrl: string,
  supabaseKey: string,
  businessId: string,
  moduleName: string,
  planType: string,
  subscriptionData: {
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    billingCycle: string;
    amount: number;
    canceledAt?: string;
  }
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_module_subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      p_business_id: businessId,
      p_module_name: moduleName,
      p_plan_type: planType,
      p_stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      p_stripe_customer_id: subscriptionData.stripeCustomerId,
      p_stripe_price_id: subscriptionData.stripePriceId,
      p_billing_cycle: subscriptionData.billingCycle,
      p_amount: subscriptionData.amount,
      p_trial_days: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update module subscription: ${error}`);
  }

  return await response.json();
}

async function getBusinessIdFromStripeCustomer(
  supabaseUrl: string,
  supabaseKey: string,
  stripeCustomerId: string
): Promise<string | null> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/businesses?stripe_customer_id=eq.${stripeCustomerId}&select=id`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }

  const businesses = await response.json();
  return businesses.length > 0 ? businesses[0].id : null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const webhookSecret = Deno.env.get('STRIPE_MODULE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    ) as WebhookEvent;

    console.log(`[Module Webhook] Processing event: ${event.type}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Procesar eventos de suscripción
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        console.log('[Module Webhook] No price ID found in subscription');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const moduleInfo = PRICE_TO_MODULE_MAP[priceId];
      if (!moduleInfo) {
        console.log(`[Module Webhook] Price ID ${priceId} not mapped to any module`);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const businessId = await getBusinessIdFromStripeCustomer(
        supabaseUrl,
        supabaseKey,
        subscription.customer as string
      );

      if (!businessId) {
        throw new Error('Business not found for customer');
      }

      const subscriptionData = {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        billingCycle: moduleInfo.billing,
        amount: subscription.items.data[0].price.unit_amount! / 100,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : undefined,
      };

      await updateModuleSubscription(
        supabaseUrl,
        supabaseKey,
        businessId,
        moduleInfo.module,
        moduleInfo.plan,
        subscriptionData
      );

      console.log(`[Module Webhook] Updated ${moduleInfo.module} subscription for business ${businessId}`);
    }

    // Procesar eventos de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;

        if (priceId) {
          const moduleInfo = PRICE_TO_MODULE_MAP[priceId];
          
          if (moduleInfo) {
            const businessId = await getBusinessIdFromStripeCustomer(
              supabaseUrl,
              supabaseKey,
              session.customer as string
            );

            if (businessId) {
              const subscriptionData = {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: session.customer as string,
                stripePriceId: priceId,
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                billingCycle: moduleInfo.billing,
                amount: subscription.items.data[0].price.unit_amount! / 100,
              };

              await updateModuleSubscription(
                supabaseUrl,
                supabaseKey,
                businessId,
                moduleInfo.module,
                moduleInfo.plan,
                subscriptionData
              );

              console.log(`[Module Webhook] Created ${moduleInfo.module} subscription for business ${businessId}`);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Module Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
