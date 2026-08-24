import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBillingDetection() {
  console.log('🔍 VERIFICANDO DETECCIÓN DE BILLING EN TODAS LAS EMPRESAS');
  console.log('='.repeat(80));
  
  // Obtener todas las empresas activas
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('subscription_status', 'active')
    .not('subscription_end_date', 'is', null)
    .order('subscription_end_date', { ascending: false });
  
  if (error) {
    console.error('❌ Error al obtener empresas:', error);
    return;
  }
  
  console.log(`\n📊 Total de empresas activas: ${businesses.length}\n`);
  
  let correctCount = 0;
  let incorrectCount = 0;
  const incorrectBusinesses = [];
  
  for (const business of businesses) {
    const endDate = new Date(business.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Detectar billing correcto
    const detectedBilling = daysRemaining > 40 ? 'year' : 'month';
    const savedBilling = business.settings?.billing_period;
    const isCorrect = savedBilling === detectedBilling;
    
    const status = isCorrect ? '✅' : '❌';
    const billingLabel = detectedBilling === 'year' ? 'ANUAL' : 'MENSUAL';
    
    console.log(`${status} ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Plan: ${business.subscription_plan}`);
    console.log(`   Días restantes: ${daysRemaining}`);
    console.log(`   Billing detectado: ${detectedBilling.toUpperCase()} (${billingLabel})`);
    console.log(`   Billing guardado: ${savedBilling || 'NO DEFINIDO'}`);
    
    if (isCorrect) {
      console.log(`   Estado: ✅ CORRECTO`);
      correctCount++;
    } else {
      console.log(`   Estado: ❌ INCORRECTO - Debe ser ${detectedBilling.toUpperCase()}`);
      incorrectCount++;
      incorrectBusinesses.push({
        id: business.id,
        name: business.name,
        daysRemaining,
        detectedBilling,
        savedBilling
      });
    }
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('\n📈 RESUMEN:');
  console.log(`✅ Empresas correctas: ${correctCount}`);
  console.log(`❌ Empresas incorrectas: ${incorrectCount}`);
  console.log(`📊 Total: ${businesses.length}`);
  
  if (incorrectCount > 0) {
    console.log('\n⚠️ EMPRESAS QUE NECESITAN CORRECCIÓN:');
    console.log('='.repeat(80));
    
    for (const biz of incorrectBusinesses) {
      console.log(`\n❌ ${biz.name}`);
      console.log(`   ID: ${biz.id}`);
      console.log(`   Días restantes: ${biz.daysRemaining}`);
      console.log(`   Debe ser: ${biz.detectedBilling.toUpperCase()}`);
      console.log(`   Actualmente: ${biz.savedBilling || 'NO DEFINIDO'}`);
      console.log(`\n   SQL para corregir:`);
      console.log(`   UPDATE businesses`);
      console.log(`   SET settings = jsonb_set(`);
      console.log(`     COALESCE(settings, '{}'::jsonb),`);
      console.log(`     '{billing_period}',`);
      console.log(`     '"${biz.detectedBilling}"'::jsonb`);
      console.log(`   )`);
      console.log(`   WHERE id = '${biz.id}';`);
    }
    
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Ejecuta el script FIX_ALL_BILLING_PERIODS.sql en Supabase para corregir todas las empresas de una vez.');
  } else {
    console.log('\n🎉 ¡Todas las empresas tienen el billing correcto!');
  }
  
  console.log('\n' + '='.repeat(80));
}

verifyBillingDetection().catch(console.error);
