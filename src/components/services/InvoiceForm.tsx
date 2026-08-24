import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  invoiceToEdit?: {
    id: string;
    client_id: string;
    invoice_date: string;
    due_date: string | null;
    tax_percentage: number;
    discount_percentage: number;
    tip_percentage?: number;
    notes: string | null;
  } | null;
  pendingInvoiceData?: {
    clientId: string;
    staffId: string;
    items: Array<{
      serviceId: string;
      description: string;
      quantity: number;
      price: number;
      commissionPercentage: number;
      appointmentId?: string;
    }>;
  } | null;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  commission_percentage: number;
}

interface InvoiceItem {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  commission_percentage: number;
  subtotal: number;
}

export function InvoiceForm({ open, onOpenChange, onSuccess, invoiceToEdit, pendingInvoiceData }: InvoiceFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_percentage: 0,
    discount_percentage: 0,
    tip_percentage: 0,
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [appointmentIds, setAppointmentIds] = useState<string[]>([]);

  // Helper para formatear números sin decimales innecesarios
  const formatNumber = (value: number): string => {
    if (value === 0) return '';
    // Convertir a string y eliminar solo decimales innecesarios
    // 1.50 -> 1.5, 2.00 -> 2, pero 20 sigue siendo 20
    const str = value.toString();
    // Solo eliminar ceros después del punto decimal
    if (str.includes('.')) {
      return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
    return str;
  };

  useEffect(() => {
    if (open) {
      loadClients();
      loadServices();
      if (invoiceToEdit) {
        loadInvoiceData();
      } else if (pendingInvoiceData) {
        loadPendingInvoiceData();
      } else {
        resetForm(); // Limpiar formulario al abrir para nueva factura
      }
    }
  }, [open, profile, invoiceToEdit, pendingInvoiceData]);

  const loadClients = async () => {
    if (!profile?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .eq('business_id', profile.business_id)
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast.error(t('servicesModule.invoiceForm.errorLoading'));
    }
  };

  const loadServices = async () => {
    if (!profile?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, commission_percentage, duration_minutes')
        .eq('business_id', profile.business_id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(t('servicesModule.invoiceForm.errorLoading'));
    }
  };

  const loadInvoiceData = async () => {
    if (!invoiceToEdit) return;

    try {
      console.log('📋 Loading invoice data for editing:', invoiceToEdit.id);
      
      // Cargar datos de la factura
      setFormData({
        client_id: invoiceToEdit.client_id,
        invoice_date: invoiceToEdit.invoice_date,
        due_date: invoiceToEdit.due_date || '',
        tax_percentage: invoiceToEdit.tax_percentage,
        discount_percentage: invoiceToEdit.discount_percentage,
        tip_percentage: invoiceToEdit.tip_percentage || 0,
        notes: invoiceToEdit.notes || '',
      });

      // Cargar items de la factura SIN JOIN para evitar problemas
      const { data: invoiceItems, error } = await supabase
        .from('service_invoice_items')
        .select('service_id, description, quantity, unit_price, commission_percentage, subtotal')
        .eq('invoice_id', invoiceToEdit.id);

      if (error) {
        console.error('❌ Error loading invoice items:', error);
        throw error;
      }

      console.log('✅ Loaded invoice items:', invoiceItems);

      // Cargar nombres de servicios por separado
      const serviceIds = invoiceItems?.map(item => item.service_id).filter(Boolean) || [];
      let serviceNames: Record<string, string> = {};
      
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        if (!servicesError && servicesData) {
          serviceNames = servicesData.reduce((acc, service) => {
            acc[service.id] = service.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const loadedItems: InvoiceItem[] = (invoiceItems || []).map(item => ({
        service_id: item.service_id,
        service_name: serviceNames[item.service_id] || item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        commission_percentage: item.commission_percentage,
        subtotal: item.subtotal,
      }));

      console.log('✅ Processed items for form:', loadedItems);
      setItems(loadedItems);
    } catch (error: any) {
      console.error('❌ Error loading invoice data:', error);
      toast.error(t('servicesModule.invoiceForm.errorLoading') + ': ' + (error.message || 'Error desconocido'));
    }
  };

  const loadPendingInvoiceData = async () => {
    if (!pendingInvoiceData) return;

    try {
      console.log('📋 Loading pending invoice data:', pendingInvoiceData);
      
      // Pre-cargar el cliente
      setFormData(prev => ({
        ...prev,
        client_id: pendingInvoiceData.clientId,
      }));

      // Pre-cargar los items
      const loadedItems: InvoiceItem[] = pendingInvoiceData.items.map(item => ({
        service_id: item.serviceId,
        service_name: item.description,
        quantity: item.quantity,
        unit_price: item.price,
        commission_percentage: item.commissionPercentage,
        subtotal: item.quantity * item.price,
      }));

      setItems(loadedItems);

      // Guardar los IDs de las citas para asociarlas a los items
      const aptIds = pendingInvoiceData.items
        .map(item => item.appointmentId)
        .filter(Boolean) as string[];
      setAppointmentIds(aptIds);

      toast.success('Datos de la cita cargados. Completa la información de la factura.');
    } catch (error: any) {
      console.error('❌ Error loading pending invoice data:', error);
      toast.error('Error al cargar los datos de la cita');
    }
  };

  const handleAddItem = () => {
    if (services.length === 0) {
      toast.error(t('servicesModule.invoiceForm.noServicesAvailable'));
      return;
    }

    const firstService = services[0];
    const newItem: InvoiceItem = {
      service_id: firstService.id,
      service_name: firstService.name,
      quantity: 1,
      unit_price: firstService.price,
      commission_percentage: firstService.commission_percentage || 0,
      subtotal: firstService.price,
    };

    console.log('➕ Adding new item with commission:', newItem.commission_percentage);
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'service_id') {
      const service = services.find(s => s.id === value);
      if (service) {
        item.service_id = service.id;
        item.service_name = service.name;
        item.unit_price = service.price;
        item.commission_percentage = service.commission_percentage || 0;
        console.log('🔄 Service changed, new commission:', item.commission_percentage);
      }
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value) || 0;
    } else if (field === 'unit_price') {
      item.unit_price = parseFloat(value) || 0;
    }

    item.subtotal = item.quantity * item.unit_price;
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = subtotal * (formData.tax_percentage / 100);
    const discountAmount = subtotal * (formData.discount_percentage / 100);
    const tipAmount = subtotal * (formData.tip_percentage / 100);
    const total = subtotal + taxAmount - discountAmount + tipAmount;

    return { subtotal, taxAmount, discountAmount, tipAmount, total };
  };

  const handleSave = async () => {
    if (!profile?.business_id) return;

    if (!formData.client_id) {
      toast.error(t('servicesModule.invoiceForm.selectClientError'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('servicesModule.invoiceForm.addServiceError'));
      return;
    }

    try {
      setLoading(true);
      const totals = calculateTotals();

      if (invoiceToEdit) {
        // Actualizar factura existente
        const { error: invoiceError } = await supabase
          .from('service_invoices')
          .update({
            client_id: formData.client_id,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date || null,
            subtotal: totals.subtotal,
            tax_percentage: formData.tax_percentage,
            tax_amount: totals.taxAmount,
            discount_percentage: formData.discount_percentage,
            discount_amount: totals.discountAmount,
            tip_percentage: formData.tip_percentage,
            tip_amount: totals.tipAmount,
            total: totals.total,
            notes: formData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceToEdit.id);

        if (invoiceError) throw invoiceError;

        // Eliminar items antiguos
        const { error: deleteError } = await supabase
          .from('service_invoice_items')
          .delete()
          .eq('invoice_id', invoiceToEdit.id);

        if (deleteError) throw deleteError;

        // Crear nuevos items
        const invoiceItems = items.map((item, index) => {
          const commissionAmount = (item.subtotal * item.commission_percentage) / 100;
          console.log('💾 Saving item with commission:', {
            service: item.service_name,
            commission_percentage: item.commission_percentage,
            subtotal: item.subtotal,
            commission_amount: commissionAmount
          });
          
          return {
            invoice_id: invoiceToEdit.id,
            service_id: item.service_id,
            staff_id: profile.id,
            description: item.service_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            commission_percentage: item.commission_percentage,
            commission_amount: commissionAmount,
            subtotal: item.subtotal,
            appointment_id: appointmentIds[index] || null,
          };
        });

        const { error: itemsError } = await supabase
          .from('service_invoice_items')
          .insert(invoiceItems);

        if (itemsError) throw itemsError;

        toast.success(t('servicesModule.invoiceForm.invoiceUpdated'));
      } else {
        // Crear nueva factura
        console.log('💾 Creating new invoice...');
        
        const { data: invoice, error: invoiceError } = await supabase
          .from('service_invoices')
          .insert([
            {
              business_id: profile.business_id,
              client_id: formData.client_id,
              staff_id: profile.id,
              invoice_date: formData.invoice_date,
              due_date: formData.due_date || null,
              subtotal: totals.subtotal,
              tax_percentage: formData.tax_percentage,
              tax_amount: totals.taxAmount,
              discount_percentage: formData.discount_percentage,
              discount_amount: totals.discountAmount,
              tip_percentage: formData.tip_percentage,
              tip_amount: totals.tipAmount,
              total: totals.total,
              notes: formData.notes,
              created_by: profile.id,
            },
          ])
          .select()
          .single();

        if (invoiceError) {
          console.error('❌ Error creating invoice:', invoiceError);
          throw invoiceError;
        }

        if (!invoice) {
          console.error('❌ No invoice data returned');
          throw new Error('No se pudo crear la factura');
        }

        console.log('✅ Invoice created:', invoice.id);

        // Crear items de factura
        const invoiceItems = items.map((item, index) => {
          const commissionAmount = (item.subtotal * item.commission_percentage) / 100;
          console.log('💾 Saving item with commission:', {
            service: item.service_name,
            commission_percentage: item.commission_percentage,
            subtotal: item.subtotal,
            commission_amount: commissionAmount,
            appointment_id: appointmentIds[index] || null
          });
          
          return {
            invoice_id: invoice.id,
            service_id: item.service_id,
            staff_id: profile.id,
            description: item.service_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            commission_percentage: item.commission_percentage,
            commission_amount: commissionAmount,
            subtotal: item.subtotal,
            appointment_id: appointmentIds[index] || null,
          };
        });

        console.log('💾 Creating invoice items:', invoiceItems.length);

        const { error: itemsError } = await supabase
          .from('service_invoice_items')
          .insert(invoiceItems);

        if (itemsError) {
          console.error('❌ Error creating invoice items:', itemsError);
          throw itemsError;
        }

        console.log('✅ Invoice items created successfully');
        toast.success(t('servicesModule.invoiceForm.invoiceCreated'));
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error saving invoice:', error);
      
      // Mensaje de error más específico
      let errorMessage = invoiceToEdit 
        ? t('servicesModule.invoiceForm.errorUpdating')
        : t('servicesModule.invoiceForm.errorCreating');
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      if (error.hint) {
        console.error('Error hint:', error.hint);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_percentage: 0,
      discount_percentage: 0,
      tip_percentage: 0,
      notes: '',
    });
    setItems([]);
    setAppointmentIds([]);
  };

  const handleClose = () => {
    resetForm(); // Limpiar al cerrar también
    onOpenChange(false);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoiceToEdit ? t('servicesModule.invoiceForm.editTitle') : t('servicesModule.invoiceForm.title')}
          </DialogTitle>
          <DialogDescription>
            {invoiceToEdit ? t('servicesModule.invoiceForm.editDescription') : t('servicesModule.invoiceForm.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">{t('servicesModule.invoiceForm.client')} {t('servicesModule.invoiceForm.required')}</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('servicesModule.invoiceForm.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">{t('servicesModule.invoiceForm.invoiceDate')} {t('servicesModule.invoiceForm.required')}</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
          </div>

          {/* Items de factura */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('servicesModule.invoiceForm.services')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                {t('servicesModule.invoiceForm.addService')}
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('servicesModule.invoiceForm.noServices')}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs">{t('servicesModule.invoiceForm.service')}</Label>
                        <Select
                          value={item.service_id}
                          onValueChange={(value) => handleItemChange(index, 'service_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ${service.price} ({service.commission_percentage || 0}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">{t('servicesModule.invoiceForm.quantity')}</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={formatNumber(item.quantity)}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? 0 : e.target.value)}
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('servicesModule.invoiceForm.price')}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formatNumber(item.unit_price)}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value === '' ? 0 : e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs">{t('servicesModule.invoiceForm.subtotal')}</Label>
                      <div className="font-semibold">${item.subtotal.toFixed(2)}</div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax">{t('servicesModule.invoiceForm.tax')} (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formatNumber(formData.tax_percentage)}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">{t('servicesModule.invoiceForm.discount')} (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formatNumber(formData.discount_percentage)}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tip">{t('servicesModule.invoiceForm.tip')} (%)</Label>
                <Input
                  id="tip"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formatNumber(formData.tip_percentage)}
                  onChange={(e) => setFormData({ ...formData, tip_percentage: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>{t('servicesModule.invoiceForm.subtotal')}:</span>
                <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
              </div>
              {formData.tax_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('servicesModule.invoiceForm.tax')} ({formData.tax_percentage}%):</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {formData.discount_percentage > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>{t('servicesModule.invoiceForm.discount')} ({formData.discount_percentage}%):</span>
                  <span>-${totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {formData.tip_percentage > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('servicesModule.invoiceForm.tip')} ({formData.tip_percentage}%):</span>
                  <span>+${totals.tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t('servicesModule.invoiceForm.total')}:</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('servicesModule.invoiceForm.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('servicesModule.invoiceForm.notesPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('servicesModule.invoiceForm.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading 
              ? (invoiceToEdit ? t('servicesModule.invoiceForm.updating') : t('servicesModule.invoiceForm.creating')) 
              : (invoiceToEdit ? t('servicesModule.invoiceForm.update') : t('servicesModule.invoiceForm.create'))
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}











































