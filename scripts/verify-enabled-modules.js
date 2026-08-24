import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyEnabledModules() {
  console.log('🔍 Verificando módulos habilitados después de la migración...\n');

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, enabled_modules, subscription_plan')
    .order('name');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total de empresas: ${businesses.length}\n`);

  const stats = {
    appointments: 0,
    services: 0,
    jewelry: 0,
    total: businesses.length
  };

  console.log('📋 Detalle por empresa:\n');
  businesses.forEach(b => {
    const modules = b.enabled_modules || [];
    const modulesStr = modules.length > 0 ? modules.join(', ') : 'ninguno';
    
    console.log(`  ${b.name}`);
    console.log(`    Plan: ${b.subscription_plan || 'sin plan'}`);
    console.log(`    Módulos: ${modulesStr}\n`);

    if (modules.includes('appointments')) stats.appointments++;
    if (modules.includes('services')) stats.services++;
    if (modules.includes('jewelry')) stats.jewelry++;
  });

  console.log('\n📈 Estadísticas de Adopción:\n');
  console.log(`  📅 Citas: ${stats.appointments}/${stats.total} (${Math.round((stats.appointments / stats.total) * 100)}%)`);
  console.log(`  💼 Servicios: ${stats.services}/${stats.total} (${Math.round((stats.services / stats.total) * 100)}%)`);
  console.log(`  💎 Joyería: ${stats.jewelry}/${stats.total} (${Math.round((stats.jewelry / stats.total) * 100)}%)`);

  console.log('\n✅ Verificación completada!');
}

verifyEnabledModules();
