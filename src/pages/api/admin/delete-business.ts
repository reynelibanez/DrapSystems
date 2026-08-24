import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Obtener variables de entorno (con y sin prefijo PUBLIC_)
    const supabaseUrl = 
      locals?.runtime?.env?.PUBLIC_SUPABASE_URL || 
      import.meta.env.PUBLIC_SUPABASE_URL;
      
    const supabaseAnonKey = 
      locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      
    const supabaseServiceKey = 
      locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || 
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Variables de entorno:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl?.substring(0, 30) + '...'
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Faltan variables de entorno de Supabase');
      return new Response(JSON.stringify({ 
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!supabaseServiceKey) {
      console.error('Falta SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ 
        error: 'Missing service role key - cannot perform admin operations' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cliente normal para verificar autenticación
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || ''
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el businessId del body
    const { businessId } = await request.json();

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Business ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cliente con service role para bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== ELIMINACIÓN CON SERVICE ROLE ===');
    console.log('Business ID:', businessId);

    // 1. Eliminar citas
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('business_id', businessId);

    if (appointmentsError) {
      console.error('Error eliminando citas:', appointmentsError);
      throw appointmentsError;
    }

    // 2. Eliminar clientes
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('business_id', businessId);

    if (clientsError) {
      console.error('Error eliminando clientes:', clientsError);
      throw clientsError;
    }

    // 3. Eliminar servicios
    const { error: servicesError } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('business_id', businessId);

    if (servicesError) {
      console.error('Error eliminando servicios:', servicesError);
      throw servicesError;
    }

    // 4. Actualizar perfiles
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .update({ business_id: null })
      .eq('business_id', businessId);

    if (profilesError) {
      console.error('Error actualizando perfiles:', profilesError);
      throw profilesError;
    }

    // 5. Eliminar la empresa
    const { error: businessError, data: deletedBusiness } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', businessId)
      .select();

    if (businessError) {
      console.error('Error eliminando empresa:', businessError);
      throw businessError;
    }

    console.log('Empresa eliminada exitosamente:', deletedBusiness);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Empresa eliminada exitosamente',
      deleted: deletedBusiness 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en delete-business:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error al eliminar la empresa' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



