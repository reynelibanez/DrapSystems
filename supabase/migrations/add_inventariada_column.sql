

-- =====================================================
-- Agregar columna 'inventariada' a documentos de inventario
-- Fecha: 2025-01-17
-- =====================================================

-- 1. Agregar columna a recepciones
ALTER TABLE il_recepciones_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- 2. Agregar columna a transferencias
ALTER TABLE il_transferencias_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- 3. Agregar columna a vales de salida
ALTER TABLE il_valessalida_inventario 
  ADD COLUMN IF NOT EXISTS inventariada BOOLEAN DEFAULT false;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_recepciones_inventariada 
  ON il_recepciones_inventario(inventariada) 
  WHERE NOT anulada;

CREATE INDEX IF NOT EXISTS idx_transferencias_inventariada 
  ON il_transferencias_inventario(inventariada) 
  WHERE NOT anulada;

CREATE INDEX IF NOT EXISTS idx_vales_inventariada 
  ON il_valessalida_inventario(inventariada) 
  WHERE NOT anulada;

-- 5. Comentarios
COMMENT ON COLUMN il_recepciones_inventario.inventariada IS 'Indica si la recepción ya fue inventariada y no puede modificarse';
COMMENT ON COLUMN il_transferencias_inventario.inventariada IS 'Indica si la transferencia ya fue inventariada y no puede modificarse';
COMMENT ON COLUMN il_valessalida_inventario.inventariada IS 'Indica si el vale ya fue inventariado y no puede modificarse';

-- =====================================================
-- FIN
-- =====================================================


