import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase credentials from environment
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check if client exists (without is_active filter for better error messages)
    const { data: clientCheck, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    console.log('=== VERIFICACIÓN DE CLIENTE ===');
    console.log('Email buscado:', email);
    console.log('Error de búsqueda:', checkError);
    console.log('Cliente encontrado:', clientCheck ? 'SÍ' : 'NO');

    if (clientCheck) {
      console.log('Datos del cliente:', {
        id: clientCheck.id,
        full_name: clientCheck.full_name,
        email: clientCheck.email,
        is_active: clientCheck.is_active,
        has_password: !!clientCheck.password,
        has_password_hash: !!clientCheck.password_hash,
      });
    }

    // Now search with is_active filter
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (clientError) {
      console.error('❌ Error buscando cliente activo:', clientError);
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!client) {
      // Check if client exists but is inactive
      if (clientCheck && !clientCheck.is_active) {
        console.log('❌ Cliente existe pero está inactivo');
        return new Response(
          JSON.stringify({ error: 'Esta cuenta está inactiva. Contacte al administrador.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.log('❌ No se encontró cliente activo con ese email');
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Cliente activo encontrado:', client.full_name);

    // Check if client has password configured
    const hasPassword = client.password || client.password_hash;

    if (!hasPassword) {
      console.error('❌ Cliente sin contraseña configurada');
      return new Response(
        JSON.stringify({ error: 'Este cliente no tiene contraseña configurada. Contacte al administrador.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== VERIFICACIÓN DE CONTRASEÑA ===');
    console.log('Tiene password (texto plano):', !!client.password);
    console.log('Tiene password_hash (bcrypt):', !!client.password_hash);

    // Verify client password
    let passwordValid = false;

    // If has password_hash, use bcrypt to compare
    if (client.password_hash) {
      console.log('Verificando contraseña con bcrypt...');
      passwordValid = await bcrypt.compare(password, client.password_hash);
      console.log('Resultado bcrypt.compare:', passwordValid);
    }
    // If has password (plain text), compare directly
    else if (client.password) {
      console.log('Verificando contraseña en texto plano...');
      passwordValid = client.password === password;
      console.log('Resultado comparación directa:', passwordValid);
    }

    if (!passwordValid) {
      console.log('❌ Contraseña incorrecta');
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Client authenticated successfully
    console.log('✅ Cliente autenticado correctamente:', client.full_name);

    // Return client session data
    const clientSessionData = {
      id: client.id,
      email: client.email,
      full_name: client.full_name,
      business_id: client.business_id,
      role: 'client',
      avatar_url: client.avatar_url,
      phone: client.phone,
      created_at: client.created_at,
    };

    return new Response(
      JSON.stringify({ success: true, client: clientSessionData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error en verify-client-password:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
