import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener business_id del usuario
    const { data: permissions } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', session.user.id)
      .single();

    if (!permissions?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo');

    let query = supabase
      .from('ng_catalogos_inventario')
      .select('*')
      .eq('business_id', permissions.business_id)
      .order('nombre', { ascending: true });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/catalogos:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener catálogos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: permissions } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', session.user.id)
      .single();

    if (!permissions?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { tipo, nombre, descripcion } = body;

    const { data, error } = await supabase
      .from('ng_catalogos_inventario')
      .insert({
        business_id: permissions.business_id,
        tipo,
        nombre,
        descripcion
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/catalogos:', error);
    return new Response(JSON.stringify({ error: 'Error al crear catálogo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

