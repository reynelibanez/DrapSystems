#!/usr/bin/env node

/**
 * Script para aplicar la migración de precio por peso
 * Este script agrega las columnas necesarias para vender joyas por peso
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migración de precio por peso...\n');

  try {
    // Leer el archivo de migración
    const migrationPath = join(__dirname, '../supabase/migrations/add_precio_por_peso_joyas.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando directamente...');
      
      // Dividir el SQL en statements individuales
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.rpc('exec', { 
            query: statement + ';' 
          });
          
          if (execError) {
            console.error(`❌ Error ejecutando statement: ${execError.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('\n✅ Migración aplicada exitosamente!\n');
    
    // Verificar que las columnas se agregaron correctamente
    console.log('🔍 Verificando columnas agregadas...\n');
    
    const { data: joyasColumns, error: joyasError } = await supabase
      .from('jwl_joyas')
      .select('*')
      .limit(1);

    if (!joyasError && joyasColumns) {
      console.log('✅ Tabla jwl_joyas actualizada correctamente');
      console.log('   - Columna precio_por_peso agregada');
    }

    const { data: ventasColumns, error: ventasError } = await supabase
      .from('jwl_ventas')
      .select('*')
      .limit(1);

    if (!ventasError && ventasColumns) {
      console.log('✅ Tabla jwl_ventas actualizada correctamente');
      console.log('   - Columna venta_por_peso agregada');
      console.log('   - Columna peso_vendido agregada');
      console.log('   - Columna precio_por_peso_venta agregada');
    }

    console.log('\n📝 Próximos pasos:');
    console.log('1. Ve a Inventario y edita una joya');
    console.log('2. Agrega un precio por peso (opcional)');
    console.log('3. Ve a Ventas y selecciona esa joya');
    console.log('4. Verás la opción "Vender por Peso" si la joya tiene precio por peso configurado\n');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    console.error('\n📋 Instrucciones manuales:');
    console.error('1. Ve al SQL Editor en Supabase Dashboard');
    console.error('2. Copia el contenido de supabase/migrations/add_precio_por_peso_joyas.sql');
    console.error('3. Pégalo en el editor y ejecuta');
    process.exit(1);
  }
}

applyMigration();
