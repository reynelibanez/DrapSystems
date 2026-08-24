-- =====================================================
-- MÓDULO DE INVENTARIO - MIGRACIÓN COMPLETA
-- Basado en el sistema Sisges
-- Fecha: 2025-01-17
-- =====================================================

-- 1. CATÁLOGOS BASE
-- =====================================================

-- Almacenes
CREATE TABLE IF NOT EXISTS ng_almacen_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  almacen VARCHAR(255) NOT NULL,
  codigo VARCHAR(255),
  abierto BOOLEAN NOT NULL DEFAULT true,
  puntoventa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Áreas de Ventas
CREATE TABLE IF NOT EXISTS ng_areas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  area VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unidades de Medida
CREATE TABLE IF NOT EXISTS unidadmedida_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  unidad VARCHAR(255) NOT NULL,
  abreviatura VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tipos de Productos
CREATE TABLE IF NOT EXISTS ng_productostipos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tipo VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monedas
CREATE TABLE IF NOT EXISTS ng_monedas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  moneda VARCHAR(255) NOT NULL,
  tasa NUMERIC(18, 4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS ng_productos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  codigo VARCHAR(255),
  producto VARCHAR(255) NOT NULL,
  idtipo UUID REFERENCES ng_productostipos_inventario(id),
  idunidad UUID REFERENCES unidadmedida_inventario(id),
  costo NUMERIC(18, 4) NOT NULL DEFAULT 0,
  precio NUMERIC(18, 4) NOT NULL DEFAULT 0,
  rutaimagen TEXT,
  inventariada BOOLEAN NOT NULL DEFAULT true,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos Asociados (Combos/Recetas)
CREATE TABLE IF NOT EXISTS ng_productosasociados_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id) ON DELETE CASCADE,
  idproductoasociado UUID NOT NULL REFERENCES ng_productos_inventario(id) ON DELETE CASCADE,
  cantidad NUMERIC(18, 4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Motivos de Baja
CREATE TABLE IF NOT EXISTS bajas_por_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  concepto VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MOVIMIENTOS DE INVENTARIO
-- =====================================================

-- Existencias (Stock actual)
CREATE TABLE IF NOT EXISTS il_existencias_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id) ON DELETE CASCADE,
  idalmacen UUID NOT NULL REFERENCES ng_almacen_inventario(id) ON DELETE CASCADE,
  cantidad NUMERIC(18, 4) NOT NULL DEFAULT 0,
  costo NUMERIC(18, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, idproducto, idalmacen)
);

-- Recepciones (Entradas de inventario)
CREATE TABLE IF NOT EXISTS il_recepciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  numero VARCHAR(255),
  fecha DATE NOT NULL,
  idalmacen UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  observaciones TEXT,
  anulada BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS il_recepciones_detalle_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idrecepcion UUID NOT NULL REFERENCES il_recepciones_inventario(id) ON DELETE CASCADE,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id),
  cantidad NUMERIC(18, 4) NOT NULL,
  costo NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transferencias (Movimientos entre almacenes)
CREATE TABLE IF NOT EXISTS il_transferencias_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  numero VARCHAR(255),
  fecha DATE NOT NULL,
  idalmacenorigen UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  idalmacendestino UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  observaciones TEXT,
  anulada BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS il_transferencias_detalle_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idtransferencia UUID NOT NULL REFERENCES il_transferencias_inventario(id) ON DELETE CASCADE,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id),
  cantidad NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vales de Salida (Ventas/Consumos)
CREATE TABLE IF NOT EXISTS il_valessalida_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  numero VARCHAR(255),
  fecha DATE NOT NULL,
  idalmacen UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  idarea UUID REFERENCES ng_areas_inventario(id),
  observaciones TEXT,
  anulada BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS il_valessalida_detalle_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idvalesalida UUID NOT NULL REFERENCES il_valessalida_inventario(id) ON DELETE CASCADE,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id),
  cantidad NUMERIC(18, 4) NOT NULL,
  precio NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vales con Monedas Extranjeras
CREATE TABLE IF NOT EXISTS il_valesmonedas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idvalesalida UUID NOT NULL REFERENCES il_valessalida_inventario(id) ON DELETE CASCADE,
  idmoneda UUID NOT NULL REFERENCES ng_monedas_inventario(id),
  monto NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bajas de Inventario
