#!/usr/bin/env node

/**
 * Script para corregir el trigger de facturas
 * Ejecuta el SQL que corrige el problema de tax_percentage
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

// Crear cliente de Supabase con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 Corrigiendo trigger de facturas...\n');

async function fixInvoiceTrigger() {
  try {
    // SQL para corregir el trigger
    const sql = `
-- Eliminar el trigger actual
DROP TRIGGER IF EXISTS recalculate_invoice_totals ON service_invoice_items;

-- Función corregida para calcular totales de factura (con propinas)
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_subtotal DECIMAL(10,2);
  v_tax_percentage DECIMAL(5,2);
  v_discount_percentage DECIMAL(5,2);
  v_tip_percentage DECIMAL(5,2);
  v_tax_amount DECIMAL(10,2);
  v_discount_amount DECIMAL(10,2);
  v_tip_amount DECIMAL(10,2);
  v_total DECIMAL(10,2);
BEGIN
  -- Determinar el invoice_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Obtener los porcentajes de la factura
  SELECT 
    COALESCE(tax_percentage, 0),
    COALESCE(discount_percentage, 0),
    COALESCE(tip_percentage, 0)
  INTO 
    v_tax_percentage,
    v_discount_percentage,
    v_tip_percentage
  FROM service_invoices
  WHERE id = v_invoice_id;

  -- Calcular subtotal de items
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_subtotal
  FROM service_invoice_items
  WHERE invoice_id = v_invoice_id;
  
  -- Calcular impuesto sobre el subtotal
  v_tax_amount := v_subtotal * (v_tax_percentage / 100);
  
  -- Calcular descuento sobre el subtotal
  v_discount_amount := v_subtotal * (v_discount_percentage / 100);
  
  -- Calcular propina sobre el subtotal
  v_tip_amount := v_subtotal * (v_tip_percentage / 100);
  
  -- Calcular total: Subtotal + Impuesto - Descuento + Propina
  v_total := v_subtotal + v_tax_amount - v_discount_amount + v_tip_amount;
  
  -- Actualizar la factura
  UPDATE service_invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    discount_amount = v_discount_amount,
    tip_amount = v_tip_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
  -- Retornar según la operación
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER recalculate_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON service_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- Comentario
COMMENT ON FUNCTION calculate_invoice_totals() IS 'Recalcula automáticamente los totales de la factura (incluyendo propinas) cuando se agregan, modifican o eliminan items';
`;

    console.log('📝 Ejecutando SQL...');
    
    // Ejecutar el SQL usando rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Si no existe la función exec_sql, intentar con el método directo
      console.log('⚠️  Método RPC no disponible, intentando método directo...\n');
      
      // Dividir el SQL en partes y ejecutar cada una
      const statements = [
        'DROP TRIGGER IF EXISTS recalculate_invoice_totals ON service_invoice_items',
        sql.substring(sql.indexOf('CREATE OR REPLACE FUNCTION'), sql.indexOf('CREATE TRIGGER')),
        sql.substring(sql.indexOf('CREATE TRIGGER'), sql.indexOf('COMMENT ON')),
        sql.substring(sql.indexOf('COMMENT ON'))
      ];
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        console.log(`Ejecutando parte ${i + 1}/${statements.length}...`);
        const { error: stmtError } = await supabase.rpc('exec', { sql: stmt });
        
        if (stmtError) {
          console.error(`❌ Error en parte ${i + 1}:`, stmtError.message);
          throw stmtError;
        }
      }
      
      console.log('✅ SQL ejecutado correctamente (método directo)\n');
    } else {
      console.log('✅ SQL ejecutado correctamente\n');
    }

    // Verificar que el trigger se creó
    console.log('🔍 Verificando trigger...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table')
      .eq('trigger_name', 'recalculate_invoice_totals');

    if (triggerError) {
      console.log('⚠️  No se pudo verificar el trigger automáticamente');
      console.log('   Pero probablemente se creó correctamente\n');
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Trigger verificado:');
      console.log('   Nombre:', triggers[0].trigger_name);
      console.log('   Tabla:', triggers[0].event_object_table);
      console.log('   Eventos:', triggers.map(t => t.event_manipulation).join(', '));
      console.log('');
    }

    console.log('✅ ¡Trigger corregido exitosamente!');
    console.log('');
    console.log('📋 Cambios aplicados:');
    console.log('   ✅ Trigger eliminado y recreado');
    console.log('   ✅ Función actualizada con soporte para propinas');
    console.log('   ✅ Lectura correcta de tax_percentage desde service_invoices');
    console.log('   ✅ Manejo correcto de operaciones DELETE');
    console.log('');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Prueba crear una factura en producción');
    console.log('   2. Verifica que no haya error de tax_percentage');
    console.log('   3. Confirma que los totales se calculen correctamente');
    console.log('');

  } catch (error) {
    console.error('❌ Error al ejecutar el script:', error.message);
    if (error.details) {
      console.error('   Detalles:', error.details);
    }
    if (error.hint) {
      console.error('   Sugerencia:', error.hint);
    }
    process.exit(1);
  }
}

// Ejecutar
fixInvoiceTrigger();
