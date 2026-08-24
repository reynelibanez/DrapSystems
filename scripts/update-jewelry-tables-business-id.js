#!/usr/bin/env node

/**
 * Script para actualizar las tablas del módulo de joyería con business_id
 * 
 * Este script:
 * 1. Lee el archivo SQL de migración
 * 2. Lo ejecuta en Supabase
 * 3. Verifica que los cambios se aplicaron correctamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('🚀 Iniciando actualización de tablas de joyería...\n');

  // Leer el archivo SQL
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_business_id_to_jewelry_tables.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ No se encontró el archivo de migración:', sqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📄 Archivo de migración cargado');
  console.log('📏 Tamaño:', sqlContent.length, 'caracteres\n');

  try {
    // Ejecutar la migración usando rpc
    console.log('⚙️  Ejecutando migración SQL...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      console.error('❌ Error al ejecutar la migración:', error);
      
      // Si el error es que no existe la función exec_sql, dar instrucciones
      if (error.message.includes('exec_sql') || error.code === '42883') {
        console.log('\n⚠️  La función exec_sql no existe en Supabase.');
        console.log('\n📋 INSTRUCCIONES:');
        console.log('1. Ve a Supabase Dashboard > SQL Editor');
        console.log('2. Copia y pega el contenido del archivo:');
        console.log('   supabase/migrations/add_business_id_to_jewelry_tables.sql');
        console.log('3. Ejecuta el SQL directamente en el editor\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Migración ejecutada exitosamente\n');

    // Verificar los cambios
    await verifyChanges();

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
  }
}

async function verifyChanges() {
  console.log('🔍 Verificando cambios...\n');

  const tables = [
    'jwl_materias_primas',
    'jwl_joyas',
    'jwl_produccion',
    'jwl_ventas',
    'jwl_gastos_generales'
  ];

  for (const table of tables) {
    try {
      // Verificar que la columna business_id existe
      const { data, error } = await supabase
        .from(table)
        .select('business_id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Columna business_id existe`);
        
        // Contar registros
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   📊 Registros: ${count || 0}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Error inesperado - ${err.message}`);
    }
  }

  // Verificar configuración de moneda
  console.log('\n💰 Verificando configuración de moneda...');
  const { data: configData, error: configError } = await supabase
    .from('jwl_configuracion_moneda')
    .select('*, jwl_monedas(*)')
    .eq('business_id', '313b0fd7-67d8-4dfd-a878-f4a5692e6251');

  if (configError) {
    console.log('❌ Error al verificar configuración:', configError.message);
  } else if (configData && configData.length > 0) {
    console.log('✅ Configuración de moneda existe');
    console.log('   Moneda:', configData[0].jwl_monedas?.codigo || 'N/A');
  } else {
    console.log('⚠️  No se encontró configuración de moneda');
  }

  console.log('\n✨ Verificación completada\n');
}

// Ejecutar
executeMigration();
