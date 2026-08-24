import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url, locals }) => {
  const businessId = url.searchParams.get('id');

  const debug = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    businessId: businessId,
    hasSupabaseUrl: !!(locals?.runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL),
    hasSupabaseKey: !!(locals?.runtime?.env?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY),
    result: null as any,
    error: null as any
  };

  if (!businessId) {
    return new Response(JSON.stringify({
      ...debug,
      error: 'No business ID provided. Use ?id=YOUR_BUSINESS_ID'
    }, null, 2), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = locals?.runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, subscription_status')
      .eq('id', businessId)
      .single();

    debug.result = data;
    debug.error = error;

    return new Response(JSON.stringify(debug, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    debug.error = error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error;

    return new Response(JSON.stringify(debug, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
