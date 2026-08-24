-- =====================================================
-- FIX COMPLETO PARA VENTAS POR PESO
-- =====================================================

-- 1. Eliminar columnas generadas si existen
ALTER TABLE jwl_ventas 
DROP COLUMN IF EXISTS total_venta CASCADE;

ALTER TABLE jwl_ventas 
DROP COLUMN IF EXISTS utilidad CASCADE;

-- 2. Crear columnas normales
ALTER TABLE jwl_ventas 
ADD COLUMN total_venta DECIMAL(10,2);

ALTER TABLE jwl_ventas 
ADD COLUMN utilidad DECIMAL(10,2);

-- 3. Crear función para calcular total y utilidad
CREATE OR REPLACE FUNCTION calculate_venta_total_and_utilidad()
RETURNS TRIGGER AS $$
DECLARE
  v_costo_produccion DECIMAL(10,2);
BEGIN
  -- Obtener el costo de producción de la joya
  SELECT costo_produccion INTO v_costo_produccion
  FROM jwl_joyas
  WHERE id = NEW.joya_id;

  -- Calcular total según tipo de venta
  IF NEW.venta_por_peso = true THEN
    -- Venta por peso
    NEW.total_venta := NEW.peso_vendido * NEW.precio_por_peso_venta;
    -- Para ventas por peso, la utilidad es el total menos el costo de producción de UNA unidad
    -- (asumiendo que el peso vendido es de una unidad completa)
    NEW.utilidad := NEW.total_venta - v_costo_produccion;
  ELSE
    -- Venta normal
    NEW.total_venta := NEW.cantidad * NEW.precio_unitario_venta;
    -- Utilidad = (precio_venta - costo) * cantidad
    NEW.utilidad := (NEW.precio_unitario_venta - v_costo_produccion) * NEW.cantidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_calculate_venta_total_and_utilidad ON jwl_ventas;

-- 5. Crear trigger
CREATE TRIGGER trigger_calculate_venta_total_and_utilidad
  BEFORE INSERT OR UPDATE ON jwl_ventas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_venta_total_and_utilidad();

-- 6. Actualizar ventas existentes
UPDATE jwl_ventas v
SET 
  total_venta = CASE
    WHEN v.venta_por_peso = true THEN v.peso_vendido * v.precio_por_peso_venta
    ELSE v.cantidad * v.precio_unitario_venta
  END,
  utilidad = CASE
    WHEN v.venta_por_peso = true THEN 
      (v.peso_vendido * v.precio_por_peso_venta) - j.costo_produccion
    ELSE 
      (v.precio_unitario_venta - j.costo_produccion) * v.cantidad
  END
FROM jwl_joyas j
WHERE v.joya_id = j.id;

-- 7. Comentarios
COMMENT ON COLUMN jwl_ventas.total_venta IS 'Total de la venta (calculado automáticamente según tipo de venta)';
COMMENT ON COLUMN jwl_ventas.utilidad IS 'Utilidad de la venta (calculado automáticamente según tipo de venta)';

