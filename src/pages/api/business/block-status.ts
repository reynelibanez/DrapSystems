

/**
 * API: Verificar Estado de Bloqueo del Negocio
 * 
 * GET /api/business/block-status?businessId=xxx
 * 
 * Retorna el estado de bloqueo de un negocio
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');

    console.log('🔍 [block-status] Checking block status for business:', businessId);

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Business ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos del negocio directamente
    const { data: business, error } = await supabase
      .from('businesses')
      .select('is_blocked, sms_used_current_month, sms_limit, sms_price_per_unit, updated_at')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('❌ Error getting business:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get business', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!business) {
      console.log('⚠️ Business not found');
      return new Response(
        JSON.stringify({ 
          isBlocked: false 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Business data:', {
      is_blocked: business.is_blocked,
      sms_used: business.sms_used_current_month,
      sms_limit: business.sms_limit,
      price_per_sms: business.sms_price_per_unit,
    });

    // Calcular SMS excedidos
    const smsExcess = Math.max(0, (business.sms_used_current_month || 0) - (business.sms_limit || 0));
    const pendingAmount = smsExcess * (business.sms_price_per_unit || 0.05);
    const isBlocked = business.is_blocked === true;

    console.log('💰 Calculated:', {
      smsExcess,
      pendingAmount,
      isBlocked,
    });

    // Calcular días bloqueado
    let daysBlocked = 0;
    if (isBlocked && business.updated_at) {
      const blockedDate = new Date(business.updated_at);
      const now = new Date();
      daysBlocked = Math.floor((now.getTime() - blockedDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const response = {
      isBlocked,
      blockedReason: isBlocked ? `You have ${smsExcess} excess SMS messages that need to be paid` : undefined,
      blockedAt: isBlocked ? business.updated_at : undefined,
      ...(isBlocked && daysBlocked > 0 && { daysBlocked }), // Solo incluir si es mayor a 0
      pendingAmount: isBlocked ? pendingAmount : 0,
      smsExcess: isBlocked ? smsExcess : 0,
      canPay: isBlocked && smsExcess > 0,
    };

    console.log('✅ Returning block status:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in block-status endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