CREATE TABLE IF NOT EXISTS ng_bajas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  idalmacen UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id),
  idbajapor UUID NOT NULL REFERENCES bajas_por_inventario(id),
  cantidad NUMERIC(18, 4) NOT NULL,
  observaciones TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MÓDULO DE CAJA
-- =====================================================

-- Extracciones de Efectivo
CREATE TABLE IF NOT EXISTS il_extracciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto NUMERIC(18, 4) NOT NULL,
  observaciones TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fechas de Cierre de Caja
CREATE TABLE IF NOT EXISTS ng_fechacierre_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  cerrada BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, fecha)
);

-- Venta del Día (Snapshot de stock al cierre)
CREATE TABLE IF NOT EXISTS il_ventadia_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  idproducto UUID NOT NULL REFERENCES ng_productos_inventario(id),
  idalmacen UUID NOT NULL REFERENCES ng_almacen_inventario(id),
  cantidad NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_almacen_business ON ng_almacen_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_areas_business ON ng_areas_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_unidades_business ON unidadmedida_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_tipos_business ON ng_productostipos_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_monedas_business ON ng_monedas_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_productos_business ON ng_productos_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON ng_productos_inventario(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON ng_productos_inventario(activo);
CREATE INDEX IF NOT EXISTS idx_existencias_business ON il_existencias_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_existencias_producto ON il_existencias_inventario(idproducto);
CREATE INDEX IF NOT EXISTS idx_existencias_almacen ON il_existencias_inventario(idalmacen);
CREATE INDEX IF NOT EXISTS idx_recepciones_business ON il_recepciones_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_fecha ON il_recepciones_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_recepciones_anulada ON il_recepciones_inventario(anulada);
CREATE INDEX IF NOT EXISTS idx_transferencias_business ON il_transferencias_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_fecha ON il_transferencias_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_valessalida_business ON il_valessalida_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_valessalida_fecha ON il_valessalida_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_valessalida_anulada ON il_valessalida_inventario(anulada);
CREATE INDEX IF NOT EXISTS idx_bajas_business ON ng_bajas_inventario(business_id);
CREATE INDEX IF NOT EXISTS idx_bajas_fecha ON ng_bajas_inventario(fecha);

-- 5. RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE ng_almacen_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_areas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidadmedida_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_productostipos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_monedas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_productos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_productosasociados_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE bajas_por_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_existencias_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_recepciones_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_recepciones_detalle_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_transferencias_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_transferencias_detalle_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_valessalida_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_valessalida_detalle_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_valesmonedas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_bajas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_extracciones_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_fechacierre_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE il_ventadia_inventario ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - ALMACENES
-- =====================================================

CREATE POLICY "Users can view almacenes from their business"
  ON ng_almacen_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert almacenes in their business"
  ON ng_almacen_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update almacenes in their business"
  ON ng_almacen_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete almacenes in their business"
  ON ng_almacen_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - ÁREAS
-- =====================================================

CREATE POLICY "Users can view areas from their business"
  ON ng_areas_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert areas in their business"
  ON ng_areas_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update areas in their business"
  ON ng_areas_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete areas in their business"
  ON ng_areas_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - UNIDADES DE MEDIDA
-- =====================================================

CREATE POLICY "Users can view unidades from their business"
  ON unidadmedida_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert unidades in their business"
  ON unidadmedida_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update unidades in their business"
  ON unidadmedida_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete unidades in their business"
  ON unidadmedida_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - TIPOS DE PRODUCTOS
-- =====================================================

CREATE POLICY "Users can view tipos from their business"
  ON ng_productostipos_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tipos in their business"
  ON ng_productostipos_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tipos in their business"
  ON ng_productostipos_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tipos in their business"
  ON ng_productostipos_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - MONEDAS
-- =====================================================

CREATE POLICY "Users can view monedas from their business"
  ON ng_monedas_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert monedas in their business"
  ON ng_monedas_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update monedas in their business"
  ON ng_monedas_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete monedas in their business"
  ON ng_monedas_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - PRODUCTOS
-- =====================================================

CREATE POLICY "Users can view productos from their business"
  ON ng_productos_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert productos in their business"
  ON ng_productos_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update productos in their business"
  ON ng_productos_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete productos in their business"
  ON ng_productos_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - PRODUCTOS ASOCIADOS
-- =====================================================

CREATE POLICY "Users can view productos asociados from their business"
  ON ng_productosasociados_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert productos asociados in their business"
  ON ng_productosasociados_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update productos asociados in their business"
  ON ng_productosasociados_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete productos asociados in their business"
  ON ng_productosasociados_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - MOTIVOS DE BAJA
-- =====================================================

CREATE POLICY "Users can view bajas_por from their business"
  ON bajas_por_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bajas_por in their business"
  ON bajas_por_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bajas_por in their business"
  ON bajas_por_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bajas_por in their business"
  ON bajas_por_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - EXISTENCIAS
-- =====================================================

CREATE POLICY "Users can view existencias from their business"
  ON il_existencias_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert existencias in their business"
  ON il_existencias_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update existencias in their business"
  ON il_existencias_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete existencias in their business"
  ON il_existencias_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - RECEPCIONES
-- =====================================================

CREATE POLICY "Users can view recepciones from their business"
  ON il_recepciones_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recepciones in their business"
  ON il_recepciones_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recepciones in their business"
  ON il_recepciones_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recepciones in their business"
  ON il_recepciones_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - RECEPCIONES DETALLE
-- =====================================================

CREATE POLICY "Users can view recepciones detalle from their business"
  ON il_recepciones_detalle_inventario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM il_recepciones_inventario r
      WHERE r.id = idrecepcion
      AND r.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert recepciones detalle in their business"
  ON il_recepciones_detalle_inventario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM il_recepciones_inventario r
      WHERE r.id = idrecepcion
      AND r.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update recepciones detalle in their business"
  ON il_recepciones_detalle_inventario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM il_recepciones_inventario r
      WHERE r.id = idrecepcion
      AND r.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete recepciones detalle in their business"
  ON il_recepciones_detalle_inventario FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM il_recepciones_inventario r
      WHERE r.id = idrecepcion
      AND r.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLÍTICAS RLS - TRANSFERENCIAS
-- =====================================================

CREATE POLICY "Users can view transferencias from their business"
  ON il_transferencias_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transferencias in their business"
  ON il_transferencias_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transferencias in their business"
  ON il_transferencias_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transferencias in their business"
  ON il_transferencias_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - TRANSFERENCIAS DETALLE
-- =====================================================

CREATE POLICY "Users can view transferencias detalle from their business"
  ON il_transferencias_detalle_inventario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM il_transferencias_inventario t
      WHERE t.id = idtransferencia
      AND t.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert transferencias detalle in their business"
  ON il_transferencias_detalle_inventario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM il_transferencias_inventario t
      WHERE t.id = idtransferencia
      AND t.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update transferencias detalle in their business"
  ON il_transferencias_detalle_inventario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM il_transferencias_inventario t
      WHERE t.id = idtransferencia
      AND t.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete transferencias detalle in their business"
  ON il_transferencias_detalle_inventario FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM il_transferencias_inventario t
      WHERE t.id = idtransferencia
      AND t.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLÍTICAS RLS - VALES DE SALIDA
-- =====================================================

CREATE POLICY "Users can view vales salida from their business"
  ON il_valessalida_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vales salida in their business"
  ON il_valessalida_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vales salida in their business"
  ON il_valessalida_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vales salida in their business"
  ON il_valessalida_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - VALES DE SALIDA DETALLE
-- =====================================================

CREATE POLICY "Users can view vales salida detalle from their business"
  ON il_valessalida_detalle_inventario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert vales salida detalle in their business"
  ON il_valessalida_detalle_inventario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update vales salida detalle in their business"
  ON il_valessalida_detalle_inventario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete vales salida detalle in their business"
  ON il_valessalida_detalle_inventario FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLÍTICAS RLS - VALES MONEDAS
-- =====================================================

CREATE POLICY "Users can view vales monedas from their business"
  ON il_valesmonedas_inventario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert vales monedas in their business"
  ON il_valesmonedas_inventario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update vales monedas in their business"
  ON il_valesmonedas_inventario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete vales monedas in their business"
  ON il_valesmonedas_inventario FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM il_valessalida_inventario v
      WHERE v.id = idvalesalida
      AND v.business_id IN (
        SELECT business_id FROM user_module_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLÍTICAS RLS - BAJAS
-- =====================================================

CREATE POLICY "Users can view bajas from their business"
  ON ng_bajas_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bajas in their business"
  ON ng_bajas_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bajas in their business"
  ON ng_bajas_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bajas in their business"
  ON ng_bajas_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - EXTRACCIONES
-- =====================================================

CREATE POLICY "Users can view extracciones from their business"
  ON il_extracciones_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert extracciones in their business"
  ON il_extracciones_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update extracciones in their business"
  ON il_extracciones_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete extracciones in their business"
  ON il_extracciones_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - FECHA CIERRE
-- =====================================================

CREATE POLICY "Users can view fecha cierre from their business"
  ON ng_fechacierre_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fecha cierre in their business"
  ON ng_fechacierre_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fecha cierre in their business"
  ON ng_fechacierre_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fecha cierre in their business"
  ON ng_fechacierre_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS - VENTA DÍA
-- =====================================================

CREATE POLICY "Users can view venta dia from their business"
  ON il_ventadia_inventario FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert venta dia in their business"
  ON il_ventadia_inventario FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update venta dia in their business"
  ON il_ventadia_inventario FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete venta dia in their business"
  ON il_ventadia_inventario FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_module_permissions
      WHERE user_id = auth.uid()
    )
  );

