// Supabase Edge Function: send-notifications
// Envía notificaciones (Email, SMS) según el plan de suscripción

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@bookingsuite.com'
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_FROM_PHONE')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface NotificationRequest {
  businessId: string
  userId: string
  appointmentId?: string
  type: 'email' | 'sms'
  to: string
  subject?: string
  message: string
  templateData?: Record<string, any>
}

serve(async (req) => {
  try {
    const { businessId, userId, appointmentId, type, to, subject, message, templateData }: NotificationRequest = await req.json()

    console.log(`[Notification] Request: ${type} to ${to} for business ${businessId}`)

    // Validar datos requeridos
    if (!businessId || !userId || !type || !to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Obtener información del business y su plan
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      console.error('[Notification] Business not found:', businessError)
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Obtener suscripción activa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single()

    // Verificar que la suscripción esté activa
    if (!subscription || subscription.status !== 'active') {
      console.error('[Notification] Subscription not active')
      return new Response(
        JSON.stringify({ error: 'Subscription not active' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar si el plan permite este tipo de notificación
    const plan = subscription.plan
    if (type === 'sms' && !['professional', 'business', 'enterprise'].includes(plan)) {
      console.error('[Notification] SMS not available for plan:', plan)
      return new Response(
        JSON.stringify({ error: 'SMS not available for your plan' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crear registro de notificación
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        business_id: businessId,
        user_id: userId,
        appointment_id: appointmentId,
        type: type,
        message: message,
        status: 'pending',
      })
      .select()
      .single()

    if (notificationError) {
      console.error('[Notification] Error creating notification:', notificationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Enviar notificación según el tipo
    let result
    try {
      switch (type) {
        case 'email':
          result = await sendEmail(to, subject || 'Notificación', message, templateData)
          break
        case 'sms':
          if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            throw new Error('Twilio credentials not configured')
          }
          result = await sendSMS(to, message)
          break
        default:
          throw new Error(`Unsupported notification type: ${type}`)
      }

      // Actualizar estado a enviado
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id)

      console.log(`[Notification] Sent successfully: ${notification.id}`)

      return new Response(
        JSON.stringify({ success: true, notificationId: notification.id, result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      // Actualizar estado a fallido
      await supabase
        .from('notifications')
        .update({
          status: 'failed',
        })
        .eq('id', notification.id)

      console.error('[Notification] Send failed:', error)

      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (err) {
    console.error('[Notification] Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendEmail(to: string, subject: string, message: string, templateData?: Record<string, any>): Promise<any> {
  console.log('[Email] Sending to:', to)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `Booking Suite <${resendFromEmail}>`,
      to: [to],
      subject: subject,
      html: formatEmailMessage(message, templateData),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Email send failed: ${error}`)
  }

  return await response.json()
}

async function sendSMS(to: string, message: string): Promise<any> {
  console.log('[SMS] Sending to:', to)

  const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber!,
        To: to,
        Body: message,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SMS send failed: ${error}`)
  }

  return await response.json()
}

function formatEmailMessage(message: string, templateData?: Record<string, any>): string {
  let formattedMessage = message

  // Reemplazar variables en el mensaje
  if (templateData) {
    Object.keys(templateData).forEach((key) => {
      formattedMessage = formattedMessage.replace(
        new RegExp(`{{${key}}}`, 'g'),
        templateData[key]
      )
    })
  }

  // Envolver en HTML básico
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #5AC1FF 0%, #3F9BE0 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #fff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .footer {
            background: #f6f7f9;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Booking Suite</h1>
        </div>
        <div class="content">
          ${formattedMessage}
        </div>
        <div class="footer">
          <p>Este es un mensaje automático de Booking Suite</p>
          <p>© ${new Date().getFullYear()} Booking Suite. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `
}
