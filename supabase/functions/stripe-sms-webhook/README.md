# Stripe SMS Webhook - Supabase Edge Function

Webhook de Stripe para procesar pagos de SMS excedentes.

## 🎯 Propósito

Esta función procesa eventos de Stripe relacionados con pagos de SMS:
- ✅ Desbloquea negocios cuando pagan
- ✅ Resetea contadores de SMS
- ✅ Mantiene bloqueo si el pago falla
- ✅ Registra toda la actividad

## 📋 Eventos Procesados

| Evento | Acción |
|--------|--------|
| `invoice.paid` | Desbloquea negocio, resetea contador |
| `invoice.payment_failed` | Mantiene bloqueo |
| `payment_intent.succeeded` | Confirma desbloqueo |
| `payment_intent.payment_failed` | Confirma bloqueo |

## 🚀 Despliegue

```bash
# Desplegar
supabase functions deploy stripe-sms-webhook

# Verificar
supabase functions list
```

## 🔑 Secretos Necesarios

```bash
# Configurar secretos
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_SMS_WEBHOOK_SECRET=whsec_...

# Verificar
supabase secrets list
```

## 🌐 URL de la Función

```
https://[tu-proyecto].supabase.co/functions/v1/stripe-sms-webhook
```

Esta URL debe configurarse en Stripe Dashboard → Webhooks.

## 🧪 Pruebas

```bash
# Ejecutar test
npm run test-sms-webhook-supabase

# Ver logs
supabase functions logs stripe-sms-webhook --follow
```

## 📊 Monitoreo

```bash
# Logs en tiempo real
supabase functions logs stripe-sms-webhook --follow

# Logs con filtro
supabase functions logs stripe-sms-webhook | grep "Payment"
```

## 🔐 Seguridad

- ✅ Verifica firma de Stripe en cada petición
- ✅ Rechaza peticiones sin firma válida
- ✅ Usa credenciales de servicio de Supabase
- ✅ Secretos nunca expuestos al cliente

## 📚 Documentación Completa

Para más detalles, consulta:
- [Inicio Rápido](../../../INICIO_RAPIDO_WEBHOOK_SMS_SUPABASE.md)
- [Guía Completa](../../../CONFIGURAR_WEBHOOK_SMS_SUPABASE.md)
- [FAQ](../../../FAQ_WEBHOOK_SMS_SUPABASE.md)
- [Índice Maestro](../../../INDICE_WEBHOOK_SMS_SUPABASE.md)

## 🐛 Troubleshooting

### Error: "Invalid signature"
```bash
supabase secrets set STRIPE_SMS_WEBHOOK_SECRET=whsec_el_correcto
```

### Error: "Function not found"
```bash
supabase functions deploy stripe-sms-webhook
```

### No se reciben eventos
1. Verificar URL en Stripe Dashboard
2. Verificar que el webhook esté "Enabled"
3. Verificar eventos seleccionados

## 📝 Estructura del Código

```typescript
// 1. Verificar firma del webhook
const event = stripe.webhooks.constructEvent(body, signature, secret);

// 2. Procesar según tipo de evento
switch (event.type) {
  case 'invoice.paid':
    // Desbloquear negocio
    await supabase.rpc('process_sms_payment_success', {...});
    break;
    
  case 'invoice.payment_failed':
    // Mantener bloqueo
    await supabase.rpc('process_sms_payment_failed', {...});
    break;
}

// 3. Retornar respuesta
return new Response(JSON.stringify({ received: true }), { status: 200 });
```

## 🔄 Actualización

```bash
# 1. Editar index.ts
# 2. Re-desplegar
supabase functions deploy stripe-sms-webhook
# 3. Verificar logs
supabase functions logs stripe-sms-webhook
```

---

**Versión:** 1.0.0  
**Última actualización:** 2024-01-09
