



/**
 * Cron Job: Procesar Cargos por Exceso de SMS
 * 
 * Este endpoint debe ejecutarse al final de cada mes para:
 * 1. Calcular el exceso de SMS de cada negocio usando la función de Supabase
 * 2. Crear cargos en Stripe por el exceso
 * 3. Los contadores se resetean automáticamente por la función de Supabase
 * 
 * Configurar en Cloudflare Workers Cron:
 * - Trigger: "0 0 1 * *" (primer día de cada mes a las 00:00)
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Verificar autenticación del cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = locals?.runtime?.env?.CRON_SECRET || import.meta.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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

    // Llamar a la función SQL que procesa cargos Y bloquea negocios automáticamente
    const { data: charges, error: chargesError } = await supabase
      .rpc('process_monthly_sms_charges_with_blocking');

    if (chargesError) {
      console.error('Error processing SMS charges:', chargesError);
      return new Response(
        JSON.stringify({ error: 'Failed to process SMS charges', details: chargesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!charges || charges.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No SMS charges to process',
          processed: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('Stripe key not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const results = [];

    // Procesar cada cargo
    for (const charge of charges) {
      try {
        // Obtener el Stripe customer ID del negocio
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('stripe_customer_id, name, owner_id')
          .eq('id', charge.business_id)
          .single();

        if (businessError || !business?.stripe_customer_id) {
          console.error(`Business ${charge.business_id} has no Stripe customer ID`);
          results.push({
            business_id: charge.business_id,
            success: false,
            error: 'No Stripe customer ID',
            blocked: true
          });
          continue;
        }

        // Crear factura en Stripe
        const invoice = await stripe.invoices.create({
          customer: business.stripe_customer_id,
          description: `SMS Overage Charges - ${charge.excess_sms} excess SMS`,
          metadata: {
            business_id: charge.business_id,
            charge_id: charge.charge_id,
            sms_excess: charge.excess_sms.toString(),
            type: 'sms_overage'
          },
          auto_advance: true,
          collection_method: 'charge_automatically',
        });

        // Agregar línea de factura
        await stripe.invoiceItems.create({
          customer: business.stripe_customer_id,
          invoice: invoice.id,
          description: `${charge.excess_sms} excess SMS messages`,
          amount: Math.round(charge.total_amount * 100),
          currency: 'usd',
          metadata: {
            charge_id: charge.charge_id,
            business_id: charge.business_id
          }
        });

        // Finalizar y enviar la factura
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        // Actualizar el cargo con el invoice ID
        await supabase
          .from('sms_charges')
          .update({ 
            stripe_invoice_id: finalizedInvoice.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', charge.charge_id);

        results.push({
          business_id: charge.business_id,
          business_name: charge.business_name,
          charge_id: charge.charge_id,
          excess_sms: charge.excess_sms,
          total_amount: charge.total_amount,
          stripe_invoice_id: finalizedInvoice.id,
          invoice_url: finalizedInvoice.hosted_invoice_url,
          success: true,
          blocked: true
        });

        console.log(`✅ Created invoice for business ${business.name}: $${charge.total_amount} (${charge.excess_sms} SMS)`);
        console.log(`🔒 Business ${business.name} is now BLOCKED until payment is completed`);

      } catch (error: any) {
        console.error(`Error processing charge ${charge.charge_id}:`, error);
        results.push({
          business_id: charge.business_id,
          charge_id: charge.charge_id,
          success: false,
          error: error.message,
          blocked: true
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'SMS charges processed',
        processed: results.length,
        results,
        note: 'Businesses with pending charges are now BLOCKED until payment is completed'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-sms-charges:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};




