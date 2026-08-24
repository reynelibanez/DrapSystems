import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

// Función para validar la fortaleza de la contraseña
function validatePasswordStrength(pwd: string): string | null {
  if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'La contraseña debe contener al menos una letra mayúscula';
  if (!/[a-z]/.test(pwd)) return 'La contraseña debe contener al menos una letra minúscula';
  if (!/[0-9]/.test(pwd)) return 'La contraseña debe contener al menos un número';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
    return 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)';
  }
  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validar requisitos de seguridad de la contraseña
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return new Response(
        JSON.stringify({ error: passwordError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar el token en la base de datos (Nota: reset_token_expires_at)
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expires_at, user_id')
      .eq('reset_token', token)
      .single();

    if (findError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verificar si el token ha expirado
    const expiresAt = new Date(profile.reset_token_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'El enlace de recuperación ha expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Actualizar la contraseña en la tabla profiles
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq('id', profile.id);

    if (updateProfileError) {
      console.error('Error al actualizar contraseña en profiles:', updateProfileError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar la contraseña' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Actualizar en Supabase Auth si existe user_id (Soporte Cloudflare / Workers)
    if (profile.user_id) {
      try {
        // En Cloudflare Workers se obtiene desde locals.runtime.env
        const env = (locals as any)?.runtime?.env || import.meta.env;
        const serviceKey = env.SUPABASE_SERVICE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;
        const supabaseUrl = env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;

        if (serviceKey && supabaseUrl) {
          const { createClient } = await import('@supabase/supabase-js');
          const adminClient = createClient(supabaseUrl, serviceKey);

          await adminClient.auth.admin.updateUserById(profile.user_id, {
            password: password,
          });
        }
      } catch (authError) {
        console.error('Error no crítico al actualizar en Supabase Auth:', authError);
      }
    }

    console.log('✅ Contraseña actualizada correctamente para el perfil:', profile.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Contraseña actualizada correctamente' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error en reset-password:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno al procesar la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};