/**
 * VALIDADOR DE SUSCRIPCIÓN Y BLOQUEOS
 * 
 * Este módulo valida el estado de la suscripción y bloqueos
 * de un negocio antes de permitir operaciones.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

export interface BusinessBlockStatus {
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  daysBlocked?: number;
  pendingChargeId?: string;
  pendingAmount?: number;
  smsExcess?: number;
  stripeInvoiceId?: string;
  canPay?: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: string;
  expiresAt?: string;
  daysRemaining?: number;
  isBlocked: boolean;
  blockStatus?: BusinessBlockStatus;
}

export interface SubscriptionValidationResult {
  isExpired: boolean;
  canAccess: boolean;
  daysRemaining: number;
  message?: string;
}

export interface UserAccessValidationResult {
  canAccess: boolean;
  reason?: string;
  maxUsers?: number;
  currentUsers?: number;
}

/**
 * Valida el estado de la suscripción de un negocio
 * Función legacy para compatibilidad con Dashboard
 */
export function validateSubscription(business: Business): SubscriptionValidationResult {
  const now = new Date();
  
  // Si tiene trial_ends_at, verificar si expiró
  if (business.trial_ends_at) {
    const trialEnd = new Date(business.trial_ends_at);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return {
        isExpired: true,
        canAccess: false,
        daysRemaining: 0,
        message: 'Trial period has expired'
      };
    }
    
    return {
      isExpired: false,
      canAccess: true,
      daysRemaining: Math.max(0, daysRemaining),
      message: daysRemaining <= 7 ? `Trial expires in ${daysRemaining} days` : undefined
    };
  }
  
  // Si tiene subscription_end_date, verificar si expiró
  if (business.subscription_end_date) {
    const subEnd = new Date(business.subscription_end_date);
    const daysRemaining = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return {
        isExpired: true,
        canAccess: false,
        daysRemaining: 0,
        message: 'Subscription has expired'
      };
    }
    
    return {
      isExpired: false,
      canAccess: true,
      daysRemaining: Math.max(0, daysRemaining),
      message: daysRemaining <= 7 ? `Subscription expires in ${daysRemaining} days` : undefined
    };
  }
  
  // Si no tiene fechas de expiración, permitir acceso
  return {
    isExpired: false,
    canAccess: true,
    daysRemaining: 999,
  };
}

/**
 * Valida si un usuario puede acceder basado en límites del plan
 * Función legacy para compatibilidad con Dashboard
 */
export async function validateUserAccess(
  userId: string,
  businessId: string,
  business: Business
): Promise<UserAccessValidationResult> {
  try {
    // Importar getPlanLimits dinámicamente para evitar problemas de importación circular
    const { getPlanLimits } = await import('./plan-limits');
    
    const limits = getPlanLimits(business.subscription_plan || 'free');
    
    // Si el plan permite usuarios ilimitados, permitir acceso
    if (limits.users === 'unlimited') {
      return { canAccess: true };
    }
    
    // Contar usuarios activos del negocio
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured, allowing access');
      return { canAccess: true };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .in('role', ['business_owner', 'staff']);
    
    if (error) {
      console.error('Error counting users:', error);
      return { canAccess: true }; // En caso de error, permitir acceso
    }
    
    const currentUsers = count || 0;
    const maxUsers = typeof limits.users === 'number' ? limits.users : 999;
    
    if (currentUsers > maxUsers) {
      return {
        canAccess: false,
        reason: `Plan limit exceeded: ${currentUsers}/${maxUsers} users`,
        maxUsers,
        currentUsers
      };
    }
    
    return {
      canAccess: true,
      maxUsers,
      currentUsers
    };
  } catch (error) {
    console.error('Error in validateUserAccess:', error);
    return { canAccess: true }; // En caso de error, permitir acceso
  }
}

/**
 * Verifica el estado de bloqueo de un negocio
 */
export async function checkBusinessBlockStatus(
  businessId: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<BusinessBlockStatus> {
  try {
    const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
    const key = supabaseKey || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(url, key);

    // Llamar a la función SQL que obtiene el estado de bloqueo
    const { data, error } = await supabase.rpc('get_business_block_status', {
      p_business_id: businessId
    });

    if (error) {
      console.error('Error checking block status:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { isBlocked: false };
    }

    const status = data[0];

    return {
      isBlocked: status.is_blocked || false,
      blockedReason: status.blocked_reason,
      blockedAt: status.blocked_at,
      daysBlocked: status.days_blocked,
      pendingChargeId: status.pending_charge_id,
      pendingAmount: status.pending_amount,
      smsExcess: status.sms_excess,
      stripeInvoiceId: status.stripe_invoice_id,
      canPay: status.can_pay
    };
  } catch (error) {
    console.error('Error in checkBusinessBlockStatus:', error);
    return { isBlocked: false };
  }
}

/**
 * Verifica el estado completo de la suscripción
 */
export async function checkSubscriptionStatus(
  businessId: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<SubscriptionStatus> {
  try {
    const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
    const key = supabaseKey || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(url, key);

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_status, trial_ends_at, is_blocked')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    // Verificar estado de bloqueo
    const blockStatus = await checkBusinessBlockStatus(businessId, supabaseUrl, supabaseKey);

    // Calcular días restantes de trial
    let daysRemaining: number | undefined;
    if (business.trial_ends_at) {
      const trialEnd = new Date(business.trial_ends_at);
      const now = new Date();
      const diff = trialEnd.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      isActive: business.subscription_status === 'active' || business.subscription_status === 'trialing',
      plan: business.subscription_plan || 'free',
      expiresAt: business.trial_ends_at,
      daysRemaining,
      isBlocked: blockStatus.isBlocked,
      blockStatus: blockStatus.isBlocked ? blockStatus : undefined
    };
  } catch (error) {
    console.error('Error in checkSubscriptionStatus:', error);
    throw error;
  }
}

/**
 * Valida si un negocio puede realizar operaciones
 * Lanza un error si está bloqueado
 */
export async function validateBusinessAccess(
  businessId: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<void> {
  const status = await checkSubscriptionStatus(businessId, supabaseUrl, supabaseKey);

  if (status.isBlocked && status.blockStatus) {
    const { blockedReason, pendingAmount, stripeInvoiceId } = status.blockStatus;
    
    throw new Error(
      JSON.stringify({
        code: 'BUSINESS_BLOCKED',
        message: blockedReason || 'Business is blocked',
        pendingAmount,
        stripeInvoiceId,
        canPay: !!stripeInvoiceId
      })
    );
  }

  if (!status.isActive) {
    throw new Error(
      JSON.stringify({
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Subscription is not active',
        plan: status.plan
      })
    );
  }
}

/**
 * Middleware helper para validar acceso en API routes
 */
export async function withBusinessAccessValidation<T>(
  businessId: string,
  operation: () => Promise<T>,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<T> {
  await validateBusinessAccess(businessId, supabaseUrl, supabaseKey);
  return await operation();
}

