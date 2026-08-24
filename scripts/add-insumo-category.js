#!/usr/bin/env node

/**
 * Script para añadir la categoría "Insumo" al catálogo de materiales IA
 * 
 * Este script ejecuta la migración SQL que añade 15 materiales de la categoría
 * "Insumo" al catálogo de IA para todas las empresas con módulo de joyería.
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
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addInsumoCategory() {
  console.log('🚀 Añadiendo categoría "Insumo" al catálogo de materiales IA...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '../supabase/migrations/add_insumo_category.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si no existe la función exec_sql, ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando directamente...');
      
      // Dividir el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE OR REPLACE FUNCTION') || 
            statement.includes('SELECT add_insumo_category') ||
            statement.includes('DROP FUNCTION')) {
          console.log(`   Ejecutando: ${statement.substring(0, 50)}...`);
          
          const { error: execError } = await supabase.rpc('exec', { 
            query: statement + ';' 
          });
          
          if (execError) {
            console.error(`   ❌ Error: ${execError.message}`);
          } else {
            console.log('   ✅ Ejecutado');
          }
        }
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente');
    }

    // Verificar cuántos materiales de categoría "Insumo" hay ahora
    console.log('\n📊 Verificando materiales de categoría "Insumo"...');
    
    const { data: insumos, error: countError } = await supabase
      .from('jwl_catalogo_materiales')
      .select('id, nombre, business_id')
      .eq('categoria', 'Insumo');

    if (countError) {
      console.error('❌ Error al contar materiales:', countError.message);
    } else {
      console.log(`✅ Total de materiales "Insumo": ${insumos?.length || 0}`);
      
      if (insumos && insumos.length > 0) {
        console.log('\n📋 Materiales añadidos:');
        const uniqueNames = [...new Set(insumos.map(i => i.nombre))];
        uniqueNames.forEach((nombre, index) => {
          console.log(`   ${index + 1}. ${nombre}`);
        });
      }
    }

    // Verificar todas las categorías disponibles
    console.log('\n📊 Categorías disponibles en el catálogo:');
    
    const { data: categories, error: catError } = await supabase
      .from('jwl_catalogo_materiales')
      .select('categoria')
      .order('categoria');

    if (catError) {
      console.error('❌ Error al obtener categorías:', catError.message);
    } else {
      const uniqueCategories = [...new Set(categories?.map(c => c.categoria) || [])];
      uniqueCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat}`);
      });
    }

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Verifica que la categoría "Insumo" aparezca en el catálogo IA');
    console.log('   2. Verifica que aparezca en el selector de tipo al agregar materia prima');
    console.log('   3. Prueba crear una materia prima de tipo "Insumo"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
addInsumoCategory();
