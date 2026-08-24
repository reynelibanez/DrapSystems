import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateMSIBusiness() {
  const businessId = '0f2c51a8-1533-4582-981c-47a6d76454f7';
  
  console.log('🔍 Actualizando empresa MSI LLC...');
  console.log('Business ID:', businessId);
  
  // Obtener la empresa actual
  const { data: currentBusiness, error: fetchError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();
  
  if (fetchError) {
    console.error('❌ Error al obtener la empresa:', fetchError);
    return;
  }
  
  console.log('\n📊 Estado actual:');
  console.log('- Plan:', currentBusiness.subscription_plan);
  console.log('- Status:', currentBusiness.subscription_status);
  console.log('- Trial ends at:', currentBusiness.trial_ends_at);
  console.log('- Subscription end date:', currentBusiness.subscription_end_date);
  console.log('- Settings:', JSON.stringify(currentBusiness.settings, null, 2));
  
  // Calcular nueva fecha de fin (30 días desde ahora)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  
  // Obtener settings actuales y agregar billing_period
  const currentSettings = currentBusiness.settings || {};
  const updatedSettings = {
    ...currentSettings,
    billing_period: 'month'
  };
  
  console.log('\n🔄 Aplicando cambios:');
  console.log('- Estableciendo trial_ends_at:', trialEndsAt.toISOString());
  console.log('- Estableciendo subscription_end_date:', trialEndsAt.toISOString());
  console.log('- Agregando billing_period: month');
  
  // Actualizar la empresa
  const { data: updatedBusiness, error: updateError } = await supabase
    .from('businesses')
    .update({
      trial_ends_at: trialEndsAt.toISOString(),
      subscription_end_date: trialEndsAt.toISOString(),
      settings: updatedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Error al actualizar la empresa:', updateError);
    return;
  }
  
  console.log('\n✅ Empresa actualizada exitosamente!');
  console.log('\n📊 Nuevo estado:');
  console.log('- Plan:', updatedBusiness.subscription_plan);
  console.log('- Status:', updatedBusiness.subscription_status);
  console.log('- Trial ends at:', updatedBusiness.trial_ends_at);
  console.log('- Subscription end date:', updatedBusiness.subscription_end_date);
  console.log('- Billing period:', updatedBusiness.settings?.billing_period);
  console.log('- Settings:', JSON.stringify(updatedBusiness.settings, null, 2));
  
  // Calcular días restantes
  const now = new Date();
  const endDate = new Date(updatedBusiness.subscription_end_date);
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  console.log('\n⏰ Días restantes de trial:', daysRemaining);
}

updateMSIBusiness().catch(console.error);
