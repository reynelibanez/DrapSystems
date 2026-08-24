import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Obtener variables de entorno
    const supabaseUrl = 
      locals?.runtime?.env?.PUBLIC_SUPABASE_URL || 
      import.meta.env.PUBLIC_SUPABASE_URL;
      
    const supabaseAnonKey = 
      locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      
    const supabaseServiceKey = 
      locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || 
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing Supabase configuration'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing service role key - cannot perform admin operations' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cliente normal para verificar autenticación
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || ''
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario sea admin o business_owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isBusinessOwner = profile?.role === 'business_owner';

    if (!isAdmin && !isBusinessOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin or Business Owner access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el userId del body
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // No permitir que se elimine a sí mismo
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener información del usuario a eliminar
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('role, business_id, full_name, email')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // REGLA: Solo los admins pueden eliminar business_owners
    if (targetUser.role === 'business_owner' && !isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Only administrators can delete business owners' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si es business_owner, verificar que el usuario a eliminar sea staff de su empresa
    if (isBusinessOwner) {
      // Solo puede eliminar staff
      if (targetUser.role !== 'staff') {
        return new Response(JSON.stringify({ 
          error: 'Business owners can only delete staff users' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Solo puede eliminar usuarios de su propia empresa
      if (targetUser.business_id !== profile.business_id) {
        return new Response(JSON.stringify({ 
          error: 'You can only delete users from your own business' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Cliente con service role para bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== ELIMINACIÓN DE USUARIO ===');
    console.log('User ID:', userId);

    // 1. Eliminar el perfil (esto también eliminará las citas y clientes asociados por CASCADE)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error eliminando perfil:', profileError);
      throw profileError;
    }

    // 2. Eliminar el usuario de Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error eliminando usuario de Auth:', authDeleteError);
      // No lanzamos error aquí porque el perfil ya fue eliminado
      // El usuario quedará huérfano en Auth pero no podrá hacer login
    }

    console.log('Usuario eliminado exitosamente');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Usuario eliminado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en delete-user:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error al eliminar el usuario' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



