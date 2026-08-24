-- =====================================================
-- AGREGAR MÓDULO DE JOYERÍA AL SISTEMA
-- =====================================================
-- Este script agrega el módulo de joyería a la tabla system_modules
-- para que pueda ser asignado a usuarios y negocios.
--
-- Fecha: 2026-01-XX
-- Versión: 1.0
-- =====================================================

-- Insertar el módulo de joyería en system_modules
INSERT INTO system_modules (
  name,
  slug,
  description,
  icon,
  display_order,
  is_active,
  requires_subscription,
  created_at,
  updated_at
) VALUES (
  'Joyería',
  'jewelry',
  'Control operativo y financiero de taller de joyería',
  'Gem',
  3,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  requires_subscription = EXCLUDED.requires_subscription,
  updated_at = NOW();

-- Verificar que el módulo se insertó correctamente
SELECT 
  id,
  name,
  slug,
  description,
  icon,
  display_order,
  is_active,
  requires_subscription
FROM system_modules
WHERE slug = 'jewelry';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este módulo requiere suscripción (requires_subscription = true)
-- 2. Para dar acceso a un usuario, usar la tabla user_module_permissions
-- 3. Para gestionar suscripciones, usar la tabla module_subscriptions
-- 4. El módulo tiene display_order = 3 (después de appointments y services)
-- =====================================================
