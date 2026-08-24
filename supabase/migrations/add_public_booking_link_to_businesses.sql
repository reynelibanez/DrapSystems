-- Agregar columna public_booking_link a la tabla businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS public_booking_link TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN businesses.public_booking_link IS 'Enlace público encriptado para reservas de citas';
