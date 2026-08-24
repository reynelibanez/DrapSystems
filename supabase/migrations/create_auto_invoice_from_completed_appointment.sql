-- Función para crear automáticamente una factura cuando una cita se marca como completada
CREATE OR REPLACE FUNCTION create_invoice_from_completed_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_service_price DECIMAL;
  v_service_name TEXT;
  v_commission_percentage DECIMAL;
  v_commission_amount DECIMAL;
  v_next_number INTEGER;
BEGIN
  -- Solo procesar si el estado cambió a 'completed' y no había factura antes
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Verificar si ya existe una factura para esta cita
    IF EXISTS (
      SELECT 1 FROM service_invoice_items 
      WHERE appointment_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Obtener información del servicio
    SELECT price, name, COALESCE(commission_percentage, 0)
    INTO v_service_price, v_service_name, v_commission_percentage
    FROM services
    WHERE id = NEW.service_id;

    -- Calcular comisión
    v_commission_amount := (v_service_price * v_commission_percentage) / 100;

    -- Generar número de factura
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO v_next_number
    FROM service_invoices
    WHERE business_id = NEW.business_id;

    v_invoice_number := 'INV-' || LPAD(v_next_number::TEXT, 6, '0');

    -- Crear la factura
    INSERT INTO service_invoices (
      business_id,
      client_id,
      staff_id,
      invoice_number,
      invoice_date,
      subtotal,
      tax_percentage,
      tax_amount,
      discount_percentage,
      discount_amount,
      tip_percentage,
      tip_amount,
      total,
      status,
      notes,
      created_by
    ) VALUES (
      NEW.business_id,
      NEW.client_id,
      NEW.staff_id,
      v_invoice_number,
      CURRENT_DATE,
      v_service_price,
      0,
      0,
      0,
      0,
      0,
      0,
      v_service_price,
      'pending',
      'Factura generada automáticamente desde cita completada',
      NEW.staff_id
    )
    RETURNING id INTO v_invoice_id;

    -- Crear el item de la factura
    INSERT INTO service_invoice_items (
      invoice_id,
      service_id,
      staff_id,
      appointment_id,
      description,
      quantity,
      unit_price,
      commission_percentage,
      commission_amount,
      subtotal
    ) VALUES (
      v_invoice_id,
      NEW.service_id,
      NEW.staff_id,
      NEW.id,
      v_service_name,
      1,
      v_service_price,
      v_commission_percentage,
      v_commission_amount,
      v_service_price
    );

    RAISE NOTICE 'Factura % creada automáticamente para cita %', v_invoice_number, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_create_invoice_from_completed_appointment ON appointments;

-- Crear trigger
CREATE TRIGGER trigger_create_invoice_from_completed_appointment
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_completed_appointment();

-- Comentarios
COMMENT ON FUNCTION create_invoice_from_completed_appointment() IS 
'Crea automáticamente una factura cuando una cita se marca como completada';

COMMENT ON TRIGGER trigger_create_invoice_from_completed_appointment ON appointments IS 
'Trigger que ejecuta la creación automática de factura al completar una cita';
