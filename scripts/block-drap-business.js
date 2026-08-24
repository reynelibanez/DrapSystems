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

async function blockBusiness() {
  const businessId = 'a4a8798c-3951-4e74-91b4-d2879683bc45';
  
  console.log('🔒 Bloqueando negocio DRAP UPWARD CARE LLC...');
  
  const { data, error } = await supabase
    .from('businesses')
    .update({
      is_blocked: true,
      blocked_reason: 'SMS limit exceeded - 251 excess messages',
      blocked_at: new Date().toISOString(),
    })
    .eq('id', businessId)
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Negocio bloqueado exitosamente');
  console.log('📊 Datos actualizados:', data[0]);
}

blockBusiness();
