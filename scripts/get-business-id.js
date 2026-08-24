/**
 * Script para obtener el business ID y generar el enlace público
 * Uso: node scripts/get-business-id.js [email]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { encryptBusinessId } from '../src/lib/encryption.ts';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getBusinessInfo(email) {
  try {
    console.log('🔍 Buscando negocios...');
    console.log('');

    let query = supabase
      .from('businesses')
      .select('id, name, owner_id, email')
      .order('created_at', { ascending: false });

    if (email) {
      // Buscar por email del owner
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, business_id')
        .eq('email', email)
        .single();

      if (profile && profile.business_id) {
        query = query.eq('id', profile.business_id);
      } else {
        console.log('⚠️ No se encontró un perfil con ese email');
        console.log('Mostrando todos los negocios...');
        console.log('');
      }
    }

    const { data: businesses, error } = await query.limit(10);

    if (error) {
      throw error;
    }

    if (!businesses || businesses.length === 0) {
      console.log('❌ No se encontraron negocios');
      return;
    }

    console.log(`✅ Se encontraron ${businesses.length} negocio(s):`);
    console.log('');

    businesses.forEach((business, index) => {
      const encryptedId = encryptBusinessId(business.id);
      
      console.log(`${index + 1}. ${business.name}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Email: ${business.email || 'N/A'}`);
      console.log(`   ID Encriptado: ${encryptedId}`);
      console.log('');
      console.log('   📱 Enlace Público (Desarrollo):');
      console.log(`   http://localhost:4321/booking/${encryptedId}`);
      console.log('');
      console.log('   🌐 Enlace Público (Producción):');
      console.log(`   https://tu-dominio.com/booking/${encryptedId}`);
      console.log('');
      console.log('   ─────────────────────────────────────────────────');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('📋 Uso:');
  console.log('  node scripts/get-business-id.js [email]');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node scripts/get-business-id.js owner@example.com');
  console.log('  node scripts/get-business-id.js  (muestra todos los negocios)');
  console.log('');
}

getBusinessInfo(email);
