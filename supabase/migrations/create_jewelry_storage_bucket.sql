-- =====================================================
-- CREAR BUCKET DE STORAGE PARA IMÁGENES DE JOYERÍA
-- =====================================================
-- Este script crea el bucket de storage para las imágenes
-- del módulo de joyería y configura las políticas de acceso.
--
-- Fecha: 2026-01-XX
-- Versión: 1.0
-- =====================================================

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jewelry-images',
  'jewelry-images',
  true,  -- Bucket público para que las imágenes sean accesibles
  5242880,  -- 5MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- POLÍTICAS DE ACCESO (RLS)
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir lectura pública de imágenes de joyería" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de imágenes autenticadas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes propias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes propias" ON storage.objects;

-- Política 1: Permitir lectura pública de todas las imágenes
CREATE POLICY "Permitir lectura pública de imágenes de joyería"
ON storage.objects FOR SELECT
USING (bucket_id = 'jewelry-images');

-- Política 2: Permitir subida de imágenes a usuarios autenticados
CREATE POLICY "Permitir subida de imágenes autenticadas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jewelry-images');

-- Política 3: Permitir actualización de imágenes a usuarios autenticados
CREATE POLICY "Permitir actualización de imágenes propias"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'jewelry-images')
WITH CHECK (bucket_id = 'jewelry-images');

-- Política 4: Permitir eliminación de imágenes a usuarios autenticados
CREATE POLICY "Permitir eliminación de imágenes propias"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'jewelry-images');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'jewelry-images';

-- Verificar políticas
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
WHERE tablename = 'objects'
  AND policyname LIKE '%joyería%' OR policyname LIKE '%jewelry%';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. El bucket es PÚBLICO para que las imágenes sean accesibles sin autenticación
-- 2. Solo usuarios autenticados pueden subir, actualizar o eliminar imágenes
-- 3. Límite de 5MB por archivo
-- 4. Formatos permitidos: JPEG, PNG, WebP, GIF
-- 5. Las imágenes se organizan en carpetas: joyas/, materiales/, etc.
-- =====================================================

-- =====================================================
-- ESTRUCTURA DE CARPETAS RECOMENDADA:
-- =====================================================
-- jewelry-images/
--   ├── joyas/           (Imágenes de productos terminados)
--   ├── materiales/      (Imágenes de materias primas)
--   ├── produccion/      (Imágenes del proceso de producción)
--   └── ventas/          (Imágenes relacionadas con ventas)
-- =====================================================