-- 6. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar existencias al crear recepción
CREATE OR REPLACE FUNCTION actualizar_existencias_recepcion()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacen UUID;
BEGIN
  -- Obtener business_id y almacén de la recepción
  SELECT business_id, idalmacen INTO v_business_id, v_idalmacen
  FROM il_recepciones_inventario
  WHERE id = NEW.idrecepcion;
  
  -- Actualizar o insertar existencias
  INSERT INTO il_existencias_inventario (business_id, idproducto, idalmacen, cantidad, costo)
  VALUES (
    v_business_id,
    NEW.idproducto,
    v_idalmacen,
    NEW.cantidad,
    NEW.costo
  )
  ON CONFLICT (business_id, idproducto, idalmacen)
  DO UPDATE SET
    cantidad = il_existencias_inventario.cantidad + NEW.cantidad,
    costo = ((il_existencias_inventario.cantidad * il_existencias_inventario.costo) + (NEW.cantidad * NEW.costo)) / 
            NULLIF((il_existencias_inventario.cantidad + NEW.cantidad), 0),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_existencias_recepcion
AFTER INSERT ON il_recepciones_detalle_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_existencias_recepcion();

-- Trigger para actualizar existencias al crear transferencia
CREATE OR REPLACE FUNCTION actualizar_existencias_transferencia()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacenorigen UUID;
  v_idalmacendestino UUID;
  v_costo_promedio NUMERIC(18, 4);
