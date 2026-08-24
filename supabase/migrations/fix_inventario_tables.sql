-- =====================================================
-- FIX INVENTARIO - Agregar tablas y columnas faltantes
-- Fecha: 2025-01-17
-- =====================================================

-- 1. Crear tabla de catálogos genéricos (categorías, marcas, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS ng_catalogos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'categoria', 'marca', 'proveedor', etc.
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_catalogos_business ON ng_catalogos_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_tipo ON ng_catalogos_inventario(tipo);
CREATE INDEX IF NOT EXISTS idx_catalogos_activo ON ng_catalogos_inventario(activo);

-- RLS
ALTER TABLE ng_catalogos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view catalogos from their business"
  ON ng_catalogos_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert catalogos in their business"
  ON ng_catalogos_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update catalogos in their business"
  ON ng_catalogos_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete catalogos in their business"
  ON ng_catalogos_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- 2. Modificar tabla de productos para usar estructura simplificada
-- =====================================================

-- Agregar columnas faltantes a ng_productos_inventario
ALTER TABLE ng_productos_inventario 
  ADD COLUMN IF NOT EXISTS nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS unidad VARCHAR(50) DEFAULT 'UND',
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES ng_catalogos_inventario(id),
  ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES ng_catalogos_inventario(id),
  ADD COLUMN IF NOT EXISTS modelo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(18, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_maximo NUMERIC(18, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_compra NUMERIC(18, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(18, 4) DEFAULT 0;

-- Copiar datos de columnas antiguas a nuevas (si existen)
UPDATE ng_productos_inventario 
SET nombre = producto 
WHERE nombre IS NULL AND producto IS NOT NULL;

UPDATE ng_productos_inventario 
SET precio_compra = costo 
WHERE precio_compra = 0 AND costo > 0;

UPDATE ng_productos_inventario 
SET precio_venta = precio 
WHERE precio_venta = 0 AND precio > 0;

-- 3. Crear vista para existencias con información completa
-- =====================================================

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

-- 4. Insertar catálogos por defecto
-- =====================================================

-- Función para insertar catálogos por defecto cuando se crea un negocio
CREATE OR REPLACE FUNCTION crear_catalogos_default_inventario()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar categorías por defecto
  INSERT INTO ng_catalogos_inventario (business_id, tipo, nombre, descripcion)
  VALUES 
    (NEW.id, 'categoria', 'General', 'Categoría general para productos'),
    (NEW.id, 'categoria', 'Materia Prima', 'Materias primas y suministros'),
    (NEW.id, 'categoria', 'Producto Terminado', 'Productos listos para venta'),
    (NEW.id, 'marca', 'Sin Marca', 'Productos sin marca específica');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear catálogos al crear un negocio
-- (Solo si no existe)
DROP TRIGGER IF EXISTS trigger_crear_catalogos_inventario ON businesses;
CREATE TRIGGER trigger_crear_catalogos_inventario
AFTER INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION crear_catalogos_default_inventario();

-- 5. Función para migrar datos existentes
-- =====================================================

-- Migrar tipos de productos a catálogos
INSERT INTO ng_catalogos_inventario (business_id, tipo, nombre, descripcion)
SELECT 
  business_id,
  'categoria' AS tipo,
  tipo AS nombre,
  'Migrado desde tipos de productos' AS descripcion
FROM ng_productostipos_inventario
WHERE NOT EXISTS (
  SELECT 1 FROM ng_catalogos_inventario c
  WHERE c.business_id = ng_productostipos_inventario.business_id
  AND c.tipo = 'categoria'
  AND c.nombre = ng_productostipos_inventario.tipo
);

-- 6. Actualizar referencias en productos
-- =====================================================

-- Actualizar categoria_id basado en idtipo
UPDATE ng_productos_inventario p
SET categoria_id = (
  SELECT c.id 
  FROM ng_catalogos_inventario c
  JOIN ng_productostipos_inventario t ON t.tipo = c.nombre
  WHERE t.id = p.idtipo
  AND c.business_id = p.business_id
  AND c.tipo = 'categoria'
  LIMIT 1
)
WHERE p.idtipo IS NOT NULL 
AND p.categoria_id IS NULL;

-- =====================================================
-- FIN DEL FIX
-- =====================================================
