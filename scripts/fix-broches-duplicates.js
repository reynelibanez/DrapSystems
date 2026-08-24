/**
 * Script para limpiar duplicados de broches y corregir categorías
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

async function fixBrochesDuplicates() {
  console.log('🔧 Limpiando duplicados de broches...\n');

  try {
    // 1. Obtener todos los materiales de broche
    const { data: allBroches, error } = await supabase
      .from('jwl_catalogo_materiales')
      .select('*')
      .or('nombre.ilike.%broche%,palabras_clave.cs.{broche}')
      .order('created_at');

    if (error) {
      console.error('❌ Error al obtener materiales:', error);
      return;
    }

    console.log(`📊 Total de materiales encontrados: ${allBroches?.length || 0}\n`);

    // 2. Agrupar por nombre
    const grouped = {};
    allBroches?.forEach(material => {
      if (!grouped[material.nombre]) {
        grouped[material.nombre] = [];
      }
      grouped[material.nombre].push(material);
    });

    // 3. Para cada grupo, mantener solo el primero (más antiguo) y eliminar duplicados
    for (const [nombre, materials] of Object.entries(grouped)) {
      if (materials.length > 1) {
        console.log(`\n🔍 ${nombre}: ${materials.length} duplicados encontrados`);
        
        // Mantener el primero (más antiguo)
        const toKeep = materials[0];
        const toDelete = materials.slice(1);

        console.log(`   ✅ Mantener: ${toKeep.id} (${toKeep.created_at})`);
        console.log(`   ❌ Eliminar: ${toDelete.length} duplicados`);

        // Corregir la categoría del que vamos a mantener
        let correctCategory = 'Broches y Cierres';
        
        // Si la categoría actual es "Broche", actualizarla
        if (toKeep.categoria === 'Broche' || toKeep.categoria === 'Metales Comunes') {
          console.log(`   🔧 Corrigiendo categoría de "${toKeep.categoria}" a "${correctCategory}"`);
          
          const { error: updateError } = await supabase
            .from('jwl_catalogo_materiales')
            .update({ categoria: correctCategory })
            .eq('id', toKeep.id);

          if (updateError) {
            console.error(`   ❌ Error al actualizar categoría:`, updateError);
          } else {
            console.log(`   ✅ Categoría actualizada`);
          }
        }

        // Corregir color si es incorrecto
        if (nombre === 'Broche de Plata' && toKeep.color === '#666845') {
          console.log(`   🔧 Corrigiendo color de ${toKeep.color} a #C0C0C0`);
          
          const { error: colorError } = await supabase
            .from('jwl_catalogo_materiales')
            .update({ color: '#C0C0C0' })
            .eq('id', toKeep.id);

          if (colorError) {
            console.error(`   ❌ Error al actualizar color:`, colorError);
          } else {
            console.log(`   ✅ Color actualizado`);
          }
        }

        // Eliminar duplicados
        for (const dup of toDelete) {
          console.log(`   🗑️  Eliminando: ${dup.id}`);
          
          const { error: deleteError } = await supabase
            .from('jwl_catalogo_materiales')
            .delete()
            .eq('id', dup.id);

          if (deleteError) {
            console.error(`   ❌ Error al eliminar:`, deleteError);
          }
        }
      } else {
        // Solo uno, verificar categoría
        const material = materials[0];
        if (material.categoria === 'Broche' || material.categoria === 'Metales Comunes') {
          console.log(`\n🔧 ${material.nombre}: Corrigiendo categoría`);
          
          const { error: updateError } = await supabase
            .from('jwl_catalogo_materiales')
            .update({ categoria: 'Broches y Cierres' })
            .eq('id', material.id);

          if (updateError) {
            console.error(`   ❌ Error al actualizar:`, updateError);
          } else {
            console.log(`   ✅ Categoría actualizada a "Broches y Cierres"`);
          }
        }
      }
    }

    console.log('\n✅ Limpieza completada\n');

    // 4. Verificar resultado final
    const { data: finalBroches, error: finalError } = await supabase
      .from('jwl_catalogo_materiales')
      .select('*')
      .eq('categoria', 'Broches y Cierres')
      .order('nombre');

    if (finalError) {
      console.error('❌ Error al verificar resultado:', finalError);
      return;
    }

    console.log(`📊 Resultado final: ${finalBroches?.length || 0} materiales en "Broches y Cierres"\n`);
    
    finalBroches?.forEach((material, index) => {
      console.log(`${index + 1}. ${material.nombre}`);
      console.log(`   Color: ${material.color}`);
      console.log(`   Forma: ${material.forma}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixBrochesDuplicates();