BEGIN
  -- Obtener datos de la transferencia
  SELECT business_id, idalmacenorigen, idalmacendestino 
  INTO v_business_id, v_idalmacenorigen, v_idalmacendestino
  FROM il_transferencias_inventario
  WHERE id = NEW.idtransferencia;
  
  -- Obtener costo promedio del almacén origen
  SELECT costo INTO v_costo_promedio
  FROM il_existencias_inventario
  WHERE business_id = v_business_id
    AND idproducto = NEW.idproducto
    AND idalmacen = v_idalmacenorigen;
  
  -- Restar del almacén origen
  UPDATE il_existencias_inventario
  SET cantidad = cantidad - NEW.cantidad,
      updated_at = NOW()
  WHERE business_id = v_business_id
    AND idproducto = NEW.idproducto
    AND idalmacen = v_idalmacenorigen;
  
  -- Sumar al almacén destino
  INSERT INTO il_existencias_inventario (business_id, idproducto, idalmacen, cantidad, costo)
  VALUES (
    v_business_id,
    NEW.idproducto,
    v_idalmacendestino,
    NEW.cantidad,
    v_costo_promedio
  )
  ON CONFLICT (business_id, idproducto, idalmacen)
  DO UPDATE SET
    cantidad = il_existencias_inventario.cantidad + NEW.cantidad,
    costo = ((il_existencias_inventario.cantidad * il_existencias_inventario.costo) + (NEW.cantidad * v_costo_promedio)) / 
            NULLIF((il_existencias_inventario.cantidad + NEW.cantidad), 0),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_existencias_transferencia
