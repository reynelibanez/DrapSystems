
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Función para crear un ZIP simple sin dependencias externas
function createZipBuffer(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  
  // Cabecera ZIP simple
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;
  
  for (const [filename, content] of Object.entries(files)) {
    const filenameBytes = encoder.encode(filename);
    const contentBytes = encoder.encode(content);
    
    // Local file header
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);
    
    // Signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed
    view.setUint16(4, 20, true);
    // Flags
    view.setUint16(6, 0, true);
    // Compression method (0 = no compression)
    view.setUint16(8, 0, true);
    // Last mod time
    view.setUint16(10, 0, true);
    // Last mod date
    view.setUint16(12, 0, true);
    // CRC-32
    view.setUint32(14, 0, true);
    // Compressed size
    view.setUint32(18, contentBytes.length, true);
    // Uncompressed size
    view.setUint32(22, contentBytes.length, true);
    // Filename length
    view.setUint16(26, filenameBytes.length, true);
    // Extra field length
    view.setUint16(28, 0, true);
    
    // Filename
    localHeader.set(filenameBytes, 30);
    
    chunks.push(localHeader);
    chunks.push(contentBytes);
    
    // Central directory header
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    
    // Signature
    centralView.setUint32(0, 0x02014b50, true);
    // Version made by
    centralView.setUint16(4, 20, true);
    // Version needed
    centralView.setUint16(6, 20, true);
    // Flags
    centralView.setUint16(8, 0, true);
    // Compression method
    centralView.setUint16(10, 0, true);
    // Last mod time
    centralView.setUint16(12, 0, true);
    // Last mod date
    centralView.setUint16(14, 0, true);
    // CRC-32
    centralView.setUint32(16, 0, true);
    // Compressed size
    centralView.setUint32(20, contentBytes.length, true);
    // Uncompressed size
    centralView.setUint32(24, contentBytes.length, true);
    // Filename length
    centralView.setUint16(28, filenameBytes.length, true);
    // Extra field length
    centralView.setUint16(30, 0, true);
    // File comment length
    centralView.setUint16(32, 0, true);
    // Disk number start
    centralView.setUint16(34, 0, true);
    // Internal file attributes
    centralView.setUint16(36, 0, true);
    // External file attributes
    centralView.setUint32(38, 0, true);
    // Relative offset of local header
    centralView.setUint32(42, offset, true);
    
    // Filename
    centralHeader.set(filenameBytes, 46);
    
    centralDirectory.push(centralHeader);
    
    offset += localHeader.length + contentBytes.length;
  }
  
  // Concatenar central directory
  const centralDirData = new Uint8Array(
    centralDirectory.reduce((sum, arr) => sum + arr.length, 0)
  );
  let centralOffset = 0;
  for (const header of centralDirectory) {
    centralDirData.set(header, centralOffset);
    centralOffset += header.length;
  }
  
  // End of central directory
  const endOfCentral = new Uint8Array(22);
  const endView = new DataView(endOfCentral.buffer);
  
  // Signature
  endView.setUint32(0, 0x06054b50, true);
  // Disk number
  endView.setUint16(4, 0, true);
  // Disk with central directory
  endView.setUint16(6, 0, true);
  // Number of entries on this disk
  endView.setUint16(8, Object.keys(files).length, true);
  // Total number of entries
  endView.setUint16(10, Object.keys(files).length, true);
  // Size of central directory
  endView.setUint32(12, centralDirData.length, true);
  // Offset of central directory
  endView.setUint32(16, offset, true);
  // Comment length
  endView.setUint16(20, 0, true);
  
  // Concatenar todo
  const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0) + 
                      centralDirData.length + endOfCentral.length;
  const result = new Uint8Array(totalLength);
  
  let resultOffset = 0;
  for (const chunk of chunks) {
    result.set(chunk, resultOffset);
    resultOffset += chunk.length;
  }
  result.set(centralDirData, resultOffset);
  resultOffset += centralDirData.length;
  result.set(endOfCentral, resultOffset);
  
  return result;
}

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

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'Error al verificar perfil' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (profile?.role !== 'admin') {
      console.log('User role:', profile?.role, 'Expected: admin');
      return new Response(JSON.stringify({ error: 'Acceso denegado. Solo administradores.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating full backup for admin user:', user.email);

    // Generar backup de datos de la base de datos
    const dbBackup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        generatedBy: user.email,
        type: 'full-backup',
        description: 'Backup completo del sistema de gestión de citas'
      },
      data: {} as Record<string, any>,
      statistics: {
        totalTables: 0,
        totalRecords: 0,
        tablesWithErrors: [] as string[]
      }
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
          dbBackup.data[table] = { 
            error: error.message, 
            count: 0,
            records: []
          };
          dbBackup.statistics.tablesWithErrors.push(table);
        } else {
          dbBackup.data[table] = {
            count: data?.length || 0,
            records: data || []
          };
          dbBackup.statistics.totalRecords += data?.length || 0;
        }
        dbBackup.statistics.totalTables++;
      } catch (err) {
        console.error(`Exception fetching ${table}:`, err);
        dbBackup.data[table] = { 
          error: String(err), 
          count: 0,
          records: []
        };
        dbBackup.statistics.tablesWithErrors.push(table);
      }
    }

    // Agregar información adicional
    dbBackup.statistics = {
      ...dbBackup.statistics,
      businesses: dbBackup.data.businesses?.count || 0,
      users: dbBackup.data.profiles?.count || 0,
      clients: dbBackup.data.clients?.count || 0,
      appointments: dbBackup.data.appointments?.count || 0,
      services: dbBackup.data.services?.count || 0,
      notifications: dbBackup.data.notifications?.count || 0
    };

    // Agregar README con instrucciones
    const readme = `# Backup del Sistema de Gestión de Citas

## Información del Backup

- **Fecha**: ${new Date().toISOString()}
- **Generado por**: ${user.email}
- **Tipo**: Backup completo (Base de datos)
- **Total de registros**: ${dbBackup.statistics.totalRecords}

## Contenido

### Tablas incluidas:
${tables.map(t => `- ${t}: ${dbBackup.data[t]?.count || 0} registros`).join('\n')}

${dbBackup.statistics.tablesWithErrors.length > 0 ? `
### ⚠️ Tablas con errores:
${dbBackup.statistics.tablesWithErrors.map(t => `- ${t}`).join('\n')}
` : ''}

## Restauración

### Base de Datos

Para restaurar los datos:

1. Abre Supabase SQL Editor
2. Para cada tabla, usa los datos del archivo JSON
3. O importa directamente usando la API de Supabase

## Notas de Seguridad

🔒 Este archivo contiene información sensible:
- Datos de clientes
- Información de citas
- Configuración de negocios
- Perfiles de usuarios

**Recomendaciones**:
- Guarda este archivo en un lugar seguro
- No lo compartas públicamente
- Encripta el archivo si lo almacenas en la nube
- Elimina backups antiguos regularmente

---

Generado automáticamente por DRAP Appointment
${new Date().toISOString()}
`;

    // Crear archivos para el ZIP
    const files = {
      'README.md': readme,
      'database-backup.json': JSON.stringify(dbBackup, null, 2),
      'backup-info.json': JSON.stringify({
        backup_date: new Date().toISOString(),
        generated_by: user.email,
        system_version: '1.0.0',
        tables_backed_up: tables,
        total_records: dbBackup.statistics.totalRecords,
        statistics: dbBackup.statistics
      }, null, 2)
    };

    // Crear el ZIP
    const zipBuffer = createZipBuffer(files);

    // Generar nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const filename = `booking-suite-backup-${timestamp}.zip`;

    console.log('Full backup generated successfully:', {
      filename,
      size: zipBuffer.length,
      tables: tables.length,
      totalRecords: dbBackup.statistics.totalRecords
    });

    // Retornar el ZIP directamente
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error generating full backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al generar el backup completo',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

