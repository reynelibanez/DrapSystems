-- Script para generar enlaces públicos para negocios existentes
-- Este script es OPCIONAL y solo se debe ejecutar si quieres generar
-- enlaces para negocios que ya existen en la base de datos

-- NOTA: Este script NO genera los enlaces automáticamente
-- Los enlaces se generarán desde el código cuando:
-- 1. Se edite un negocio existente
-- 2. Se cree un nuevo negocio

-- Para verificar cuántos negocios no tienen enlace:
SELECT 
  COUNT(*) as negocios_sin_enlace
FROM businesses
WHERE public_booking_link IS NULL;

-- Para ver los negocios sin enlace:
SELECT 
  id,
  name,
  created_at,
  owner_id
FROM businesses
WHERE public_booking_link IS NULL
ORDER BY created_at DESC;

-- IMPORTANTE: Los enlaces se generarán automáticamente cuando:
-- 1. Edites cualquier negocio desde la interfaz
-- 2. Crees un nuevo negocio

-- No es necesario ejecutar ningún script manual
