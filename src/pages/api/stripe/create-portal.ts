import type { APIRoute } from 'astro';
import { getStripeInstance } from '../../../lib/stripe';
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
    const { customerId } = body;

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'Customer ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stripe = getStripeInstance(stripeKey);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(JSON.stringify({ error: 'Failed to create portal session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

