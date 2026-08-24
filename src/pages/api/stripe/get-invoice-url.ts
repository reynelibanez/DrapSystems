/**
 * API: Obtener URL de Pago de Factura de Stripe
 * 
 * POST /api/stripe/get-invoice-url
 * Body: { invoiceId: string }
 * 
 * Retorna la URL de pago de una factura de Stripe
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Obtener la factura de Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (!invoice.hosted_invoice_url) {
      return new Response(
        JSON.stringify({ error: 'Invoice URL not available' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        url: invoice.hosted_invoice_url,
        amount: invoice.amount_due / 100,
        status: invoice.status
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error getting invoice URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get invoice URL', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
