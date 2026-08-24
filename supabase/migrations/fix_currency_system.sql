-- =====================================================
-- FIX SISTEMA DE MONEDAS
-- =====================================================

-- 1. Crear tabla jwl_configuracion_moneda si no existe
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
