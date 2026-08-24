


import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Detecta el plan identificando palabras clave en el ID de Stripe o su nickname/nombre
function getPlanFromPriceId(priceId: string, priceObj?: Stripe.Price): 'basic' | 'professional' | 'business' | 'enterprise' {
  if (!priceId) return 'basic';

  const pId = priceId.trim().toLowerCase();
  const nickname = priceObj?.nickname?.toLowerCase() || '';

  if (pId.includes('pro') || nickname.includes('pro')) return 'professional';
  if (pId.includes('biz') || nickname.includes('business')) return 'business';
  if (pId.includes('ent') || nickname.includes('enterprise')) return 'enterprise';

  return 'basic';
}

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  // Actualizado a la versión de API actual para evitar conflictos con el SDK
  const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2026-05-27.dahlia' });
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Falta la firma o el secreto' }), { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error verificando webhook: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }

  console.log(`📨 Webhook recibido: ${event.type}`);

  // ========================================
  // MANEJO DE PAGOS DE SMS EXCEDIDOS
  // ========================================
  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log('📄 Factura pagada:', {
        id: invoice.id,
        metadata: invoice.metadata,
        amount: invoice.amount_paid / 100,
      });

      // Verificar si es un pago de SMS excedidos
      if (invoice.metadata?.type === 'sms_overage') {
        const businessId = invoice.metadata.business_id;
        const smsCount = parseInt(invoice.metadata.sms_count || '0');

        console.log('💰 Pago de SMS excedidos detectado:', {
          businessId,
          smsCount,
          amount: invoice.amount_paid / 100,
        });

        if (!businessId) {
          console.error('❌ No se encontró business_id en metadata de la factura');
          return new Response(JSON.stringify({ error: 'Missing business_id' }), { status: 400 });
        }

        // Obtener datos actuales del negocio
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('sms_used_current_month, sms_limit')
          .eq('id', businessId)
          .single();

        if (businessError || !business) {
          console.error('❌ Error obteniendo negocio:', businessError);
          return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
        }

        console.log('📊 Estado actual del negocio:', {
          sms_used: business.sms_used_current_month,
          sms_limit: business.sms_limit,
          exceeded: business.sms_used_current_month - business.sms_limit,
        });

        // Calcular nuevo contador de SMS
        // Restamos los SMS pagados del contador actual
        const newSmsUsed = Math.max(0, business.sms_used_current_month - smsCount);

        console.log('🔄 Actualizando contador de SMS:', {
          before: business.sms_used_current_month,
          paid: smsCount,
          after: newSmsUsed,
        });

        // Actualizar el negocio: resetear contador y desbloquear
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            sms_used_current_month: newSmsUsed,
            is_blocked: false,
            blocked_reason: null,
            blocked_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);

        if (updateError) {
          console.error('❌ Error actualizando negocio:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to update business' }), { status: 500 });
        }

        console.log('✅ Negocio actualizado exitosamente:', {
          businessId,
          sms_used: newSmsUsed,
          is_blocked: false,
        });

        // Registrar el pago en sms_charges (si existe la tabla)
        try {
          await supabase.from('sms_charges').insert({
            business_id: businessId,
            sms_count: smsCount,
            amount: invoice.amount_paid / 100,
            stripe_invoice_id: invoice.id,
            status: 'paid',
            created_at: new Date().toISOString(),
          });
          console.log('✅ Cargo de SMS registrado en sms_charges');
        } catch (chargeError) {
          console.warn('⚠️ No se pudo registrar en sms_charges (tabla puede no existir):', chargeError);
        }

        return new Response(JSON.stringify({ 
          received: true, 
          type: 'sms_payment',
          businessId,
          smsCount,
        }), { status: 200 });
      }
    } catch (error: any) {
      console.error('❌ Error procesando pago de factura:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // ========================================
  // MANEJO DE SUSCRIPCIONES Y PAGOS DE SMS
  // ========================================
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'checkout.session.completed'
  ) {
    try {
      let subscription: Stripe.Subscription;

      // Si es checkout.session.completed, verificar si es pago de SMS
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('📨 Checkout session completed:', {
          id: session.id,
          metadata: session.metadata,
          payment_status: session.payment_status,
        });

        // Verificar si es un pago de SMS
        if (session.metadata?.type === 'sms_overage') {
          const businessId = session.metadata.business_id;
          const smsCount = parseInt(session.metadata.sms_count || '0');

          console.log('💰 Pago de SMS detectado en checkout:', {
            businessId,
            smsCount,
            amount: session.amount_total ? session.amount_total / 100 : 0,
          });

          if (!businessId) {
            console.error('❌ No se encontró business_id en metadata del checkout');
            return new Response(JSON.stringify({ error: 'Missing business_id' }), { status: 400 });
          }

          // Verificar que el pago esté completo
          if (session.payment_status !== 'paid') {
            console.log('⚠️ Pago no completado aún, status:', session.payment_status);
            return new Response(JSON.stringify({ received: true, status: 'pending' }), { status: 200 });
          }

          // Obtener datos actuales del negocio
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('sms_used_current_month, sms_limit')
            .eq('id', businessId)
            .single();

          if (businessError || !business) {
            console.error('❌ Error obteniendo negocio:', businessError);
            return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
          }

          console.log('📊 Estado actual del negocio:', {
            sms_used: business.sms_used_current_month,
            sms_limit: business.sms_limit,
            exceeded: business.sms_used_current_month - business.sms_limit,
          });

          // Calcular nuevo contador de SMS
          const newSmsUsed = Math.max(0, business.sms_used_current_month - smsCount);

          console.log('🔄 Actualizando contador de SMS:', {
            before: business.sms_used_current_month,
            paid: smsCount,
            after: newSmsUsed,
          });

          // Actualizar el negocio: resetear contador y desbloquear
          const { error: updateError } = await supabase
            .from('businesses')
            .update({
              sms_used_current_month: newSmsUsed,
              is_blocked: false,
              blocked_reason: null,
              blocked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', businessId);

          if (updateError) {
            console.error('❌ Error actualizando negocio:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to update business' }), { status: 500 });
          }

          console.log('✅ Negocio actualizado exitosamente:', {
            businessId,
            sms_used: newSmsUsed,
            is_blocked: false,
          });

          // Registrar el pago en sms_charges (si existe la tabla)
          try {
            await supabase.from('sms_charges').insert({
              business_id: businessId,
              sms_count: smsCount,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              stripe_invoice_id: session.id,
              status: 'paid',
              created_at: new Date().toISOString(),
            });
            console.log('✅ Cargo de SMS registrado en sms_charges');
          } catch (chargeError) {
            console.warn('⚠️ No se pudo registrar en sms_charges (tabla puede no existir):', chargeError);
          }

          return new Response(JSON.stringify({ 
            received: true, 
            type: 'sms_payment',
            businessId,
            smsCount,
          }), { status: 200 });
        }

        // Si no es pago de SMS, continuar con el flujo de suscripción
        if (!session.subscription) {
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }
        subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      } else {
        subscription = event.data.object as Stripe.Subscription;
      }

      // Priorizar businessId que viene directamente en los metadatos de la suscripción o sesión
      const businessId = subscription.metadata?.businessId || subscription.metadata?.business_id;
      const customerId = subscription.customer as string;

      const priceItem = subscription.items?.data[0]?.price;
      const priceId = priceItem?.id || '';
      
      const billingInterval = priceItem?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      const plan = getPlanFromPriceId(priceId, priceItem);

      // Búsqueda del negocio en la BD si no viene el ID directo
      let targetBusinessId = businessId;
      if (!targetBusinessId && customerId) {
        const { data: bData } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (bData) targetBusinessId = bData.id;
      }

      if (!targetBusinessId) {
        console.error('❌ No se encontró ningún negocio asignado a esta suscripción. Customer ID:', customerId);
        return new Response(JSON.stringify({ error: 'Business no encontrado' }), { status: 404 });
      }

      // Obtener los settings actuales para actualizar el periodo de facturación en el JSONB
      const { data: currentBusiness } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', targetBusinessId)
        .single();

      const currentSettings = (currentBusiness?.settings as object) || {};

      // Actualización en Supabase
      const updateData = {
        subscription_plan: plan,
        subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        settings: {
          ...currentSettings,
          billing_period: billingInterval,
        },
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', targetBusinessId);

      if (updateError) {
        console.error('❌ Error al actualizar la base de datos:', updateError);
        return new Response(JSON.stringify({ error: 'DB update failed', details: updateError.message }), { status: 500 });
      }

      console.log(`🎉 Negocio ${targetBusinessId} actualizado con éxito al plan ${plan} (${billingInterval}).`);
    } catch (processingError: any) {
      console.error('❌ Excepción interna procesando el webhook de Stripe:', processingError);
      return new Response(JSON.stringify({ error: processingError.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};



