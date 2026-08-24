import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { decryptBusinessId } from '../../../../lib/encryption';

export const GET: APIRoute = async ({ params, locals }) => {
  const { businessId: encryptedId } = params;

  console.log('=== PUBLIC BUSINESS API DEBUG ===');
  console.log('🔍 Encrypted ID from params:', encryptedId);
  console.log('🌐 Environment:', import.meta.env.MODE);
  console.log('📍 Request URL:', locals?.url || 'N/A');

  if (!encryptedId) {
    console.error('❌ No business ID provided');
    return new Response(JSON.stringify({ error: 'Business ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Desencriptar el ID del negocio
  const businessId = decryptBusinessId(encryptedId);
  console.log('🔓 Decrypted business ID:', businessId);

  if (!businessId) {
    console.error('❌ Failed to decrypt business ID');
    return new Response(JSON.stringify({ error: 'Invalid business ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Usar las credenciales de Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔑 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set');
    console.log('🔑 Supabase Key:', supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Not set');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener información del negocio (solo negocios activos)
    console.log('📡 Querying business with ID:', businessId);
    console.log('📡 ID type:', typeof businessId);
    console.log('📡 ID length:', businessId.length);
    
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, description, email, phone, address, subscription_status, settings')
      .eq('id', businessId)
      .single();

    console.log('📊 Query completed');
    console.log('📊 Business data:', business ? 'Found' : 'Not found');
    console.log('📊 Error:', error ? JSON.stringify(error) : 'None');

    if (error) {
      console.error('❌ Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return new Response(JSON.stringify({ 
        error: 'Business not found', 
        details: error.message,
        businessId: businessId 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!business) {
      console.error('❌ Business not found in database for ID:', businessId);
      return new Response(JSON.stringify({ 
        error: 'Business not found',
        businessId: businessId 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el negocio esté activo o en trial
    console.log('🔍 Checking subscription status:', business.subscription_status);
    if (!['active', 'trial'].includes(business.subscription_status)) {
      console.error('❌ Business not active. Status:', business.subscription_status);
      return new Response(JSON.stringify({ error: 'Business not available' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Business found and active:', business.name);
    console.log('✅ Business settings:', business.settings);
    console.log('=== END DEBUG ===');

    // No devolver subscription_status al cliente
    const { subscription_status, ...publicBusiness } = business;

    return new Response(JSON.stringify(publicBusiness), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      businessId: businessId
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





