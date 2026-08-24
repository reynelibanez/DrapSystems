import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Mail, Printer, X } from 'lucide-react';
import { baseUrl } from '@/lib/base-url';
import { useTranslation } from 'react-i18next';

interface InvoiceViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  autoPrint?: boolean;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  tip_percentage: number;
  tip_amount: number;
  total: number;
  status: string;
  notes: string | null;
  email_sent: boolean;
  clients: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  businesses: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  service_invoice_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    commission_percentage: number;
  }>;
}

export function InvoiceView({ open, onOpenChange, invoiceId, autoPrint = false }: InvoiceViewProps) {
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoice();
    }
  }, [open, invoiceId]);

  // Auto-print cuando autoPrint es true y la factura está cargada
  useEffect(() => {
    if (autoPrint && invoice && !loading) {
      console.log('🖨️ Auto-printing invoice:', invoice.invoice_number);
      // Pequeño delay para asegurar que el diálogo esté completamente renderizado
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, invoice, loading]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener la factura
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('service_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // 2. Obtener datos del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('full_name, email, phone')
        .eq('id', invoiceData.client_id)
        .single();

      if (clientError) throw clientError;

      // 3. Obtener datos del negocio
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('name, email, phone, address')
        .eq('id', invoiceData.business_id)
        .single();

      if (businessError) throw businessError;

      // 4. Obtener items de la factura
      const { data: itemsData, error: itemsError } = await supabase
        .from('service_invoice_items')
        .select('description, quantity, unit_price, subtotal, commission_percentage')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      // 5. Combinar todos los datos
      const completeInvoice = {
        ...invoiceData,
        clients: clientData,
        businesses: businessData,
        service_invoice_items: itemsData || []
      };

      setInvoice(completeInvoice);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast.error(t('servicesModule.invoiceView.errorUpdating'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Generar HTML para imprimir
    const printContent = generatePrintableHtml(invoice);
    
    // Crear una nueva ventana
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor permite ventanas emergentes para imprimir');
      return;
    }
    
    // Escribir el contenido
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const generatePrintableHtml = (invoice: InvoiceData): string => {
    const formatDate = (date: string) => {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es });
    };

    const itemsHtml = invoice.service_invoice_items
      .map(
        (item, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0;">${item.description}</td>
          <td style="padding: 12px 0; text-align: right;">${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right;">$${item.unit_price.toFixed(2)}</td>
          <td style="padding: 12px 0; text-align: right;">$${item.subtotal.toFixed(2)}</td>
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            background-color: white;
          }
          .invoice-container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
          }
          .business-info h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #111827;
          }
          .business-info p {
            margin: 4px 0;
            font-size: 14px;
            color: #6b7280;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #111827;
          }
          .invoice-title p {
            margin: 4px 0;
            font-size: 14px;
            color: #374151;
          }
          .invoice-title span {
            font-weight: 600;
          }
          .separator {
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
          }
          .client-info h3 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #111827;
          }
          .client-info p {
            margin: 4px 0;
            font-size: 14px;
          }
          .client-info .client-name {
            font-weight: 500;
            color: #111827;
          }
          .client-info .client-detail {
            color: #6b7280;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }
          .items-table thead tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table th {
            padding: 8px 0;
            text-align: left;
            font-size: 14px;
            font-weight: 500;
            color: #111827;
          }
          .items-table th:nth-child(2),
          .items-table th:nth-child(3),
          .items-table th:nth-child(4) {
            text-align: right;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table td {
            padding: 12px 0;
            font-size: 14px;
            color: #374151;
          }
          .items-table td:nth-child(2),
          .items-table td:nth-child(3),
          .items-table td:nth-child(4) {
            text-align: right;
          }
          .totals-container {
            display: flex;
            justify-content: flex-end;
            margin: 24px 0;
          }
          .totals {
            width: 256px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-row.subtotal {
            font-size: 14px;
          }
          .total-row.subtotal span:last-child {
            font-weight: 600;
          }
          .total-row.tax,
          .total-row.discount {
            font-size: 14px;
            color: #6b7280;
          }
          .total-row.discount {
            color: #ef4444;
          }
          .total-separator {
            height: 1px;
            background-color: #e5e7eb;
            margin: 8px 0;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: 700;
            padding: 12px 0;
          }
          .notes {
            margin: 24px 0;
          }
          .notes h3 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #111827;
          }
          .notes p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            padding-top: 32px;
            margin-top: 32px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
          .footer p {
            margin: 0;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 1cm;
              size: letter;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header-grid">
            <div class="business-info">
              <h3>${invoice.businesses.name}</h3>
              ${invoice.businesses.address ? `<p>${invoice.businesses.address}</p>` : ''}
              ${invoice.businesses.phone ? `<p>Tel: ${invoice.businesses.phone}</p>` : ''}
              ${invoice.businesses.email ? `<p>Email: ${invoice.businesses.email}</p>` : ''}
            </div>
            
            <div class="invoice-title">
              <h2>FACTURA</h2>
              <p><span>Número:</span> ${invoice.invoice_number}</p>
              <p><span>Fecha:</span> ${formatDate(invoice.invoice_date)}</p>
              ${invoice.due_date ? `<p><span>Vencimiento:</span> ${formatDate(invoice.due_date)}</p>` : ''}
            </div>
          </div>

          <div class="separator"></div>

          <!-- Client Info -->
          <div class="client-info">
            <h3>Facturar a:</h3>
            <p class="client-name">${invoice.clients.full_name}</p>
            <p class="client-detail">${invoice.clients.email}</p>
            ${invoice.clients.phone ? `<p class="client-detail">Tel: ${invoice.clients.phone}</p>` : ''}
          </div>

          <div class="separator"></div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals-container">
            <div class="totals">
              <div class="total-row subtotal">
                <span>Subtotal:</span>
                <span>$${invoice.subtotal.toFixed(2)}</span>
              </div>
              
              ${
                invoice.tax_percentage > 0
                  ? `
              <div class="total-row tax">
                <span>Impuesto (${invoice.tax_percentage}%):</span>
                <span>$${invoice.tax_amount.toFixed(2)}</span>
              </div>
              `
                  : ''
              }
              
              ${
                invoice.discount_percentage > 0
                  ? `
              <div class="total-row discount">
                <span>Descuento (${invoice.discount_percentage}%):</span>
                <span>-$${invoice.discount_amount.toFixed(2)}</span>
              </div>
              `
                  : ''
              }
              
              ${
                invoice.tip_percentage > 0
                  ? `
              <div class="total-row tax">
                <span>Propina (${invoice.tip_percentage}%):</span>
                <span>+$${invoice.tip_amount.toFixed(2)}</span>
              </div>
              `
                  : ''
              }
              
              <div class="total-separator"></div>
              
              <div class="total-row final">
                <span>Total:</span>
                <span>$${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${
            invoice.notes
              ? `
          <div class="separator"></div>
          <div class="notes">
            <h3>Notas:</h3>
            <p>${invoice.notes}</p>
          </div>
          `
              : ''
          }

          <!-- Footer -->
          <div class="footer">
            <p>Gracias por su preferencia</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendEmail = async () => {
    try {
      console.log('📧 Enviando email para factura:', invoice.id);
      
      const response = await fetch(`${baseUrl}/api/services/send-invoice-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const data = await response.json();
      console.log('📧 Respuesta del servidor:', data);

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || 'Error al enviar email');
      }

      toast.success(t('servicesModule.invoiceForm.invoiceCreated'));
      loadInvoice(); // Recargar para actualizar el estado de email_sent
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      toast.error(`${t('servicesModule.invoiceView.errorUpdating')}: ${error.message}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      
      const { error } = await supabase
        .from('service_invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast.success(t('servicesModule.invoiceView.statusUpdated'));
      loadInvoice(); // Recargar la factura
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(t('servicesModule.invoiceView.errorUpdating'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      paid: { variant: 'default', label: 'Pagada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
      overdue: { variant: 'destructive', label: 'Vencida' },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle>{t('servicesModule.invoiceView.invoice')} {invoice.invoice_number}</DialogTitle>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="flex gap-2">
              <Select
                value={invoice.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('servicesModule.invoiceView.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header de la factura */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-2">{invoice.businesses.name}</h3>
              {invoice.businesses.address && (
                <p className="text-sm text-muted-foreground">{invoice.businesses.address}</p>
              )}
              {invoice.businesses.phone && (
                <p className="text-sm text-muted-foreground">Tel: {invoice.businesses.phone}</p>
              )}
              {invoice.businesses.email && (
                <p className="text-sm text-muted-foreground">Email: {invoice.businesses.email}</p>
              )}
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold mb-2">{t('servicesModule.invoiceView.invoice').toUpperCase()}</h2>
              <p className="text-sm">
                <span className="font-semibold">Número:</span> {invoice.invoice_number}
              </p>
              <p className="text-sm">
                <span className="font-semibold">{t('servicesModule.invoiceView.date')}:</span>{' '}
                {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: es })}
              </p>
              {invoice.due_date && (
                <p className="text-sm">
                  <span className="font-semibold">{t('servicesModule.invoiceView.dueDate')}:</span>{' '}
                  {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del cliente */}
          <div>
            <h3 className="font-semibold mb-2">{t('servicesModule.invoiceView.billTo')}:</h3>
            <p className="font-medium">{invoice.clients.full_name}</p>
            <p className="text-sm text-muted-foreground">{invoice.clients.email}</p>
            {invoice.clients.phone && (
              <p className="text-sm text-muted-foreground">Tel: {invoice.clients.phone}</p>
            )}
          </div>

          <Separator />

          {/* Items de la factura */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">{t('servicesModule.invoiceView.itemsTable.description')}</th>
                  <th className="text-right py-2">{t('servicesModule.invoiceView.itemsTable.quantity')}</th>
                  <th className="text-right py-2">{t('servicesModule.invoiceView.itemsTable.unitPrice')}</th>
                  <th className="text-right py-2">{t('servicesModule.invoiceView.itemsTable.subtotal')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.service_invoice_items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">${item.unit_price.toFixed(2)}</td>
                    <td className="text-right py-3">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>{t('servicesModule.invoiceView.subtotal')}:</span>
                <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.tax_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('servicesModule.invoiceView.tax')} ({invoice.tax_percentage}%):</span>
                  <span>${invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}

              {invoice.discount_percentage > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>{t('servicesModule.invoiceView.discount')} ({invoice.discount_percentage}%):</span>
                  <span>-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}

              {invoice.tip_percentage > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('servicesModule.invoiceView.tip')} ({invoice.tip_percentage}%):</span>
                  <span>+${invoice.tip_amount.toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>{t('servicesModule.invoiceView.total')}:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">{t('servicesModule.invoiceView.notes')}:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>Gracias por su preferencia</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




















