
/**
 * API Endpoint: Obtener Estadísticas de Uso de SMS
 * 
 * GET /api/business/sms-stats?businessId=xxx
 * 
 * Retorna:
 * - Uso actual de SMS
 * - Límite del plan
 * - SMS excedentes
 * - Cargo estimado
 * - Historial de cargos
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
      .select('id, owner_id')
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

    // Obtener estadísticas usando la función de Supabase
    const { data: stats, error: statsError } = await supabase
      .rpc('get_business_sms_stats', {
        p_business_id: businessId
      })
      .single();

    if (statsError) {
      console.error('Error getting SMS stats:', statsError);
      throw statsError;
    }

    // Obtener historial de cargos
    const { data: charges, error: chargesError } = await supabase
      .from('sms_charges')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (chargesError) {
      console.error('Error getting SMS charges:', chargesError);
    }

    // Obtener información del plan
    const { data: businessInfo, error: infoError } = await supabase
      .from('businesses')
      .select('subscription_plan, sms_price_per_unit, sms_billing_period_start')
      .eq('id', businessId)
      .single();

    if (infoError) {
      console.error('Error getting business info:', infoError);
    }

    // Calcular días restantes en el período
    let daysRemaining = 0;
    if (businessInfo?.sms_billing_period_start) {
      const periodStart = new Date(businessInfo.sms_billing_period_start);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const now = new Date();
      const diffTime = periodEnd.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          currentUsage: stats?.current_usage || 0,
          limit: stats?.limit_amount || 0,
          excess: stats?.excess_amount || 0,
          usagePercentage: stats?.usage_percentage || 0,
          estimatedCharge: stats?.estimated_charge || 0,
          totalHistoricalCharges: stats?.total_historical_charges || 0,
          chargesCount: stats?.charges_count || 0,
          currentPeriodStart: stats?.current_period_start,
          daysRemaining,
          pricePerSMS: businessInfo?.sms_price_per_unit || 0.10,
          plan: businessInfo?.subscription_plan || 'basic',
          isUnlimited: (stats?.limit_amount || 0) >= 9999
        },
        charges: charges || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in SMS stats endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

