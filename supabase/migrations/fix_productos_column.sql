-- =====================================================
-- FIX: Hacer columna 'producto' nullable y usar 'nombre'
-- Fecha: 2025-01-17
-- =====================================================

-- 1. Hacer la columna 'producto' nullable
ALTER TABLE ng_productos_inventario 
  ALTER COLUMN producto DROP NOT NULL;

-- 2. Crear trigger para sincronizar 'nombre' con 'producto'
CREATE OR REPLACE FUNCTION sync_producto_nombre()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se inserta/actualiza 'nombre', copiar a 'producto'
  IF NEW.nombre IS NOT NULL THEN
    NEW.producto := NEW.nombre;
  END IF;
  
  -- Si se inserta/actualiza 'producto', copiar a 'nombre'
  IF NEW.producto IS NOT NULL AND NEW.nombre IS NULL THEN
    NEW.nombre := NEW.producto;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_sync_producto_nombre ON ng_productos_inventario;

-- Crear trigger
CREATE TRIGGER trigger_sync_producto_nombre
BEFORE INSERT OR UPDATE ON ng_productos_inventario
FOR EACH ROW
EXECUTE FUNCTION sync_producto_nombre();

-- 3. Sincronizar datos existentes
UPDATE ng_productos_inventario 
SET nombre = producto 
WHERE nombre IS NULL AND producto IS NOT NULL;

UPDATE ng_productos_inventario 
SET producto = nombre 
WHERE producto IS NULL AND nombre IS NOT NULL;

-- 4. Actualizar vista para usar COALESCE
CREATE OR REPLACE VIEW vw_existencias_inventario AS
SELECT 
  e.business_id,
  e.idproducto,
  p.codigo AS codigo_producto,
  COALESCE(p.nombre, p.producto) AS nombre_producto,
  e.idalmacen,
  a.almacen AS nombre_almacen,
  e.cantidad AS existencia,
  COALESCE(p.unidad, 'UND') AS unidad,
  COALESCE(p.stock_minimo, 0) AS stock_minimo,
  COALESCE(p.stock_maximo, 0) AS stock_maximo,
  e.costo,
  e.cantidad * e.costo AS valor_total
FROM il_existencias_inventario e
JOIN ng_productos_inventario p ON e.idproducto = p.id
JOIN ng_almacen_inventario a ON e.idalmacen = a.id
WHERE e.cantidad > 0;

-- =====================================================
-- FIN DEL FIX
-- =====================================================
