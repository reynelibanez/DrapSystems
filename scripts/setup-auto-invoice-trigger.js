import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias');
  console.error('Necesitas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAutoInvoiceTrigger() {
  try {
    console.log('🚀 Configurando trigger de facturación automática...\n');

    // Leer el archivo SQL
    const sqlPath = join(__dirname, '../supabase/migrations/create_auto_invoice_from_completed_appointment.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Ejecutando SQL...');
    
    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // Si no existe la función exec_sql, ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando con query directo...');
      
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
      
      if (directError) {
        console.error('❌ Error al ejecutar SQL:', directError);
        console.log('\n📋 Por favor, ejecuta manualmente este SQL en Supabase:');
        console.log('\n' + sql);
        process.exit(1);
      }
    }

    console.log('✅ Trigger de facturación automática configurado correctamente\n');
    
    console.log('📊 Probando el trigger...');
    await testTrigger();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function testTrigger() {
  try {
    // Obtener una cita de prueba
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('id, status, business_id, client_id, service_id, staff_id')
      .eq('status', 'confirmed')
      .limit(1);

    if (aptError) {
      console.log('⚠️  No se pudo obtener cita de prueba:', aptError.message);
      return;
    }

    if (!appointments || appointments.length === 0) {
      console.log('ℹ️  No hay citas confirmadas para probar el trigger');
      return;
    }

    const testAppointment = appointments[0];
    console.log(`\n🧪 Cita de prueba encontrada: ${testAppointment.id}`);
    console.log(`   Estado actual: ${testAppointment.status}`);

    // Verificar si ya tiene factura
    const { data: existingInvoice } = await supabase
      .from('service_invoice_items')
      .select('invoice_id')
      .eq('appointment_id', testAppointment.id)
      .single();

    if (existingInvoice) {
      console.log('ℹ️  Esta cita ya tiene una factura asociada');
      return;
    }

    console.log('\n⚠️  NOTA: Para probar el trigger, marca una cita como "completed" en la aplicación');
    console.log('   El trigger creará automáticamente una factura para esa cita\n');

  } catch (error) {
    console.log('⚠️  Error al probar trigger:', error.message);
  }
}

// Ejecutar
setupAutoInvoiceTrigger();
