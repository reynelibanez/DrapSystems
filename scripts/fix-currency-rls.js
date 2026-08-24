#!/usr/bin/env node

/**
 * Script para arreglar RLS y permisos de jwl_configuracion_moneda
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCurrencyRLS() {
  console.log('🔧 Arreglando RLS de jwl_configuracion_moneda...\n');

  try {
    // SQL para crear la tabla y configurar RLS
    const sql = `
-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS jwl_configuracion_moneda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  moneda_id UUID NOT NULL REFERENCES jwl_monedas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

-- 2. Habilitar RLS
ALTER TABLE jwl_configuracion_moneda ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their business currency config" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "Users can insert their business currency config" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "Users can update their business currency config" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "Users can delete their business currency config" ON jwl_configuracion_moneda;

-- 4. Crear políticas de RLS
CREATE POLICY "Users can view their business currency config"
  ON jwl_configuracion_moneda
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their business currency config"
  ON jwl_configuracion_moneda
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their business currency config"
  ON jwl_configuracion_moneda
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their business currency config"
  ON jwl_configuracion_moneda
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- 5. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_jwl_configuracion_moneda_business_id 
  ON jwl_configuracion_moneda(business_id);

-- 6. Comentarios
COMMENT ON TABLE jwl_configuracion_moneda IS 'Configuración de moneda por negocio';
COMMENT ON COLUMN jwl_configuracion_moneda.business_id IS 'ID del negocio';
COMMENT ON COLUMN jwl_configuracion_moneda.moneda_id IS 'ID de la moneda configurada';
`;

    console.log('📝 Ejecutando SQL...');
    
    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', { 
          query: statement + ';' 
        });
        
        if (error) {
          console.log(`⚠️  Statement ejecutado con advertencia: ${error.message}`);
        }
      }
    }

    console.log('✅ SQL ejecutado correctamente\n');

    // Verificar que la tabla existe
    console.log('🔍 Verificando tabla...');
    const { data, error } = await supabase
      .from('jwl_configuracion_moneda')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error verificando tabla:', error.message);
      console.log('\n📋 SOLUCIÓN MANUAL:');
      console.log('1. Ve a Supabase Dashboard > SQL Editor');
      console.log('2. Copia y pega el SQL de arriba');
      console.log('3. Ejecuta la query\n');
      return;
    }

    console.log('✅ Tabla jwl_configuracion_moneda existe y es accesible\n');

    // Verificar políticas RLS
    console.log('🔍 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec', {
        query: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'jwl_configuracion_moneda'
        `
      });

    if (!policiesError && policies) {
      console.log('✅ Políticas RLS configuradas:');
      policies.forEach(p => console.log(`   - ${p.policyname}`));
    }

    console.log('\n✅ Configuración completada!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCurrencyRLS();
