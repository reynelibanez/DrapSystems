import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ request, url }) => {
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

    // Obtener parámetros de búsqueda
    const searchParams = url.searchParams;
    const activo = searchParams.get('activo');
    const inventariada = searchParams.get('inventariada');

    // Construir query
    let query = supabase
      .from('ng_productos_inventario')
      .select(`
        *,
        tipo:ng_productostipos_inventario(id, tipo),
        unidad:unidadmedida_inventario(id, unidad, abreviatura)
      `)
      .eq('business_id', permissions.business_id);

    if (activo !== null) {
      query = query.eq('activo', activo === 'true');
    }

    if (inventariada !== null) {
      query = query.eq('inventariada', inventariada === 'true');
    }

    query = query.order('producto', { ascending: true });

    const { data: productos, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(productos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/productos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
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
    const { 
      codigo, 
      producto, 
      idtipo, 
      idunidad, 
      costo, 
      precio, 
      rutaimagen, 
      inventariada, 
      activo 
    } = body;

    if (!producto) {
      return new Response(JSON.stringify({ error: 'El nombre del producto es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear producto
    const { data: nuevoProducto, error } = await supabase
      .from('ng_productos_inventario')
      .insert({
        business_id: permissions.business_id,
        codigo: codigo || null,
        producto,
        idtipo: idtipo || null,
        idunidad: idunidad || null,
        costo: costo || 0,
        precio: precio || 0,
        rutaimagen: rutaimagen || null,
        inventariada: inventariada !== undefined ? inventariada : true,
        activo: activo !== undefined ? activo : true
      })
      .select(`
        *,
        tipo:ng_productostipos_inventario(id, tipo),
        unidad:unidadmedida_inventario(id, unidad, abreviatura)
      `)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(nuevoProducto), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/productos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
