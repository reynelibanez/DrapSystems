-- =====================================================
-- AGREGAR PRECIO POR PESO A JOYAS Y VENTAS
-- =====================================================
-- Fecha: 2026-01-XX
-- Descripción: Permite vender joyas por peso además del precio fijo

-- 1. Agregar columna precio_por_peso a jwl_joyas
ALTER TABLE jwl_joyas 
ADD COLUMN IF NOT EXISTS precio_por_peso DECIMAL(12, 2) DEFAULT NULL;

COMMENT ON COLUMN jwl_joyas.precio_por_peso IS 'Precio por gramo/unidad de peso (opcional)';

-- 2. Agregar columnas para venta por peso en jwl_ventas
ALTER TABLE jwl_ventas 
ADD COLUMN IF NOT EXISTS venta_por_peso BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS peso_vendido DECIMAL(12, 3) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_por_peso_venta DECIMAL(12, 2) DEFAULT NULL;

COMMENT ON COLUMN jwl_ventas.venta_por_peso IS 'Indica si la venta fue por peso';
COMMENT ON COLUMN jwl_ventas.peso_vendido IS 'Peso en gramos vendido';
COMMENT ON COLUMN jwl_ventas.precio_por_peso_venta IS 'Precio por gramo al momento de la venta';

-- 3. Actualizar el trigger de cálculo de total_venta para considerar venta por peso
CREATE OR REPLACE FUNCTION calcular_total_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es venta por peso, calcular total basado en peso
  IF NEW.venta_por_peso = TRUE AND NEW.peso_vendido IS NOT NULL AND NEW.precio_por_peso_venta IS NOT NULL THEN
    NEW.total_venta := NEW.peso_vendido * NEW.precio_por_peso_venta;
  ELSE
    -- Venta normal por cantidad
    NEW.total_venta := NEW.cantidad * NEW.precio_unitario_venta;
  END IF;
  
  -- Calcular utilidad
  NEW.utilidad := NEW.total_venta - (NEW.cantidad * NEW.costo_unitario_al_vender);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_calcular_total_venta ON jwl_ventas;
CREATE TRIGGER trigger_calcular_total_venta
  BEFORE INSERT OR UPDATE ON jwl_ventas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_venta();

-- 4. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_jwl_joyas_precio_por_peso ON jwl_joyas(precio_por_peso) WHERE precio_por_peso IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jwl_ventas_venta_por_peso ON jwl_ventas(venta_por_peso) WHERE venta_por_peso = TRUE;
