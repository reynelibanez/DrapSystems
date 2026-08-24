




/**
 * API ENDPOINT: Crear Sesión de Pago Completo para SMS Excedidos
 * 
 * Crea una sesión de Stripe Checkout para pagar TODOS los SMS excedentes.
 * Redirige de vuelta a la app después del pago.
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { baseUrl } from '../../../lib/base-url';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Obtener credenciales
    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔧 [create-sms-invoice] Iniciando pago completo de SMS excedidos...');

    if (!stripeKey) {
      console.error('❌ Stripe key missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parsear el body
    const body = await request.json();
    const { businessId, smsCount } = body;

    console.log('📋 Parámetros recibidos:', { businessId, smsCount });

    if (!businessId || !smsCount) {
      console.error('❌ Missing required fields:', { businessId, smsCount });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que smsCount sea un número positivo
    if (smsCount <= 0) {
      console.error('❌ Invalid SMS count:', smsCount);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid SMS count' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, stripe_customer_id, sms_price_per_unit, sms_used_current_month, sms_limit, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      console.error('❌ Business not found:', businessError);
      return new Response(
        JSON.stringify({ success: false, error: 'Business not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Business data:', {
      name: business.name,
      stripe_customer_id: business.stripe_customer_id,
      sms_price_per_unit: business.sms_price_per_unit,
      sms_used: business.sms_used_current_month,
      sms_limit: business.sms_limit,
      owner_id: business.owner_id
    });

    let stripeCustomerId = business.stripe_customer_id;

    // Si no tiene stripe_customer_id, crearlo
    if (!stripeCustomerId) {
      console.log('⚠️ No Stripe customer ID found, creating one...');

      // Obtener el email del owner
      const { data: owner, error: ownerError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', business.owner_id)
        .single();

      if (ownerError || !owner || !owner.email) {
        console.error('❌ Owner not found or no email:', ownerError);
        return new Response(
          JSON.stringify({ success: false, error: 'Business owner email not found' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('👤 Owner data:', {
        email: owner.email,
        name: owner.full_name
      });

      // Crear customer en Stripe
      try {
        console.log('🔨 Creating Stripe customer with:', {
          email: owner.email,
          name: business.name,
          businessId
        });

        const customer = await stripe.customers.create({
          email: owner.email,
          name: business.name,
          metadata: {
            business_id: businessId,
            owner_name: owner.full_name || '',
          },
        });

        stripeCustomerId = customer.id;
        console.log('✅ Stripe customer created:', stripeCustomerId);

        // Actualizar el negocio con el nuevo stripe_customer_id
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', businessId);

        if (updateError) {
          console.error('⚠️ Error updating business with stripe_customer_id:', updateError);
        } else {
          console.log('✅ Business updated with stripe_customer_id');
        }
      } catch (stripeError) {
        console.error('❌ Error creating Stripe customer:', stripeError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create Stripe customer',
            details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calcular el monto
    const pricePerSms = business.sms_price_per_unit || 0.05;
    const amount = smsCount * pricePerSms;

    console.log('💰 Cálculo:', {
      smsCount,
      pricePerSms,
      amount
    });

    // Validar que el monto sea positivo
    if (amount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la URL base de la app desde la configuración
    // En producción: PUBLIC_SITE_URL = https://www.drapsystems.com/
    // baseUrl = /booking-suite
    // Resultado: https://www.drapsystems.com/booking-suite/
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://e04f83b9-e8d0-4fac-92a7-841fd16c056e.wf-app-prod.cosmic.webflow.services';
    
    // Construir la URL completa de la app
    // Si siteUrl ya termina con baseUrl, no duplicar
    let appUrl = siteUrl.replace(/\/$/, ''); // Remover trailing slash
    
    // Solo agregar baseUrl si no está ya en siteUrl
    if (baseUrl && !appUrl.endsWith(baseUrl)) {
      appUrl = `${appUrl}${baseUrl}`;
    }
    
    // Redirigir a la raíz de la app después del pago
    // El webhook de Supabase manejará el desbloqueo automáticamente
    const successUrl = `${appUrl}/`;
    const cancelUrl = `${appUrl}/`;

    console.log('🔗 URLs de retorno:', {
      siteUrl,
      baseUrl,
      appUrl,
      successUrl,
      cancelUrl
    });

    // Crear sesión de Checkout en Stripe
    console.log('📝 Creando sesión de Checkout en Stripe...');
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Pago Completo de SMS Excedidos - ${business.name}`,
              description: `${smsCount} SMS excedidos × $${pricePerSms.toFixed(4)}`,
            },
            unit_amount: Math.round(amount * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'sms_overage',
        business_id: businessId,
        sms_count: smsCount.toString(),
        price_per_sms: pricePerSms.toString(),
      },
    });

    console.log('✅ Sesión de Checkout creada:', {
      id: session.id,
      url: session.url
    });

    // Retornar la URL de pago
    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id,
        amount: amount,
        smsCount: smsCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error creating SMS checkout session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};











