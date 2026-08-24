import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimits, canAddUser } from '../../../lib/plan-limits';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('=== CREATE USER API CALLED ===');
    
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Crear cliente de Supabase con el token del usuario
    const { createClient } = await import('@supabase/supabase-js');
    
    // Obtener variables de entorno con múltiples fuentes
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || 
                        import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || 
                           import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Anon Key available:', !!supabaseAnonKey);
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verificar el token y obtener el usuario
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Verificar que el usuario sea admin o business_owner usando el cliente con el token
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single();

    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Error al verificar permisos',
        details: profileError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isAdmin = profile?.role === 'admin';
    const isBusinessOwner = profile?.role === 'business_owner';

    if (!isAdmin && !isBusinessOwner) {
      console.error('User does not have permission. Role:', profile?.role);
      return new Response(JSON.stringify({ 
        error: 'No tienes permisos para crear usuarios',
        currentRole: profile?.role 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User has permission to create users. Role:', profile.role);

    // Obtener los datos del nuevo usuario
    const body = await request.json();
    const { email, password, full_name, phone, role, business_id, address, avatar_url } = body;

    console.log('Creating user with data:', { email, full_name, role, business_id });

    // Validar datos requeridos
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ 
          error: 'Password must be at least 8 characters long' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si es business_owner, validar restricciones
    if (isBusinessOwner) {
      // Solo puede crear staff
      if (role !== 'staff') {
        return new Response(JSON.stringify({ 
          error: 'Los propietarios de negocio solo pueden crear usuarios con rol "staff"' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Debe usar su propio business_id
      if (business_id && business_id !== profile.business_id) {
        return new Response(JSON.stringify({ 
          error: 'No puedes crear usuarios para otro negocio' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Forzar el business_id del propietario
      body.business_id = profile.business_id;

      // Validar límites del plan
      const targetBusinessId = profile.business_id;
      
      // Obtener el plan del negocio
      const { data: businessData, error: businessError } = await userClient
        .from('businesses')
        .select('subscription_plan')
        .eq('id', targetBusinessId)
        .single();

      if (businessError) {
        console.error('Error fetching business:', businessError);
        return new Response(JSON.stringify({ 
          error: 'Error al verificar el plan del negocio',
          details: businessError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const currentPlan = businessData?.subscription_plan || 'basic';

      // Contar usuarios actuales del negocio
      const { count: userCount, error: countError } = await userClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetBusinessId);

      if (countError) {
        console.error('Error counting users:', countError);
        return new Response(JSON.stringify({ 
          error: 'Error al contar usuarios',
          details: countError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const currentUserCount = userCount || 0;

      // Verificar si se puede agregar un usuario más
      if (!canAddUser(currentPlan, currentUserCount)) {
        const limits = getPlanLimits(currentPlan);
        const limitText = limits.users === 'unlimited' ? 'ilimitados' : limits.users.toString();
        
        return new Response(JSON.stringify({ 
          error: `Has alcanzado el límite de ${limitText} usuarios para el plan ${currentPlan}. Actualiza tu plan para agregar más usuarios.`
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Obtener la service role key con múltiples fuentes
    let serviceRoleKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    }
    
    // Intentar también desde process.env si estamos en desarrollo
    if (!serviceRoleKey && typeof process !== 'undefined' && process.env) {
      serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
    
    console.log('Service role key available:', !!serviceRoleKey);
    console.log('Service role key length:', serviceRoleKey?.length || 0);
    
    if (!serviceRoleKey) {
      console.error('Service role key not found in any source');
      console.error('Checked sources:', {
        cloudflare: !!locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY,
        importMeta: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
        processEnv: typeof process !== 'undefined' && !!process?.env?.SUPABASE_SERVICE_ROLE_KEY
      });
      return new Response(JSON.stringify({ 
        error: 'Configuración del servidor incompleta',
        details: 'SUPABASE_SERVICE_ROLE_KEY no está configurada'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Admin client created, attempting to create user...');

    // Crear el usuario usando el admin client
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role,
        business_id,
        address
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!newUser.user) {
      console.error('No user returned from createUser');
      return new Response(JSON.stringify({ error: 'Error al crear el usuario' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User created successfully:', newUser.user.id);

    // Actualizar el perfil con los datos adicionales
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name,
        phone: phone || null,
        role: role || 'client',
        business_id: business_id || null,
        address: address || null,
        avatar_url: avatar_url || null
      })
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // No retornamos error aquí porque el usuario ya fue creado
    }

    console.log('User creation completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in create-user API:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor',
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};








