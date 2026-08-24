

/**
 * API: Consultar Uso de SMS
 * 
 * GET /api/business/sms-usage?businessId=xxx
 * 
 * Retorna información sobre el uso de SMS del negocio:
 * - Uso actual
 * - Límite del plan
 * - Exceso
 * - Cargos históricos
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Business ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = locals?.runtime?.env?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || ''
        }
      }
    });

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario tenga acceso al negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos (owner o admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = business.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener estadísticas de SMS
    const { data: stats, error: statsError } = await supabase
      .rpc('get_business_sms_stats', { p_business_id: businessId });

    if (statsError) {
      console.error('Error getting SMS stats:', statsError);
      throw statsError;
    }

    const smsStats = stats && stats.length > 0 ? stats[0] : null;

    // Obtener historial de cargos
    const { data: charges, error: chargesError } = await supabase
      .from('sms_charges')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(12); // Últimos 12 meses

    if (chargesError) {
      console.error('Error getting charges:', chargesError);
    }

    // Obtener información del negocio
    const { data: businessInfo, error: infoError } = await supabase
      .from('businesses')
      .select('sms_limit, sms_used_current_month, sms_billing_period_start, sms_price_per_unit, subscription_plan')
      .eq('id', businessId)
      .single();

    if (infoError) {
      console.error('Error getting business info:', infoError);
    }

    // Verificar si el plan tiene SMS ilimitado
    const hasUnlimitedSMS = businessInfo?.subscription_plan === 'business' || businessInfo?.subscription_plan === 'enterprise';
    const smsLimit = businessInfo?.sms_limit || 0;
    const smsUsed = businessInfo?.sms_used_current_month || 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          business: {
            id: businessId,
            name: business.name,
            plan: businessInfo?.subscription_plan || 'basic'
          },
          current_period: {
            start: businessInfo?.sms_billing_period_start,
            limit: smsLimit,
            used: smsUsed,
            remaining: hasUnlimitedSMS ? 9999 : Math.max(0, smsLimit - smsUsed),
            excess: hasUnlimitedSMS ? 0 : Math.max(0, smsUsed - smsLimit),
            usage_percentage: hasUnlimitedSMS ? 0 : smsStats?.usage_percentage || 0,
            estimated_charge: hasUnlimitedSMS ? 0 : (smsStats?.estimated_charge || 0),
            price_per_sms: businessInfo?.sms_price_per_unit || 0.10
          },
          statistics: {
            total_charges: smsStats?.total_historical_charges || 0,
            charges_count: smsStats?.charges_count || 0
          },
          charges: charges || [],
          warnings: {
            near_limit: hasUnlimitedSMS ? false : (businessInfo && smsUsed >= smsLimit * 0.8),
            over_limit: hasUnlimitedSMS ? false : (businessInfo && smsUsed > smsLimit),
            will_be_charged: hasUnlimitedSMS ? false : (businessInfo && smsUsed > smsLimit)
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in SMS usage endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


