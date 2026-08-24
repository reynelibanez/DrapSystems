#!/usr/bin/env node

/**
 * Script para corregir el trigger de facturas usando PostgreSQL directo
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

const { Client } = pg;

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

// Extraer el project ref de la URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Error: No se pudo extraer el project ref de la URL');
  process.exit(1);
}

console.log('🔧 Corrigiendo trigger de facturas...\n');
console.log('📍 Proyecto:', projectRef);
console.log('');

// Nota: Supabase no permite conexiones directas de PostgreSQL desde fuera
// Vamos a usar el REST API de Supabase para ejecutar el SQL

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatements() {
  try {
    console.log('📝 Paso 1: Eliminando trigger anterior...');
    
    // Paso 1: Eliminar trigger
    const dropTrigger = `DROP TRIGGER IF EXISTS recalculate_invoice_totals ON service_invoice_items;`;
    
    // Usar una query simple para verificar la conexión
    const { data: testData, error: testError } = await supabase
      .from('service_invoices')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      throw testError;
    }
    
    console.log('✅ Conexión establecida\n');
    
    // Dado que no podemos ejecutar SQL directamente, vamos a usar un enfoque diferente
    console.log('⚠️  Limitación: No se puede ejecutar SQL DDL directamente desde el SDK');
    console.log('');
    console.log('📋 INSTRUCCIONES MANUALES:');
    console.log('');
    console.log('1. Ve a: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('');
    console.log('2. Copia y pega este SQL:');
    console.log('');
    console.log('─'.repeat(80));
    
    const fullSQL = `-- Eliminar el trigger actual
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
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

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

  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_subtotal
  FROM service_invoice_items
  WHERE invoice_id = v_invoice_id;
  
  v_tax_amount := v_subtotal * (v_tax_percentage / 100);
  v_discount_amount := v_subtotal * (v_discount_percentage / 100);
  v_tip_amount := v_subtotal * (v_tip_percentage / 100);
  v_total := v_subtotal + v_tax_amount - v_discount_amount + v_tip_amount;
  
  UPDATE service_invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    discount_amount = v_discount_amount,
    tip_amount = v_tip_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
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
  EXECUTE FUNCTION calculate_invoice_totals();`;
    
    console.log(fullSQL);
    console.log('─'.repeat(80));
    console.log('');
    console.log('3. Haz clic en "RUN" o presiona Ctrl+Enter');
    console.log('');
    console.log('4. Deberías ver: "Success. No rows returned"');
    console.log('');
    console.log('✅ Después de ejecutar, prueba crear una factura en producción');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQLStatements();
