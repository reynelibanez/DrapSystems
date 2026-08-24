import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener el usuario autenticado
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener business_id del usuario
    const { data: permissions } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (!permissions?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener almacenes
    const { data: almacenes, error } = await supabase
      .from('ng_almacen_inventario')
      .select('*')
      .eq('business_id', permissions.business_id)
      .order('almacen', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(almacenes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/almacenes:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener el usuario autenticado
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener business_id del usuario
    const { data: permissions } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (!permissions?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del body
    const body = await request.json();
    const { almacen, codigo, abierto, puntoventa } = body;

    if (!almacen) {
      return new Response(JSON.stringify({ error: 'El nombre del almacén es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear almacén
    const { data: nuevoAlmacen, error } = await supabase
      .from('ng_almacen_inventario')
      .insert({
        business_id: permissions.business_id,
        almacen,
        codigo: codigo || null,
        abierto: abierto !== undefined ? abierto : true,
        puntoventa: puntoventa !== undefined ? puntoventa : false
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(nuevoAlmacen), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/almacenes:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

