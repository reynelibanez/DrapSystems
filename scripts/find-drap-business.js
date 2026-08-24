import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findDrapBusiness() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .ilike('name', '%DRAP%');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No se encontró el negocio DRAP UPWARD CARE LLC');
    return;
  }

  console.log('📋 Negocio encontrado:\n');
  data.forEach((b) => {
    const excess = Math.max(0, (b.sms_used_current_month || 0) - (b.sms_limit || 0));
    console.log(`Nombre: ${b.name}`);
    console.log(`ID: ${b.id}`);
    console.log(`Plan: ${b.subscription_plan}`);
    console.log(`Bloqueado: ${b.is_blocked ? 'SÍ' : 'NO'}`);
    console.log(`SMS usados: ${b.sms_used_current_month || 0}`);
    console.log(`SMS límite: ${b.sms_limit || 0}`);
    console.log(`SMS excedidos: ${excess}`);
    console.log(`Precio por SMS: $${b.sms_price_per_unit || 0}`);
    console.log(`Stripe Customer ID: ${b.stripe_customer_id || 'No configurado'}`);
    console.log('');
  });
}

findDrapBusiness();
