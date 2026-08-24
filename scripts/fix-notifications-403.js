#!/usr/bin/env node

/**
 * Script para solucionar el error 403 en notificaciones
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 SOLUCIÓN: Error 403 en Notificaciones');
console.log('='.repeat(60));
console.log('');

async function fix() {
  try {
    // 1. Verificar si existe la tabla de notificaciones
    console.log('📋 1. Verificando tabla de notificaciones...');
    const { data: tables, error: tablesError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.log('   ❌ La tabla "notifications" no existe o no es accesible');
      console.log('   ℹ️  Necesitas crear la tabla primero');
      console.log('');
      console.log('   SQL para crear la tabla:');
      console.log('');
      console.log(`
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy para que los usuarios puedan ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy para que el sistema pueda insertar notificaciones
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Policy para que el sistema pueda actualizar notificaciones
CREATE POLICY "System can update notifications"
  ON notifications FOR UPDATE
  USING (true);
      `);
      return;
    }

    console.log('   ✅ Tabla de notificaciones existe');
    console.log('');

    // 2. Crear función para enviar notificaciones automáticamente
    console.log('📧 2. Creando función para enviar notificaciones...');
    
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION send_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_client RECORD;
  v_business RECORD;
  v_service RECORD;
BEGIN
  -- Obtener información del cliente
  SELECT * INTO v_client FROM clients WHERE id = NEW.client_id;
  
  -- Obtener información del negocio
  SELECT * INTO v_business FROM businesses WHERE id = NEW.business_id;
  
  -- Obtener información del servicio
  SELECT * INTO v_service FROM services WHERE id = NEW.service_id;
  
  -- Solo enviar notificaciones si el cliente tiene email o teléfono
  IF v_client.email IS NOT NULL OR v_client.phone IS NOT NULL THEN
    -- Insertar notificación pendiente
    INSERT INTO notifications (
      type,
      recipient_email,
      recipient_phone,
      appointment_id,
      business_id,
      client_id,
      status,
      metadata
    )
    VALUES (
      'appointment_created',
      v_client.email,
      v_client.phone,
      NEW.id,
      NEW.business_id,
      NEW.client_id,
      'pending',
      jsonb_build_object(
        'service_name', v_service.name,
        'service_price', v_service.price,
        'service_duration', v_service.duration_minutes,
        'business_name', v_business.name,
        'business_address', v_business.address,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'notes', NEW.notes,
        'client_name', v_client.full_name,
        'client_language', COALESCE(v_client.preferred_language, 'es')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('   ℹ️  Ejecuta este SQL en Supabase SQL Editor:');
    console.log('');
    console.log(createFunctionSQL);
    console.log('');

    // 3. Crear trigger
    console.log('🔔 3. Creando trigger...');
    
    const createTriggerSQL = `
-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_appointment_created ON appointments;

-- Crear trigger
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_notifications();
    `;

    console.log('   ℹ️  Ejecuta este SQL en Supabase SQL Editor:');
    console.log('');
    console.log(createTriggerSQL);
    console.log('');

    // 4. Instrucciones para procesar notificaciones
    console.log('⚙️  4. Procesamiento de notificaciones');
    console.log('='.repeat(60));
    console.log('');
    console.log('Ahora necesitas crear una Edge Function o Cron Job que procese');
    console.log('las notificaciones pendientes y las envíe por email/SMS.');
    console.log('');
    console.log('Opciones:');
    console.log('');
    console.log('A) Usar Supabase Edge Function (RECOMENDADO)');
    console.log('   - Ya tienes la función en: supabase/functions/send-notifications/');
    console.log('   - Solo necesitas desplegarla y configurar las variables');
    console.log('');
    console.log('B) Usar un Cron Job en Cloudflare Workers');
    console.log('   - Crear un worker que se ejecute cada minuto');
    console.log('   - Procesar notificaciones pendientes');
    console.log('');
    console.log('C) Procesar notificaciones desde el cliente (NO RECOMENDADO)');
    console.log('   - Seguir usando el método actual');
    console.log('   - Requiere configurar CORS en Cloudflare');
    console.log('');

    // 5. Resumen
    console.log('📋 RESUMEN');
    console.log('='.repeat(60));
    console.log('');
    console.log('Para solucionar el error 403, necesitas:');
    console.log('');
    console.log('1. ✅ Crear la tabla "notifications" (si no existe)');
    console.log('2. ✅ Crear la función "send_appointment_notifications()"');
    console.log('3. ✅ Crear el trigger "on_appointment_created"');
    console.log('4. ⏳ Configurar el procesamiento de notificaciones');
    console.log('');
    console.log('Después de esto, las notificaciones se enviarán automáticamente');
    console.log('cuando se cree una cita, sin necesidad de hacer peticiones HTTP');
    console.log('desde el cliente.');
    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fix();
