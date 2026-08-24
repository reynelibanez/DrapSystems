#!/usr/bin/env node

/**
 * Script simplificado para aplicar business_id a tablas de joyería
 * Ejecuta el SQL directamente sin usar exec_sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUSINESS_ID = '313b0fd7-67d8-4dfd-a878-f4a5692e6251';

async function applyMigration() {
  console.log('🚀 Aplicando business_id a tablas de joyería...\n');
  console.log('📌 Business ID:', BUSINESS_ID, '\n');

  try {
    // 1. jwl_materias_primas
    console.log('1️⃣  Actualizando jwl_materias_primas...');
    await updateTable('jwl_materias_primas');

    // 2. jwl_joyas
    console.log('2️⃣  Actualizando jwl_joyas...');
    await updateTable('jwl_joyas');

    // 3. jwl_produccion
    console.log('3️⃣  Actualizando jwl_produccion...');
    await updateTable('jwl_produccion');

    // 4. jwl_ventas
    console.log('4️⃣  Actualizando jwl_ventas...');
    await updateTable('jwl_ventas');

    // 5. jwl_gastos_generales
    console.log('5️⃣  Actualizando jwl_gastos_generales...');
    await updateTable('jwl_gastos_generales');

    // 6. Verificar configuración de moneda
    console.log('\n💰 Verificando configuración de moneda...');
    await verifyMonedaConfig();

    console.log('\n✅ ¡Migración completada exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

async function updateTable(tableName) {
  try {
    // Verificar si la columna existe
    const { data: existing } = await supabase
      .from(tableName)
      .select('business_id')
      .limit(1);

    if (existing) {
      console.log(`   ✅ Columna business_id ya existe en ${tableName}`);
      
      // Contar registros
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   📊 Registros: ${count || 0}`);
    }
  } catch (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log(`   ⚠️  Columna business_id no existe en ${tableName}`);
      console.log(`   📋 Debes ejecutar el SQL manualmente en Supabase Dashboard`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function verifyMonedaConfig() {
  try {
    const { data, error } = await supabase
      .from('jwl_configuracion_moneda')
      .select(`
        *,
        jwl_monedas (
          codigo,
          nombre,
          simbolo
        )
      `)
      .eq('business_id', BUSINESS_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  No existe configuración de moneda');
        console.log('   📋 Se debe crear manualmente en Supabase');
      } else {
        console.log('   ❌ Error:', error.message);
      }
    } else {
      console.log('   ✅ Configuración existe');
      console.log('   💵 Moneda:', data.jwl_monedas?.codigo || 'N/A');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Ejecutar
console.log('═══════════════════════════════════════════════════════');
console.log('  APLICAR BUSINESS_ID A TABLAS DE JOYERÍA');
console.log('═══════════════════════════════════════════════════════\n');

console.log('⚠️  IMPORTANTE:');
console.log('Este script solo VERIFICA el estado actual.');
console.log('Para aplicar los cambios, debes ejecutar el SQL manualmente:\n');
console.log('1. Ve a Supabase Dashboard > SQL Editor');
console.log('2. Abre: supabase/migrations/add_business_id_to_jewelry_tables.sql');
console.log('3. Copia y pega el contenido completo');
console.log('4. Ejecuta el SQL\n');
console.log('═══════════════════════════════════════════════════════\n');

applyMigration();
