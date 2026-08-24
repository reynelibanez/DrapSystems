import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

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
      return new Response(JSON.stringify({ error: 'Configuración de servidor incompleta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear cliente con service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar el token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario es admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado. Solo administradores.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar el backup más reciente
    const files = await readdir('/app');
    const backupFiles = files.filter(f => f.startsWith('backup-completo-') && f.endsWith('.zip'));
    
    if (backupFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay backups disponibles' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ordenar por fecha (más reciente primero)
    backupFiles.sort().reverse();
    const latestBackup = backupFiles[0];
    
    console.log('Downloading backup:', latestBackup);

    // Leer el archivo
    const backupPath = join('/app', latestBackup);
    const fileBuffer = await readFile(backupPath);

    // Retornar el archivo
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${latestBackup}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error downloading backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al descargar el backup',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
