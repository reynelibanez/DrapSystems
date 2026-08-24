import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
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
      modules = ['appointments'],
    } = data;

    // Validar datos requeridos
    if (!userEmail || !userPassword || !userFullName || !businessName || !businessEmail || !businessPhone) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos requeridos faltantes',
          details: 'Por favor completa todos los campos obligatorios marcados con *'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar consentimiento SMS
    if (!smsConsent) {
      return new Response(
        JSON.stringify({ 
          error: 'Consentimiento SMS requerido',
          details: 'Debes aceptar recibir notificaciones por SMS para continuar'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar módulos
    if (!modules || modules.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Módulos requeridos',
          details: 'Debes seleccionar al menos un módulo para continuar'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validModules = ['appointments', 'services', 'inventory', 'pos', 'crm'];
    const invalidModules = modules.filter((m: string) => !validModules.includes(m));
    if (invalidModules.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Módulos inválidos',
          details: `Los siguientes módulos no son válidos: ${invalidModules.join(', ')}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return new Response(
        JSON.stringify({ 
          error: 'Email inválido',
          details: 'Por favor ingresa un email válido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar contraseña segura
    if (userPassword.length < 8) {
      return new Response(
        JSON.stringify({ 
          error: 'Contraseña muy corta',
          details: 'La contraseña debe tener al menos 8 caracteres'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[A-Z]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ 
          error: 'Contraseña débil',
          details: 'La contraseña debe contener al menos una letra mayúscula (A-Z)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[a-z]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ 
          error: 'Contraseña débil',
          details: 'La contraseña debe contener al menos una letra minúscula (a-z)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[0-9]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ 
          error: 'Contraseña débil',
          details: 'La contraseña debe contener al menos un número (0-9)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/[^A-Za-z0-9]/.test(userPassword)) {
      return new Response(
        JSON.stringify({ 
          error: 'Contraseña débil',
          details: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar teléfono de la empresa
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(businessPhone)) {
      return new Response(
        JSON.stringify({ 
          error: 'Teléfono inválido',
          details: 'El teléfono de la empresa debe tener al menos 10 dígitos'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener credenciales de Supabase
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || locals?.runtime?.env?.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({ 
          error: 'Error de configuración del servidor',
          details: 'Faltan credenciales de Supabase'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase con service role key para crear usuarios
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userFullName,
        phone: userPhone || null,
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      
      // Detectar si el usuario ya existe
      if (authError?.message?.includes('already') || authError?.message?.includes('duplicate')) {
        return new Response(
          JSON.stringify({ 
            error: 'Este email ya está registrado',
            details: 'Por favor usa otro email o inicia sesión'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: authError?.message || 'Error al crear el usuario',
          details: authError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('User created successfully:', userId);

    // 2. Actualizar el perfil del usuario (el trigger ya lo creó)
    // Esperamos un momento para que el trigger termine
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userFullName,
        phone: userPhone || null,
        role: 'business_owner',
        sms_consent: smsConsent,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Intentar eliminar el usuario de auth si falla la actualización del perfil
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ 
          error: 'Error al actualizar el perfil del usuario',
          details: profileError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile updated successfully');

    // 3. Crear la empresa con plan básico de 30 días
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        email: businessEmail,
        phone: businessPhone,
        address: businessAddress || null,
        description: businessDescription || null,
        owner_id: userId,
        subscription_plan: 'basic',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_end_date: trialEndsAt.toISOString(), // Fecha de fin del trial
        settings: {
          billing_period: 'month' // Por defecto mensual
        }
      })
      .select()
      .single();

    if (businessError || !businessData) {
      console.error('Error creating business:', businessError);
      // Limpiar: eliminar perfil y usuario
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ 
          error: 'Error al crear la empresa',
          details: businessError?.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Business created successfully:', businessData.id);

    // 4. Actualizar el perfil con el business_id
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ business_id: businessData.id })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('Error updating profile with business_id:', updateProfileError);
      // No es crítico, pero lo registramos
    } else {
      console.log('Profile updated with business_id');
    }

    // 5. Asignar automáticamente el módulo de citas al propietario
    // 5. Crear suscripciones modulares para cada módulo seleccionado
    try {
      // Obtener el ID del módulo de citas
      const { data: appointmentsModule, error: moduleError } = await supabase
        .from('system_modules')
        .select('id')
        .eq('slug', 'appointments')
        .single();

      if (!moduleError && appointmentsModule) {
        // Crear el permiso
        const { error: permissionError } = await supabase
          .from('user_module_permissions')
          .insert({
            user_id: userId,
            module_id: appointmentsModule.id
          });

        if (permissionError) {
          console.error('Error assigning appointments module:', permissionError);
          // No es crítico, continuamos
        } else {
          console.log('Appointments module assigned successfully');
        }
      } else {
        console.error('Error getting appointments module:', moduleError);
      }
      for (const moduleName of modules) {
        const isAppointments = moduleName === 'appointments';
        const planType = 'free';
        const trialDays = isAppointments ? 30 : 0;
        
        const { error: subscriptionError } = await supabase.rpc('create_module_subscription', {
          p_business_id: businessData.id,
          p_module_name: moduleName,
          p_plan_type: planType,
          p_billing_cycle: 'monthly',
          p_amount: 0,
          p_trial_days: trialDays,
        });

        if (subscriptionError) {
          console.error(`Error creating ${moduleName} subscription:`, subscriptionError);
        } else {
          console.log(`${moduleName} subscription created successfully`);
        }
      }
    } catch (moduleAssignError) {
      console.error('Error in module assignment:', moduleAssignError);
      console.error('Error creating module subscriptions:', moduleAssignError);
      // No es crítico, continuamos
    }

    // 6. Enviar email de bienvenida (opcional)
    try {
      const baseUrl = new URL(request.url).origin;
      
      const moduleNames: Record<string, string> = {
        appointments: 'Gestión de Citas',
        services: 'Módulo de Servicios',
        inventory: 'Control de Inventario',
        pos: 'Punto de Venta',
        crm: 'CRM',
      };
      
      const modulesList = modules
        .map((m: string) => `<li>✓ ${moduleNames[m] || m}</li>`)
        .join('');
      
      const emailResponse = await fetch(`${baseUrl}/api/notifications/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: '¡Bienvenido a DRAP Appointment!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #5AC1FF;">¡Bienvenido a DRAP Appointment!</h1>
              <p>Hola ${userFullName},</p>
              <p>Tu cuenta ha sido creada exitosamente. Aquí están los detalles:</p>
              <ul>
                <li><strong>Empresa:</strong> ${businessName}</li>
                <li><strong>Plan:</strong> Básico (30 días de prueba)</li>
                <li><strong>Vence:</strong> ${trialEndsAt.toLocaleDateString()}</li>
              </ul>
              <p>Puedes comenzar a usar todas las funcionalidades de inmediato:</p>
              <p><strong>Módulos activados:</strong></p>
              <ul>
                <li>✓ Gestión de citas</li>
                <li>✓ Administración de clientes</li>
                <li>✓ Gestión de servicios</li>
                <li>✓ Reportes y estadísticas</li>
                ${modulesList}
              </ul>
              <p>
                <a href="${baseUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #5AC1FF; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  Iniciar Sesión
                </a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 24px;">
                ${modules.includes('appointments') 
                  ? `Tu módulo de citas tiene 30 días de prueba gratuita que vence el ${trialEndsAt.toLocaleDateString()}.`
                  : 'Tus módulos tienen plan básico gratuito.'
                }
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 24px;">
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Error sending welcome email:', await emailResponse.text());
      } else {
        console.log('Welcome email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // No es crítico, continuamos
    }

    // 7. Enviar SMS de bienvenida al usuario admin (si tiene teléfono y consentimiento)
    if (userPhone && smsConsent) {
      try {
        const baseUrl = new URL(request.url).origin;
        
        const smsMessage = `¡Bienvenido a DRAP Appointment! Tu cuenta para ${businessName} ha sido creada. Tu plan básico vence el ${trialEndsAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Inicia sesión en ${baseUrl}`;
        
        const smsResponse = await fetch(`${baseUrl}/api/notifications/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: userPhone,
            message: smsMessage,
            businessId: businessData.id,
          }),
        });

        if (!smsResponse.ok) {
          console.error('Error sending welcome SMS:', await smsResponse.text());
        } else {
          console.log('Welcome SMS sent successfully to:', userPhone);
        }
      } catch (smsError) {
        console.error('Error sending welcome SMS:', smsError);
        // No es crítico, continuamos
      }
    } else {
      console.log('SMS not sent - no phone or no consent:', { 
        hasPhone: !!userPhone, 
        hasConsent: smsConsent 
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cuenta creada exitosamente',
        data: {
          userId,
          businessId: businessData.id,
          trialEndsAt: trialEndsAt.toISOString(),
          modules,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-business-owner:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


















