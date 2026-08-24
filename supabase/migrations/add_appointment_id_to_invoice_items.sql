-- Agregar columna appointment_id a service_invoice_items
-- Esta columna vincula los items de factura con las citas que los generaron

-- 1. Agregar la columna
ALTER TABLE service_invoice_items 
ADD COLUMN IF NOT EXISTS appointment_id UUID;

-- 2. Agregar foreign key constraint
ALTER TABLE service_invoice_items
ADD CONSTRAINT fk_service_invoice_items_appointment
FOREIGN KEY (appointment_id) 
REFERENCES appointments(id)
ON DELETE SET NULL;

-- 3. Agregar índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_service_invoice_items_appointment_id 
ON service_invoice_items(appointment_id);

-- 4. Agregar comentario
COMMENT ON COLUMN service_invoice_items.appointment_id IS 
'ID de la cita que generó este item de factura (si aplica)';

-- Verificar que se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'service_invoice_items' 
  AND column_name = 'appointment_id';
