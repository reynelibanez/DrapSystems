-- Crear tabla de unidades de medida para joyería
CREATE TABLE IF NOT EXISTS public.jwl_unidades_medida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  abreviatura VARCHAR(20) NOT NULL,
  tipo VARCHAR(50), -- 'peso', 'longitud', 'volumen', 'cantidad', etc.
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, nombre),
  UNIQUE(business_id, abreviatura)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_jwl_unidades_business ON public.jwl_unidades_medida(business_id);
CREATE INDEX IF NOT EXISTS idx_jwl_unidades_activo ON public.jwl_unidades_medida(activo);

-- RLS Policies
ALTER TABLE public.jwl_unidades_medida ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
DROP POLICY IF EXISTS "Users can view units from their business" ON public.jwl_unidades_medida;
CREATE POLICY "Users can view units from their business"
  ON public.jwl_unidades_medida
  FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy para INSERT
DROP POLICY IF EXISTS "Users can insert units for their business" ON public.jwl_unidades_medida;
CREATE POLICY "Users can insert units for their business"
  ON public.jwl_unidades_medida
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy para UPDATE
DROP POLICY IF EXISTS "Users can update units from their business" ON public.jwl_unidades_medida;
CREATE POLICY "Users can update units from their business"
  ON public.jwl_unidades_medida
  FOR UPDATE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy para DELETE
DROP POLICY IF EXISTS "Users can delete units from their business" ON public.jwl_unidades_medida;
CREATE POLICY "Users can delete units from their business"
  ON public.jwl_unidades_medida
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN profiles p ON p.business_id = b.id
      WHERE p.id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_jwl_unidades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jwl_unidades_updated_at_trigger ON public.jwl_unidades_medida;
CREATE TRIGGER update_jwl_unidades_updated_at_trigger
  BEFORE UPDATE ON public.jwl_unidades_medida
  FOR EACH ROW
  EXECUTE FUNCTION update_jwl_unidades_updated_at();

-- Insertar unidades de medida comunes (se insertarán para cada negocio cuando se active el módulo)
-- Estas son solo ejemplos, cada negocio tendrá sus propias unidades
COMMENT ON TABLE public.jwl_unidades_medida IS 'Unidades de medida personalizables por negocio para materias primas de joyería';

-- Función para insertar unidades por defecto cuando un negocio activa el módulo de joyería
CREATE OR REPLACE FUNCTION insert_default_jewelry_units(p_business_id UUID)
RETURNS void AS $$
BEGIN
  -- Solo insertar si no existen unidades para este negocio
  IF NOT EXISTS (SELECT 1 FROM jwl_unidades_medida WHERE business_id = p_business_id) THEN
    INSERT INTO jwl_unidades_medida (business_id, nombre, abreviatura, tipo) VALUES
    -- Peso
    (p_business_id, 'Gramos', 'g', 'peso'),
    (p_business_id, 'Kilogramos', 'kg', 'peso'),
    (p_business_id, 'Onzas', 'oz', 'peso'),
    (p_business_id, 'Quilates', 'ct', 'peso'),
    (p_business_id, 'Miligramos', 'mg', 'peso'),
    
    -- Longitud
    (p_business_id, 'Metros', 'm', 'longitud'),
    (p_business_id, 'Centímetros', 'cm', 'longitud'),
    (p_business_id, 'Milímetros', 'mm', 'longitud'),
    (p_business_id, 'Pulgadas', 'in', 'longitud'),
    
    -- Volumen
    (p_business_id, 'Litros', 'L', 'volumen'),
    (p_business_id, 'Mililitros', 'ml', 'volumen'),
    
    -- Cantidad
    (p_business_id, 'Unidades', 'ud', 'cantidad'),
    (p_business_id, 'Piezas', 'pz', 'cantidad'),
    (p_business_id, 'Docenas', 'doc', 'cantidad'),
    (p_business_id, 'Pares', 'par', 'cantidad');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

