-- =====================================================
-- AÑADIR CATEGORÍA "INSUMO" AL CATÁLOGO DE MATERIALES IA
-- =====================================================
-- Este script añade materiales de la categoría "Insumo"
-- al catálogo de IA para todas las empresas con módulo de joyería
-- =====================================================

-- Función para insertar materiales de categoría Insumo
CREATE OR REPLACE FUNCTION add_insumo_category()
RETURNS void AS $$
DECLARE
  v_business_id uuid;
BEGIN
  -- Iterar sobre todas las empresas que tienen el módulo de joyería habilitado
  FOR v_business_id IN 
    SELECT id FROM businesses 
    WHERE 'jewelry' = ANY(enabled_modules)
  LOOP
    
    -- =====================================================
    -- CATEGORÍA: INSUMO
    -- =====================================================
    
    -- Soldadura de Plata
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Soldadura de Plata', 'Insumo',
      ARRAY['soldadura', 'plata', 'soldar', 'metal', 'unir'],
      '#C0C0C0', '#A8A8A8', 'capsule', 0.88, 0.25, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Soldadura de Oro
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Soldadura de Oro', 'Insumo',
      ARRAY['soldadura', 'oro', 'soldar', 'metal', 'unir'],
      '#FFD700', '#DAA520', 'capsule', 0.90, 0.22, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Flux para Soldadura
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Flux para Soldadura', 'Insumo',
      ARRAY['flux', 'soldadura', 'fundente', 'líquido', 'químico'],
      '#F0E68C', '#E6D480', 'cylinder', 0.05, 0.30, true, 0.60, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Ácido para Limpieza
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Ácido para Limpieza', 'Insumo',
      ARRAY['ácido', 'limpiador', 'químico', 'líquido', 'limpiar'],
      '#98FB98', '#90EE90', 'cylinder', 0.02, 0.15, true, 0.70, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Pasta Pulidora
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Pasta Pulidora', 'Insumo',
      ARRAY['pasta', 'pulidor', 'pulir', 'abrasivo', 'brillo'],
      '#F5DEB3', '#D2B48C', 'cylinder', 0.10, 0.60, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Pegamento Epoxi
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Pegamento Epoxi', 'Insumo',
      ARRAY['pegamento', 'epoxi', 'adhesivo', 'resina', 'unir'],
      '#E0E0E0', '#C0C0C0', 'capsule', 0.05, 0.20, true, 0.75, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Cianoacrilato (Super Glue)
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Cianoacrilato', 'Insumo',
      ARRAY['cianoacrilato', 'pegamento', 'adhesivo', 'super', 'glue', 'instantáneo'],
      '#F0F0F0', '#D8D8D8', 'capsule', 0.03, 0.12, true, 0.82, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Barniz Protector
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Barniz Protector', 'Insumo',
      ARRAY['barniz', 'protector', 'sellador', 'transparente', 'brillo'],
      '#FFFACD', '#F0E68C', 'cylinder', 0.08, 0.18, true, 0.68, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Esmalte para Joyería
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Esmalte para Joyería', 'Insumo',
      ARRAY['esmalte', 'pintura', 'color', 'decorar', 'vitrificado'],
      '#FF6347', '#DC143C', 'cylinder', 0.15, 0.40, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Cera de Modelar Azul
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Cera de Modelar Azul', 'Insumo',
      ARRAY['cera', 'modelar', 'moldear', 'azul', 'esculpir'],
      '#4169E1', '#1E90FF', 'sphere', 0.10, 0.70, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Cera de Modelar Verde
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Cera de Modelar Verde', 'Insumo',
      ARRAY['cera', 'modelar', 'moldear', 'verde', 'esculpir'],
      '#32CD32', '#228B22', 'sphere', 0.10, 0.70, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Silicona para Moldes
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Silicona para Moldes', 'Insumo',
      ARRAY['silicona', 'molde', 'flexible', 'goma', 'moldear'],
      '#FFB6C1', '#FF69B4', 'capsule', 0.05, 0.50, true, 0.45, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Lubricante para Herramientas
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Lubricante para Herramientas', 'Insumo',
      ARRAY['lubricante', 'aceite', 'líquido', 'herramienta', 'mantener'],
      '#FFE4B5', '#FFDAB9', 'cylinder', 0.08, 0.25, true, 0.55, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Desengrasante
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, transmission, activo
    ) VALUES (
      v_business_id, 'Desengrasante', 'Insumo',
      ARRAY['desengrasante', 'limpiador', 'químico', 'líquido', 'limpiar'],
      '#87CEEB', '#6495ED', 'cylinder', 0.03, 0.20, true, 0.65, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
    -- Lija Fina
    INSERT INTO jwl_catalogo_materiales (
      business_id, nombre, categoria, palabras_clave,
      color, color_secundario, forma, metalness, roughness,
      transparente, activo
    ) VALUES (
      v_business_id, 'Lija Fina', 'Insumo',
      ARRAY['lija', 'abrasivo', 'pulir', 'lijar', 'papel'],
      '#D2B48C', '#BC8F8F', 'box', 0.05, 0.85, false, true
    ) ON CONFLICT (business_id, nombre) DO NOTHING;
    
  END LOOP;
  
  RAISE NOTICE 'Categoría "Insumo" añadida exitosamente al catálogo de materiales IA';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función
SELECT add_insumo_category();

-- Eliminar la función después de usarla
DROP FUNCTION IF EXISTS add_insumo_category();
