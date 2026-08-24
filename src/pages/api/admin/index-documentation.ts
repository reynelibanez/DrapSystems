import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Endpoint para indexar toda la documentación del proyecto
 * Solo accesible por administradores
 */
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Archivos de documentación a indexar
    const documentationFiles = [
      // Setup y Configuración
      { title: 'Inicio Rápido', file: 'INICIO_RAPIDO.md', category: 'setup', tags: ['inicio', 'configuracion', 'primeros-pasos'] },
      { title: 'Configuración de Email', file: 'CONFIGURAR_EMAIL.md', category: 'setup', tags: ['email', 'notificaciones', 'resend'] },
      { title: 'Configuración de Stripe', file: 'CONFIGURAR_STRIPE_PRICES.md', category: 'setup', tags: ['stripe', 'pagos', 'suscripciones'] },
      { title: 'Configuración de SMS/Twilio', file: 'CONFIGURACION_TWILIO_SMS.md', category: 'setup', tags: ['sms', 'twilio', 'notificaciones'] },
      { title: 'Variables de Entorno', file: 'ENV_VARIABLES_COMPLETO.md', category: 'setup', tags: ['env', 'configuracion', 'variables'] },
      { title: 'Configuración de Cloudflare', file: 'CONFIGURAR_CLOUDFLARE_VARS.md', category: 'setup', tags: ['cloudflare', 'deployment', 'produccion'] },
      
      // Características y Funcionalidades
      { title: 'Sistema de Notificaciones', file: 'SISTEMA_NOTIFICACIONES_COMPLETO.md', category: 'features', tags: ['notificaciones', 'email', 'sms'] },
      { title: 'Sistema de Backups', file: 'SISTEMA_BACKUP.md', category: 'features', tags: ['backup', 'respaldo', 'datos'] },
      { title: 'Reservas Públicas', file: 'SISTEMA_RESERVAS_PUBLICAS.md', category: 'features', tags: ['reservas', 'publico', 'booking'] },
      { title: 'Recordatorios Automáticos', file: 'CONFIGURAR_RECORDATORIOS_AUTOMATICOS.md', category: 'features', tags: ['recordatorios', 'automatico', 'citas'] },
      { title: 'Sistema de Suscripciones', file: 'SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md', category: 'features', tags: ['suscripciones', 'planes', 'stripe'] },
      { title: 'Gestión de Números Twilio', file: 'GUIA_NUMEROS_TWILIO.md', category: 'features', tags: ['twilio', 'numeros', 'sms'] },
      
      // Solución de Problemas
      { title: 'Solución Error 500', file: 'SOLUCION_ERROR_500_COMPLETA.md', category: 'troubleshooting', tags: ['error', '500', 'servidor'] },
      { title: 'Solución Error 403', file: 'SOLUCION_ERROR_403_CLOUDFLARE.md', category: 'troubleshooting', tags: ['error', '403', 'permisos'] },
      { title: 'Solución Error 401', file: 'SOLUCION_RAPIDA_401.md', category: 'troubleshooting', tags: ['error', '401', 'autenticacion'] },
      { title: 'Problemas con Webhook Stripe', file: 'SOLUCION_URGENTE_WEBHOOK.md', category: 'troubleshooting', tags: ['webhook', 'stripe', 'error'] },
      { title: 'Problemas de Login', file: 'SOLUCION_SOLUCION_LOGIN.md', category: 'troubleshooting', tags: ['login', 'autenticacion', 'acceso'] },
      
      // Ayuda y Guías
      { title: 'FAQ - Preguntas Frecuentes', file: 'FAQ.md', category: 'help', tags: ['faq', 'preguntas', 'ayuda'] },
      { title: 'Guía de Backups', file: 'GUIA_BACKUPS.md', category: 'help', tags: ['backup', 'guia', 'tutorial'] },
      { title: 'Guía de SMS', file: 'GUIA_COMPLETA_SMS.md', category: 'help', tags: ['sms', 'guia', 'tutorial'] },
      { title: 'Guía de Configuración Rápida', file: 'GUIA_CONFIGURACION_RAPIDA.md', category: 'help', tags: ['configuracion', 'rapida', 'inicio'] },
      
      // Arquitectura y Desarrollo
      { title: 'Arquitectura del Sistema', file: 'ARQUITECTURA.md', category: 'development', tags: ['arquitectura', 'desarrollo', 'tecnico'] },
      { title: 'Roles y Permisos', file: 'ROLES_Y_PERMISOS.md', category: 'development', tags: ['roles', 'permisos', 'seguridad'] },
    ];

    const indexedChunks: any[] = [];
    const errors: any[] = [];

    // Leer y procesar cada archivo
    for (const doc of documentationFiles) {
      try {
        const filePath = path.join(process.cwd(), doc.file);
        
        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
          console.log(`Archivo no encontrado: ${doc.file}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Dividir el contenido en chunks más pequeños (máximo 2000 caracteres)
        const chunks = splitIntoChunks(content, 2000);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Insertar en la base de datos
          const { data, error } = await supabase
            .from('documentation_chunks')
            .insert({
              title: chunks.length > 1 ? `${doc.title} (Parte ${i + 1})` : doc.title,
              content: chunk,
              category: doc.category,
              tags: doc.tags,
              metadata: {
                file: doc.file,
                chunk_index: i,
                total_chunks: chunks.length
              }
            })
            .select()
            .single();

          if (error) {
            errors.push({ file: doc.file, error: error.message });
          } else {
            indexedChunks.push(data);
          }
        }
      } catch (error: any) {
        errors.push({ file: doc.file, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        indexed: indexedChunks.length,
        errors: errors.length,
        details: {
          chunks: indexedChunks,
          errors
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error indexing documentation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Dividir texto en chunks más pequeños
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Si un párrafo es muy largo, dividirlo por oraciones
      if (paragraph.length > maxLength) {
        const sentences = paragraph.split('. ');
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + '. ';
          } else {
            currentChunk += sentence + '. ';
          }
        }
      } else {
        currentChunk = paragraph + '\n\n';
      }
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
