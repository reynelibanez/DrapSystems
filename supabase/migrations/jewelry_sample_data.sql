-- =====================================================
-- DATOS DE EJEMPLO PARA EL MÓDULO DE JOYERÍA
-- Ejecuta este script DESPUÉS de crear las tablas principales
-- =====================================================

-- IMPORTANTE: Este script es OPCIONAL y solo para pruebas/demostración
-- NO lo ejecutes en producción si ya tienes datos reales

-- Limpiar datos de ejemplo anteriores (si existen)
DELETE FROM jwl_ventas WHERE id IN (
  SELECT v.id FROM jwl_ventas v
  JOIN jwl_joyas j ON v.joya_id = j.id
  WHERE j.sku LIKE 'DEMO-%'
);

DELETE FROM jwl_produccion WHERE id IN (
  SELECT p.id FROM jwl_produccion p
  JOIN jwl_joyas j ON p.joya_id = j.id
  WHERE j.sku LIKE 'DEMO-%'
);

DELETE FROM jwl_ficha_costo WHERE id IN (
  SELECT fc.id FROM jwl_ficha_costo fc
  JOIN jwl_joyas j ON fc.joya_id = j.id
  WHERE j.sku LIKE 'DEMO-%'
);

DELETE FROM jwl_joyas WHERE sku LIKE 'DEMO-%';

DELETE FROM jwl_compras_materiales WHERE id IN (
  SELECT c.id FROM jwl_compras_materiales c
  JOIN jwl_materias_primas m ON c.materia_prima_id = m.id
  WHERE m.nombre LIKE 'DEMO-%'
);

DELETE FROM jwl_materias_primas WHERE nombre LIKE 'DEMO-%';

-- =====================================================
-- 1. MATERIAS PRIMAS DE EJEMPLO
-- =====================================================

INSERT INTO jwl_materias_primas (nombre, categoria, unidad_medida, costo_unitario_actual, stock_actual, stock_minimo, proveedor) VALUES
('DEMO-Oro 14k', 'Metal', 'Gramo', 1500.00, 100.00, 20.00, 'Metales Preciosos SA'),
('DEMO-Plata 925', 'Metal', 'Gramo', 15.00, 500.00, 100.00, 'Metales Preciosos SA'),
('DEMO-Diamante 0.5ct', 'Piedra', 'Quilate', 5000.00, 10.00, 2.00, 'Gemas del Sur'),
('DEMO-Esmeralda', 'Piedra', 'Quilate', 3000.00, 15.00, 3.00, 'Gemas del Sur'),
('DEMO-Hilo de seda', 'Hilo', 'Metro', 5.00, 200.00, 50.00, 'Insumos Joyería'),
('DEMO-Broche de plata', 'Broche', 'Pieza', 25.00, 100.00, 20.00, 'Insumos Joyería'),
('DEMO-Caja de regalo', 'Empaque', 'Pieza', 15.00, 50.00, 10.00, 'Empaques Premium');

-- =====================================================
-- 2. COMPRAS DE MATERIALES (Historial)
-- =====================================================

-- Obtener IDs de materiales para las compras
DO $$
DECLARE
  v_oro_id UUID;
  v_plata_id UUID;
  v_diamante_id UUID;
BEGIN
  SELECT id INTO v_oro_id FROM jwl_materias_primas WHERE nombre = 'DEMO-Oro 14k';
  SELECT id INTO v_plata_id FROM jwl_materias_primas WHERE nombre = 'DEMO-Plata 925';
  SELECT id INTO v_diamante_id FROM jwl_materias_primas WHERE nombre = 'DEMO-Diamante 0.5ct';

  -- Compras de oro
  INSERT INTO jwl_compras_materiales (materia_prima_id, cantidad, costo_unitario, proveedor, fecha_compra, notas) VALUES
  (v_oro_id, 50.00, 1450.00, 'Metales Preciosos SA', CURRENT_DATE - INTERVAL '30 days', 'Compra inicial'),
  (v_oro_id, 30.00, 1520.00, 'Metales Preciosos SA', CURRENT_DATE - INTERVAL '15 days', 'Reposición'),
  (v_oro_id, 20.00, 1550.00, 'Metales Preciosos SA', CURRENT_DATE - INTERVAL '5 days', 'Compra reciente');

  -- Compras de plata
  INSERT INTO jwl_compras_materiales (materia_prima_id, cantidad, costo_unitario, proveedor, fecha_compra, notas) VALUES
  (v_plata_id, 300.00, 14.00, 'Metales Preciosos SA', CURRENT_DATE - INTERVAL '25 days', 'Compra inicial'),
  (v_plata_id, 200.00, 16.00, 'Metales Preciosos SA', CURRENT_DATE - INTERVAL '10 days', 'Reposición');

  -- Compras de diamantes
  INSERT INTO jwl_compras_materiales (materia_prima_id, cantidad, costo_unitario, proveedor, fecha_compra, notas) VALUES
  (v_diamante_id, 5.00, 4800.00, 'Gemas del Sur', CURRENT_DATE - INTERVAL '20 days', 'Lote premium'),
  (v_diamante_id, 5.00, 5200.00, 'Gemas del Sur', CURRENT_DATE - INTERVAL '8 days', 'Lote especial');
