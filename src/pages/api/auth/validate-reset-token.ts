import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar el token en la base de datos
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expires_at')
      .eq('reset_token', token)
      .single();

    if (error || !profile) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token inválido' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el token ha expirado
    const expiresAt = new Date(profile.reset_token_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token expirado' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en validate-reset-token:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Error al validar el token' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

