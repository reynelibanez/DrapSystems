import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID no proporcionado' }), { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Obtener la transferencia
    const { data: transferencia, error } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !transferencia) {
      console.error('Error obteniendo transferencia:', error);
      return new Response(JSON.stringify({ error: 'Transferencia no encontrada' }), { status: 404 });
    }

    // Obtener información de almacenes
    const { data: almacenOrigen } = await supabaseAdmin
      .from('ng_almacen_inventario')
      .select('almacen')
      .eq('id', transferencia.idalmacenorigen)
      .single();

    const { data: almacenDestino } = await supabaseAdmin
      .from('ng_almacen_inventario')
      .select('almacen')
      .eq('id', transferencia.idalmacendestino)
      .single();

    const transferenciaCompleta = {
      ...transferencia,
      almacen_origen: almacenOrigen,
      almacen_destino: almacenDestino
    };

    return new Response(JSON.stringify({ transferencia: transferenciaCompleta }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/transferencias/[id]:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID no proporcionado' }), { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Verificar que la transferencia no esté anulada ni inventariada
    const { data: transferenciaExistente, error: checkError } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .select('anulada, inventariada, idalmacenorigen, idalmacendestino')
      .eq('id', id)
      .single();

    if (checkError || !transferenciaExistente) {
      return new Response(JSON.stringify({ error: 'Transferencia no encontrada' }), { status: 404 });
    }

    if (transferenciaExistente.anulada) {
      return new Response(JSON.stringify({ error: 'No se puede editar una transferencia anulada' }), { status: 400 });
    }

    if (transferenciaExistente.inventariada) {
      return new Response(JSON.stringify({ error: 'No se puede editar una transferencia inventariada' }), { status: 400 });
    }

    const body = await request.json();
    const { fecha, observaciones, detalles, business_id } = body;

    // Actualizar transferencia
    const { error: updateError } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .update({
        fecha,
        observaciones
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error al actualizar transferencia:', updateError);
      return new Response(JSON.stringify({ error: 'Error al actualizar transferencia' }), { status: 500 });
    }

    // Si se proporcionan nuevos detalles, actualizar
    if (detalles && detalles.length > 0) {
      // Revertir existencias anteriores
      const { data: detallesAnteriores } = await supabaseAdmin
        .from('il_transferencias_detalle_inventario')
        .select('idproducto, cantidad')
        .eq('idtransferencia', id);

      if (detallesAnteriores) {
        for (const detalle of detallesAnteriores) {
          // Devolver al almacén origen
          const { data: existenciaOrigen } = await supabaseAdmin
            .from('il_existencias_inventario')
            .select('cantidad')
            .eq('business_id', business_id)
            .eq('idalmacen', transferenciaExistente.idalmacenorigen)
            .eq('idproducto', detalle.idproducto)
            .single();

          if (existenciaOrigen) {
            await supabaseAdmin
              .from('il_existencias_inventario')
              .update({ cantidad: Number(existenciaOrigen.cantidad) + Number(detalle.cantidad) })
              .eq('business_id', business_id)
              .eq('idalmacen', transferenciaExistente.idalmacenorigen)
              .eq('idproducto', detalle.idproducto);
          }

          // Quitar del almacén destino
          const { data: existenciaDestino } = await supabaseAdmin
            .from('il_existencias_inventario')
            .select('cantidad')
            .eq('business_id', business_id)
            .eq('idalmacen', transferenciaExistente.idalmacendestino)
            .eq('idproducto', detalle.idproducto)
            .single();

          if (existenciaDestino) {
            await supabaseAdmin
              .from('il_existencias_inventario')
              .update({ cantidad: Number(existenciaDestino.cantidad) - Number(detalle.cantidad) })
              .eq('business_id', business_id)
              .eq('idalmacen', transferenciaExistente.idalmacendestino)
              .eq('idproducto', detalle.idproducto);
          }
        }
      }

      // Eliminar detalles anteriores
      await supabaseAdmin
        .from('il_transferencias_detalle_inventario')
        .delete()
        .eq('idtransferencia', id);

      // Insertar nuevos detalles
      const detallesConId = detalles.map((detalle: any) => ({
        idtransferencia: id,
        idproducto: detalle.idproducto,
        cantidad: detalle.cantidad
      }));

      const { error: detallesError } = await supabaseAdmin
        .from('il_transferencias_detalle_inventario')
        .insert(detallesConId);

      if (detallesError) {
        console.error('Error al insertar detalles:', detallesError);
        return new Response(JSON.stringify({ error: 'Error al actualizar detalles' }), { status: 500 });
      }

      // Aplicar nuevas existencias
      for (const detalle of detalles) {
        // Reducir stock en almacén origen
        const { data: existenciaOrigen } = await supabaseAdmin
          .from('il_existencias_inventario')
          .select('cantidad')
          .eq('business_id', business_id)
          .eq('idalmacen', transferenciaExistente.idalmacenorigen)
          .eq('idproducto', detalle.idproducto)
          .single();

        if (existenciaOrigen) {
          await supabaseAdmin
            .from('il_existencias_inventario')
            .update({ cantidad: Number(existenciaOrigen.cantidad) - Number(detalle.cantidad) })
            .eq('business_id', business_id)
            .eq('idalmacen', transferenciaExistente.idalmacenorigen)
            .eq('idproducto', detalle.idproducto);
        }

        // Aumentar stock en almacén destino
        const { data: existenciaDestino } = await supabaseAdmin
          .from('il_existencias_inventario')
          .select('cantidad')
          .eq('business_id', business_id)
          .eq('idalmacen', transferenciaExistente.idalmacendestino)
          .eq('idproducto', detalle.idproducto)
          .single();

        if (existenciaDestino) {
          await supabaseAdmin
            .from('il_existencias_inventario')
            .update({ cantidad: Number(existenciaDestino.cantidad) + Number(detalle.cantidad) })
            .eq('business_id', business_id)
            .eq('idalmacen', transferenciaExistente.idalmacendestino)
            .eq('idproducto', detalle.idproducto);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en PUT /api/inventario/transferencias/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID no proporcionado' }), { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Obtener información de la transferencia
    const { data: transferencia, error: getError } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .select('business_id, idalmacenorigen, idalmacendestino, anulada, inventariada')
      .eq('id', id)
      .single();

    if (getError || !transferencia) {
      return new Response(JSON.stringify({ error: 'Transferencia no encontrada' }), { status: 404 });
    }

    if (transferencia.anulada) {
      return new Response(JSON.stringify({ error: 'La transferencia ya está anulada' }), { status: 400 });
    }

    if (transferencia.inventariada) {
      return new Response(JSON.stringify({ error: 'No se puede anular una transferencia inventariada' }), { status: 400 });
    }

    // Obtener detalles para revertir existencias
    const { data: detalles } = await supabaseAdmin
      .from('il_transferencias_detalle_inventario')
      .select('idproducto, cantidad')
      .eq('idtransferencia', id);

    if (detalles) {
      for (const detalle of detalles) {
        // Devolver al almacén origen
        const { data: existenciaOrigen } = await supabaseAdmin
          .from('il_existencias_inventario')
          .select('cantidad')
          .eq('business_id', transferencia.business_id)
          .eq('idalmacen', transferencia.idalmacenorigen)
          .eq('idproducto', detalle.idproducto)
          .single();

        if (existenciaOrigen) {
          await supabaseAdmin
            .from('il_existencias_inventario')
            .update({ cantidad: Number(existenciaOrigen.cantidad) + Number(detalle.cantidad) })
            .eq('business_id', transferencia.business_id)
            .eq('idalmacen', transferencia.idalmacenorigen)
            .eq('idproducto', detalle.idproducto);
        }

        // Quitar del almacén destino
        const { data: existenciaDestino } = await supabaseAdmin
          .from('il_existencias_inventario')
          .select('cantidad')
          .eq('business_id', transferencia.business_id)
          .eq('idalmacen', transferencia.idalmacendestino)
          .eq('idproducto', detalle.idproducto)
          .single();

        if (existenciaDestino) {
          await supabaseAdmin
            .from('il_existencias_inventario')
            .update({ cantidad: Number(existenciaDestino.cantidad) - Number(detalle.cantidad) })
            .eq('business_id', transferencia.business_id)
            .eq('idalmacen', transferencia.idalmacendestino)
            .eq('idproducto', detalle.idproducto);
        }
      }
    }

    // Marcar como anulada
    const { error: updateError } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .update({ anulada: true })
      .eq('id', id);

    if (updateError) {
      console.error('Error al anular transferencia:', updateError);
      return new Response(JSON.stringify({ error: 'Error al anular transferencia' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en DELETE /api/inventario/transferencias/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};