END $$;

-- =====================================================
-- 3. JOYAS (Catálogo de productos)
-- =====================================================

INSERT INTO jwl_joyas (sku, nombre, descripcion, categoria, margen_ganancia, stock_actual) VALUES
('DEMO-AN-001', 'Anillo de Compromiso Oro', 'Anillo de oro 14k con diamante central de 0.5ct', 'Anillo', 60.00, 0),
('DEMO-CO-001', 'Collar de Plata con Esmeralda', 'Collar de plata 925 con esmeralda natural', 'Collar', 50.00, 0),
('DEMO-AR-001', 'Aretes de Oro', 'Par de aretes de oro 14k con diseño clásico', 'Arete', 55.00, 0),
('DEMO-PU-001', 'Pulsera de Plata', 'Pulsera de plata 925 con broche de seguridad', 'Pulsera', 45.00, 0);

-- =====================================================
-- 4. FICHAS DE COSTO (Bill of Materials)
-- =====================================================

DO $$
DECLARE
  v_anillo_id UUID;
  v_collar_id UUID;
  v_aretes_id UUID;
  v_pulsera_id UUID;
  v_oro_id UUID;
  v_plata_id UUID;
  v_diamante_id UUID;
  v_esmeralda_id UUID;
  v_hilo_id UUID;
  v_broche_id UUID;
  v_caja_id UUID;
  v_oro_costo NUMERIC;
  v_plata_costo NUMERIC;
  v_diamante_costo NUMERIC;
  v_esmeralda_costo NUMERIC;
  v_hilo_costo NUMERIC;
  v_broche_costo NUMERIC;
  v_caja_costo NUMERIC;
BEGIN
  -- Obtener IDs de joyas
  SELECT id INTO v_anillo_id FROM jwl_joyas WHERE sku = 'DEMO-AN-001';
  SELECT id INTO v_collar_id FROM jwl_joyas WHERE sku = 'DEMO-CO-001';
  SELECT id INTO v_aretes_id FROM jwl_joyas WHERE sku = 'DEMO-AR-001';
  SELECT id INTO v_pulsera_id FROM jwl_joyas WHERE sku = 'DEMO-PU-001';

  -- Obtener IDs y costos de materiales
  SELECT id, costo_unitario_actual INTO v_oro_id, v_oro_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Oro 14k';
  SELECT id, costo_unitario_actual INTO v_plata_id, v_plata_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Plata 925';
  SELECT id, costo_unitario_actual INTO v_diamante_id, v_diamante_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Diamante 0.5ct';
  SELECT id, costo_unitario_actual INTO v_esmeralda_id, v_esmeralda_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Esmeralda';
  SELECT id, costo_unitario_actual INTO v_hilo_id, v_hilo_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Hilo de seda';
  SELECT id, costo_unitario_actual INTO v_broche_id, v_broche_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Broche de plata';
  SELECT id, costo_unitario_actual INTO v_caja_id, v_caja_costo FROM jwl_materias_primas WHERE nombre = 'DEMO-Caja de regalo';

  -- Ficha de costo: Anillo de Compromiso
  INSERT INTO jwl_ficha_costo (joya_id, materia_prima_id, cantidad_usada, costo_unitario_momento) VALUES
  (v_anillo_id, v_oro_id, 3.50, v_oro_costo),
  (v_anillo_id, v_diamante_id, 0.50, v_diamante_costo),
  (v_anillo_id, v_caja_id, 1.00, v_caja_costo);

  -- Ficha de costo: Collar de Plata
  INSERT INTO jwl_ficha_costo (joya_id, materia_prima_id, cantidad_usada, costo_unitario_momento) VALUES
  (v_collar_id, v_plata_id, 15.00, v_plata_costo),
  (v_collar_id, v_esmeralda_id, 1.00, v_esmeralda_costo),
  (v_collar_id, v_hilo_id, 0.50, v_hilo_costo),
  (v_collar_id, v_broche_id, 1.00, v_broche_costo),
  (v_collar_id, v_caja_id, 1.00, v_caja_costo);

  -- Ficha de costo: Aretes de Oro
  INSERT INTO jwl_ficha_costo (joya_id, materia_prima_id, cantidad_usada, costo_unitario_momento) VALUES
  (v_aretes_id, v_oro_id, 2.00, v_oro_costo),
  (v_aretes_id, v_caja_id, 1.00, v_caja_costo);

  -- Ficha de costo: Pulsera de Plata
  INSERT INTO jwl_ficha_costo (joya_id, materia_prima_id, cantidad_usada, costo_unitario_momento) VALUES
  (v_pulsera_id, v_plata_id, 20.00, v_plata_costo),
  (v_pulsera_id, v_broche_id, 1.00, v_broche_costo),
  (v_pulsera_id, v_caja_id, 1.00, v_caja_costo);
