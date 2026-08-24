#!/bin/bash

echo "🔍 VERIFICACIÓN DE CONFIGURACIÓN SMS EN CLOUDFLARE"
echo "=================================================="
echo ""

echo "📋 PASO 1: Verificar secrets en Cloudflare"
echo "-------------------------------------------"
npx wrangler secret list

echo ""
echo "📋 PASO 2: Variables requeridas"
echo "--------------------------------"
echo "✅ Debe aparecer: PUBLIC_SUPABASE_URL"
echo "✅ Debe aparecer: SUPABASE_SERVICE_ROLE_KEY"
echo "✅ Debe aparecer: TWILIO_ACCOUNT_SID"
echo "✅ Debe aparecer: TWILIO_AUTH_TOKEN"
echo ""

echo "📋 PASO 3: Si falta alguna variable, configurarla"
echo "--------------------------------------------------"
echo "Ejemplo:"
echo "  echo 'TU_VALOR' | npx wrangler secret put NOMBRE_VARIABLE"
echo ""

echo "📋 PASO 4: Hacer deploy"
echo "------------------------"
echo "  npm run build"
echo "  npx wrangler deploy"
echo ""

echo "📋 PASO 5: Ver logs en tiempo real"
echo "-----------------------------------"
echo "  npx wrangler tail"
echo ""

echo "✅ Listo! Sigue las instrucciones en SOLUCION_SMS_503.md"
