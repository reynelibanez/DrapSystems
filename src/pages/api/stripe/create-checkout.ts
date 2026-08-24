import type { APIRoute } from 'astro';
import { getStripeInstance, createCheckoutSession, getStripePriceIds } from '../../../lib/stripe';
import { baseUrl } from '../../../lib/base-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { planId, billing = 'month', businessId, customerId, customerEmail } = body;

    // Obtener los price IDs con el runtime correcto
    const STRIPE_PRICE_IDS = getStripePriceIds(locals?.runtime);

    console.log('=== CREATE CHECKOUT DEBUG ===');
    console.log('Request body:', { planId, billing, businessId, customerId, customerEmail });
    console.log('Available STRIPE_PRICE_IDS:', Object.keys(STRIPE_PRICE_IDS));
    console.log('STRIPE_PRICE_IDS values:', STRIPE_PRICE_IDS);

    // Validar que tenemos un planId
    if (!planId) {
      return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener el price ID según el plan y billing
    let priceId: string;
    const billingKey = billing === 'year' ? 'Year' : 'Month';
    const lookupKey = `${planId}${billingKey}`;
    
    console.log('Looking for price with key:', lookupKey);
    
    switch (planId) {
      case 'professional':
        priceId = STRIPE_PRICE_IDS[`professional${billingKey}`] || STRIPE_PRICE_IDS.professional;
        break;
      case 'business':
        priceId = STRIPE_PRICE_IDS[`business${billingKey}`] || STRIPE_PRICE_IDS.business;
        break;
      case 'enterprise':
        priceId = STRIPE_PRICE_IDS[`enterprise${billingKey}`] || STRIPE_PRICE_IDS.enterprise;
        break;
      default:
        console.error('Invalid plan ID:', planId);
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    console.log('Selected price ID:', priceId);
    console.log('Price ID is valid:', priceId && priceId !== '' && !priceId.includes('xxxxx'));

    if (!priceId || priceId === '' || priceId.includes('xxxxx')) {
      console.error('Price ID not found or invalid for:', { planId, billing, billingKey, lookupKey });
      return new Response(JSON.stringify({ 
        error: 'Price ID not configured for this plan',
        details: `Please configure STRIPE_PRICE_${planId.toUpperCase()}_${billingKey.toUpperCase()} in your environment variables`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating Stripe session with price ID:', priceId);

    const stripe = getStripeInstance(stripeKey);

    // Usar la URL de producción real en lugar del origin del request
    // Esto evita que se usen URLs temporales de Webflow
    const productionUrl = 'https://www.drapsystems.com';
    const successUrl = `${productionUrl}${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${productionUrl}${baseUrl}/subscription/cancelled`;

    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);

    const session = await createCheckoutSession(
      stripe,
      priceId,
      customerId,
      businessId,
      successUrl,
      cancelUrl,
      customerEmail
    );

    console.log('Stripe session created successfully:', session.id);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};








