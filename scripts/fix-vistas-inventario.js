/**
 * Script para corregir las vistas de inventario agregando business_id
 * 
 * Ejecutar: node scripts/fix-vistas-inventario.js
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

async function fixVistasInventario() {
  console.log('🔧 Corrigiendo vistas de inventario...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '..', 'FIX_VISTAS_INVENTARIO_BUSINESS_ID.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando SQL...');
    
    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando queries manualmente...\n');
      
      // Dividir el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        if (statement.includes('CREATE OR REPLACE VIEW')) {
          console.log('📝 Ejecutando:', statement.substring(0, 60) + '...');
          
          // Para vistas, necesitamos usar una función RPC o ejecutar directamente
          // Como no podemos ejecutar DDL directamente, mostramos las instrucciones
          console.log('⚠️  Esta vista debe ejecutarse manualmente en Supabase SQL Editor');
        }
      }

      console.log('\n📋 INSTRUCCIONES MANUALES:');
      console.log('1. Abre Supabase Dashboard');
      console.log('2. Ve a SQL Editor');
      console.log('3. Copia y pega el contenido de FIX_VISTAS_INVENTARIO_BUSINESS_ID.sql');
      console.log('4. Ejecuta el script');
      
      return;
    }

    console.log('✅ Vistas actualizadas correctamente\n');

    // Verificar las vistas
    console.log('🔍 Verificando vistas...\n');

    const vistas = [
      'jwl_valor_inventario_materiales',
      'jwl_valor_inventario_joyas',
      'jwl_alertas_stock_bajo',
      'jwl_resumen_ventas_por_joya'
    ];

    for (const vista of vistas) {
      const { data, error } = await supabase
        .from(vista)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${vista}: Error - ${error.message}`);
      } else {
        const hasBusinessId = data && data.length > 0 && 'business_id' in data[0];
        console.log(`${hasBusinessId ? '✅' : '❌'} ${vista}: ${hasBusinessId ? 'business_id presente' : 'business_id faltante'}`);
      }
    }

    console.log('\n✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
fixVistasInventario();
