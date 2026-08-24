import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
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
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario es admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Profile query result:', {
      userId: user.id,
      userEmail: user.email,
      profile,
      profileError,
      hasProfile: !!profile,
      role: profile?.role
    });

    if (profileError) {
      console.error('Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      return new Response(JSON.stringify({ 
        error: 'Error al verificar perfil',
        details: profileError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Perfil de usuario no encontrado',
        details: 'No se encontró un perfil asociado a este usuario'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (profile.role !== 'admin') {
      console.log('Access denied - User role:', {
        userId: user.id,
        userEmail: user.email,
        currentRole: profile.role,
        requiredRole: 'admin'
      });
      return new Response(JSON.stringify({ 
        error: 'Acceso denegado. Solo administradores.',
        details: `Tu rol actual es: ${profile.role}. Se requiere rol: admin`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Admin access granted:', {
      userId: user.id,
      userEmail: user.email,
      role: profile.role
    });

    console.log('Generating backup for admin user:', user.email);

    // Generar el backup
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        generatedBy: user.email,
      },
      data: {} as Record<string, any>
    };

    // Tablas a respaldar
    const tables = [
      'profiles',
      'businesses',
      'services',
      'clients',
      'appointments',
      'notifications',
      'notification_queue'
    ];

    // Obtener datos de cada tabla
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          backup.data[table] = { error: error.message, count: 0 };
        } else {
          backup.data[table] = {
            count: data?.length || 0,
            records: data || []
          };
        }
      } catch (err) {
        console.error(`Exception fetching ${table}:`, err);
        backup.data[table] = { error: String(err), count: 0 };
      }
    }

    // Agregar estadísticas generales
    backup.data.statistics = {
      totalBusinesses: backup.data.businesses?.count || 0,
      totalUsers: backup.data.profiles?.count || 0,
      totalClients: backup.data.clients?.count || 0,
      totalAppointments: backup.data.appointments?.count || 0,
      totalServices: backup.data.services?.count || 0,
      totalNotifications: backup.data.notifications?.count || 0,
    };

    console.log('Backup generated successfully. Statistics:', backup.data.statistics);

    // Generar nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `booking-suite-backup-${timestamp}.json`;

    // Retornar el backup como JSON descargable
    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error generating backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al generar el backup',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



