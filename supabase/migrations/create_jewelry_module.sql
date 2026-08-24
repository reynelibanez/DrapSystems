-- =====================================================
-- MÓDULO DE JOYERÍA - TABLAS CON PREFIJO jwl_
-- =====================================================

-- 1. Tabla de materias primas
CREATE TABLE IF NOT EXISTS jwl_materias_primas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidad_medida TEXT NOT NULL,
  costo_unitario_actual NUMERIC(10, 2) DEFAULT 0,
  stock_actual NUMERIC(10, 3) DEFAULT 0,
  stock_minimo NUMERIC(10, 3) DEFAULT 0,
  proveedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de compras de materiales
CREATE TABLE IF NOT EXISTS jwl_compras_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_prima_id UUID NOT NULL REFERENCES jwl_materias_primas(id) ON DELETE CASCADE,
  cantidad NUMERIC(10, 3) NOT NULL,
  costo_unitario NUMERIC(10, 2) NOT NULL,
  costo_total NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  proveedor TEXT,
  fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de joyas (productos terminados)
CREATE TABLE IF NOT EXISTS jwl_joyas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  costo_produccion NUMERIC(10, 2) DEFAULT 0,
  margen_ganancia NUMERIC(5, 2) DEFAULT 0,
  precio_venta NUMERIC(10, 2) DEFAULT 0,
  stock_actual NUMERIC(10, 2) DEFAULT 0,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de ficha de costo (Bill of Materials)
CREATE TABLE IF NOT EXISTS jwl_ficha_costo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joya_id UUID NOT NULL REFERENCES jwl_joyas(id) ON DELETE CASCADE,
  materia_prima_id UUID NOT NULL REFERENCES jwl_materias_primas(id) ON DELETE CASCADE,
  cantidad_usada NUMERIC(10, 3) NOT NULL,
  costo_unitario_momento NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad_usada * costo_unitario_momento) STORED,
  UNIQUE(joya_id, materia_prima_id)
);

-- 5. Tabla de producción
CREATE TABLE IF NOT EXISTS jwl_produccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joya_id UUID NOT NULL REFERENCES jwl_joyas(id) ON DELETE CASCADE,
  cantidad_producida NUMERIC(10, 2) NOT NULL,
  fecha_produccion DATE NOT NULL DEFAULT CURRENT_DATE,
  costo_total_lote NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de ventas
CREATE TABLE IF NOT EXISTS jwl_ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joya_id UUID NOT NULL REFERENCES jwl_joyas(id) ON DELETE CASCADE,
  cantidad NUMERIC(10, 2) NOT NULL,
  precio_unitario_venta NUMERIC(10, 2) NOT NULL,
  total_venta NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario_venta) STORED,
  costo_unitario_al_vender NUMERIC(10, 2) NOT NULL,
  utilidad NUMERIC(10, 2) GENERATED ALWAYS AS ((cantidad * precio_unitario_venta) - (costo_unitario_al_vender * cantidad)) STORED,
  cliente TEXT,
  fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de gastos generales
CREATE TABLE IF NOT EXISTS jwl_gastos_generales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES Y TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION jwl_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para materias primas
CREATE TRIGGER jwl_materias_primas_updated_at
  BEFORE UPDATE ON jwl_materias_primas
  FOR EACH ROW
  EXECUTE FUNCTION jwl_update_updated_at();

-- Trigger para joyas
CREATE TRIGGER jwl_joyas_updated_at
  BEFORE UPDATE ON jwl_joyas
  FOR EACH ROW
  EXECUTE FUNCTION jwl_update_updated_at();

-- =====================================================
-- FUNCIÓN: Actualizar stock y costo al comprar material
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar stock y costo promedio ponderado
  UPDATE jwl_materias_primas
  SET 
    stock_actual = stock_actual + NEW.cantidad,
    costo_unitario_actual = (
      (stock_actual * costo_unitario_actual) + (NEW.cantidad * NEW.costo_unitario)
    ) / (stock_actual + NEW.cantidad),
    updated_at = NOW()
  WHERE id = NEW.materia_prima_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jwl_trigger_compra_material
  AFTER INSERT ON jwl_compras_materiales
  FOR EACH ROW
  EXECUTE FUNCTION jwl_actualizar_stock_compra();

