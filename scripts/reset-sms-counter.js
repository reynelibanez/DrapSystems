
/**
 * Script para resetear el contador de SMS de un negocio
 * 
 * Uso: node scripts/reset-sms-counter.js [businessId]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetSMSCounter(businessId) {
  try {
    if (!businessId) {
      console.log('❌ Error: Debes proporcionar un businessId');
      console.log('Uso: node scripts/reset-sms-counter.js [businessId]\n');
      
      // Mostrar negocios disponibles
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, sms_used_current_month')
        .order('name');

      if (businesses && businesses.length > 0) {
        console.log('📋 Negocios disponibles:\n');
        businesses.forEach((business) => {
          console.log(`ID: ${business.id}`);
          console.log(`Nombre: ${business.name}`);
          console.log(`SMS enviados: ${business.sms_used_current_month || 0}\n`);
        });
      }
      return;
    }

    console.log('🔍 Buscando negocio...\n');

    // Obtener el negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, subscription_plan, sms_used_current_month, sms_limit')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      console.log('❌ No se encontró el negocio con ID:', businessId);
      return;
    }

    console.log(`📊 Negocio: ${business.name}`);
    console.log(`   Plan: ${business.subscription_plan}`);
    console.log(`   SMS enviados actualmente: ${business.sms_used_current_month || 0}`);
    console.log(`   Límite: ${business.sms_limit || 0}\n`);

    // Resetear contador
    console.log('🔄 Reseteando contador de SMS...\n');

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        sms_used_current_month: 0
      })
      .eq('id', businessId);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Contador reseteado exitosamente!');
    console.log('   SMS enviados: 0\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Obtener businessId de los argumentos
const businessId = process.argv[2];
resetSMSCounter(businessId);

