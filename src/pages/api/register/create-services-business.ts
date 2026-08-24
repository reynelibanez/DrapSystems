import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      userEmail,
      userPassword,
      userFullName,
      userPhone,
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessDescription,
      smsConsent,
    } = body;

    // Validaciones
    if (!userEmail || !userPassword || !userFullName || !userPhone) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos del usuario' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!businessName || !businessEmail || !businessPhone) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos de la empresa' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!smsConsent) {
      return new Response(
        JSON.stringify({ error: 'Debes aceptar recibir notificaciones por SMS' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail) || !emailRegex.test(businessEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar contraseña segura
    if (userPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[A-Z]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe contener al menos una letra mayúscula' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[a-z]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe contener al menos una letra minúscula' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[0-9]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe contener al menos un número' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[^A-Za-z0-9]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe contener al menos un carácter especial' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === userEmail);

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'El email ya está registrado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userFullName,
        phone: userPhone,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Error al crear el usuario',
          details: authError?.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    try {
      // 2. Crear empresa
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          email: businessEmail,
          phone: businessPhone,
          address: businessAddress || null,
          description: businessDescription || null,
          owner_id: userId,
          plan_type: 'free', // Plan gratuito por defecto
          sms_consent: smsConsent,
        })
        .select()
        .single();

      if (businessError || !businessData) {
        console.error('Error creating business:', businessError);
        // Rollback: eliminar usuario de auth
        await supabase.auth.admin.deleteUser(userId);
        
        return new Response(
          JSON.stringify({ 
            error: 'Error al crear la empresa',
            details: businessError?.message 
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const businessId = businessData.id;

      // 3. Crear perfil del usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          business_id: businessId,
          full_name: userFullName,
          email: userEmail,
          phone: userPhone,
          role: 'owner',
          password: hashedPassword,
          enabled_modules: ['services'], // Solo módulo de servicios habilitado
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Rollback: eliminar empresa y usuario
        await supabase.from('businesses').delete().eq('id', businessId);
        await supabase.auth.admin.deleteUser(userId);
        
        return new Response(
          JSON.stringify({ 
            error: 'Error al crear el perfil',
            details: profileError.message 
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 4. Crear suscripción al módulo de servicios con plan básico gratuito
      const { error: subscriptionError } = await supabase.rpc('create_module_subscription', {
        p_business_id: businessId,
        p_module_name: 'services',
        p_plan_type: 'free',
        p_billing_cycle: 'monthly',
        p_amount: 0,
        p_trial_days: 0,
      });

      if (subscriptionError) {
        console.error('Error creating module subscription:', subscriptionError);
        // No hacemos rollback aquí porque la suscripción no es crítica
        // El usuario puede seguir usando el sistema
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cuenta creada exitosamente',
          data: {
            userId,
            businessId,
            module: 'services',
            plan: 'free',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error in registration process:', error);
      
      // Intentar rollback
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Error en el proceso de registro',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
