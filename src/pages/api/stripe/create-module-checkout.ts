import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapeo de módulos y planes a Price IDs de Stripe
const MODULE_PRICE_IDS: Record<string, Record<string, { monthly: string; annual: string }>> = {
  services: {
    basic: {
      monthly: import.meta.env.STRIPE_SERVICES_BASIC_MONTHLY_PRICE_ID || 'price_services_basic_monthly',
      annual: import.meta.env.STRIPE_SERVICES_BASIC_ANNUAL_PRICE_ID || 'price_services_basic_annual',
    },
    professional: {
      monthly: import.meta.env.STRIPE_SERVICES_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_services_professional_monthly',
      annual: import.meta.env.STRIPE_SERVICES_PROFESSIONAL_ANNUAL_PRICE_ID || 'price_services_professional_annual',
    },
    enterprise: {
      monthly: import.meta.env.STRIPE_SERVICES_ENTERPRISE_MONTHLY_PRICE_ID || 'price_services_enterprise_monthly',
      annual: import.meta.env.STRIPE_SERVICES_ENTERPRISE_ANNUAL_PRICE_ID || 'price_services_enterprise_annual',
    },
  },
  appointments: {
    basic: {
      monthly: import.meta.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
      annual: import.meta.env.STRIPE_BASIC_ANNUAL_PRICE_ID || '',
    },
    professional: {
      monthly: import.meta.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '',
      annual: import.meta.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || '',
    },
    enterprise: {
      monthly: import.meta.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      annual: import.meta.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
    },
  },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { businessId, module, plan, billingCycle } = await request.json();

    if (!businessId || !module || !plan || !billingCycle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar módulo y plan
    if (!MODULE_PRICE_IDS[module]) {
      return new Response(
        JSON.stringify({ error: 'Invalid module' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!MODULE_PRICE_IDS[module][plan]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return new Response(
        JSON.stringify({ error: 'Invalid billing cycle' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener o crear customer de Stripe
    let customerId = business.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.name,
        phone: business.phone,
        metadata: {
          business_id: businessId,
        },
      });

      customerId = customer.id;

      // Actualizar el negocio con el customer ID
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', businessId);
    }

    // Obtener el Price ID correcto
    const priceId = MODULE_PRICE_IDS[module][plan][billingCycle];

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${import.meta.env.PUBLIC_SITE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&module=${module}`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/subscription/cancelled?module=${module}`,
      metadata: {
        business_id: businessId,
        module: module,
        plan: plan,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          business_id: businessId,
          module: module,
          plan: plan,
          billing_cycle: billingCycle,
        },
      },
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
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
