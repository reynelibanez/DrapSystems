import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('📧 [send-invoice-email] Endpoint llamado');
  
  try {
    const body = await request.json() as { invoiceId: string };
    const { invoiceId } = body;
    console.log('📋 Invoice ID recibido:', invoiceId);

    if (!invoiceId) {
      console.error('❌ Invoice ID no proporcionado');
      return new Response(
        JSON.stringify({ error: 'Invoice ID es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener credenciales
    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    const fromEmail = locals?.runtime?.env?.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@drapsystems.com';

    console.log('🔑 Credenciales:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey,
      fromEmail
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return new Response(
        JSON.stringify({ error: 'Servicio no configurado correctamente' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY no configurada');
      return new Response(
        JSON.stringify({ error: 'Servicio de email no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase con service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Inicializar Resend
    const resend = new Resend(resendApiKey);

    // Obtener factura
    console.log('🔍 Buscando factura...');
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('service_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('❌ Factura no encontrada:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Factura no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Factura encontrada:', invoice.invoice_number);

    // Obtener cliente
    console.log('🔍 Buscando cliente...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('full_name, email, phone')
      .eq('id', invoice.client_id)
      .single();

    if (clientError || !client) {
      console.error('❌ Cliente no encontrado:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Cliente encontrado:', client.full_name);

    if (!client.email) {
      console.error('❌ Cliente no tiene email configurado');
      return new Response(
        JSON.stringify({ error: 'El cliente no tiene un email configurado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Email del cliente:', client.email);

    // Obtener negocio
    console.log('🔍 Buscando negocio...');
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name, email, phone, address')
      .eq('id', invoice.business_id)
      .single();

    if (businessError || !business) {
      console.error('❌ Negocio no encontrado:', businessError);
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Negocio encontrado:', business.name);

    // Obtener items de la factura
    console.log('🔍 Buscando items de la factura...');
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('service_invoice_items')
      .select('description, quantity, unit_price, subtotal, commission_percentage')
      .eq('invoice_id', invoiceId);

    if (itemsError) {
      console.error('❌ Error al cargar items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Error al cargar items de la factura' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Items encontrados: ${items?.length || 0}`);

    // Generar HTML del email
    const emailHtml = generateInvoiceEmailHtml(invoice, client, business, items || []);

    // Enviar email
    try {
      console.log('📤 Enviando email a:', client.email);
      const result = await resend.emails.send({
        from: `${business.name} <${fromEmail}>`,
        to: client.email,
        subject: `Factura ${invoice.invoice_number} - ${business.name}`,
        html: emailHtml,
      });

      if (result.error) {
        console.error('❌ Error de Resend:', result.error);
        throw new Error(result.error.message || 'Error al enviar email');
      }

      console.log('✅ Email enviado exitosamente:', result.data?.id);

      // Actualizar factura como enviada
      console.log('📝 Actualizando estado de factura...');
      const { error: updateError } = await supabaseAdmin
        .from('service_invoices')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('⚠️ Error al actualizar factura:', updateError);
        // No es crítico, el email ya se envió
      } else {
        console.log('✅ Factura actualizada como enviada');
      }

      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (emailError: any) {
      console.error('❌ Error al enviar email:', emailError);
      console.error('   Mensaje:', emailError.message);
      return new Response(
        JSON.stringify({ error: 'Error al enviar email', details: emailError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Error en send-invoice-email:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function generateInvoiceEmailHtml(
  invoice: any,
  client: any,
  business: any,
  items: any[]
): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; color: #374151;">${item.description}</td>
        <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; color: #374151;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura ${invoice.invoice_number}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 800px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 48px 48px 32px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="width: 50%; vertical-align: top;">
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #111827;">${business.name}</h3>
                        ${business.address ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${business.address}</p>` : ''}
                        ${business.phone ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Tel: ${business.phone}</p>` : ''}
                        ${business.email ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Email: ${business.email}</p>` : ''}
                      </td>
                      <td style="width: 50%; vertical-align: top; text-align: right;">
                        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #5AC1FF;">FACTURA</h2>
                        <p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Número:</strong> ${invoice.invoice_number}</p>
                        <p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Fecha:</strong> ${formatDate(invoice.invoice_date)}</p>
                        ${invoice.due_date ? `<p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Vencimiento:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Separator -->
              <tr>
                <td style="padding: 0 48px;">
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                </td>
              </tr>

              <!-- Client Info -->
              <tr>
                <td style="padding: 24px 48px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Facturar a:</h3>
                  <p style="margin: 4px 0; font-size: 16px; font-weight: 600; color: #111827;">${client.full_name}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${client.email}</p>
                  ${client.phone ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Tel: ${client.phone}</p>` : ''}
                </td>
              </tr>

              <!-- Separator -->
              <tr>
                <td style="padding: 0 48px;">
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 24px 48px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e5e7eb;">
                        <th style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: 600; color: #111827;">Descripción</th>
                        <th style="padding: 12px 8px; text-align: center; font-size: 14px; font-weight: 600; color: #111827;">Cant.</th>
                        <th style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">Precio Unit.</th>
                        <th style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Totals -->
              <tr>
                <td style="padding: 24px 48px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="width: 60%;"></td>
                      <td style="width: 40%;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #374151;">Subtotal:</td>
                            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">${formatCurrency(invoice.subtotal)}</td>
                          </tr>
                          ${
                            invoice.tax_percentage > 0
                              ? `
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Impuesto (${invoice.tax_percentage}%):</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; text-align: right;">${formatCurrency(invoice.tax_amount)}</td>
                          </tr>
                          `
                              : ''
                          }
                          ${
                            invoice.discount_percentage > 0
                              ? `
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #ef4444;">Descuento (${invoice.discount_percentage}%):</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #ef4444; text-align: right;">-${formatCurrency(invoice.discount_amount)}</td>
                          </tr>
                          `
                              : ''
                          }
                          <tr>
                            <td colspan="2" style="padding: 8px 0;">
                              <div style="height: 1px; background-color: #e5e7eb;"></div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; font-size: 20px; font-weight: 700; color: #111827;">Total:</td>
                            <td style="padding: 12px 0; font-size: 20px; font-weight: 700; color: #5AC1FF; text-align: right;">${formatCurrency(invoice.total)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${
                invoice.notes
                  ? `
              <!-- Separator -->
              <tr>
                <td style="padding: 0 48px;">
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                </td>
              </tr>

              <!-- Notes -->
              <tr>
                <td style="padding: 24px 48px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Notas:</h3>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; white-space: pre-wrap;">${invoice.notes}</p>
                </td>
              </tr>
              `
                  : ''
              }

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 48px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Gracias por su preferencia</p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">${business.name}</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}





