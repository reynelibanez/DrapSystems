/**
 * Script para agregar la columna object_3d_id a jwl_materias_primas
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
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addObjectIdColumn() {
  console.log('🚀 Agregando columna object_3d_id a jwl_materias_primas...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '../supabase/migrations/add_object_3d_id_to_materias_primas.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si no existe la función exec_sql, intentar con query directo
      console.log('⚠️  Función exec_sql no disponible, ejecutando directamente...');
      
      const { error: directError } = await supabase
        .from('jwl_materias_primas')
        .select('object_3d_id')
        .limit(1);

      if (directError && directError.message.includes('column')) {
        console.log('\n⚠️  La columna no existe. Por favor ejecuta este SQL en Supabase SQL Editor:');
        console.log('\n' + '='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80) + '\n');
        console.log('📋 Pasos:');
        console.log('1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/sql');
        console.log('2. Copia y pega el SQL de arriba');
        console.log('3. Haz clic en "Run"');
        console.log('4. Vuelve a ejecutar este script para verificar\n');
        process.exit(1);
      } else {
        console.log('✅ La columna object_3d_id ya existe!');
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente!');
    }

    // Verificar que la columna existe
    console.log('\n🔍 Verificando columna...');
    const { data: testData, error: testError } = await supabase
      .from('jwl_materias_primas')
      .select('id, nombre, object_3d_id')
      .limit(1);

    if (testError) {
      console.error('❌ Error al verificar:', testError.message);
      process.exit(1);
    }

    console.log('✅ Columna object_3d_id verificada correctamente!');
    console.log('\n✨ Migración completada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addObjectIdColumn();
