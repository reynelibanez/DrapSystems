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
      console.error('Error de autenticación:', authError);
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el perfil del usuario con su business_id usando service key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Error al obtener perfil de usuario',
        details: profileError.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile) {
      console.error('Perfil no encontrado para usuario:', user.id);
      return new Response(JSON.stringify({ error: 'Perfil de usuario no encontrado' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile.business_id) {
      console.error('Usuario sin business_id:', user.id, 'role:', profile.role);
      return new Response(JSON.stringify({ 
        error: 'No se encontró el negocio asociado al usuario',
        details: 'El usuario no tiene un business_id asignado'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Obtener recepciones con información del almacén
    const { data, error, count } = await supabase
      .from('il_recepciones_inventario')
      .select(`
        id,
        numero,
        fecha,
        idalmacen,
        observaciones,
        anulada,
        inventariada,
        user_id,
        created_at,
        updated_at,
        almacen:ng_almacen_inventario!idalmacen(almacen),
        usuario:profiles!user_id(full_name)
      `, { count: 'exact' })
      .eq('business_id', profile.business_id)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error en query recepciones:', error);
      throw error;
    }

    return new Response(JSON.stringify({ data, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/recepciones:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener recepciones',
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

    // Obtener el perfil del usuario con su business_id usando service key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Error al obtener perfil de usuario',
        details: profileError.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile) {
      console.error('Perfil no encontrado para usuario:', user.id);
      return new Response(JSON.stringify({ error: 'Perfil de usuario no encontrado' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile.business_id) {
      console.error('Usuario sin business_id:', user.id, 'role:', profile.role);
      return new Response(JSON.stringify({ 
        error: 'No se encontró el negocio asociado al usuario',
        details: 'El usuario no tiene un business_id asignado'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { business_id, fecha, idalmacen, observaciones, inventariada, detalle } = body;

    // Validaciones básicas
    if (!business_id || !fecha || !idalmacen) {
      return new Response(JSON.stringify({ 
        error: 'Faltan campos requeridos: business_id, fecha, idalmacen' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!detalle || detalle.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Debe agregar al menos un producto' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar número automático
    const { data: lastRecepcion } = await supabase
      .from('il_recepciones_inventario')
      .select('numero')
      .eq('business_id', business_id)
      .order('numero', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastRecepcion?.numero) {
      // Extraer el número del formato (ej: "RC-0001" -> 1)
      const match = lastRecepcion.numero.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const numero = `RC-${nextNumber.toString().padStart(4, '0')}`;

    console.log('Creando recepción:', { numero, fecha, idalmacen, inventariada });

    // Crear recepción
    const { data: recepcion, error: recepcionError } = await supabase
      .from('il_recepciones_inventario')
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

    if (recepcionError) {
      console.error('Error creando recepción:', recepcionError);
      throw recepcionError;
    }

    console.log('Recepción creada:', recepcion.id);

    // Insertar detalle
    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map((item: any) => ({
        idrecepcion: recepcion.id,
        idproducto: item.idproducto,
        cantidad: item.cantidad,
        costo: item.costo
      }));

      console.log('Insertando detalle:', detalleData);

      const { error: detalleError } = await supabase
        .from('il_recepciones_detalle_inventario')
        .insert(detalleData);

      if (detalleError) {
        console.error('Error insertando detalle:', detalleError);
        throw detalleError;
      }
    }

    return new Response(JSON.stringify(recepcion), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/recepciones:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al crear recepción',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};