-- =====================================================
-- FUNCIÓN: Recalcular costo de producción de joya
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_recalcular_costo_joya()
RETURNS TRIGGER AS $$
DECLARE
  v_joya_id UUID;
  v_costo_total NUMERIC(10, 2);
BEGIN
  -- Determinar el joya_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_joya_id := OLD.joya_id;
  ELSE
    v_joya_id := NEW.joya_id;
  END IF;

  -- Calcular el costo total sumando todos los subtotales
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_costo_total
  FROM jwl_ficha_costo
  WHERE joya_id = v_joya_id;

  -- Actualizar el costo de producción de la joya
  UPDATE jwl_joyas
  SET 
    costo_produccion = v_costo_total,
    precio_venta = CASE 
      WHEN margen_ganancia > 0 THEN v_costo_total * (1 + margen_ganancia / 100)
      ELSE precio_venta
    END,
    updated_at = NOW()
  WHERE id = v_joya_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jwl_trigger_recalcular_costo_insert
  AFTER INSERT ON jwl_ficha_costo
  FOR EACH ROW
  EXECUTE FUNCTION jwl_recalcular_costo_joya();

CREATE TRIGGER jwl_trigger_recalcular_costo_update
  AFTER UPDATE ON jwl_ficha_costo
  FOR EACH ROW
  EXECUTE FUNCTION jwl_recalcular_costo_joya();

CREATE TRIGGER jwl_trigger_recalcular_costo_delete
  AFTER DELETE ON jwl_ficha_costo
  FOR EACH ROW
  EXECUTE FUNCTION jwl_recalcular_costo_joya();

-- =====================================================
-- FUNCIÓN: Procesar producción (descontar materiales, sumar joyas)
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_procesar_produccion()
RETURNS TRIGGER AS $$
DECLARE
  v_material RECORD;
  v_costo_total NUMERIC(10, 2) := 0;
BEGIN
  -- Descontar materiales del inventario según la ficha de costo
  FOR v_material IN 
    SELECT materia_prima_id, cantidad_usada, subtotal
    FROM jwl_ficha_costo
    WHERE joya_id = NEW.joya_id
  LOOP
    -- Descontar stock de materia prima
    UPDATE jwl_materias_primas
    SET 
      stock_actual = stock_actual - (v_material.cantidad_usada * NEW.cantidad_producida),
      updated_at = NOW()
    WHERE id = v_material.materia_prima_id;
    
    -- Acumular costo total del lote
    v_costo_total := v_costo_total + (v_material.subtotal * NEW.cantidad_producida);
  END LOOP;

  -- Actualizar el costo total del lote en el registro de producción
  NEW.costo_total_lote := v_costo_total;

  -- Sumar al inventario de joyas terminadas
  UPDATE jwl_joyas
  SET 
    stock_actual = stock_actual + NEW.cantidad_producida,
    updated_at = NOW()
  WHERE id = NEW.joya_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jwl_trigger_produccion
  BEFORE INSERT ON jwl_produccion
  FOR EACH ROW
  EXECUTE FUNCTION jwl_procesar_produccion();

-- =====================================================
-- FUNCIÓN: Procesar venta (descontar inventario de joyas)
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_procesar_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Descontar del inventario de joyas
  UPDATE jwl_joyas
  SET 
    stock_actual = stock_actual - NEW.cantidad,
    updated_at = NOW()
  WHERE id = NEW.joya_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jwl_trigger_venta
  AFTER INSERT ON jwl_ventas
  FOR EACH ROW
  EXECUTE FUNCTION jwl_procesar_venta();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE jwl_materias_primas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_compras_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_joyas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_ficha_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwl_gastos_generales ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo para usuarios autenticados)
-- Ajusta según tus necesidades de seguridad

