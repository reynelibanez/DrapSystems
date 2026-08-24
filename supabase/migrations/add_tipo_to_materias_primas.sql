-- =====================================================
-- AGREGAR COLUMNA 'tipo' A jwl_materias_primas
-- =====================================================
-- Fecha: 2025-01-XX
-- Descripción: Agregar campo 'tipo' para especificar el tipo de material
--              (ej: "Oro 18k", "Rubí", "Nylon", etc.)

-- Agregar columna tipo (opcional)
ALTER TABLE jwl_materias_primas 
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Agregar comentario
COMMENT ON COLUMN jwl_materias_primas.tipo IS 'Tipo específico del material (ej: Oro 18k, Plata 925, Rubí, etc.)';

-- Crear índice para búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_jwl_materias_primas_tipo 
ON jwl_materias_primas(tipo);

-- Verificar que la columna se agregó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jwl_materias_primas' 
    AND column_name = 'tipo'
  ) THEN
    RAISE NOTICE '✅ Columna "tipo" agregada exitosamente a jwl_materias_primas';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo agregar la columna "tipo"';
  END IF;
END $$;
