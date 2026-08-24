import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  console.log('📊 [sms-usage] Endpoint llamado');
  
  try {
    // Obtener credenciales de Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'businessId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Parámetros:', { businessId, year, month });

    // Obtener detalles del negocio con contadores reales
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, subscription_plan, subscription_status, sms_used_current_month, sms_limit, sms_price_per_unit')
      .eq('id', businessId)
      .single();

    if (businessError) {
      console.error('❌ Error obteniendo negocio:', businessError);
      return new Response(
        JSON.stringify({ error: 'Failed to get business details', details: businessError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Datos del negocio:', {
      name: business.name,
      plan: business.subscription_plan,
      sms_used: business.sms_used_current_month,
      sms_limit: business.sms_limit,
      price_per_unit: business.sms_price_per_unit
    });

    // Calcular límites según el plan
    let includedSms = 0;
    let costPerSms = 0;

    switch (business.subscription_plan) {
      case 'business':
        includedSms = 1500;
        costPerSms = 0.05;
        break;
      case 'enterprise':
        includedSms = 4500;
        costPerSms = 0.035;
        break;
      default:
        includedSms = 0;
        costPerSms = 0;
    }

    // Usar los valores de la tabla businesses
    const smsUsed = business.sms_used_current_month || 0;
    const smsLimit = business.sms_limit || includedSms;
    const pricePerUnit = business.sms_price_per_unit || costPerSms;

    // Calcular excedentes
    const exceeded = Math.max(0, smsUsed - smsLimit);
    const totalCost = exceeded * pricePerUnit;

    console.log('💰 Cálculos:', {
      smsUsed,
      smsLimit,
      exceeded,
      pricePerUnit,
      totalCost
    });

    // Obtener historial detallado de SMS del mes
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59);

    console.log('📅 Rango de fechas:', {
      firstDay: firstDay.toISOString(),
      lastDay: lastDay.toISOString()
    });

    const { data: smsHistory, error: historyError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        status,
        recipient,
        message,
        sent_at,
        delivered_at,
        created_at,
        appointment_id,
        client_id,
        clients:client_id (
          full_name,
          email
        )
      `)
      .eq('business_id', businessId)
      .eq('type', 'sms')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
    } else {
      console.log(`📊 Historial obtenido: ${smsHistory?.length || 0} registros`);
    }

    // Contar estados del historial (solo para mostrar en el reporte)
    const totalDelivered = smsHistory?.filter(sms => 
      sms.status === 'sent' || sms.status === 'delivered'
    ).length || 0;
    
    const totalFailed = smsHistory?.filter(sms => 
      sms.status === 'failed'
    ).length || 0;

    console.log('✅ Datos obtenidos exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        business: {
          name: business.name,
          plan: business.subscription_plan,
          status: business.subscription_status
        },
        period: {
          year,
          month,
          firstDay: firstDay.toISOString(),
          lastDay: lastDay.toISOString()
        },
        usage: {
          total_sent: smsUsed,  // Usar el contador real de businesses
          total_delivered: totalDelivered,  // Del historial
          total_failed: totalFailed  // Del historial
        },
        overage: {
          plan_name: business.subscription_plan,
          included_sms: smsLimit,
          total_sent: smsUsed,
          exceeded: exceeded,
          cost_per_sms: pricePerUnit,
          total_cost: totalCost
        },
        history: smsHistory || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error en sms-usage:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


