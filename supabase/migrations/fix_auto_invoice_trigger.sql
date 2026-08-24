-- Versión mejorada del trigger que maneja campos opcionales
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
    
    RAISE NOTICE 'Trigger activado para cita %', NEW.id;
    
    -- Verificar si ya existe una factura para esta cita
    IF EXISTS (
      SELECT 1 FROM service_invoice_items 
      WHERE appointment_id = NEW.id
    ) THEN
      RAISE NOTICE 'Ya existe factura para cita %', NEW.id;
      RETURN NEW;
    END IF;

    -- Obtener información del servicio
    -- Usar COALESCE para manejar campos que podrían no existir
    BEGIN
      SELECT 
        price, 
        name, 
        COALESCE(
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'services' 
              AND column_name = 'commission_percentage'
            ) 
            THEN commission_percentage 
            ELSE 0 
          END, 
          0
        )
      INTO v_service_price, v_service_name, v_commission_percentage
      FROM services
      WHERE id = NEW.service_id;
      
      IF v_service_price IS NULL THEN
        RAISE NOTICE 'Servicio % no encontrado o sin precio', NEW.service_id;
        RETURN NEW;
      END IF;
      
      RAISE NOTICE 'Servicio encontrado: % - Precio: % - Comisión: %', v_service_name, v_service_price, v_commission_percentage;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al obtener servicio: %', SQLERRM;
      RETURN NEW;
    END;

    -- Calcular comisión
    v_commission_amount := (v_service_price * COALESCE(v_commission_percentage, 0)) / 100;

    -- Generar número de factura
    BEGIN
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1
      INTO v_next_number
      FROM service_invoices
      WHERE business_id = NEW.business_id;

      v_invoice_number := 'INV-' || LPAD(v_next_number::TEXT, 6, '0');
      
      RAISE NOTICE 'Número de factura generado: %', v_invoice_number;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al generar número de factura: %', SQLERRM;
      RETURN NEW;
    END;

    -- Crear la factura
    BEGIN
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
      
      RAISE NOTICE 'Factura creada con ID: %', v_invoice_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al crear factura: %', SQLERRM;
      RETURN NEW;
    END;

    -- Crear el item de la factura
    BEGIN
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
        COALESCE(v_commission_percentage, 0),
        v_commission_amount,
        v_service_price
      );
      
      RAISE NOTICE 'Item de factura creado para factura %', v_invoice_id;
      RAISE NOTICE '✅ Factura % creada automáticamente para cita %', v_invoice_number, NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al crear item de factura: %', SQLERRM;
      -- Si falla el item, eliminar la factura creada
      DELETE FROM service_invoices WHERE id = v_invoice_id;
      RETURN NEW;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error general en trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_create_invoice_from_completed_appointment ON appointments;

CREATE TRIGGER trigger_create_invoice_from_completed_appointment
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_completed_appointment();

COMMENT ON FUNCTION create_invoice_from_completed_appointment() IS 
'Crea automáticamente una factura cuando una cita se marca como completada (versión mejorada con manejo de errores)';
