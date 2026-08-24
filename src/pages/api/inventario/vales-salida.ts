import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, locals }) => {
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

    // Obtener el perfil del usuario para verificar business_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.business_id) {
      return new Response(JSON.stringify({ error: 'No se encontró el negocio' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const businessId = profile.business_id;

    // Obtener vales de salida
    const { data, error } = await supabase
      .from('il_valessalida_inventario')
      .select(`
        *,
        almacen:ng_almacen_inventario!idalmacen(id, almacen),
        usuario:profiles!user_id(id, full_name)
      `)
      .eq('business_id', businessId)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/vales-salida:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener vales de salida',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json();
    const { business_id, fecha, idalmacen, observaciones, inventariada, detalle } = body;

    // Generar número automático
    const { data: lastVale } = await supabase
      .from('il_valessalida_inventario')
      .select('numero')
      .eq('business_id', business_id)
      .order('numero', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastVale?.numero) {
      // Extraer el número del formato (ej: "VS-0001" -> 1)
      const match = lastVale.numero.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const numero = `VS-${nextNumber.toString().padStart(4, '0')}`;

    // Crear vale de salida
    const { data: vale, error: valeError } = await supabase
      .from('il_valessalida_inventario')
      .insert({
        business_id,
        numero,
        fecha,
        idalmacen,
        observaciones,
        inventariada: inventariada || false,
        user_id: user.id
      })
      .select()
      .single();

    if (valeError) throw valeError;

    // Insertar detalle
    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map((item: any) => ({
        idvalesalida: vale.id,
        idproducto: item.idproducto,
        cantidad: item.cantidad,
        precio: item.precio
      }));

      const { error: detalleError } = await supabase
        .from('il_valessalida_detalle_inventario')
        .insert(detalleData);

      if (detalleError) throw detalleError;

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
            const { error: updateError } = await supabase
              .from('il_existencias_inventario')
              .update({ 
                cantidad: existencia.cantidad - item.cantidad 
              })
              .eq('business_id', business_id)
              .eq('idalmacen', idalmacen)
              .eq('idproducto', item.idproducto);

            if (updateError) throw updateError;
          }
        }
      }
    }

    return new Response(JSON.stringify(vale), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/vales-salida:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al crear vale de salida',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



