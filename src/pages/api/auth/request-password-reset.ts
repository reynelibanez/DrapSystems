

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const prerender = false;

// Función para generar contraseña aleatoria segura
function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Asegurar que tenga al menos uno de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('🔵 [request-password-reset] Endpoint llamado - NUEVO SISTEMA');
  
  try {
    const { email } = await request.json();
    console.log('📧 Email recibido:', email);

    if (!email) {
      console.error('❌ Email no proporcionado');
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener credenciales
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'DRAP Systems <noreply@drapsystems.com>';

    console.log('🔑 Credenciales:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'N/A',
      hasResendKey: !!resendApiKey,
      resendKeyPrefix: resendApiKey ? resendApiKey.substring(0, 8) + '...' : 'N/A',
      fromEmail
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return new Response(
        JSON.stringify({ error: 'Servicio no configurado correctamente' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY no configurada');
      return new Response(
        JSON.stringify({ error: 'Servicio de email no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase con service role key para operaciones admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Inicializar Resend
    const resend = new Resend(resendApiKey);

    // Buscar el usuario por email en la tabla profiles con su empresa
    console.log('🔍 Buscando usuario en profiles...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, 
        email, 
        full_name,
        business_id,
        businesses:business_id (
          name
        )
      `)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      console.log('⚠️ Usuario no encontrado, pero respondiendo con éxito por seguridad');
      console.log('   Error:', profileError?.message);
      // Por seguridad, no revelamos si el email existe o no
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Si el email existe, recibirás un correo con tu nueva contraseña temporal' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario encontrado:', profile.full_name);
    console.log('   ID:', profile.id);

    // Obtener el nombre de la empresa
    const businessName = profile.businesses?.name || 'DRAP Systems';
    console.log('🏢 Empresa:', businessName);

    // Generar contraseña aleatoria temporal
    const temporaryPassword = generateRandomPassword(12);
    console.log('🔐 Contraseña temporal generada (longitud):', temporaryPassword.length);

    // Hashear la contraseña para guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    console.log('🔒 Contraseña hasheada');

    // Actualizar la contraseña en Supabase Auth
    console.log('📝 Actualizando contraseña en Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: temporaryPassword }
    );

    if (authError) {
      console.error('❌ Error al actualizar contraseña en Auth:', authError);
      console.error('   Mensaje:', authError.message);
      console.error('   Detalles:', JSON.stringify(authError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Contraseña actualizada en Supabase Auth');
    console.log('   User ID:', authData?.user?.id);

    // También actualizar en la tabla profiles si existe la columna password
    console.log('📝 Actualizando contraseña en tabla profiles...');
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('id', profile.id);

    if (profileUpdateError) {
      console.log('⚠️ No se pudo actualizar en profiles (puede que no exista la columna):', profileUpdateError.message);
      // No es crítico, continuamos
    } else {
      console.log('✅ Contraseña también actualizada en tabla profiles');
    }

    // Construir URL de login
    let baseUrl = locals?.runtime?.env?.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'https://www.drapsystems.com';
    
    // Eliminar barra final si existe
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // Asegurar que siempre incluya /booking-suite
    if (!baseUrl.includes('/booking-suite')) {
      baseUrl = `${baseUrl}/booking-suite`;
    }
    
    const loginUrl = baseUrl;

    console.log('🔗 URL de login:', loginUrl);

    // Enviar email con la contraseña temporal
    try {
      console.log('📤 Enviando email con contraseña temporal...');
      const result = await resend.emails.send({
        from: `${businessName} <${fromEmail}>`,
        to: email,
        subject: `Tu nueva contraseña temporal - ${businessName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Contraseña Temporal</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f9;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #5AC1FF 0%, #3F9BE0 100%); border-radius: 8px 8px 0 0;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                            🔑 Contraseña Temporal
                          </h1>
                          <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                            ${businessName}
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; color: #00001F; font-size: 16px; line-height: 1.6;">
                            Hola <strong>${profile.full_name || 'Usuario'}</strong>,
                          </p>
                          
                          <p style="margin: 0 0 20px; color: #00001F; font-size: 16px; line-height: 1.6;">
                            Hemos generado una nueva contraseña temporal para tu cuenta en <strong>${businessName}</strong>.
                          </p>
                          
                          <!-- Password Box -->
                          <div style="background: linear-gradient(135deg, #f6f7f9 0%, #e8eaed 100%); border: 2px solid #5AC1FF; border-radius: 8px; padding: 24px; margin: 30px 0; text-align: center;">
                            <p style="margin: 0 0 12px; color: rgba(0, 0, 31, 0.6); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                              Tu Contraseña Temporal
                            </p>
                            <p style="margin: 0; color: #00001F; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px; word-break: break-all;">
                              ${temporaryPassword}
                            </p>
                          </div>
                          
                          <p style="margin: 0 0 30px; color: #00001F; font-size: 16px; line-height: 1.6;">
                            Usa esta contraseña para iniciar sesión. <strong>Te recomendamos cambiarla inmediatamente</strong> después de iniciar sesión por una contraseña personal y segura.
                          </p>
                          
                          <!-- Button -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td align="center" style="padding: 0 0 30px;">
                                <a href="${loginUrl}" target="_top" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #5AC1FF 0%, #3F9BE0 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(90, 193, 255, 0.3);">
                                  Iniciar Sesión Ahora
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Alternative Link - HIGHLIGHTED -->
                          <div style="padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%); border: 2px solid #ffc107; border-radius: 8px; margin-bottom: 30px;">
                            <p style="margin: 0 0 12px; color: #856404; font-size: 15px; font-weight: 700;">
                              ⚠️ IMPORTANTE: Si el botón no funciona
                            </p>
                            <p style="margin: 0 0 12px; color: #856404; font-size: 14px; line-height: 1.6;">
                              Algunos clientes de email bloquean los botones. <strong>Copia y pega este enlace directamente en tu navegador:</strong>
                            </p>
                            <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #ffc107;">
                              <p style="margin: 0; color: #5AC1FF; font-size: 14px; font-weight: 600; word-break: break-all; font-family: 'Courier New', monospace;">
                                ${loginUrl}
                              </p>
                            </div>
                            <p style="margin: 12px 0 0; color: #856404; font-size: 13px; font-style: italic;">
                              💡 Consejo: Haz clic derecho en el enlace y selecciona "Abrir en nueva pestaña"
                            </p>
                          </div>
                          
                          <!-- Instructions -->
                          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
                            <p style="margin: 0 0 10px; color: #00001F; font-size: 14px; font-weight: 600;">
                              📋 Instrucciones:
                            </p>
                            <ol style="margin: 0; padding-left: 20px; color: rgba(0, 0, 31, 0.8); font-size: 14px; line-height: 1.8;">
                              <li>Haz clic en el botón "Iniciar Sesión Ahora"</li>
                              <li>Ingresa tu email: <strong>${email}</strong></li>
                              <li>Copia y pega la contraseña temporal mostrada arriba</li>
                              <li>Una vez dentro, ve a tu perfil y cambia tu contraseña</li>
                            </ol>
                          </div>
                          
                          <!-- Security Info -->
                          <div style="border-left: 4px solid #5AC1FF; padding-left: 16px; margin-bottom: 30px;">
                            <p style="margin: 0 0 10px; color: #00001F; font-size: 14px; font-weight: 600;">
                              🔒 Seguridad
                            </p>
                            <p style="margin: 0; color: rgba(0, 0, 31, 0.6); font-size: 14px; line-height: 1.5;">
                              Esta contraseña temporal es válida hasta que la cambies. Por tu seguridad, te recomendamos cambiarla lo antes posible.
                            </p>
                          </div>
                          
                          <!-- Warning -->
                          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                              <strong>⚠️ ¿No solicitaste este cambio?</strong><br>
                              Si no solicitaste restablecer tu contraseña, contacta inmediatamente con el administrador. Tu cuenta podría estar comprometida.
                            </p>
                          </div>
                          
                          <p style="margin: 0; color: rgba(0, 0, 31, 0.6); font-size: 14px; line-height: 1.6;">
                            Saludos,<br>
                            <strong>El equipo de ${businessName}</strong>
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px 40px; background-color: #f6f7f9; border-radius: 0 0 8px 8px; text-align: center;">
                          <p style="margin: 0 0 10px; color: rgba(0, 0, 31, 0.6); font-size: 12px;">
                            Este es un correo automático, por favor no respondas a este mensaje.
                          </p>
                          <p style="margin: 0; color: rgba(0, 0, 31, 0.6); font-size: 12px;">
                            © ${new Date().getFullYear()} ${businessName}. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (result.error) {
        console.error('❌ Error de Resend:', result.error);
        throw new Error(result.error.message || 'Error al enviar email');
      }

      console.log('✅ Email con contraseña temporal enviado exitosamente:', result.data?.id);
    } catch (emailError: any) {
      console.error('❌ Error al enviar email:', emailError);
      console.error('   Mensaje:', emailError.message);
      console.error('   Stack:', emailError.stack);
      // No revelamos el error al usuario por seguridad, pero lo logueamos
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Si el email existe, recibirás un correo con tu nueva contraseña temporal' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error en request-password-reset:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};