AFTER INSERT ON il_transferencias_detalle_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_existencias_transferencia();

-- Trigger para actualizar existencias al crear vale de salida
CREATE OR REPLACE FUNCTION actualizar_existencias_valesalida()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacen UUID;
BEGIN
  -- Obtener datos del vale de salida
  SELECT business_id, idalmacen 
  INTO v_business_id, v_idalmacen
  FROM il_valessalida_inventario
  WHERE id = NEW.idvalesalida;
  
  -- Restar del almacén
  UPDATE il_existencias_inventario
  SET cantidad = cantidad - NEW.cantidad,
      updated_at = NOW()
  WHERE business_id = v_business_id
    AND idproducto = NEW.idproducto
    AND idalmacen = v_idalmacen;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_existencias_valesalida
AFTER INSERT ON il_valessalida_detalle_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_existencias_valesalida();

-- Trigger para actualizar existencias al crear baja
CREATE OR REPLACE FUNCTION actualizar_existencias_baja()
RETURNS TRIGGER AS $$
BEGIN
  -- Restar del almacén
  UPDATE il_existencias_inventario
  SET cantidad = cantidad - NEW.cantidad,
      updated_at = NOW()
  WHERE business_id = NEW.business_id
    AND idproducto = NEW.idproducto
    AND idalmacen = NEW.idalmacen;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_existencias_baja
AFTER INSERT ON ng_bajas_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_existencias_baja();

-- 7. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener existencias actuales
CREATE OR REPLACE FUNCTION obtener_existencias(
  p_business_id UUID,
  p_idalmacen UUID DEFAULT NULL
)
RETURNS TABLE (
  idproducto UUID,
  producto VARCHAR,
  almacen VARCHAR,
  cantidad NUMERIC,
  costo NUMERIC,
  valor_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.idproducto,
    p.producto,
    a.almacen,
    e.cantidad,
    e.costo,
    e.cantidad * e.costo AS valor_total
  FROM il_existencias_inventario e
  JOIN ng_productos_inventario p ON e.idproducto = p.id
  JOIN ng_almacen_inventario a ON e.idalmacen = a.id
  WHERE e.business_id = p_business_id
    AND (p_idalmacen IS NULL OR e.idalmacen = p_idalmacen)
    AND e.cantidad > 0
  ORDER BY p.producto;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar número de documento
CREATE OR REPLACE FUNCTION generar_numero_documento(
  p_business_id UUID,
  p_tipo VARCHAR,
  p_fecha DATE
)
RETURNS VARCHAR AS $$
DECLARE
  v_numero INTEGER;
  v_prefijo VARCHAR;
BEGIN
  -- Generar prefijo basado en tipo y fecha
  v_prefijo := UPPER(SUBSTRING(p_tipo, 1, 3)) || '-' || TO_CHAR(p_fecha, 'YYYYMM') || '-';
  
  -- Obtener el siguiente número secuencial
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM LENGTH(v_prefijo) + 1) AS INTEGER)), 0) + 1
  INTO v_numero
  FROM (
    SELECT numero FROM il_recepciones_inventario WHERE business_id = p_business_id AND numero LIKE v_prefijo || '%'
    UNION ALL
    SELECT numero FROM il_transferencias_inventario WHERE business_id = p_business_id AND numero LIKE v_prefijo || '%'
    UNION ALL
    SELECT numero FROM il_valessalida_inventario WHERE business_id = p_business_id AND numero LIKE v_prefijo || '%'
  ) AS documentos;
  
  RETURN v_prefijo || LPAD(v_numero::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. REGISTRAR MÓDULO EN SYSTEM_MODULES
-- =====================================================

INSERT INTO system_modules (name, slug, description, icon, is_active, display_order)
VALUES (
  'Inventario',
  'inventario',
  'Sistema completo de gestión de inventario, almacenes, productos y movimientos',
  'package',
  true,
  5
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
