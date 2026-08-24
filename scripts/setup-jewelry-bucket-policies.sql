-- =====================================================
-- CONFIGURAR POLÍTICAS RLS PARA BUCKET DE JOYERÍA
-- =====================================================
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "jewelry_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "jewelry_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "jewelry_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "jewelry_images_authenticated_delete" ON storage.objects;

-- Política 1: Permitir lectura pública de todas las imágenes
CREATE POLICY "jewelry_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'jewelry-images');

-- Política 2: Permitir subida de imágenes a usuarios autenticados
CREATE POLICY "jewelry_images_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jewelry-images');

-- Política 3: Permitir actualización de imágenes a usuarios autenticados
CREATE POLICY "jewelry_images_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'jewelry-images')
WITH CHECK (bucket_id = 'jewelry-images');

-- Política 4: Permitir eliminación de imágenes a usuarios autenticados
CREATE POLICY "jewelry_images_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'jewelry-images');

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE 'jewelry_images%'
ORDER BY policyname;
