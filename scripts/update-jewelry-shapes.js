/**
 * Script para actualizar las formas de los materiales a solo Lingote o Diamante
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de categorías a formas
const CATEGORY_TO_SHAPE = {
  // Metales = Lingote
  'Metales Preciosos': 'box',
  'Metales Comunes': 'box',
  'Aleaciones': 'box',
  
  // Piedras = Diamante
  'Piedras Preciosas': 'cone',
  'Piedras Semi-Preciosas': 'cone',
  
  // Otros materiales = Lingote por defecto
  'Materiales Orgánicos': 'box',
  'Materiales Sintéticos': 'box',
  'Vidrios y Cristales': 'cone', // Cristales como diamante
  'Broches y Cierres': 'box',
  'Colores': 'box',
  'Acabados': 'box',
  'Efectos Especiales': 'box',
  'Formas': 'box',
  'Tamaños': 'box'
};

async function updateShapes() {
  console.log('🔧 Actualizando formas de materiales...\n');

  try {
    // Obtener todos los materiales
    const { data: materials, error } = await supabase
      .from('jwl_catalogo_materiales')
      .select('*')
      .order('categoria', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener materiales:', error);
      return;
    }

    console.log(`📊 Total de materiales: ${materials?.length || 0}\n`);

    let updated = 0;
    let unchanged = 0;

    for (const material of materials || []) {
      const newShape = CATEGORY_TO_SHAPE[material.categoria] || 'box';
      
      if (material.forma !== newShape) {
        console.log(`🔄 ${material.nombre}`);
        console.log(`   Categoría: ${material.categoria}`);
        console.log(`   Forma anterior: ${material.forma} → Nueva: ${newShape}`);
        
        const { error: updateError } = await supabase
          .from('jwl_catalogo_materiales')
          .update({ forma: newShape })
          .eq('id', material.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar:`, updateError);
        } else {
          console.log(`   ✅ Actualizado`);
          updated++;
        }
        console.log('');
      } else {
        unchanged++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Sin cambios: ${unchanged}`);
    console.log(`   📦 Total: ${materials?.length || 0}`);

    // Mostrar distribución final
    console.log('\n📊 Distribución de formas:');
    
    const { data: lingotes, error: lingoError } = await supabase
      .from('jwl_catalogo_materiales')
      .select('*')
      .eq('forma', 'box');

    const { data: diamantes, error: diamError } = await supabase
      .from('jwl_catalogo_materiales')
      .select('*')
      .eq('forma', 'cone');

    if (!lingoError && !diamError) {
      console.log(`   📦 Lingotes (box): ${lingotes?.length || 0}`);
      console.log(`   💎 Diamantes (cone): ${diamantes?.length || 0}`);
    }

    // Mostrar ejemplos por categoría
    console.log('\n📋 Ejemplos por categoría:');
    const grouped = {};
    materials?.forEach(m => {
      if (!grouped[m.categoria]) {
        grouped[m.categoria] = [];
      }
      grouped[m.categoria].push(m);
    });

    for (const [categoria, mats] of Object.entries(grouped)) {
      const forma = CATEGORY_TO_SHAPE[categoria] || 'box';
      const formaLabel = forma === 'box' ? '📦 Lingote' : '💎 Diamante';
      console.log(`\n   ${categoria} → ${formaLabel}`);
      mats.slice(0, 3).forEach(m => {
        console.log(`      - ${m.nombre} (${m.color})`);
      });
      if (mats.length > 3) {
        console.log(`      ... y ${mats.length - 3} más`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateShapes();