END $$;

-- =====================================================
-- 5. PRODUCCIÓN (Registros de fabricación)
-- =====================================================

DO $$
DECLARE
  v_anillo_id UUID;
  v_collar_id UUID;
  v_aretes_id UUID;
  v_pulsera_id UUID;
BEGIN
  SELECT id INTO v_anillo_id FROM jwl_joyas WHERE sku = 'DEMO-AN-001';
  SELECT id INTO v_collar_id FROM jwl_joyas WHERE sku = 'DEMO-CO-001';
  SELECT id INTO v_aretes_id FROM jwl_joyas WHERE sku = 'DEMO-AR-001';
  SELECT id INTO v_pulsera_id FROM jwl_joyas WHERE sku = 'DEMO-PU-001';

  -- Registrar producción
  INSERT INTO jwl_produccion (joya_id, cantidad_producida, fecha_produccion) VALUES
  (v_anillo_id, 3.00, CURRENT_DATE - INTERVAL '10 days'),
  (v_collar_id, 5.00, CURRENT_DATE - INTERVAL '8 days'),
  (v_aretes_id, 10.00, CURRENT_DATE - INTERVAL '6 days'),
  (v_pulsera_id, 8.00, CURRENT_DATE - INTERVAL '5 days');
END $$;

-- =====================================================
-- 6. VENTAS (Registros de ventas)
-- =====================================================

DO $$
DECLARE
  v_anillo_id UUID;
  v_collar_id UUID;
  v_aretes_id UUID;
  v_pulsera_id UUID;
  v_anillo_precio NUMERIC;
  v_collar_precio NUMERIC;
  v_aretes_precio NUMERIC;
  v_pulsera_precio NUMERIC;
  v_anillo_costo NUMERIC;
  v_collar_costo NUMERIC;
  v_aretes_costo NUMERIC;
  v_pulsera_costo NUMERIC;