CREATE POLICY "jwl_materias_primas_policy" ON jwl_materias_primas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_compras_materiales_policy" ON jwl_compras_materiales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_joyas_policy" ON jwl_joyas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_ficha_costo_policy" ON jwl_ficha_costo
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_produccion_policy" ON jwl_produccion
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_ventas_policy" ON jwl_ventas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "jwl_gastos_generales_policy" ON jwl_gastos_generales
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX idx_jwl_compras_materia_prima ON jwl_compras_materiales(materia_prima_id);
CREATE INDEX idx_jwl_compras_fecha ON jwl_compras_materiales(fecha_compra);
CREATE INDEX idx_jwl_ficha_joya ON jwl_ficha_costo(joya_id);
CREATE INDEX idx_jwl_ficha_materia ON jwl_ficha_costo(materia_prima_id);
CREATE INDEX idx_jwl_produccion_joya ON jwl_produccion(joya_id);
CREATE INDEX idx_jwl_produccion_fecha ON jwl_produccion(fecha_produccion);
CREATE INDEX idx_jwl_ventas_joya ON jwl_ventas(joya_id);
CREATE INDEX idx_jwl_ventas_fecha ON jwl_ventas(fecha_venta);
CREATE INDEX idx_jwl_gastos_fecha ON jwl_gastos_generales(fecha);

-- =====================================================
-- VISTAS ÚTILES PARA REPORTES
-- =====================================================

-- Vista: Valor del inventario de materias primas
CREATE OR REPLACE VIEW jwl_valor_inventario_materiales AS
SELECT 
  mp.id,
  mp.nombre,
  mp.categoria,
  mp.stock_actual,
  mp.costo_unitario_actual,
  (mp.stock_actual * mp.costo_unitario_actual) AS valor_total
FROM jwl_materias_primas mp
WHERE mp.stock_actual > 0;

-- Vista: Valor del inventario de joyas
CREATE OR REPLACE VIEW jwl_valor_inventario_joyas AS
SELECT 
  j.id,
  j.sku,
  j.nombre,
  j.categoria,
  j.stock_actual,
  j.costo_produccion,
  j.precio_venta,
  (j.stock_actual * j.costo_produccion) AS valor_costo,
  (j.stock_actual * j.precio_venta) AS valor_venta
FROM jwl_joyas j
WHERE j.stock_actual > 0;

-- Vista: Materiales con stock bajo
CREATE OR REPLACE VIEW jwl_alertas_stock_bajo AS
SELECT 
  mp.id,
  mp.nombre,
  mp.categoria,
  mp.stock_actual,
  mp.stock_minimo,
  mp.proveedor
FROM jwl_materias_primas mp
WHERE mp.stock_actual <= mp.stock_minimo;

-- Vista: Resumen de ventas por joya
CREATE OR REPLACE VIEW jwl_resumen_ventas_por_joya AS
SELECT 
  j.id AS joya_id,
  j.sku,
  j.nombre,
  j.categoria,
  COUNT(v.id) AS total_ventas,
  SUM(v.cantidad) AS cantidad_vendida,
  SUM(v.total_venta) AS ingresos_totales,
  SUM(v.utilidad) AS utilidad_total
FROM jwl_joyas j
LEFT JOIN jwl_ventas v ON j.id = v.joya_id
GROUP BY j.id, j.sku, j.nombre, j.categoria;

COMMENT ON TABLE jwl_materias_primas IS 'Catálogo de materias primas e insumos para joyería';
COMMENT ON TABLE jwl_compras_materiales IS 'Historial de compras de materiales';
COMMENT ON TABLE jwl_joyas IS 'Catálogo de joyas y productos terminados';
COMMENT ON TABLE jwl_ficha_costo IS 'Bill of Materials - Materiales usados por cada joya';
COMMENT ON TABLE jwl_produccion IS 'Registro de producción de joyas';
COMMENT ON TABLE jwl_ventas IS 'Registro de ventas de joyas';
COMMENT ON TABLE jwl_gastos_generales IS 'Gastos operativos generales del taller';
