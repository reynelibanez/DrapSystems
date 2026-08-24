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

async function findAndChangeAdmin() {
  try {
    console.log('🔍 Buscando usuarios admin...\n');

    // Buscar todos los usuarios con rol admin
    const { data: admins, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (findError) {
      console.error('❌ Error al buscar admins:', findError);
      process.exit(1);
    }

    console.log(`✓ Encontrados ${admins?.length || 0} usuarios admin:\n`);
    
    if (!admins || admins.length === 0) {
      console.log('❌ No se encontraron usuarios admin');
      console.log('\n🔍 Buscando todos los usuarios...');
      
      const { data: allUsers, error: allError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .limit(10);
      
      if (allUsers) {
        console.log('\nUsuarios encontrados:');
        allUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.role}) - ${u.full_name || 'Sin nombre'}`);
        });
      }
      process.exit(1);
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Nombre: ${admin.full_name || 'Sin nombre'}`);
      console.log(`   Rol: ${admin.role}`);
      console.log('');
    });

    // Cambiar contraseña del primer admin encontrado
    const admin = admins[0];
    const newPassword = '12355789';
    
    console.log(`🔄 Cambiando contraseña de: ${admin.email}\n`);
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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

    console.log('✅ Contraseña actualizada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log(`   Email: ${admin.email}`);
    console.log('   Contraseña: 12355789');
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAndChangeAdmin();
