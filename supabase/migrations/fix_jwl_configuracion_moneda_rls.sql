-- =====================================================
-- FIX: Políticas RLS para jwl_configuracion_moneda
-- =====================================================
-- Problema: La política actual no permite INSERT correctamente
-- Solución: Separar políticas para SELECT, INSERT, UPDATE, DELETE
-- =====================================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Permitir gestión de configuración de moneda" ON public.jwl_configuracion_moneda;

-- Política para SELECT
DROP POLICY IF EXISTS "Permitir lectura de configuración de moneda" ON public.jwl_configuracion_moneda;
CREATE POLICY "Permitir lectura de configuración de moneda"
ON public.jwl_configuracion_moneda FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para INSERT
DROP POLICY IF EXISTS "Permitir insertar configuración de moneda" ON public.jwl_configuracion_moneda;
CREATE POLICY "Permitir insertar configuración de moneda"
ON public.jwl_configuracion_moneda FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'business_owner')
  )
);

-- Política para UPDATE
DROP POLICY IF EXISTS "Permitir actualizar configuración de moneda" ON public.jwl_configuracion_moneda;
CREATE POLICY "Permitir actualizar configuración de moneda"
ON public.jwl_configuracion_moneda FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'business_owner')
  )
)
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'business_owner')
  )
);

-- Política para DELETE
DROP POLICY IF EXISTS "Permitir eliminar configuración de moneda" ON public.jwl_configuracion_moneda;
CREATE POLICY "Permitir eliminar configuración de moneda"
ON public.jwl_configuracion_moneda FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'business_owner')
  )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ver todas las políticas de la tabla
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
