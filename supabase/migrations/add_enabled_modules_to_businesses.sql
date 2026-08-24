-- Agregar columna enabled_modules a la tabla businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT ARRAY['appointments']::TEXT[];

-- Actualizar empresas existentes según su plan
-- Plan Free: solo appointments
UPDATE businesses 
SET enabled_modules = ARRAY['appointments']::TEXT[]
WHERE subscription_plan = 'free' 
  AND (enabled_modules IS NULL OR enabled_modules = ARRAY[]::TEXT[]);

-- Plan Basic: appointments + services
UPDATE businesses 
SET enabled_modules = ARRAY['appointments', 'services']::TEXT[]
WHERE subscription_plan = 'basic' 
  AND (enabled_modules IS NULL OR enabled_modules = ARRAY[]::TEXT[]);

-- Plan Business: appointments + services + jewelry
UPDATE businesses 
SET enabled_modules = ARRAY['appointments', 'services', 'jewelry']::TEXT[]
WHERE subscription_plan = 'business' 
  AND (enabled_modules IS NULL OR enabled_modules = ARRAY[]::TEXT[]);

-- Plan Enterprise: todos los módulos
UPDATE businesses 
SET enabled_modules = ARRAY['appointments', 'services', 'jewelry']::TEXT[]
WHERE subscription_plan = 'enterprise' 
  AND (enabled_modules IS NULL OR enabled_modules = ARRAY[]::TEXT[]);

-- Si no tiene plan definido, dar solo appointments
UPDATE businesses 
SET enabled_modules = ARRAY['appointments']::TEXT[]
WHERE subscription_plan IS NULL 
  AND (enabled_modules IS NULL OR enabled_modules = ARRAY[]::TEXT[]);

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_businesses_enabled_modules ON businesses USING GIN (enabled_modules);

-- Comentario
COMMENT ON COLUMN businesses.enabled_modules IS 'Módulos habilitados para esta empresa: appointments, services, jewelry';
