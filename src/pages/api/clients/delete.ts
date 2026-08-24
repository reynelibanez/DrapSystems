import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Obtener el token del header de autorización
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Obtener variables de entorno (incluyendo versiones PUBLIC_)
    const supabaseUrl = 
      locals?.runtime?.env?.SUPABASE_URL || 
      locals?.runtime?.env?.PUBLIC_SUPABASE_URL ||
      import.meta.env.SUPABASE_URL || 
      import.meta.env.PUBLIC_SUPABASE_URL;
    
    const supabaseKey = 
      locals?.runtime?.env?.SUPABASE_ANON_KEY || 
      locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.SUPABASE_ANON_KEY || 
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey = 
      locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || 
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Variables de entorno faltantes:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY no está configurado');
      return new Response(JSON.stringify({ error: 'Falta la clave de servicio - no se pueden realizar operaciones de administrador' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que sea admin o business_owner
    if (!['admin', 'business_owner'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para eliminar clientes' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el clientId del body
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'clientId es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el cliente para verificar permisos
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('business_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si es business_owner, verificar que el cliente pertenezca a su empresa
    if (profile.role === 'business_owner' && client.business_id !== profile.business_id) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para eliminar este cliente' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usar el service role key para eliminar
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log('=== ELIMINACIÓN DE CLIENTE ===');
    console.log('Client ID:', clientId);
    console.log('Business ID:', client.business_id);

    // Eliminar las citas del cliente primero
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('client_id', clientId);

    if (appointmentsError) {
      console.error('Error eliminando citas del cliente:', appointmentsError);
      return new Response(JSON.stringify({ error: 'Error al eliminar las citas del cliente' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar el cliente
    const { error: deleteError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (deleteError) {
      console.error('Error eliminando cliente:', deleteError);
      return new Response(JSON.stringify({ error: 'Error al eliminar el cliente' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Cliente eliminado exitosamente');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cliente eliminado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en delete client endpoint:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


