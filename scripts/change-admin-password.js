import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function changeAdminPassword() {
  try {
    console.log('🔄 Cambiando contraseña del usuario admin...\n');

    // Nueva contraseña
    const newPassword = '12355789';
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Buscar el usuario admin
    const { data: admin, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@drapsystems.com')
      .single();

    if (findError || !admin) {
      console.error('❌ Error: No se encontró el usuario admin');
      console.error(findError);
      process.exit(1);
    }

    console.log('✓ Usuario admin encontrado:', admin.email);
    console.log('  ID:', admin.id);
    console.log('  Rol:', admin.role);

    // Actualizar la contraseña
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('❌ Error al actualizar la contraseña:', updateError);
      process.exit(1);
    }

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email: admin@drapsystems.com');
    console.log('   Contraseña: 12355789');
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

changeAdminPassword();
