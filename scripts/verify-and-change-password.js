import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAndChangePassword() {
  try {
    const email = 'reynelibanez@gmail.com';
    const newPassword = '12355789';
    
    console.log('🔍 Verificando usuario actual...\n');

    // Buscar el usuario
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error('❌ Error al buscar usuario:', findError);
      process.exit(1);
    }

    console.log('✓ Usuario encontrado:');
    console.log('  Email:', user.email);
    console.log('  ID:', user.id);
    console.log('  Rol:', user.role);
    console.log('  Password actual (hash):', user.password ? user.password.substring(0, 20) + '...' : 'NO TIENE');
    
    // Verificar si la contraseña actual es la que queremos
    if (user.password) {
      const isCurrentPassword = await bcrypt.compare(newPassword, user.password);
      console.log('  ¿Ya tiene la contraseña 12355789?:', isCurrentPassword ? 'SÍ' : 'NO');
      
      if (isCurrentPassword) {
        console.log('\n✅ La contraseña ya es 12355789');
        console.log('\n📋 Credenciales:');
        console.log('   Email:', email);
        console.log('   Contraseña: 12355789');
        return;
      }
    }
    
    console.log('\n🔄 Generando nuevo hash...');
    
    // Generar nuevo hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✓ Hash generado:', hashedPassword.substring(0, 20) + '...');
    
    console.log('\n🔄 Actualizando contraseña en la base de datos...');
    
    // Actualizar con RPC para evitar problemas de RLS
    const { data: updateData, error: updateError } = await supabase.rpc('update_user_password', {
      user_id: user.id,
      new_password: hashedPassword
    });

    if (updateError) {
      console.log('⚠️  RPC no disponible, intentando UPDATE directo...');
      
      // Intentar UPDATE directo
      const { error: directError } = await supabase
        .from('profiles')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (directError) {
        console.error('❌ Error en UPDATE directo:', directError);
        process.exit(1);
      }
    }

    console.log('✓ Contraseña actualizada en la base de datos');
    
    // Verificar que se actualizó
    console.log('\n🔍 Verificando actualización...');
    const { data: updatedUser, error: verifyError } = await supabase
      .from('profiles')
      .select('password')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Error al verificar:', verifyError);
      process.exit(1);
    }

    console.log('✓ Password en BD:', updatedUser.password.substring(0, 20) + '...');
    
    // Verificar que el hash funciona
    const passwordWorks = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('✓ ¿La contraseña funciona?:', passwordWorks ? 'SÍ ✅' : 'NO ❌');

    if (passwordWorks) {
      console.log('\n✅ ¡CONTRASEÑA CAMBIADA EXITOSAMENTE!');
      console.log('\n📋 Credenciales de acceso:');
      console.log('   Email:', email);
      console.log('   Contraseña: 12355789');
    } else {
      console.log('\n❌ ERROR: La contraseña no funciona después de actualizar');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAndChangePassword();
