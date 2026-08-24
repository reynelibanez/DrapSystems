-- Agregar columna object_3d_id a jwl_materias_primas
-- Esta columna almacena el ID del objeto 3D predefinido

ALTER TABLE jwl_materias_primas
ADD COLUMN IF NOT EXISTS object_3d_id TEXT;

-- Agregar índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_jwl_materias_primas_object_3d_id 
ON jwl_materias_primas(object_3d_id);

-- Comentario para documentación
COMMENT ON COLUMN jwl_materias_primas.object_3d_id IS 'ID del objeto 3D predefinido para visualización';
