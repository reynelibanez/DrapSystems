import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    console.log('=== INICIO GET /api/inventario/transferencias ===');
    
    // Validar variables de entorno
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return new Response(JSON.stringify({ 
        error: 'Configuración del servidor incompleta',
        details: 'Faltan variables de entorno de Supabase'
      }), { status: 500 });
    }
    
    // Obtener el token del usuario autenticado
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No hay header de autorización');
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token recibido');
    
    // Crear cliente con Service Role Key para operaciones del servidor
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Cliente Supabase creado');
    
    // Verificar el usuario con el token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error verificando usuario:', userError);
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    console.log('Usuario autenticado:', user.id);

    // Obtener business_id del perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return new Response(JSON.stringify({ error: 'Error obteniendo perfil', details: profileError.message }), { status: 500 });
    }

    if (!profile?.business_id) {
      console.error('Perfil sin business_id');
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), { status: 404 });
    }

    const businessId = profile.business_id;
    console.log('Business ID:', businessId);

    // Obtener transferencias primero sin joins
    console.log('Consultando transferencias...');
    const { data: transferencias, error } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener transferencias:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener transferencias', details: error.message }), { status: 500 });
    }

    console.log('Transferencias encontradas:', transferencias?.length || 0);

    // Si no hay transferencias, retornar array vacío
    if (!transferencias || transferencias.length === 0) {
      return new Response(JSON.stringify({ transferencias: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener información de almacenes para cada transferencia
    console.log('Obteniendo información de almacenes...');
    const transferenciasConAlmacenes = await Promise.all(
      transferencias.map(async (t) => {
        try {
          const { data: almacenOrigen } = await supabaseAdmin
            .from('ng_almacen_inventario')
            .select('almacen')
            .eq('id', t.idalmacenorigen)
            .single();

          const { data: almacenDestino } = await supabaseAdmin
            .from('ng_almacen_inventario')
            .select('almacen')
            .eq('id', t.idalmacendestino)
            .single();

          return {
            ...t,
            almacen_origen: almacenOrigen,
            almacen_destino: almacenDestino
          };
        } catch (err) {
          console.error('Error obteniendo almacenes para transferencia:', t.id, err);
          return {
            ...t,
            almacen_origen: null,
            almacen_destino: null
          };
        }
      })
    );

    console.log('Transferencias con almacenes procesadas');
    console.log('=== FIN GET /api/inventario/transferencias ===');

    return new Response(JSON.stringify({ transferencias: transferenciasConAlmacenes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('=== ERROR CRÍTICO en GET /api/inventario/transferencias ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    const body = await request.json();
    const { business_id, fecha, idalmacenorigen, idalmacendestino, observaciones, detalles, numero, inventariada } = body;

    // Validaciones
    if (!business_id || !fecha || !idalmacenorigen || !idalmacendestino) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
    }

    if (idalmacenorigen === idalmacendestino) {
      return new Response(JSON.stringify({ error: 'El almacén de origen y destino deben ser diferentes' }), { status: 400 });
    }

    if (!detalles || detalles.length === 0) {
      return new Response(JSON.stringify({ error: 'Debe agregar al menos un producto' }), { status: 400 });
    }

    // Validar stock disponible en almacén origen
    for (const detalle of detalles) {
      const { data: existencia, error: stockError } = await supabaseAdmin
        .from('il_existencias_inventario')
        .select('cantidad')
        .eq('business_id', business_id)
        .eq('idalmacen', idalmacenorigen)
        .eq('idproducto', detalle.idproducto)
        .single();

      if (stockError || !existencia) {
        return new Response(JSON.stringify({ error: 'Producto sin stock en almacén origen' }), { status: 400 });
      }

      if (Number(existencia.cantidad) < Number(detalle.cantidad)) {
        return new Response(JSON.stringify({ error: 'Stock insuficiente en almacén origen' }), { status: 400 });
      }
    }

    // Generar número automático si no se proporciona
    let numeroTransferencia = numero;
    if (!numeroTransferencia) {
      const { data: lastTransferencia } = await supabaseAdmin
        .from('il_transferencias_inventario')
        .select('numero')
        .eq('business_id', business_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastTransferencia?.numero) {
        const lastNumber = parseInt(lastTransferencia.numero.replace(/\D/g, '')) || 0;
        numeroTransferencia = `TRF-${String(lastNumber + 1).padStart(6, '0')}`;
      } else {
        numeroTransferencia = 'TRF-000001';
      }
    }

    // Crear transferencia
    const { data: transferencia, error: transferenciaError } = await supabaseAdmin
      .from('il_transferencias_inventario')
      .insert({
        business_id,
        numero: numeroTransferencia,
        fecha,
        idalmacenorigen,
        idalmacendestino,
        observaciones,
        inventariada: inventariada || false,
        user_id: user.id,
        anulada: false
      })
      .select()
      .single();

    if (transferenciaError) {
      console.error('Error al crear transferencia:', transferenciaError);
      return new Response(JSON.stringify({ error: 'Error al crear transferencia' }), { status: 500 });
    }

    // Insertar detalles
    const detallesConId = detalles.map((detalle: any) => ({
      idtransferencia: transferencia.id,
      idproducto: detalle.idproducto,
      cantidad: detalle.cantidad
    }));

    const { error: detallesError } = await supabaseAdmin
      .from('il_transferencias_detalle_inventario')
      .insert(detallesConId);

    if (detallesError) {
      console.error('Error al insertar detalles:', detallesError);
      // Revertir la transferencia
      await supabaseAdmin
        .from('il_transferencias_inventario')
        .delete()
        .eq('id', transferencia.id);
      return new Response(JSON.stringify({ error: 'Error al insertar detalles' }), { status: 500 });
    }

    // Actualizar existencias
    for (const detalle of detalles) {
      // Reducir stock en almacén origen
      const { data: existenciaOrigen } = await supabaseAdmin
        .from('il_existencias_inventario')
        .select('cantidad, costo')
        .eq('business_id', business_id)
        .eq('idalmacen', idalmacenorigen)
        .eq('idproducto', detalle.idproducto)
        .single();

      if (existenciaOrigen) {
        await supabaseAdmin
          .from('il_existencias_inventario')
          .update({ cantidad: Number(existenciaOrigen.cantidad) - Number(detalle.cantidad) })
          .eq('business_id', business_id)
          .eq('idalmacen', idalmacenorigen)
          .eq('idproducto', detalle.idproducto);
      }

      // Aumentar stock en almacén destino
      const { data: existenciaDestino } = await supabaseAdmin
        .from('il_existencias_inventario')
        .select('cantidad, costo')
        .eq('business_id', business_id)
        .eq('idalmacen', idalmacendestino)
        .eq('idproducto', detalle.idproducto)
        .single();

      if (existenciaDestino) {
        // Actualizar existencia existente
        await supabaseAdmin
          .from('il_existencias_inventario')
          .update({ cantidad: Number(existenciaDestino.cantidad) + Number(detalle.cantidad) })
          .eq('business_id', business_id)
          .eq('idalmacen', idalmacendestino)
          .eq('idproducto', detalle.idproducto);
      } else {
        // Crear nueva existencia (usar el costo del almacén origen)
        const costoOrigen = existenciaOrigen?.costo || 0;
        await supabaseAdmin
          .from('il_existencias_inventario')
          .insert({
            business_id,
            idalmacen: idalmacendestino,
            idproducto: detalle.idproducto,
            cantidad: detalle.cantidad,
            costo: costoOrigen
          });
      }
    }

    return new Response(JSON.stringify({ transferencia }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/transferencias:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};









