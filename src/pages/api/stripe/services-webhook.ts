import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getStripeInstance } from '../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const stripeSecretKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = locals?.runtime?.env?.STRIPE_WEBHOOK_SECRET_SERVICES || import.meta.env.STRIPE_WEBHOOK_SECRET_SERVICES;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('[Services Webhook] Missing Stripe configuration');
      return new Response('Webhook configuration error', { status: 500 });
    }

    const stripe = getStripeInstance(stripeSecretKey);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Services Webhook] Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Services Webhook] Signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log('[Services Webhook] Event received:', event.type);

    // Inicializar Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Services Webhook] Supabase configuration missing');
      return new Response('Database configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Services Webhook] Checkout completed:', session.id);

        // Obtener la suscripción
        if (session.subscription && typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const businessId = session.metadata?.businessId;

          if (!businessId) {
            console.error('[Services Webhook] Missing businessId in metadata');
            break;
          }

          // Determinar el plan basado en el price_id
          const priceId = subscription.items.data[0]?.price.id;
          let planType = 'basic';
          
          // Aquí deberías mapear los price_ids a los planes
          // Por ahora usamos basic como default
          if (priceId?.includes('professional')) {
            planType = 'professional';
          } else if (priceId?.includes('enterprise')) {
            planType = 'enterprise';
          }

          // Determinar el ciclo de facturación
          const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

          // Crear o actualizar la suscripción del módulo
          const { error: upsertError } = await supabase
            .from('module_subscriptions')
            .upsert({
              business_id: businessId,
              module_name: 'services',
              plan_type: planType,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              stripe_price_id: priceId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              billing_cycle: billingCycle,
              amount: subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
              currency: subscription.currency,
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            }, {
              onConflict: 'business_id,module_name',
            });

          if (upsertError) {
            console.error('[Services Webhook] Error upserting subscription:', upsertError);
          } else {
            console.log('[Services Webhook] Subscription created/updated successfully');
          }

          // Actualizar el stripe_customer_id en businesses si no existe
          if (session.customer && typeof session.customer === 'string') {
            await supabase
              .from('businesses')
              .update({ stripe_customer_id: session.customer })
              .eq('id', businessId)
              .is('stripe_customer_id', null);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Services Webhook] Subscription updated:', subscription.id);

        // Actualizar la suscripción del módulo
        const { error: updateError } = await supabase
          .from('module_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('module_name', 'services');

        if (updateError) {
          console.error('[Services Webhook] Error updating subscription:', updateError);
        } else {
          console.log('[Services Webhook] Subscription updated successfully');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Services Webhook] Subscription deleted:', subscription.id);

        // Marcar la suscripción como cancelada
        const { error: deleteError } = await supabase
          .from('module_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('module_name', 'services');

        if (deleteError) {
          console.error('[Services Webhook] Error deleting subscription:', deleteError);
        } else {
          console.log('[Services Webhook] Subscription marked as canceled');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Services Webhook] Payment succeeded:', invoice.id);

        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Actualizar el estado de la suscripción
          const { error: updateError } = await supabase
            .from('module_subscriptions')
            .update({
              status: 'active',
            })
            .eq('stripe_subscription_id', invoice.subscription)
            .eq('module_name', 'services');

          if (updateError) {
            console.error('[Services Webhook] Error updating subscription status:', updateError);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Services Webhook] Payment failed:', invoice.id);

        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Marcar la suscripción como past_due
          const { error: updateError } = await supabase
            .from('module_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription)
            .eq('module_name', 'services');

          if (updateError) {
            console.error('[Services Webhook] Error updating subscription status:', updateError);
          }
        }
        break;
      }

      default:
        console.log('[Services Webhook] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Services Webhook] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
