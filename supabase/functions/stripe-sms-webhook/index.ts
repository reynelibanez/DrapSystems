
/**
 * SUPABASE EDGE FUNCTION: Stripe SMS Webhook
 * 
 * Procesa eventos de Stripe relacionados con pagos de SMS excedentes
 * 
 * Eventos procesados:
 * - invoice.paid: Pago exitoso → Desbloquea el negocio
 * - invoice.payment_failed: Pago fallido → Mantiene el bloqueo
 * - payment_intent.succeeded: Confirmación de pago exitoso
 * - payment_intent.payment_failed: Confirmación de pago fallido
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obtener variables de entorno
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_SMS_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Obtener el body y la firma
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No signature provided');
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar la firma del webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Webhook verified:', event.type);

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Procesar eventos
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Verificar si es una factura de SMS (completa o parcial)
        const isSmsOverage = invoice.metadata?.type === 'sms_overage';
        const isSmsPartial = invoice.metadata?.type === 'sms_overage_partial';
        
        if ((isSmsOverage || isSmsPartial) && invoice.metadata?.charge_id) {
          const chargeId = invoice.metadata.charge_id;
          const paymentIntentId = typeof invoice.payment_intent === 'string' 
            ? invoice.payment_intent 
            : invoice.payment_intent?.id;

          const paymentType = isSmsPartial ? 'partial' : 'full';
          console.log(`💰 SMS ${paymentType} payment received for charge ${chargeId}`);

          // Llamar a la función SQL que procesa el pago exitoso
          // La función detectará automáticamente si es parcial o completo
          const { data, error } = await supabase.rpc('process_sms_payment_success', {
            p_charge_id: chargeId,
            p_stripe_invoice_id: invoice.id,
            p_stripe_payment_intent_id: paymentIntentId || null
          });

          if (error) {
            console.error('Error processing SMS payment success:', error);
            return new Response(
              JSON.stringify({ error: 'Failed to process payment', details: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const result = data as any;
          
          if (result.action === 'fully_paid_and_unblocked') {
            console.log(`✅ Business UNBLOCKED after completing all payments`);
            console.log(`🔄 SMS counter reset for new billing period`);
          } else if (result.action === 'partial_payment_received') {
            console.log(`💵 Partial payment received`);
            console.log(`📊 Remaining: ${result.remaining_sms} SMS ($${result.remaining_amount})`);
            console.log(`🔒 Business remains BLOCKED until full payment`);
          } else {
            console.log(`✅ Business UNBLOCKED after successful payment`);
            console.log(`🔄 SMS counter reset for new billing period`);
          }

          return new Response(
            JSON.stringify({ 
              received: true, 
              message: result.message || 'Payment processed',
              charge_id: chargeId,
              payment_type: paymentType,
              action: result.action
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Verificar si es una factura de SMS (completa o parcial)
        const isSmsOverage = invoice.metadata?.type === 'sms_overage';
        const isSmsPartial = invoice.metadata?.type === 'sms_overage_partial';
        
        if ((isSmsOverage || isSmsPartial) && invoice.metadata?.charge_id) {
          const chargeId = invoice.metadata.charge_id;
          const paymentType = isSmsPartial ? 'partial' : 'full';

          console.log(`❌ SMS ${paymentType} payment FAILED for charge ${chargeId}`);

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
              charge_id: chargeId,
              payment_type: paymentType
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

