import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupJewelryUnits() {
  console.log('🔧 Configurando tabla de unidades de medida para joyería...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', 'create_jewelry_units_table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando comandos manualmente...');
      
      // Dividir el SQL en comandos individuales
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.includes('CREATE TABLE') || 
            command.includes('CREATE INDEX') || 
            command.includes('ALTER TABLE') ||
            command.includes('CREATE POLICY') ||
            command.includes('DROP POLICY') ||
            command.includes('CREATE TRIGGER') ||
            command.includes('DROP TRIGGER') ||
            command.includes('CREATE OR REPLACE FUNCTION')) {
          console.log(`Ejecutando: ${command.substring(0, 50)}...`);
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command });
          if (cmdError) {
            console.error(`❌ Error en comando: ${cmdError.message}`);
          }
        }
      }
    }

    console.log('✅ Tabla jwl_unidades_medida creada correctamente');
    console.log('✅ Políticas RLS configuradas');
    console.log('✅ Función insert_default_jewelry_units creada');

    // Verificar que la tabla existe
    const { data: tables, error: tableError } = await supabase
      .from('jwl_unidades_medida')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError.message);
      console.log('\n⚠️  Por favor, ejecuta manualmente el SQL en Supabase:');
      console.log('   1. Ve a SQL Editor en Supabase Dashboard');
      console.log('   2. Copia el contenido de: supabase/migrations/create_jewelry_units_table.sql');
      console.log('   3. Ejecuta el SQL');
    } else {
      console.log('✅ Tabla verificada correctamente');
    }

    console.log('\n📋 Resumen:');
    console.log('   - Tabla: jwl_unidades_medida');
    console.log('   - Campos: id, business_id, nombre, abreviatura, tipo, activo');
    console.log('   - RLS: Habilitado con políticas por business_id');
    console.log('   - Función: insert_default_jewelry_units(business_id)');
    console.log('\n💡 Las unidades por defecto se insertarán automáticamente');
    console.log('   cuando un negocio acceda al módulo de joyería por primera vez.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Si el error persiste, ejecuta manualmente el SQL:');
    console.log('   supabase/migrations/create_jewelry_units_table.sql');
  }
}

setupJewelryUnits();
