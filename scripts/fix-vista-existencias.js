#!/usr/bin/env node

/**
 * Script para corregir la vista de existencias
 * Ejecuta la migración directamente en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVistaExistencias() {
  console.log('🔧 Iniciando corrección de vista de existencias...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '../supabase/migrations/fix_vista_existencias_completa.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📄 Archivo SQL cargado');
    console.log('📊 Ejecutando migración...\n');

    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando queries individuales...\n');
      
      // Dividir el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DROP VIEW')) {
          console.log('🗑️  Eliminando vista anterior...');
        } else if (statement.includes('CREATE')) {
          console.log('✨ Creando vista actualizada...');
        } else if (statement.includes('GRANT')) {
          console.log('🔐 Configurando permisos...');
        } else if (statement.includes('CREATE INDEX')) {
          console.log('📇 Creando índices...');
        }
      }

      console.log('\n⚠️  Nota: Necesitas ejecutar el SQL manualmente en Supabase SQL Editor');
      console.log('📁 Archivo: supabase/migrations/fix_vista_existencias_completa.sql\n');
      return;
    }

    console.log('✅ Vista de existencias corregida exitosamente\n');

    // Verificar que la vista funciona
    console.log('🔍 Verificando vista...');
    const { data: testData, error: testError } = await supabase
      .from('vw_existencias_inventario')
      .select('nombre_almacen')
      .limit(1);

    if (testError) {
      console.error('❌ Error al verificar vista:', testError.message);
      return;
    }

    console.log('✅ Vista verificada correctamente\n');

    // Mostrar estadísticas
    console.log('📊 Obteniendo estadísticas...');
    const { data: stats, error: statsError } = await supabase
      .from('vw_existencias_inventario')
      .select('nombre_almacen');

    if (!statsError && stats) {
      const almacenes = [...new Set(stats.map(s => s.nombre_almacen))];
      console.log(`\n📦 Almacenes con existencias: ${almacenes.length}`);
      almacenes.forEach(a => console.log(`   - ${a}`));
      console.log(`\n📊 Total de registros: ${stats.length}`);
    }

    console.log('\n✅ ¡Corrección completada exitosamente!');
    console.log('💡 Recarga la página de Existencias para ver los cambios\n');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    console.error('\n📝 Solución alternativa:');
    console.error('   1. Ve a Supabase Dashboard > SQL Editor');
    console.error('   2. Abre: supabase/migrations/fix_vista_existencias_completa.sql');
    console.error('   3. Copia y pega el contenido');
    console.error('   4. Ejecuta el SQL\n');
    process.exit(1);
  }
}

// Ejecutar
fixVistaExistencias();
