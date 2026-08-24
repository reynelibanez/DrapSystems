import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AppointmentWithDetails {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  business_id: string
  client_id: string
  service_id: string
  staff_id: string | null
  businesses: {
    name: string
    email: string | null
    subscription_plan: string
    settings: any
  }
  clients: {
    full_name: string
    email: string
    phone: string | null
  }
  services: {
    name: string
    duration: number
    price: number
  }
  staff?: {
    full_name: string
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const nowISO = now.toISOString()
    
    // Calcular 72 horas desde ahora
    const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000)
    const in72HoursISO = in72Hours.toISOString()

    console.log('Starting appointment reminders job...')
    console.log('Current time:', nowISO)
    console.log('Looking for appointments until:', in72HoursISO)

    // 1. CANCELAR CITAS PASADAS QUE ESTÁN PENDIENTES O CONFIRMADAS
    const { data: pastAppointments, error: pastError } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, clients(email, full_name), businesses(name)')
      .in('status', ['pending', 'confirmed'])
      .lt('appointment_date', now.toISOString().split('T')[0])

    if (pastError) {
      console.error('Error fetching past appointments:', pastError)
    } else if (pastAppointments && pastAppointments.length > 0) {
      console.log(`Found ${pastAppointments.length} past appointments to cancel`)

      // Actualizar estado a cancelado
      const { error: cancelError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .in('id', pastAppointments.map(a => a.id))

      if (cancelError) {
        console.error('Error cancelling past appointments:', cancelError)
      } else {
        console.log(`Successfully cancelled ${pastAppointments.length} past appointments`)

        // Enviar notificaciones de cancelación si hay Resend configurado
        if (resendApiKey) {
          for (const appointment of pastAppointments) {
            try {
              const emailData = {
                from: 'Booking Suite <noreply@bookingsuite.app>',
                to: appointment.clients.email,
                subject: `Cita Cancelada - ${appointment.businesses.name}`,
                html: `
                  <h2>Cita Cancelada Automáticamente</h2>
                  <p>Hola ${appointment.clients.full_name},</p>
                  <p>Tu cita del ${appointment.appointment_date} a las ${appointment.appointment_time} en ${appointment.businesses.name} ha sido cancelada automáticamente porque la fecha ya pasó.</p>
                  <p>Si deseas agendar una nueva cita, por favor contacta con nosotros.</p>
                  <p>Saludos,<br>${appointment.businesses.name}</p>
                `
              }

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
              })

              if (!emailResponse.ok) {
                console.error(`Failed to send cancellation email to ${appointment.clients.email}`)
              } else {
                console.log(`Cancellation email sent to ${appointment.clients.email}`)
              }
            } catch (emailError) {
              console.error('Error sending cancellation email:', emailError)
            }
          }
        }
      }
    } else {
      console.log('No past appointments to cancel')
    }

    // 2. ENVIAR RECORDATORIOS PARA CITAS PRÓXIMAS
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        business_id,
        client_id,
        service_id,
        staff_id,
        businesses!inner (
          name,
          email,
          subscription_plan,
          settings
        ),
        clients!inner (
          full_name,
          email,
          phone
        ),
        services!inner (
          name,
          duration,
          price
        ),
        staff:profiles (
          full_name
        )
      `)
      .eq('status', 'confirmed')
      .gte('appointment_date', now.toISOString().split('T')[0])
      .lte('appointment_date', in72Hours.toISOString().split('T')[0])

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError)
      throw fetchError
    }

    console.log(`Found ${appointments?.length || 0} confirmed appointments in the next 72 hours`)

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No appointments to process',
          cancelled: pastAppointments?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Configuración de recordatorios por plan
    const reminderSettings: Record<string, { hours: number[], methods: string[] }> = {
      free: { hours: [24], methods: ['email'] },
      basic: { hours: [24, 2], methods: ['email'] },
      professional: { hours: [72, 24, 2], methods: ['email', 'sms'] },
      business: { hours: [72, 24, 2], methods: ['email', 'sms'] },
      enterprise: { hours: [72, 24, 2, 1], methods: ['email', 'sms', 'whatsapp'] }
    }

    for (const appointment of appointments as AppointmentWithDetails[]) {
      try {
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
        const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        const plan = appointment.businesses.subscription_plan || 'free'
        const settings = reminderSettings[plan] || reminderSettings.free

        // Verificar si debemos enviar recordatorio según las horas configuradas
        let shouldSendReminder = false
        for (const hours of settings.hours) {
          if (hoursUntilAppointment <= hours && hoursUntilAppointment > (hours - 1)) {
            shouldSendReminder = true
            break
          }
        }

        if (!shouldSendReminder) {
          skippedCount++
          continue
        }

        // Enviar email si está configurado Resend
        if (settings.methods.includes('email') && resendApiKey) {
          const emailData = {
            from: 'Booking Suite <noreply@bookingsuite.app>',
            to: appointment.clients.email,
            subject: `Recordatorio de Cita - ${appointment.businesses.name}`,
            html: `
              <h2>Recordatorio de Cita</h2>
              <p>Hola ${appointment.clients.full_name},</p>
              <p>Te recordamos tu cita próxima:</p>
              <ul>
                <li><strong>Fecha:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES')}</li>
                <li><strong>Hora:</strong> ${appointment.appointment_time}</li>
                <li><strong>Servicio:</strong> ${appointment.services.name}</li>
                <li><strong>Duración:</strong> ${appointment.services.duration} minutos</li>
                ${appointment.staff ? `<li><strong>Atendido por:</strong> ${appointment.staff.full_name}</li>` : ''}
                ${appointment.notes ? `<li><strong>Notas:</strong> ${appointment.notes}</li>` : ''}
              </ul>
              <p>Si necesitas cancelar o reprogramar, por favor contacta con nosotros lo antes posible.</p>
              <p>¡Te esperamos!<br>${appointment.businesses.name}</p>
            `
          }

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
          })

          if (emailResponse.ok) {
            sentCount++
            console.log(`Reminder sent to ${appointment.clients.email}`)
          } else {
            errorCount++
            console.error(`Failed to send reminder to ${appointment.clients.email}`)
          }
        } else {
          skippedCount++
        }

        // TODO: Implementar SMS y WhatsApp cuando estén configurados
        // if (settings.methods.includes('sms') && appointment.clients.phone) {
        //   // Enviar SMS usando Twilio
        // }

      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: 'Reminders processed successfully',
      stats: {
        total: appointments.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
        cancelled: pastAppointments?.length || 0
      }
    }

    console.log('Job completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-appointment-reminders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
