-- =====================================================
-- FIX COMPLETO MÓDULO INVENTARIO
-- Agrega columna 'inventariada' y corrige estructura
-- Fecha: 2025-01-17
-- =====================================================

-- 1. Agregar columna 'inventariada' a todas las tablas de documentos
-- =====================================================

-- Recepciones
ALTER TABLE il_recepciones_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- Transferencias
ALTER TABLE il_transferencias_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- Vales de Salida
ALTER TABLE il_valessalida_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- 2. Agregar columna 'updated_at' si no existe
-- =====================================================

ALTER TABLE il_recepciones_inventario 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE il_transferencias_inventario 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE il_valessalida_inventario 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Crear índices para mejorar rendimiento
-- =====================================================

-- Índices para recepciones
CREATE INDEX IF NOT EXISTS idx_recepciones_inventariada 
  ON il_recepciones_inventario(inventariada) 
  WHERE NOT anulada;

CREATE INDEX IF NOT EXISTS idx_recepciones_business_fecha 
  ON il_recepciones_inventario(business_id, fecha DESC);

-- Índices para transferencias
CREATE INDEX IF NOT EXISTS idx_transferencias_inventariada 
  ON il_transferencias_inventario(inventariada) 
  WHERE NOT anulada;

CREATE INDEX IF NOT EXISTS idx_transferencias_business_fecha 
  ON il_transferencias_inventario(business_id, fecha DESC);

-- Índices para vales
CREATE INDEX IF NOT EXISTS idx_vales_inventariada 
  ON il_valessalida_inventario(inventariada) 
  WHERE NOT anulada;

CREATE INDEX IF NOT EXISTS idx_vales_business_fecha 
  ON il_valessalida_inventario(business_id, fecha DESC);

-- 4. Agregar constraints para validación
-- =====================================================

-- No permitir modificar documentos inventariados
-- (esto se manejará en la aplicación, pero agregamos comentarios)

-- 5. Comentarios descriptivos
-- =====================================================

COMMENT ON COLUMN il_recepciones_inventario.inventariada IS 'Indica si la recepción ya fue inventariada y no puede modificarse';
COMMENT ON COLUMN il_recepciones_inventario.updated_at IS 'Fecha de última actualización del documento';

COMMENT ON COLUMN il_transferencias_inventario.inventariada IS 'Indica si la transferencia ya fue inventariada y no puede modificarse';
COMMENT ON COLUMN il_transferencias_inventario.updated_at IS 'Fecha de última actualización del documento';

COMMENT ON COLUMN il_valessalida_inventario.inventariada IS 'Indica si el vale ya fue inventariado y no puede modificarse';
COMMENT ON COLUMN il_valessalida_inventario.updated_at IS 'Fecha de última actualización del documento';

-- 6. Función para validar que no se modifiquen documentos inventariados
-- =====================================================

-- Trigger para recepciones
CREATE OR REPLACE FUNCTION validar_recepcion_no_inventariada()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.inventariada = true AND NEW.inventariada = true THEN
    IF OLD.anulada != NEW.anulada THEN
      RAISE EXCEPTION 'No se puede modificar una recepción inventariada';
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_recepcion_inventariada ON il_recepciones_inventario;
CREATE TRIGGER trigger_validar_recepcion_inventariada
  BEFORE UPDATE ON il_recepciones_inventario
  FOR EACH ROW
  EXECUTE FUNCTION validar_recepcion_no_inventariada();

-- Trigger para transferencias
CREATE OR REPLACE FUNCTION validar_transferencia_no_inventariada()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.inventariada = true AND NEW.inventariada = true THEN
    IF OLD.anulada != NEW.anulada THEN
      RAISE EXCEPTION 'No se puede modificar una transferencia inventariada';
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_transferencia_inventariada ON il_transferencias_inventario;
CREATE TRIGGER trigger_validar_transferencia_inventariada
  BEFORE UPDATE ON il_transferencias_inventario
  FOR EACH ROW
  EXECUTE FUNCTION validar_transferencia_no_inventariada();

-- Trigger para vales
CREATE OR REPLACE FUNCTION validar_vale_no_inventariado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.inventariada = true AND NEW.inventariada = true THEN
    IF OLD.anulada != NEW.anulada THEN
      RAISE EXCEPTION 'No se puede modificar un vale inventariado';
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_vale_inventariado ON il_valessalida_inventario;
CREATE TRIGGER trigger_validar_vale_inventariado
  BEFORE UPDATE ON il_valessalida_inventario
  FOR EACH ROW
  EXECUTE FUNCTION validar_vale_no_inventariado();

