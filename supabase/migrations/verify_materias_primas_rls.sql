-- Verificar y corregir políticas RLS para jwl_materias_primas
-- Este script asegura que los usuarios puedan eliminar sus propias materias primas

-- 1. Ver políticas actuales
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
WHERE tablename = 'jwl_materias_primas';

-- 2. Eliminar política de DELETE si existe
DROP POLICY IF EXISTS "Users can delete their own materias primas" ON jwl_materias_primas;
DROP POLICY IF EXISTS "Users can delete materias primas" ON jwl_materias_primas;
DROP POLICY IF EXISTS "Delete materias primas" ON jwl_materias_primas;

-- 3. Crear política de DELETE correcta
CREATE POLICY "Users can delete their own materias primas"
ON jwl_materias_primas
FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- 4. Verificar que RLS esté habilitado
ALTER TABLE jwl_materias_primas ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas después de la creación
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'jwl_materias_primas'
ORDER BY cmd;
