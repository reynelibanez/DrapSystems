import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');

    console.log('=== CHECK UPDATE ENDPOINT ===');
    console.log('Business ID:', businessId);

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Business ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Supabase credentials from environment - USAR SERVICE KEY
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Supabase Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        hasSubscription: false,
        status: 'unknown',
        plan: 'basic'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usar SERVICE KEY para evitar problemas de RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query the business to check if subscription was updated
    const { data: business, error } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_status, stripe_subscription_id, stripe_customer_id')
      .eq('id', businessId)
      .single();

    console.log('Query result:', { business, error });

    if (error) {
      console.error('Error fetching business:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch business data',
        details: error.message,
        hasSubscription: false,
        status: 'unknown',
        plan: 'basic'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!business) {
      console.error('Business not found');
      return new Response(JSON.stringify({ 
        error: 'Business not found',
        hasSubscription: false,
        status: 'unknown',
        plan: 'basic'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if the subscription is active and has a Stripe subscription ID
    const hasSubscription = !!(business.stripe_subscription_id || business.stripe_customer_id);
    const status = business.subscription_status || 'unknown';
    const plan = business.subscription_plan || 'basic';

    console.log('Response data:', { hasSubscription, status, plan });

    return new Response(JSON.stringify({
      hasSubscription,
      status,
      plan,
      subscription_plan: plan,
      subscription_status: status,
      updated: hasSubscription && status === 'active' && plan !== 'basic'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in check-update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage,
      hasSubscription: false,
      status: 'unknown',
      plan: 'basic'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


