-- =====================================================
-- SISTEMA DE MÚLTIPLES MONEDAS PARA MÓDULO DE JOYERÍA
-- =====================================================
-- Este script crea el sistema de gestión de monedas
-- para el módulo de joyería, permitiendo visualizar
-- importes en diferentes monedas.
--
-- Fecha: 2026-01-XX
-- Versión: 1.0
-- =====================================================

-- =====================================================
-- TABLA: jwl_monedas
-- =====================================================
-- Almacena las monedas disponibles y sus tasas de cambio
CREATE TABLE IF NOT EXISTS public.jwl_monedas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(3) NOT NULL UNIQUE, -- CLP, USD, EUR, etc.
  nombre VARCHAR(50) NOT NULL,
  simbolo VARCHAR(10) NOT NULL,
  tasa_cambio DECIMAL(15, 6) NOT NULL DEFAULT 1.0, -- Tasa respecto a la moneda base
  es_moneda_base BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: jwl_configuracion_moneda
-- =====================================================
-- Almacena la configuración de moneda por negocio
CREATE TABLE IF NOT EXISTS public.jwl_configuracion_moneda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  moneda_id UUID NOT NULL REFERENCES public.jwl_monedas(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

-- =====================================================
-- INSERTAR MONEDAS INICIALES
-- =====================================================

-- Peso Chileno (moneda base)
INSERT INTO public.jwl_monedas (codigo, nombre, simbolo, tasa_cambio, es_moneda_base, activo)
VALUES ('CLP', 'Peso Chileno', '$', 1.0, true, true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  simbolo = EXCLUDED.simbolo,
  tasa_cambio = EXCLUDED.tasa_cambio,
  es_moneda_base = EXCLUDED.es_moneda_base,
  activo = EXCLUDED.activo;

-- Dólar Estadounidense
INSERT INTO public.jwl_monedas (codigo, nombre, simbolo, tasa_cambio, es_moneda_base, activo)
VALUES ('USD', 'Dólar Estadounidense', '$', 0.0011, false, true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  simbolo = EXCLUDED.simbolo,
  tasa_cambio = EXCLUDED.tasa_cambio,
  es_moneda_base = EXCLUDED.es_moneda_base,
  activo = EXCLUDED.activo;

-- Euro
INSERT INTO public.jwl_monedas (codigo, nombre, simbolo, tasa_cambio, es_moneda_base, activo)
VALUES ('EUR', 'Euro', '€', 0.0010, false, true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  simbolo = EXCLUDED.simbolo,
  tasa_cambio = EXCLUDED.tasa_cambio,
  es_moneda_base = EXCLUDED.es_moneda_base,
  activo = EXCLUDED.activo;

-- =====================================================
-- FUNCIÓN: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_jwl_monedas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_jwl_configuracion_moneda_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_jwl_monedas_updated_at ON public.jwl_monedas;
CREATE TRIGGER trigger_update_jwl_monedas_updated_at
  BEFORE UPDATE ON public.jwl_monedas
  FOR EACH ROW
  EXECUTE FUNCTION update_jwl_monedas_updated_at();

DROP TRIGGER IF EXISTS trigger_update_jwl_configuracion_moneda_updated_at ON public.jwl_configuracion_moneda;
CREATE TRIGGER trigger_update_jwl_configuracion_moneda_updated_at
  BEFORE UPDATE ON public.jwl_configuracion_moneda
  FOR EACH ROW
  EXECUTE FUNCTION update_jwl_configuracion_moneda_updated_at();

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.jwl_monedas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jwl_configuracion_moneda ENABLE ROW LEVEL SECURITY;

-- Políticas para jwl_monedas
DROP POLICY IF EXISTS "Permitir lectura de monedas a usuarios autenticados" ON public.jwl_monedas;
CREATE POLICY "Permitir lectura de monedas a usuarios autenticados"
ON public.jwl_monedas FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir gestión de monedas a admins" ON public.jwl_monedas;
CREATE POLICY "Permitir gestión de monedas a admins"
ON public.jwl_monedas FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Políticas para jwl_configuracion_moneda
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

DROP POLICY IF EXISTS "Permitir gestión de configuración de moneda" ON public.jwl_configuracion_moneda;
CREATE POLICY "Permitir gestión de configuración de moneda"
ON public.jwl_configuracion_moneda FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'business_owner')
  )
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_jwl_monedas_codigo ON public.jwl_monedas(codigo);
CREATE INDEX IF NOT EXISTS idx_jwl_monedas_activo ON public.jwl_monedas(activo);
CREATE INDEX IF NOT EXISTS idx_jwl_configuracion_moneda_business ON public.jwl_configuracion_moneda(business_id);
CREATE INDEX IF NOT EXISTS idx_jwl_configuracion_moneda_moneda ON public.jwl_configuracion_moneda(moneda_id);

-- =====================================================
-- FUNCIÓN: Convertir monto entre monedas
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_convertir_moneda(
  p_monto DECIMAL,
  p_moneda_origen_codigo VARCHAR(3),
  p_moneda_destino_codigo VARCHAR(3)
)
RETURNS DECIMAL AS $$
DECLARE
  v_tasa_origen DECIMAL;
  v_tasa_destino DECIMAL;
  v_monto_base DECIMAL;
  v_monto_convertido DECIMAL;
BEGIN
  -- Obtener tasa de cambio de moneda origen
  SELECT tasa_cambio INTO v_tasa_origen
  FROM public.jwl_monedas
  WHERE codigo = p_moneda_origen_codigo AND activo = true;
  
  -- Obtener tasa de cambio de moneda destino
  SELECT tasa_cambio INTO v_tasa_destino
  FROM public.jwl_monedas
  WHERE codigo = p_moneda_destino_codigo AND activo = true;
  
  -- Si no se encuentran las monedas, retornar el monto original
  IF v_tasa_origen IS NULL OR v_tasa_destino IS NULL THEN
    RETURN p_monto;
  END IF;
  
  -- Convertir a moneda base
  v_monto_base := p_monto / v_tasa_origen;
  
  -- Convertir a moneda destino
  v_monto_convertido := v_monto_base * v_tasa_destino;
  
  RETURN v_monto_convertido;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Obtener moneda configurada para un negocio
-- =====================================================
CREATE OR REPLACE FUNCTION jwl_get_moneda_negocio(p_business_id UUID)
RETURNS TABLE (
  codigo VARCHAR(3),
  nombre VARCHAR(50),
  simbolo VARCHAR(10),
  tasa_cambio DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.codigo,
    m.nombre,
    m.simbolo,
    m.tasa_cambio
  FROM public.jwl_configuracion_moneda cm
  JOIN public.jwl_monedas m ON m.id = cm.moneda_id
  WHERE cm.business_id = p_business_id
  LIMIT 1;
  
  -- Si no hay configuración, retornar moneda base
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      m.codigo,
      m.nombre,
      m.simbolo,
      m.tasa_cambio
    FROM public.jwl_monedas m
    WHERE m.es_moneda_base = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar monedas insertadas
SELECT 
  codigo,
  nombre,
  simbolo,
  tasa_cambio,
  es_moneda_base,
  activo
FROM public.jwl_monedas
ORDER BY es_moneda_base DESC, codigo;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Las tasas de cambio son aproximadas y deben actualizarse regularmente
-- 2. CLP es la moneda base (tasa = 1.0)
-- 3. Tasas aproximadas al momento de creación:
--    - 1 USD ≈ 900 CLP (tasa: 0.0011)
--    - 1 EUR ≈ 1000 CLP (tasa: 0.0010)
-- 4. Los administradores pueden actualizar las tasas de cambio
-- 5. Cada negocio puede configurar su moneda preferida
-- 6. Si no hay configuración, se usa la moneda base (CLP)
-- =====================================================

-- =====================================================
-- EJEMPLO DE USO:
-- =====================================================
-- Convertir 1000 CLP a USD:
-- SELECT jwl_convertir_moneda(1000, 'CLP', 'USD');
--
-- Obtener moneda de un negocio:
-- SELECT * FROM jwl_get_moneda_negocio('business-uuid-here');
--
-- Configurar moneda para un negocio:
-- INSERT INTO jwl_configuracion_moneda (business_id, moneda_id)
-- SELECT 'business-uuid', id FROM jwl_monedas WHERE codigo = 'USD';
-- =====================================================