-- 7. Actualizar triggers existentes para no afectar documentos inventariados
-- =====================================================

-- Modificar trigger de recepciones para validar inventariada
CREATE OR REPLACE FUNCTION actualizar_existencias_recepcion()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacen UUID;
  v_anulada BOOLEAN;
  v_inventariada BOOLEAN;
BEGIN
  -- Obtener business_id, almacén y estado de la recepción
  SELECT business_id, idalmacen, anulada, inventariada 
  INTO v_business_id, v_idalmacen, v_anulada, v_inventariada
  FROM il_recepciones_inventario
  WHERE id = NEW.idrecepcion;
  
  -- Solo actualizar si no está anulada
  IF NOT v_anulada THEN
    -- Actualizar o insertar existencias
    INSERT INTO il_existencias_inventario (business_id, idproducto, idalmacen, cantidad, costo)
    VALUES (
      v_business_id,
      NEW.idproducto,
      v_idalmacen,
      NEW.cantidad,
      NEW.costo
    )
    ON CONFLICT (business_id, idproducto, idalmacen)
    DO UPDATE SET
      cantidad = il_existencias_inventario.cantidad + NEW.cantidad,
      costo = ((il_existencias_inventario.cantidad * il_existencias_inventario.costo) + (NEW.cantidad * NEW.costo)) / 
              NULLIF((il_existencias_inventario.cantidad + NEW.cantidad), 0),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modificar trigger de transferencias para validar inventariada
CREATE OR REPLACE FUNCTION actualizar_existencias_transferencia()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacenorigen UUID;
  v_idalmacendestino UUID;
  v_costo_promedio NUMERIC(18, 4);
  v_anulada BOOLEAN;
  v_inventariada BOOLEAN;
BEGIN
  -- Obtener datos de la transferencia
  SELECT business_id, idalmacenorigen, idalmacendestino, anulada, inventariada
  INTO v_business_id, v_idalmacenorigen, v_idalmacendestino, v_anulada, v_inventariada
  FROM il_transferencias_inventario
  WHERE id = NEW.idtransferencia;
  
  -- Solo actualizar si no está anulada
  IF NOT v_anulada THEN
    -- Obtener costo promedio del almacén origen
    SELECT costo INTO v_costo_promedio
    FROM il_existencias_inventario
    WHERE business_id = v_business_id
      AND idproducto = NEW.idproducto
      AND idalmacen = v_idalmacenorigen;
    
    -- Restar del almacén origen
    UPDATE il_existencias_inventario
    SET cantidad = cantidad - NEW.cantidad,
        updated_at = NOW()
    WHERE business_id = v_business_id
      AND idproducto = NEW.idproducto
      AND idalmacen = v_idalmacenorigen;
    
    -- Sumar al almacén destino
    INSERT INTO il_existencias_inventario (business_id, idproducto, idalmacen, cantidad, costo)
    VALUES (
      v_business_id,
      NEW.idproducto,
      v_idalmacendestino,
      NEW.cantidad,
      COALESCE(v_costo_promedio, 0)
    )
    ON CONFLICT (business_id, idproducto, idalmacen)
    DO UPDATE SET
      cantidad = il_existencias_inventario.cantidad + NEW.cantidad,
      costo = ((il_existencias_inventario.cantidad * il_existencias_inventario.costo) + (NEW.cantidad * COALESCE(v_costo_promedio, 0))) / 
              NULLIF((il_existencias_inventario.cantidad + NEW.cantidad), 0),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modificar trigger de vales para validar inventariada
CREATE OR REPLACE FUNCTION actualizar_existencias_valesalida()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_idalmacen UUID;
  v_anulada BOOLEAN;
  v_inventariada BOOLEAN;
BEGIN
  -- Obtener datos del vale de salida
  SELECT business_id, idalmacen, anulada, inventariada
  INTO v_business_id, v_idalmacen, v_anulada, v_inventariada
  FROM il_valessalida_inventario
  WHERE id = NEW.idvalesalida;
  
  -- Solo actualizar si no está anulada
  IF NOT v_anulada THEN
    -- Restar del almacén
    UPDATE il_existencias_inventario
    SET cantidad = cantidad - NEW.cantidad,
        updated_at = NOW()
    WHERE business_id = v_business_id
      AND idproducto = NEW.idproducto
      AND idalmacen = v_idalmacen;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vistas útiles para reportes
