import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener variables de entorno
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Configuración de servidor incompleta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear cliente con service role (bypasea RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar que el usuario actual sea admin o business_owner
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el perfil del usuario actual
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !currentProfile) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar permisos
    const isAdmin = currentProfile.role === 'admin';
    const isBusinessOwner = currentProfile.role === 'business_owner';

    if (!isAdmin && !isBusinessOwner) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para actualizar usuarios' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del body
    const body = await request.json();
    const { userId, full_name, phone, role, business_id, address, avatar_url } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID de usuario requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si no es admin, verificar que el usuario a actualizar pertenezca a su empresa
    if (!isAdmin) {
      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('business_id')
        .eq('id', userId)
        .single();

      if (targetError || !targetProfile) {
        return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (targetProfile.business_id !== currentProfile.business_id) {
        return new Response(JSON.stringify({ error: 'No puedes actualizar usuarios de otras empresas' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      full_name,
      phone: phone || null,
      address: address || null,
      avatar_url: avatar_url || null
    };

    // Solo admin puede cambiar el rol y la empresa
    if (isAdmin) {
      updateData.role = role;
      updateData.business_id = business_id || null;
    }

    console.log('Updating user with service role:', userId, updateData);

    // Actualizar usuario usando service role (bypasea RLS)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Error al actualizar usuario',
        details: updateError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User updated successfully:', updatedUser);

    return new Response(JSON.stringify({ 
      success: true,
      user: updatedUser 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in update-user endpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

