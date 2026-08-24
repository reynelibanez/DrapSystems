





-- =====================================================
-- Migración: Agregar business_id a tablas de joyería
-- Fecha: 2025-01-XX
-- Descripción: Vincula todas las tablas del módulo de
--              joyería con la tabla businesses
-- =====================================================

-- Business ID a usar para datos existentes
-- IMPORTANTE: Cambiar este valor si es necesario
DO $$ 
DECLARE
  v_business_id UUID := '313b0fd7-67d8-4dfd-a878-f4a5692e6251';
BEGIN
  RAISE NOTICE 'Usando business_id: %', v_business_id;
END $$;

-- =====================================================
-- 1. TABLA: jwl_materias_primas
-- =====================================================
DO $$ 
BEGIN
  -- Agregar columna business_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jwl_materias_primas' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE jwl_materias_primas 
    ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Columna business_id agregada a jwl_materias_primas';
  ELSE
    RAISE NOTICE 'Columna business_id ya existe en jwl_materias_primas';
  END IF;
END $$;

-- Actualizar registros existentes
UPDATE jwl_materias_primas 
SET business_id = '313b0fd7-67d8-4dfd-a878-f4a5692e6251'
WHERE business_id IS NULL;

-- Hacer la columna NOT NULL
ALTER TABLE jwl_materias_primas 
ALTER COLUMN business_id SET NOT NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_jwl_materias_primas_business_id 
ON jwl_materias_primas(business_id);

-- =====================================================
-- 2. TABLA: jwl_joyas
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jwl_joyas' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE jwl_joyas 
    ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Columna business_id agregada a jwl_joyas';
  ELSE
    RAISE NOTICE 'Columna business_id ya existe en jwl_joyas';
  END IF;
END $$;

UPDATE jwl_joyas 
SET business_id = '313b0fd7-67d8-4dfd-a878-f4a5692e6251'
WHERE business_id IS NULL;

ALTER TABLE jwl_joyas 
ALTER COLUMN business_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jwl_joyas_business_id 
ON jwl_joyas(business_id);

-- =====================================================
-- 3. TABLA: jwl_produccion
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jwl_produccion' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE jwl_produccion 
    ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Columna business_id agregada a jwl_produccion';
  ELSE
    RAISE NOTICE 'Columna business_id ya existe en jwl_produccion';
  END IF;
END $$;

UPDATE jwl_produccion 
SET business_id = '313b0fd7-67d8-4dfd-a878-f4a5692e6251'
WHERE business_id IS NULL;

ALTER TABLE jwl_produccion 
ALTER COLUMN business_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jwl_produccion_business_id 
ON jwl_produccion(business_id);

-- =====================================================
-- 4. TABLA: jwl_ventas
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jwl_ventas' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE jwl_ventas 
    ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Columna business_id agregada a jwl_ventas';
  ELSE
    RAISE NOTICE 'Columna business_id ya existe en jwl_ventas';
  END IF;
END $$;

UPDATE jwl_ventas 
SET business_id = '313b0fd7-67d8-4dfd-a878-f4a5692e6251'
WHERE business_id IS NULL;

ALTER TABLE jwl_ventas 
ALTER COLUMN business_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jwl_ventas_business_id 
ON jwl_ventas(business_id);

-- =====================================================
-- 5. TABLA: jwl_gastos_generales
-- =====================================================

-- Agregar columna business_id si no existe
ALTER TABLE jwl_gastos_generales 
ADD COLUMN IF NOT EXISTS business_id UUID;

-- Actualizar registros existentes con el business_id
UPDATE jwl_gastos_generales
SET business_id = '313b0fd7-67d8-4dfd-a878-f4a5692e6251'
WHERE business_id IS NULL;

-- Hacer la columna NOT NULL después de actualizar
ALTER TABLE jwl_gastos_generales 
ALTER COLUMN business_id SET NOT NULL;

-- Agregar foreign key constraint si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jwl_gastos_generales_business_id_fkey'
  ) THEN
    ALTER TABLE jwl_gastos_generales
    ADD CONSTRAINT jwl_gastos_generales_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice para business_id si no existe
CREATE INDEX IF NOT EXISTS idx_jwl_gastos_generales_business_id 
ON jwl_gastos_generales(business_id);

-- Actualizar RLS policy
DROP POLICY IF EXISTS "jwl_gastos_generales_policy" ON jwl_gastos_generales;

CREATE POLICY "jwl_gastos_generales_policy" ON jwl_gastos_generales
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM businesses b
    INNER JOIN profiles p ON p.business_id = b.id
    WHERE p.id = auth.uid()
  )
);

-- Agregar comentario
COMMENT ON COLUMN jwl_gastos_generales.business_id IS 'ID del negocio al que pertenece este gasto';

-- =====================================================
-- 6. POLÍTICAS RLS - jwl_materias_primas
-- =====================================================
ALTER TABLE jwl_materias_primas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jwl_materias_primas_select_policy" ON jwl_materias_primas;
DROP POLICY IF EXISTS "jwl_materias_primas_insert_policy" ON jwl_materias_primas;
DROP POLICY IF EXISTS "jwl_materias_primas_update_policy" ON jwl_materias_primas;
DROP POLICY IF EXISTS "jwl_materias_primas_delete_policy" ON jwl_materias_primas;

