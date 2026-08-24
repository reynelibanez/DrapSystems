/**
 * Servicio para gestionar números de Twilio con límite de SMS
 * Cada número tiene un límite de 75 SMS
 */

import { createClient } from '@supabase/supabase-js';

export interface TwilioNumber {
  id: string;
  phone_number: string;
  display_name: string | null;
  sms_sent_count: number;
  sms_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface TwilioNumberStatus extends TwilioNumber {
  usage_percentage: number;
  remaining_sms: number;
  status: 'OK' | 'CAUTION' | 'WARNING' | 'LIMIT_REACHED';
}

/**
 * Crea un cliente de Supabase con las credenciales proporcionadas
 */
function createSupabaseClient(supabaseUrl?: string, supabaseServiceKey?: string) {
  const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
  const key = supabaseServiceKey || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('⚠️ Twilio numbers service not configured (missing Supabase credentials)');
    console.warn('   URL provided:', !!supabaseUrl, 'env:', !!import.meta.env.PUBLIC_SUPABASE_URL);
    console.warn('   Key provided:', !!supabaseServiceKey, 'env:', !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY);
    return null;
  }

  return createClient(url, key);
}

/**
 * Obtiene el siguiente número disponible para enviar SMS
 * Selecciona el número con menos SMS enviados que no haya alcanzado el límite
 */
export async function getNextAvailableNumber(
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<TwilioNumber | null> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return null;
  }

  try {
    console.log('🔍 Llamando a RPC get_next_available_twilio_number...');
    
    const { data, error } = await supabase
      .rpc('get_next_available_twilio_number')
      .single();

    if (error) {
      console.error('❌ Error getting next available Twilio number:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      return null;
    }

    if (!data) {
      console.warn('⚠️ No available Twilio numbers found. All numbers may have reached their limit.');
      return null;
    }

    console.log('✅ Número disponible encontrado:', data.phone_number);
    return data as TwilioNumber;
  } catch (error) {
    console.error('❌ Exception getting next available Twilio number:', error);
    return null;
  }
}

/**
 * Incrementa el contador de SMS para un número específico
 */
export async function incrementSmsCount(
  numberId: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<boolean> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return false;
  }

  try {
    const { error } = await supabase
      .rpc('increment_sms_count', { number_id: numberId });

    if (error) {
      console.error('Error incrementing SMS count:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception incrementing SMS count:', error);
    return false;
  }
}

/**
 * Obtiene todos los números de Twilio con su estado
 */
export async function getAllTwilioNumbers(
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<TwilioNumberStatus[]> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('twilio_numbers_status')
      .select('*')
      .order('sms_sent_count', { ascending: false });

    if (error) {
      console.error('Error getting Twilio numbers status:', error);
      return [];
    }

    return data as TwilioNumberStatus[];
  } catch (error) {
    console.error('Exception getting Twilio numbers status:', error);
    return [];
  }
}

/**
 * Agrega un nuevo número de Twilio
 */
export async function addTwilioNumber(
  phoneNumber: string,
  displayName?: string,
  smsLimit: number = 75,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<TwilioNumber | null> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('twilio_numbers')
      .insert({
        phone_number: phoneNumber,
        display_name: displayName,
        sms_limit: smsLimit,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding Twilio number:', error);
      return null;
    }

    return data as TwilioNumber;
  } catch (error) {
    console.error('Exception adding Twilio number:', error);
    return null;
  }
}

/**
 * Actualiza un número de Twilio
 */
export async function updateTwilioNumber(
  numberId: string,
  updates: Partial<Omit<TwilioNumber, 'id' | 'created_at' | 'updated_at'>>,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<boolean> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return false;
  }

  try {
    const { error } = await supabase
      .from('twilio_numbers')
      .update(updates)
      .eq('id', numberId);

    if (error) {
      console.error('Error updating Twilio number:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating Twilio number:', error);
    return false;
  }
}

/**
 * Desactiva un número de Twilio (no lo elimina)
 */
export async function deactivateTwilioNumber(
  numberId: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<boolean> {
  return updateTwilioNumber(numberId, { is_active: false }, supabaseUrl, supabaseServiceKey);
}

/**
 * Activa un número de Twilio
 */
export async function activateTwilioNumber(
  numberId: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<boolean> {
  return updateTwilioNumber(numberId, { is_active: true }, supabaseUrl, supabaseServiceKey);
}

/**
 * Resetea los contadores de SMS de todos los números
 * Útil para ejecutar mensualmente
 */
export async function resetAllSmsCounters(
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<number> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return 0;
  }

  try {
    const { data, error } = await supabase
      .rpc('reset_twilio_sms_counts');

    if (error) {
      console.error('Error resetting SMS counters:', error);
      return 0;
    }

    return data as number;
  } catch (error) {
    console.error('Exception resetting SMS counters:', error);
    return 0;
  }
}

/**
 * Verifica si hay números disponibles para enviar SMS
 */
export async function hasAvailableNumbers(
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<boolean> {
  const number = await getNextAvailableNumber(supabaseUrl, supabaseServiceKey);
  return number !== null;
}

/**
 * Obtiene estadísticas generales de uso de números
 */
export async function getTwilioNumbersStats(
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<{
  total: number;
  active: number;
  available: number;
  limitReached: number;
  totalSmsSent: number;
  totalSmsRemaining: number;
}> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  
  if (!supabase) {
    console.warn('Twilio numbers service not available');
    return {
      total: 0,
      active: 0,
      available: 0,
      limitReached: 0,
      totalSmsSent: 0,
      totalSmsRemaining: 0,
    };
  }

  try {
    const numbers = await getAllTwilioNumbers(supabaseUrl, supabaseServiceKey);

    const stats = {
      total: numbers.length,
      active: numbers.filter(n => n.is_active).length,
      available: numbers.filter(n => n.is_active && n.sms_sent_count < n.sms_limit).length,
      limitReached: numbers.filter(n => n.sms_sent_count >= n.sms_limit).length,
      totalSmsSent: numbers.reduce((sum, n) => sum + n.sms_sent_count, 0),
      totalSmsRemaining: numbers.reduce((sum, n) => sum + n.remaining_sms, 0),
    };

    return stats;
  } catch (error) {
    console.error('Exception getting Twilio numbers stats:', error);
    return {
      total: 0,
      active: 0,
      available: 0,
      limitReached: 0,
      totalSmsSent: 0,
      totalSmsRemaining: 0,
    };
  }
}

export default {
  getNextAvailableNumber,
  incrementSmsCount,
  getAllTwilioNumbers,
  addTwilioNumber,
  updateTwilioNumber,
  deactivateTwilioNumber,
  activateTwilioNumber,
  resetAllSmsCounters,
  hasAvailableNumbers,
  getTwilioNumbersStats,
};









