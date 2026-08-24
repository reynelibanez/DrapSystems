-- Agregar columnas faltantes a jwl_produccion
-- materiales_usados: Array JSON con los materiales usados en cada producción
-- peso_producto: Peso del producto en gramos (opcional)

ALTER TABLE jwl_produccion 
ADD COLUMN IF NOT EXISTS materiales_usados JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS peso_producto NUMERIC(10,2);

-- Agregar comentarios a las columnas
COMMENT ON COLUMN jwl_produccion.materiales_usados IS 'Array JSON con los materiales usados: [{"material_id": "uuid", "cantidad": number}]';
COMMENT ON COLUMN jwl_produccion.peso_producto IS 'Peso del producto en gramos (opcional)';

-- Verificar que las columnas se agregaron correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jwl_produccion' 
    AND column_name = 'materiales_usados'
  ) THEN
    RAISE NOTICE '✅ Columna materiales_usados agregada correctamente a jwl_produccion';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo agregar la columna materiales_usados';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jwl_produccion' 
    AND column_name = 'peso_producto'
  ) THEN
    RAISE NOTICE '✅ Columna peso_producto agregada correctamente a jwl_produccion';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo agregar la columna peso_producto';
  END IF;
END $$;

