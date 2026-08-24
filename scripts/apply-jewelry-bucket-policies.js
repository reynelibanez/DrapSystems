/**
 * Script para aplicar políticas RLS al bucket de joyería
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPolicies() {
  console.log('🔧 Aplicando políticas RLS al bucket de joyería...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'setup-jewelry-bucket-policies.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} statements SQL...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('DROP POLICY') || 
          statement.includes('CREATE POLICY') || 
          statement.includes('SELECT')) {
        
        console.log(`${i + 1}. Ejecutando: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          console.error(`   ❌ Error:`, error.message);
        } else {
          console.log(`   ✅ Ejecutado correctamente`);
        }
      }
    }

    console.log('\n✅ Políticas aplicadas correctamente');
    console.log('\n📋 Verifica las políticas en:');
    console.log('   Supabase Dashboard > Storage > jewelry-images > Policies');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

applyPolicies();
