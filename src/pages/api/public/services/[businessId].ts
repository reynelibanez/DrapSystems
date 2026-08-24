import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { decryptBusinessId } from '../../../../lib/encryption';

export const GET: APIRoute = async ({ params, locals }) => {
  const { businessId: encryptedId } = params;

  if (!encryptedId) {
    return new Response(JSON.stringify({ error: 'Business ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Desencriptar el ID del negocio
  const businessId = decryptBusinessId(encryptedId);

  if (!businessId) {
    return new Response(JSON.stringify({ error: 'Invalid business ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Usar las credenciales de Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener servicios activos del negocio
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, price, duration_minutes, is_active')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(services || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


