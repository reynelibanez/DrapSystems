import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId, plan, subscriptionId, customerId } = body;
    
    if (!businessId || !plan) {
      return new Response(JSON.stringify({ 
        error: 'businessId and plan are required',
        received: { businessId, plan }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== FORCE UPDATE PLAN ===');
    console.log('Business ID:', businessId);
    console.log('New Plan:', plan);
    console.log('Subscription ID:', subscriptionId);
    console.log('Customer ID:', customerId);

    // Verificar que el negocio existe
    const { data: existingBusiness, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ 
        error: 'Business not found',
        details: fetchError.message
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Current business state:', existingBusiness);

    // Preparar datos de actualización
    const updateData: any = {
      subscription_plan: plan,
      subscription_status: 'active',
      trial_ends_at: null,
    };

    if (subscriptionId) {
      updateData.stripe_subscription_id = subscriptionId;
    }

    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }

    console.log('Update data:', updateData);

    // Actualizar el negocio
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update business',
        details: updateError.message,
        code: updateError.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Business updated successfully:', updatedBusiness);

    return new Response(JSON.stringify({
      success: true,
      message: 'Business plan updated successfully',
      before: {
        plan: existingBusiness.subscription_plan,
        status: existingBusiness.subscription_status,
      },
      after: {
        plan: updatedBusiness.subscription_plan,
        status: updatedBusiness.subscription_status,
        stripe_subscription_id: updatedBusiness.stripe_subscription_id,
        stripe_customer_id: updatedBusiness.stripe_customer_id,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error forcing plan update:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to force update plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