CREATE POLICY "jwl_materias_primas_select_policy" ON jwl_materias_primas
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "jwl_materias_primas_insert_policy" ON jwl_materias_primas
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_materias_primas_update_policy" ON jwl_materias_primas
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_materias_primas_delete_policy" ON jwl_materias_primas
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 7. POLÍTICAS RLS - jwl_joyas
-- =====================================================
ALTER TABLE jwl_joyas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jwl_joyas_select_policy" ON jwl_joyas;
DROP POLICY IF EXISTS "jwl_joyas_insert_policy" ON jwl_joyas;
DROP POLICY IF EXISTS "jwl_joyas_update_policy" ON jwl_joyas;
DROP POLICY IF EXISTS "jwl_joyas_delete_policy" ON jwl_joyas;

CREATE POLICY "jwl_joyas_select_policy" ON jwl_joyas
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "jwl_joyas_insert_policy" ON jwl_joyas
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_joyas_update_policy" ON jwl_joyas
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_joyas_delete_policy" ON jwl_joyas
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 8. POLÍTICAS RLS - jwl_produccion
-- =====================================================
ALTER TABLE jwl_produccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jwl_produccion_select_policy" ON jwl_produccion;
DROP POLICY IF EXISTS "jwl_produccion_insert_policy" ON jwl_produccion;
DROP POLICY IF EXISTS "jwl_produccion_update_policy" ON jwl_produccion;
DROP POLICY IF EXISTS "jwl_produccion_delete_policy" ON jwl_produccion;

CREATE POLICY "jwl_produccion_select_policy" ON jwl_produccion
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "jwl_produccion_insert_policy" ON jwl_produccion
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_produccion_update_policy" ON jwl_produccion
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_produccion_delete_policy" ON jwl_produccion
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 9. POLÍTICAS RLS - jwl_ventas
-- =====================================================
ALTER TABLE jwl_ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jwl_ventas_select_policy" ON jwl_ventas;
DROP POLICY IF EXISTS "jwl_ventas_insert_policy" ON jwl_ventas;
DROP POLICY IF EXISTS "jwl_ventas_update_policy" ON jwl_ventas;
DROP POLICY IF EXISTS "jwl_ventas_delete_policy" ON jwl_ventas;

CREATE POLICY "jwl_ventas_select_policy" ON jwl_ventas
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "jwl_ventas_insert_policy" ON jwl_ventas
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_ventas_update_policy" ON jwl_ventas
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_ventas_delete_policy" ON jwl_ventas
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 10. POLÍTICAS RLS - jwl_gastos_generales
-- =====================================================

DROP POLICY IF EXISTS "jwl_gastos_generales_policy" ON jwl_gastos_generales;

CREATE POLICY "jwl_gastos_generales_policy" ON jwl_gastos_generales
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM businesses b
    INNER JOIN profiles p ON p.business_id = b.id
    WHERE p.id = auth.uid()
  )
);

-- =====================================================
-- 11. VERIFICAR jwl_configuracion_moneda
-- =====================================================
-- Esta tabla ya debe tener business_id, solo verificamos RLS
ALTER TABLE jwl_configuracion_moneda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jwl_configuracion_moneda_select_policy" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "jwl_configuracion_moneda_insert_policy" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "jwl_configuracion_moneda_update_policy" ON jwl_configuracion_moneda;
DROP POLICY IF EXISTS "jwl_configuracion_moneda_delete_policy" ON jwl_configuracion_moneda;

CREATE POLICY "jwl_configuracion_moneda_select_policy" ON jwl_configuracion_moneda
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "jwl_configuracion_moneda_insert_policy" ON jwl_configuracion_moneda
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_configuracion_moneda_update_policy" ON jwl_configuracion_moneda
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "jwl_configuracion_moneda_delete_policy" ON jwl_configuracion_moneda
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      INNER JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'owner'
    )
  );

-- =====================================================
-- 10. CREAR CONFIGURACIÓN DE MONEDA SI NO EXISTE
-- =====================================================

-- Obtener el ID de la moneda MXN (o CLP si MXN no existe)
DO $$ 
DECLARE
  v_moneda_id UUID;
  v_business_id UUID := '313b0fd7-67d8-4dfd-a878-f4a5692e6251';
BEGIN
  -- Intentar obtener MXN primero
  SELECT id INTO v_moneda_id
  FROM jwl_monedas
  WHERE codigo = 'MXN'
  LIMIT 1;
  
  -- Si no existe MXN, usar CLP (moneda base)
  IF v_moneda_id IS NULL THEN
    SELECT id INTO v_moneda_id
    FROM jwl_monedas
    WHERE es_moneda_base = true
    LIMIT 1;
  END IF;
  
  -- Si encontramos una moneda, crear la configuración
  IF v_moneda_id IS NOT NULL THEN
    INSERT INTO jwl_configuracion_moneda (business_id, moneda_id)
    SELECT v_business_id, v_moneda_id
    WHERE NOT EXISTS (
      SELECT 1 FROM jwl_configuracion_moneda 
      WHERE business_id = v_business_id
    );
    
    RAISE NOTICE 'Configuración de moneda creada/verificada para business_id: %', v_business_id;
  ELSE
    RAISE WARNING 'No se encontró ninguna moneda en jwl_monedas. Ejecuta primero add_currency_system_jewelry.sql';
  END IF;
END $$;

-- =====================================================
-- 11. VERIFICACIÓN FINAL
-- =====================================================

-- =====================================================
-- RESUMEN
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Resumen:';
  RAISE NOTICE '   - Columna business_id agregada a todas las tablas';
  RAISE NOTICE '   - Datos existentes asociados al business_id especificado';
  RAISE NOTICE '   - Índices creados para mejor performance';
  RAISE NOTICE '   - Políticas RLS actualizadas';
  RAISE NOTICE '   - Solo se mostrará información del negocio del usuario';
END $$;






