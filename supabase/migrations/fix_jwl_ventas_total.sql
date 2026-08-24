
-- =====================================================
-- AGREGAR COLUMNA TOTAL_VENTA A JWL_VENTAS
-- =====================================================

-- 1. Agregar columna total_venta si no existe
ALTER TABLE jwl_ventas 
ADD COLUMN IF NOT EXISTS total_venta DECIMAL(10,2);

-- 2. Calcular el total para ventas existentes
UPDATE jwl_ventas
SET total_venta = CASE
  WHEN venta_por_peso = true THEN peso_vendido * precio_por_peso_venta
  ELSE cantidad * precio_unitario_venta
END
WHERE total_venta IS NULL;

-- 3. Crear trigger para calcular total automáticamente
CREATE OR REPLACE FUNCTION calculate_venta_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venta_por_peso = true THEN
    NEW.total_venta := NEW.peso_vendido * NEW.precio_por_peso_venta;
  ELSE
    NEW.total_venta := NEW.cantidad * NEW.precio_unitario_venta;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_calculate_venta_total ON jwl_ventas;

-- 5. Crear trigger
CREATE TRIGGER trigger_calculate_venta_total
  BEFORE INSERT OR UPDATE ON jwl_ventas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_venta_total();

-- 6. Comentario
COMMENT ON COLUMN jwl_ventas.total_venta IS 'Total de la venta (calculado automáticamente)';

