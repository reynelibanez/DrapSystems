import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Obtener el token del header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);

    // Crear cliente con Service Role Key para operaciones de servidor
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validar el token del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el business_id del perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (!profile?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const almacenId = url.searchParams.get('almacen_id');

    // Usar la vista que ya calcula las existencias
    let query = supabase
      .from('vw_existencias_inventario')
      .select('*')
      .eq('business_id', profile.business_id);

    if (almacenId) {
      query = query.eq('idalmacen', almacenId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Devolver los datos directamente sin estructura anidada
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/existencias:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener existencias' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



