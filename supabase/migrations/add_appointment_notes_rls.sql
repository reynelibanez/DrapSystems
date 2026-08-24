-- =====================================================
-- POLÍTICAS RLS PARA APPOINTMENT_NOTES
-- =====================================================
-- Fecha: 2026-01-XX
-- Descripción: Políticas de seguridad para notas de citas
-- =====================================================

-- Habilitar RLS
ALTER TABLE appointment_notes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "appointment_notes_select_policy" ON appointment_notes;
DROP POLICY IF EXISTS "appointment_notes_insert_policy" ON appointment_notes;
DROP POLICY IF EXISTS "appointment_notes_update_policy" ON appointment_notes;
DROP POLICY IF EXISTS "appointment_notes_delete_policy" ON appointment_notes;

-- =====================================================
-- POLÍTICA DE LECTURA (SELECT)
-- =====================================================
-- Permite leer notas si:
-- 1. Eres admin
-- 2. Eres el dueño del negocio
-- 3. Eres staff del negocio
-- 4. Eres el cliente (solo notas no privadas)
CREATE POLICY "appointment_notes_select_policy" ON appointment_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Admin puede ver todas
      profiles.role = 'admin'
      OR
      -- Owner del negocio puede ver todas
      (profiles.role = 'business_owner' AND profiles.business_id = appointment_notes.business_id)
      OR
      -- Staff del negocio puede ver todas
      (profiles.role = 'staff' AND profiles.business_id = appointment_notes.business_id)
      OR
      -- Cliente puede ver solo sus notas no privadas
      (profiles.role = 'client' AND profiles.id = appointment_notes.client_id AND appointment_notes.is_private = false)
    )
  )
);

-- =====================================================
-- POLÍTICA DE INSERCIÓN (INSERT)
-- =====================================================
-- Permite crear notas si:
-- 1. Eres admin
-- 2. Eres el dueño del negocio
-- 3. Eres staff del negocio
CREATE POLICY "appointment_notes_insert_policy" ON appointment_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR
      (profiles.role = 'business_owner' AND profiles.business_id = appointment_notes.business_id)
      OR
      (profiles.role = 'staff' AND profiles.business_id = appointment_notes.business_id)
    )
  )
);

-- =====================================================
-- POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- =====================================================
-- Permite actualizar notas si:
-- 1. Eres admin
-- 2. Eres el dueño del negocio
-- 3. Eres el staff que creó la nota
CREATE POLICY "appointment_notes_update_policy" ON appointment_notes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR
      (profiles.role = 'business_owner' AND profiles.business_id = appointment_notes.business_id)
      OR
      (profiles.role = 'staff' AND profiles.id = appointment_notes.staff_id)
    )
  )
);

-- =====================================================
-- POLÍTICA DE ELIMINACIÓN (DELETE)
-- =====================================================
-- Permite eliminar notas si:
-- 1. Eres admin
-- 2. Eres el dueño del negocio
-- 3. Eres el staff que creó la nota
CREATE POLICY "appointment_notes_delete_policy" ON appointment_notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR
      (profiles.role = 'business_owner' AND profiles.business_id = appointment_notes.business_id)
      OR
      (profiles.role = 'staff' AND profiles.id = appointment_notes.staff_id)
    )
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
WHERE tablename = 'appointment_notes'
ORDER BY policyname;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON POLICY "appointment_notes_select_policy" ON appointment_notes IS 
'Permite leer notas a admin, owner, staff del negocio y cliente (solo no privadas)';

COMMENT ON POLICY "appointment_notes_insert_policy" ON appointment_notes IS 
'Permite crear notas a admin, owner y staff del negocio';

COMMENT ON POLICY "appointment_notes_update_policy" ON appointment_notes IS 
'Permite actualizar notas a admin, owner del negocio y staff que creó la nota';

COMMENT ON POLICY "appointment_notes_delete_policy" ON appointment_notes IS 
'Permite eliminar notas a admin, owner del negocio y staff que creó la nota';
