-- Agregar columna imagen_url a jwl_materias_primas
-- Esta columna permite almacenar la URL de la imagen del material

ALTER TABLE jwl_materias_primas 
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN jwl_materias_primas.imagen_url IS 'URL de la imagen del material almacenada en Supabase Storage';

-- Verificar que la columna se agregó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jwl_materias_primas' 
    AND column_name = 'imagen_url'
  ) THEN
    RAISE NOTICE '✅ Columna imagen_url agregada correctamente a jwl_materias_primas';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo agregar la columna imagen_url';
  END IF;
END $$;
