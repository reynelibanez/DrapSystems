

/**
 * Webhook de Stripe para Cargos de SMS
 * 
 * Maneja eventos de Stripe relacionados con cargos por exceso de SMS:
 * - invoice.finalized: Actualizar invoice ID
 * - invoice.payment_succeeded: Marcar cargo como pagado
 * - invoice.payment_failed: Marcar cargo como fallido
 * - payment_intent.succeeded: Actualizar payment intent
 * - payment_intent.payment_failed: Actualizar payment intent
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = locals?.runtime?.env?.STRIPE_SMS_WEBHOOK_SECRET || import.meta.env.STRIPE_SMS_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Manejar eventos de pago
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Verificar si es una factura de SMS
        if (invoice.metadata?.type === 'sms_overage' && invoice.metadata?.charge_id) {
          const chargeId = invoice.metadata.charge_id;
          const paymentIntentId = typeof invoice.payment_intent === 'string' 
            ? invoice.payment_intent 
            : invoice.payment_intent?.id;

          console.log(`💰 SMS Payment received for charge ${chargeId}`);

          // Llamar a la función SQL que procesa el pago exitoso
          const { data, error } = await supabase.rpc('process_sms_payment_success', {
            p_charge_id: chargeId,
            p_stripe_invoice_id: invoice.id,
            p_stripe_payment_intent_id: paymentIntentId || null
          });

          if (error) {
            console.error('Error processing SMS payment success:', error);
            return new Response(
              JSON.stringify({ error: 'Failed to process payment', details: error.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          console.log(`✅ Business UNBLOCKED after successful payment`);
          console.log(`🔄 SMS counter reset for new billing period`);

          return new Response(
            JSON.stringify({ 
              received: true, 
              message: 'Payment processed and business unblocked',
              charge_id: chargeId
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Verificar si es una factura de SMS
        if (invoice.metadata?.type === 'sms_overage' && invoice.metadata?.charge_id) {
          const chargeId = invoice.metadata.charge_id;

          console.log(`❌ SMS Payment FAILED for charge ${chargeId}`);

          // Llamar a la función SQL que procesa el pago fallido
          const { data, error } = await supabase.rpc('process_sms_payment_failed', {
            p_charge_id: chargeId
          });

          if (error) {
            console.error('Error processing SMS payment failure:', error);
          }

          console.log(`🔒 Business remains BLOCKED due to payment failure`);

          return new Response(
            JSON.stringify({ 
              received: true, 
              message: 'Payment failed, business remains blocked',
              charge_id: chargeId
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Buscar si hay un cargo de SMS asociado
        if (paymentIntent.invoice) {
          const invoiceId = typeof paymentIntent.invoice === 'string' 
            ? paymentIntent.invoice 
            : paymentIntent.invoice.id;

          // Buscar el cargo por invoice ID
          const { data: charge, error: chargeError } = await supabase
            .from('sms_charges')
            .select('id, business_id')
            .eq('stripe_invoice_id', invoiceId)
            .single();

          if (!chargeError && charge) {
            console.log(`✅ Payment intent succeeded for SMS charge ${charge.id}`);
            
            // Procesar el pago exitoso
            await supabase.rpc('process_sms_payment_success', {
              p_charge_id: charge.id,
              p_stripe_invoice_id: invoiceId,
              p_stripe_payment_intent_id: paymentIntent.id
            });

            console.log(`✅ Business ${charge.business_id} UNBLOCKED`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Buscar si hay un cargo de SMS asociado
        if (paymentIntent.invoice) {
          const invoiceId = typeof paymentIntent.invoice === 'string' 
            ? paymentIntent.invoice 
            : paymentIntent.invoice.id;

          // Buscar el cargo por invoice ID
          const { data: charge, error: chargeError } = await supabase
            .from('sms_charges')
            .select('id, business_id')
            .eq('stripe_invoice_id', invoiceId)
            .single();

          if (!chargeError && charge) {
            console.log(`❌ Payment intent FAILED for SMS charge ${charge.id}`);
            
            // Procesar el pago fallido
            await supabase.rpc('process_sms_payment_failed', {
              p_charge_id: charge.id
            });

            console.log(`🔒 Business ${charge.business_id} remains BLOCKED`);
          }
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in SMS webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



