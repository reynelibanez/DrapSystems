#!/bin/bash

# =====================================================
# SCRIPT: Desplegar Webhook de SMS a Supabase
# =====================================================

echo "🚀 Desplegando Stripe SMS Webhook a Supabase..."
echo ""

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI no está instalado"
    echo "Instalar con: npm install -g supabase"
    exit 1
fi

# Verificar que estemos logueados
echo "📋 Verificando autenticación..."
if ! supabase projects list &> /dev/null; then
    echo "❌ No estás autenticado en Supabase"
    echo "Ejecuta: supabase login"
    exit 1
fi

echo "✅ Autenticación verificada"
echo ""

# Desplegar la función
echo "📦 Desplegando función stripe-sms-webhook..."
supabase functions deploy stripe-sms-webhook

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Función desplegada exitosamente!"
    echo ""
    echo "📝 Próximos pasos:"
    echo ""
    echo "1. Configurar secretos en Supabase:"
    echo "   supabase secrets set STRIPE_SECRET_KEY=sk_live_..."
    echo "   supabase secrets set STRIPE_SMS_WEBHOOK_SECRET=whsec_..."
    echo ""
    echo "2. Obtener la URL de la función:"
    echo "   https://[tu-proyecto].supabase.co/functions/v1/stripe-sms-webhook"
    echo ""
    echo "3. Configurar el webhook en Stripe Dashboard:"
    echo "   - URL: https://[tu-proyecto].supabase.co/functions/v1/stripe-sms-webhook"
    echo "   - Eventos: invoice.paid, invoice.payment_failed, payment_intent.succeeded, payment_intent.payment_failed"
    echo ""
    echo "4. Copiar el Signing Secret de Stripe y configurarlo:"
    echo "   supabase secrets set STRIPE_SMS_WEBHOOK_SECRET=whsec_..."
    echo ""
else
    echo ""
    echo "❌ Error al desplegar la función"
    exit 1
fi
