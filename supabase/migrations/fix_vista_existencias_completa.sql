-- =====================================================
-- FIX VISTA DE EXISTENCIAS - MOSTRAR TODOS LOS ALMACENES
-- Fecha: 2024
-- =====================================================
-- Este script recrea la vista de existencias para mostrar
-- correctamente el stock de todos los almacenes
-- =====================================================

-- 1. Eliminar la vista si existe
DROP VIEW IF EXISTS vw_existencias_inventario CASCADE;

-- 2. Crear la vista actualizada
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

-- 3. Dar permisos a la vista
GRANT SELECT ON vw_existencias_inventario TO authenticated;
GRANT SELECT ON vw_existencias_inventario TO anon;

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_existencias_business_almacen 
ON il_existencias_inventario(business_id, idalmacen);

CREATE INDEX IF NOT EXISTS idx_existencias_producto 
ON il_existencias_inventario(idproducto);

-- 5. Comentarios para documentación
COMMENT ON VIEW vw_existencias_inventario IS 
'Vista consolidada de existencias por almacén. Muestra el stock disponible de cada producto en cada almacén.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que la vista funciona correctamente:
-- SELECT nombre_almacen, COUNT(*) as productos 
-- FROM vw_existencias_inventario 
-- GROUP BY nombre_almacen;
-- =====================================================
