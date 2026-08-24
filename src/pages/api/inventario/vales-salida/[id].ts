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

    // Obtener vale con detalle
    const { data: vale, error: valeError } = await supabase
      .from('il_valessalida_inventario')
      .select(`
        *,
        almacen:ng_almacen_inventario!idalmacen(id, almacen),
        usuario:profiles!user_id(id, full_name)
      `)
      .eq('id', id!)
      .single();

    if (valeError) throw valeError;

    // Obtener detalle
    const { data: detalle, error: detalleError } = await supabase
      .from('il_valessalida_detalle_inventario')
      .select(`
        *,
        producto:ng_productos_inventario!idproducto(id, codigo, producto)
      `)
      .eq('idvalesalida', id!);

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

    return new Response(JSON.stringify({ ...vale, detalle: detalleFormateado }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/vales-salida/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener vale de salida',
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
    const { business_id, fecha, idalmacen, observaciones, inventariada, detalle } = body;

    // Verificar que el vale no esté anulado ni inventariado
    const { data: vale } = await supabase
      .from('il_valessalida_inventario')
      .select('anulada, inventariada')
      .eq('id', id!)
      .single();

    if (vale?.anulada) {
      return new Response(JSON.stringify({ error: 'No se puede modificar un vale anulado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (vale?.inventariada) {
      return new Response(JSON.stringify({ error: 'No se puede modificar un vale que ya ha sido inventariado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar vale (sin modificar el número)
    const { error: updateError } = await supabase
      .from('il_valessalida_inventario')
      .update({
        fecha,
        idalmacen,
        observaciones,
        inventariada: inventariada || false
      })
      .eq('id', id!);

    if (updateError) throw updateError;

    // Eliminar detalle anterior
    const { error: deleteError } = await supabase
      .from('il_valessalida_detalle_inventario')
      .delete()
      .eq('idvalesalida', id!);

    if (deleteError) throw deleteError;

    // Insertar nuevo detalle
    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map((item: any) => ({
        idvalesalida: id,
        idproducto: item.idproducto,
        cantidad: item.cantidad,
        precio: item.precio
      }));

      const { error: insertError } = await supabase
        .from('il_valessalida_detalle_inventario')
        .insert(detalleData);

      if (insertError) throw insertError;

      // Si está marcado como inventariada, rebajar existencias
      if (inventariada) {
        for (const item of detalle) {
          // Verificar existencia actual
          const { data: existencia } = await supabase
            .from('il_existencias_inventario')
            .select('cantidad')
            .eq('business_id', business_id)
            .eq('idalmacen', idalmacen)
            .eq('idproducto', item.idproducto)
            .single();

          if (existencia) {
            // Actualizar existencia
            const { error: updateExistError } = await supabase
              .from('il_existencias_inventario')
              .update({ 
                cantidad: existencia.cantidad - item.cantidad 
              })
              .eq('business_id', business_id)
              .eq('idalmacen', idalmacen)
              .eq('idproducto', item.idproducto);

            if (updateExistError) throw updateExistError;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en PUT /api/inventario/vales-salida/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar vale de salida',
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

    // Verificar que el vale no esté anulado ni inventariado
    const { data: vale } = await supabase
      .from('il_valessalida_inventario')
      .select('anulada, inventariada')
      .eq('id', id!)
      .single();

    if (!vale) {
      return new Response(JSON.stringify({ error: 'Vale no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (vale.inventariada) {
      return new Response(JSON.stringify({ error: 'No se puede eliminar un vale que ya ha sido inventariado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar detalle primero (por la relación CASCADE debería ser automático, pero lo hacemos explícito)
    const { error: detalleError } = await supabase
      .from('il_valessalida_detalle_inventario')
      .delete()
      .eq('idvalesalida', id!);

    if (detalleError) throw detalleError;

    // Eliminar vale
    const { error } = await supabase
      .from('il_valessalida_inventario')
      .delete()
      .eq('id', id!);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en DELETE /api/inventario/vales-salida/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar vale de salida',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};




