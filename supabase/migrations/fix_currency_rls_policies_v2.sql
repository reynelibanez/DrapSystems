-- =====================================================
-- FIX: Políticas RLS para jwl_configuracion_moneda V2
-- =====================================================
-- Corrige el error 406 al consultar la configuración de moneda
-- Fecha: 2026-01-XX
-- =====================================================

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'jwl_configuracion_moneda'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.jwl_configuracion_moneda';
    END LOOP;
END $$;

-- =====================================================
-- POLÍTICA: Lectura de configuración de moneda
-- =====================================================
CREATE POLICY "jwl_configuracion_moneda_select_policy"
ON public.jwl_configuracion_moneda
FOR SELECT
TO authenticated
USING (
  -- El usuario pertenece al negocio
  business_id IN (
    SELECT business_id 
    FROM public.profiles
    WHERE id = auth.uid()
    AND business_id IS NOT NULL
  )
  OR
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================================
-- POLÍTICA: Inserción de configuración de moneda
-- =====================================================
CREATE POLICY "jwl_configuracion_moneda_insert_policy"
ON public.jwl_configuracion_moneda
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es propietario del negocio
  business_id IN (
    SELECT business_id 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('business_owner', 'admin')
  )
  OR
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================================
-- POLÍTICA: Actualización de configuración de moneda
-- =====================================================
CREATE POLICY "jwl_configuracion_moneda_update_policy"
ON public.jwl_configuracion_moneda
FOR UPDATE
TO authenticated
USING (
  -- El usuario es propietario del negocio
  business_id IN (
    SELECT business_id 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('business_owner', 'admin')
  )
  OR
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  -- El usuario es propietario del negocio
  business_id IN (
    SELECT business_id 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('business_owner', 'admin')
  )
  OR
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================================
-- POLÍTICA: Eliminación de configuración de moneda
-- =====================================================
CREATE POLICY "jwl_configuracion_moneda_delete_policy"
ON public.jwl_configuracion_moneda
FOR DELETE
TO authenticated
USING (
  -- El usuario es propietario del negocio
  business_id IN (
    SELECT business_id 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('business_owner', 'admin')
  )
  OR
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================================
-- CREAR CONFIGURACIÓN POR DEFECTO PARA NEGOCIOS EXISTENTES
-- =====================================================
INSERT INTO public.jwl_configuracion_moneda (business_id, moneda_id)
SELECT 
  b.id,
  (SELECT id FROM public.jwl_monedas WHERE codigo = 'CLP' LIMIT 1)
FROM public.businesses b
WHERE 
  'jewelry' = ANY(b.enabled_modules)
  AND NOT EXISTS (
    SELECT 1 
    FROM public.jwl_configuracion_moneda cm
    WHERE cm.business_id = b.id
  )
ON CONFLICT (business_id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'jwl_configuracion_moneda'
ORDER BY policyname;