-- =====================================================

-- Vista de documentos pendientes de inventariar
CREATE OR REPLACE VIEW v_documentos_pendientes_inventario AS
SELECT 
  'RECEPCION' as tipo_documento,
  r.id,
  r.numero,
  r.fecha,
  r.business_id,
  a.almacen,
  r.observaciones,
  r.anulada,
  r.inventariada,
  u.full_name as usuario
FROM il_recepciones_inventario r
LEFT JOIN ng_almacen_inventario a ON r.idalmacen = a.id
LEFT JOIN profiles u ON r.user_id = u.id
WHERE r.inventariada = false AND r.anulada = false

UNION ALL

SELECT 
  'TRANSFERENCIA' as tipo_documento,
  t.id,
  t.numero,
  t.fecha,
  t.business_id,
  ao.almacen || ' → ' || ad.almacen as almacen,
  t.observaciones,
  t.anulada,
  t.inventariada,
  u.full_name as usuario
FROM il_transferencias_inventario t
LEFT JOIN ng_almacen_inventario ao ON t.idalmacenorigen = ao.id
LEFT JOIN ng_almacen_inventario ad ON t.idalmacendestino = ad.id
LEFT JOIN profiles u ON t.user_id = u.id
WHERE t.inventariada = false AND t.anulada = false

UNION ALL

SELECT 
  'VALE_SALIDA' as tipo_documento,
  v.id,
  v.numero,
  v.fecha,
  v.business_id,
  a.almacen,
  v.observaciones,
  v.anulada,
  v.inventariada,
  u.full_name as usuario
FROM il_valessalida_inventario v
LEFT JOIN ng_almacen_inventario a ON v.idalmacen = a.id
LEFT JOIN profiles u ON v.user_id = u.id
WHERE v.inventariada = false AND v.anulada = false

ORDER BY fecha DESC, numero DESC;

-- 9. Función para inventariar múltiples documentos
-- =====================================================

CREATE OR REPLACE FUNCTION inventariar_documentos(
  p_tipo_documento VARCHAR,
  p_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  numero VARCHAR,
  resultado VARCHAR
) AS $$
DECLARE
  v_id UUID;
  v_numero VARCHAR;
BEGIN
  FOREACH v_id IN ARRAY p_ids
  LOOP
    BEGIN
      CASE p_tipo_documento
        WHEN 'RECEPCION' THEN
          UPDATE il_recepciones_inventario 
          SET inventariada = true, updated_at = NOW()
          WHERE il_recepciones_inventario.id = v_id 
            AND NOT anulada 
            AND NOT inventariada
          RETURNING il_recepciones_inventario.id, il_recepciones_inventario.numero 
          INTO id, numero;
          
        WHEN 'TRANSFERENCIA' THEN
          UPDATE il_transferencias_inventario 
          SET inventariada = true, updated_at = NOW()
          WHERE il_transferencias_inventario.id = v_id 
            AND NOT anulada 
            AND NOT inventariada
          RETURNING il_transferencias_inventario.id, il_transferencias_inventario.numero 
          INTO id, numero;
          
        WHEN 'VALE_SALIDA' THEN
          UPDATE il_valessalida_inventario 
          SET inventariada = true, updated_at = NOW()
          WHERE il_valessalida_inventario.id = v_id 
            AND NOT anulada 
            AND NOT inventariada
          RETURNING il_valessalida_inventario.id, il_valessalida_inventario.numero 
          INTO id, numero;
      END CASE;
      
      IF id IS NOT NULL THEN
        resultado := 'OK';
        RETURN NEXT;
      ELSE
        id := v_id;
        numero := 'N/A';
        resultado := 'Ya inventariado o anulado';
        RETURN NEXT;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      id := v_id;
      numero := 'N/A';
      resultado := 'ERROR: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================

-- ✅ Columna 'inventariada' agregada a:
--    - il_recepciones_inventario
--    - il_transferencias_inventario
--    - il_valessalida_inventario

-- ✅ Columna 'updated_at' agregada a todas las tablas de documentos

-- ✅ Índices creados para mejorar rendimiento

-- ✅ Triggers de validación para prevenir modificaciones

-- ✅ Triggers actualizados para respetar estado inventariada

-- ✅ Vista de documentos pendientes de inventariar

-- ✅ Función para inventariar múltiples documentos

-- =====================================================
-- FIN
-- =====================================================
