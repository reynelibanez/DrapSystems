import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    // Cliente para autenticación (con anon key)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    // Cliente para operaciones (con service key para bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;

    // Obtener recepción con detalle
    const { data: recepcion, error: recepcionError } = await supabase
      .from('il_recepciones_inventario')
      .select(`
        *,
        almacen:ng_almacen_inventario!idalmacen(id, almacen),
        usuario:profiles!user_id(id, full_name)
      `)
      .eq('id', id!)
      .single();

    if (recepcionError) throw recepcionError;

    // Obtener detalle
    const { data: detalle, error: detalleError } = await supabase
      .from('il_recepciones_detalle_inventario')
      .select(`
        *,
        producto:ng_productos_inventario!idproducto(id, codigo, producto)
      `)
      .eq('idrecepcion', id!);

    if (detalleError) throw detalleError;

    // Formatear detalle para que coincida con la estructura esperada
    const detalleFormateado = (detalle || []).map(d => ({
      ...d,
      producto: {
        codigo: d.producto?.codigo || '',
        nombre: d.producto?.producto || '',
        unidad: ''
      }
    }));

    return new Response(JSON.stringify({ ...recepcion, detalle: detalleFormateado }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/recepciones/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener recepción',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    // Cliente para autenticación (con anon key)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    // Cliente para operaciones (con service key para bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const body = await request.json();
    const { fecha, idalmacen, idarea, observaciones, inventariada, detalle } = body;

    // Verificar que la recepción no esté inventariada o anulada
    const { data: recepcion } = await supabase
      .from('il_recepciones_inventario')
      .select('inventariada, anulada')
      .eq('id', id!)
      .single();

    if (recepcion?.anulada) {
      return new Response(JSON.stringify({ error: 'No se puede modificar una recepción anulada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar recepción (sin modificar el número)
    const { error: updateError } = await supabase
      .from('il_recepciones_inventario')
      .update({
        fecha,
        idalmacen,
        idarea,
        observaciones,
        inventariada: inventariada || false
      })
      .eq('id', id!);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en PUT /api/inventario/recepciones/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar recepción',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    // Cliente para autenticación (con anon key)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    // Cliente para operaciones (con service key para bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;

    // Verificar que la recepción no esté inventariada
    const { data: recepcion } = await supabase
      .from('il_recepciones_inventario')
      .select('anulada, inventariada')
      .eq('id', id!)
      .single();

    if (!recepcion) {
      return new Response(JSON.stringify({ error: 'Recepción no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (recepcion.inventariada) {
      return new Response(JSON.stringify({ error: 'No se puede eliminar una recepción inventariada. Use anular en su lugar.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar detalle primero
    const { error: detalleError } = await supabase
      .from('il_recepciones_detalle_inventario')
      .delete()
      .eq('idrecepcion', id!);

    if (detalleError) throw detalleError;

    // Eliminar recepción
    const { error } = await supabase
      .from('il_recepciones_inventario')
      .delete()
      .eq('id', id!);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en DELETE /api/inventario/recepciones/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar recepción',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