BEGIN
  -- Obtener IDs y precios de joyas
  SELECT id, precio_venta, costo_produccion INTO v_anillo_id, v_anillo_precio, v_anillo_costo FROM jwl_joyas WHERE sku = 'DEMO-AN-001';
  SELECT id, precio_venta, costo_produccion INTO v_collar_id, v_collar_precio, v_collar_costo FROM jwl_joyas WHERE sku = 'DEMO-CO-001';
  SELECT id, precio_venta, costo_produccion INTO v_aretes_id, v_aretes_precio, v_aretes_costo FROM jwl_joyas WHERE sku = 'DEMO-AR-001';
  SELECT id, precio_venta, costo_produccion INTO v_pulsera_id, v_pulsera_precio, v_pulsera_costo FROM jwl_joyas WHERE sku = 'DEMO-PU-001';

  -- Registrar ventas
  INSERT INTO jwl_ventas (joya_id, cantidad, precio_unitario_venta, costo_unitario_al_vender, cliente, fecha_venta, metodo_pago, notas) VALUES
  (v_anillo_id, 1.00, v_anillo_precio, v_anillo_costo, 'María González', CURRENT_DATE - INTERVAL '5 days', 'Tarjeta', 'Venta de compromiso'),
  (v_collar_id, 2.00, v_collar_precio, v_collar_costo, 'Ana Martínez', CURRENT_DATE - INTERVAL '4 days', 'Efectivo', 'Compra para regalo'),
  (v_aretes_id, 3.00, v_aretes_precio, v_aretes_costo, 'Laura Rodríguez', CURRENT_DATE - INTERVAL '3 days', 'Transferencia', NULL),
  (v_pulsera_id, 2.00, v_pulsera_precio, v_pulsera_costo, 'Carmen López', CURRENT_DATE - INTERVAL '2 days', 'Efectivo', NULL),
  (v_anillo_id, 1.00, v_anillo_precio, v_anillo_costo, 'Patricia Sánchez', CURRENT_DATE - INTERVAL '1 day', 'Tarjeta', 'Anillo de compromiso'),
  (v_aretes_id, 2.00, v_aretes_precio, v_aretes_costo, 'Isabel Fernández', CURRENT_DATE, 'PayPal', 'Venta online');
END $$;

-- =====================================================
-- 7. GASTOS GENERALES (Opcional)
-- =====================================================

INSERT INTO jwl_gastos_generales (concepto, categoria, monto, fecha, notas) VALUES
('Mano de obra - Joyero principal', 'Mano de obra', 5000.00, CURRENT_DATE - INTERVAL '30 days', 'Salario mensual'),
('Herramientas de precisión', 'Herramientas', 1500.00, CURRENT_DATE - INTERVAL '25 days', 'Compra de herramientas nuevas'),
('Envíos a clientes', 'Envío', 350.00, CURRENT_DATE - INTERVAL '15 days', 'Envíos del mes'),
('Electricidad del taller', 'Servicios', 800.00, CURRENT_DATE - INTERVAL '10 days', 'Recibo de luz'),
('Material de limpieza', 'Otro', 200.00, CURRENT_DATE - INTERVAL '5 days', 'Productos de limpieza para joyas');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar resumen de datos insertados
DO $$
DECLARE
  v_materiales INTEGER;
  v_compras INTEGER;
  v_joyas INTEGER;
  v_fichas INTEGER;
  v_produccion INTEGER;
  v_ventas INTEGER;
  v_gastos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_materiales FROM jwl_materias_primas WHERE nombre LIKE 'DEMO-%';
  SELECT COUNT(*) INTO v_compras FROM jwl_compras_materiales WHERE proveedor LIKE '%SA' OR proveedor LIKE '%Sur' OR proveedor LIKE '%Joyería' OR proveedor LIKE '%Premium';
  SELECT COUNT(*) INTO v_joyas FROM jwl_joyas WHERE sku LIKE 'DEMO-%';
  SELECT COUNT(*) INTO v_fichas FROM jwl_ficha_costo WHERE joya_id IN (SELECT id FROM jwl_joyas WHERE sku LIKE 'DEMO-%');
  SELECT COUNT(*) INTO v_produccion FROM jwl_produccion WHERE joya_id IN (SELECT id FROM jwl_joyas WHERE sku LIKE 'DEMO-%');
  SELECT COUNT(*) INTO v_ventas FROM jwl_ventas WHERE joya_id IN (SELECT id FROM jwl_joyas WHERE sku LIKE 'DEMO-%');
  SELECT COUNT(*) INTO v_gastos FROM jwl_gastos_generales WHERE concepto LIKE '%-%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATOS DE EJEMPLO INSERTADOS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Materias primas: %', v_materiales;
  RAISE NOTICE 'Compras: %', v_compras;
  RAISE NOTICE 'Joyas: %', v_joyas;
  RAISE NOTICE 'Fichas de costo: %', v_fichas;
  RAISE NOTICE 'Producciones: %', v_produccion;
  RAISE NOTICE 'Ventas: %', v_ventas;
  RAISE NOTICE 'Gastos generales: %', v_gastos;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Puedes acceder al módulo en: /jewelry';
  RAISE NOTICE '========================================';
END $$;
