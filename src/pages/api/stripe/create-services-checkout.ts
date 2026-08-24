import type { APIRoute } from 'astro';
import { getStripeInstance, createCheckoutSession } from '../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Mapeo de planes a Price IDs de Stripe
const SERVICES_PRICE_IDS = {
  professional: {
    month: import.meta.env.STRIPE_SERVICES_PROFESSIONAL_MONTHLY_PRICE_ID,
    year: import.meta.env.STRIPE_SERVICES_PROFESSIONAL_YEARLY_PRICE_ID,
  },
  enterprise: {
    month: import.meta.env.STRIPE_SERVICES_ENTERPRISE_MONTHLY_PRICE_ID,
    year: import.meta.env.STRIPE_SERVICES_ENTERPRISE_YEARLY_PRICE_ID,
  },
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { planId, businessId, billing = 'month' } = body;

    console.log('[Services Checkout] Request received:', { planId, businessId, billing });

    if (!planId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId and businessId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el plan no sea free
    if (planId === 'free') {
      return new Response(
        JSON.stringify({ error: 'Cannot create checkout for free plan' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el Price ID correspondiente
    const priceId = SERVICES_PRICE_IDS[planId as keyof typeof SERVICES_PRICE_IDS]?.[billing as 'month' | 'year'];
    
    if (!priceId) {
      console.error('[Services Checkout] Price ID not configured for plan:', planId, billing);
      return new Response(
        JSON.stringify({ 
          error: 'Plan not configured',
          details: `Price ID not found for plan ${planId} with ${billing} billing`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Services Checkout] Using Price ID:', priceId);

    // Obtener claves de Stripe
    const stripeSecretKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[Services Checkout] Stripe secret key not found');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = getStripeInstance(stripeSecretKey);

    // Obtener información del negocio desde Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Services Checkout] Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email, stripe_customer_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      console.error('[Services Checkout] Business not found:', businessError);
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si ya tiene una suscripción activa para el módulo de servicios
    const { data: existingSubscription } = await supabase
      .from('module_subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .eq('module_name', 'services')
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSubscription && existingSubscription.plan_type !== 'free') {
      console.log('[Services Checkout] Business already has active services subscription');
      return new Response(
        JSON.stringify({ 
          error: 'Ya tienes una suscripción activa para el módulo de servicios',
          details: 'Para cambiar de plan, cancela tu suscripción actual primero'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // URLs de éxito y cancelación
    const baseUrl = locals?.runtime?.env?.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}&module=services`;
    const cancelUrl = `${baseUrl}/subscription/cancelled?module=services`;

    console.log('[Services Checkout] Creating checkout session:', {
      priceId,
      planId,
      billing,
      businessId,
      businessName: business.name,
      customerId: business.stripe_customer_id,
    });

    // Crear sesión de checkout
    const session = await createCheckoutSession(
      stripe,
      priceId,
      business.stripe_customer_id,
      businessId,
      successUrl,
      cancelUrl,
      business.email
    );

    // Guardar información de la sesión en metadata
    await supabase
      .from('module_subscriptions')
      .upsert({
        business_id: businessId,
        module_name: 'services',
        plan_type: planId,
        status: 'pending',
        billing_cycle: billing,
        stripe_price_id: priceId,
        metadata: {
          checkout_session_id: session.id,
          price_id: priceId,
          plan_id: planId,
          billing,
        },
      }, {
        onConflict: 'business_id,module_name',
      });

    console.log('[Services Checkout] Checkout session created:', {
      sessionId: session.id,
      url: session.url,
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Services Checkout] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error creating checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

