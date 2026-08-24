-- =====================================================
-- FIX: Políticas RLS para jwl_configuracion_moneda
-- =====================================================
-- Corrige el error 406 al consultar la configuración de moneda
-- Fecha: 2026-01-XX
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir lectura de configuración de moneda" ON public.jwl_configuracion_moneda;
DROP POLICY IF EXISTS "Permitir gestión de configuración de moneda" ON public.jwl_configuracion_moneda;

-- =====================================================
-- POLÍTICA: Lectura de configuración de moneda
-- =====================================================
-- Permite a usuarios autenticados leer la configuración de moneda
-- de su propio negocio o si son administradores
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
-- Permite a propietarios y administradores crear configuración
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
-- Permite a propietarios y administradores actualizar configuración
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
-- Permite a propietarios y administradores eliminar configuración
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
-- VERIFICACIÓN
-- =====================================================
-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jwl_configuracion_moneda'
ORDER BY policyname;

-- =====================================================
-- CREAR CONFIGURACIÓN POR DEFECTO PARA NEGOCIOS EXISTENTES
-- =====================================================
-- Inserta configuración de moneda CLP para todos los negocios
-- que tienen acceso al módulo de joyería pero no tienen configuración
INSERT INTO public.jwl_configuracion_moneda (business_id, moneda_id)
SELECT 
  b.id,
  (SELECT id FROM public.jwl_monedas WHERE codigo = 'CLP' LIMIT 1)
FROM public.businesses b
WHERE 
  -- El negocio tiene el módulo de joyería habilitado
  'jewelry' = ANY(b.enabled_modules)
  -- Y no tiene configuración de moneda
  AND NOT EXISTS (
    SELECT 1 
    FROM public.jwl_configuracion_moneda cm
    WHERE cm.business_id = b.id
  )
ON CONFLICT (business_id) DO NOTHING;

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Estas políticas permiten a todos los usuarios del negocio
--    leer la configuración de moneda
-- 2. Solo propietarios y administradores pueden modificarla
-- 3. Se crea automáticamente configuración CLP para negocios
--    que tienen el módulo de joyería habilitado
-- =====================================================
