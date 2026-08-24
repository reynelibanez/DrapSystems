

import React, { useEffect, useState } from 'react';
import { Plus, Eye, Mail, Printer, FileText, CheckCircle, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceView } from './InvoiceView';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { baseUrl } from '@/lib/base-url';
import { useTranslation } from 'react-i18next';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  invoice_date: string;
  total: number;
  status: string;
  email_sent: boolean;
  clients: {
    full_name: string;
    email: string;
  };
}

interface CompletedAppointment {
  id: string;
  start_time: string;
  end_time: string;
  client_id: string;
  staff_id: string;
  service_id: string;
  notes: string | null;
  client?: { full_name: string; email: string };
  staff?: { full_name: string };
  service?: { name: string; price: number; commission_percentage: number };
  is_invoiced?: boolean;
}

// Componente separado para las acciones de cada factura
interface InvoiceActionsProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onSendEmail: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
}

function InvoiceActions({ invoice, onView, onEdit, onDelete, onUpdateStatus, onSendEmail, onPrint }: InvoiceActionsProps) {
  const { t } = useTranslation();
  console.log('🎯 InvoiceActions rendered for:', invoice.invoice_number, 'ID:', invoice.id);
  
  const canEdit = invoice.status !== 'paid';
  
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          console.log('👁️ View clicked for:', invoice.invoice_number, 'ID:', invoice.id);
          onView(invoice);
        }}
        title={t('servicesModule.invoiceManagement.viewInvoice')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log('✏️ Edit clicked for:', invoice.invoice_number, 'ID:', invoice.id);
            onEdit(invoice);
          }}
          title={t('servicesModule.invoiceManagement.editInvoice')}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log('✅ Approve clicked for:', invoice.invoice_number, 'ID:', invoice.id);
            onUpdateStatus(invoice.id, 'paid');
          }}
          title={t('servicesModule.invoiceManagement.markAsPaid')}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log('🗑️ Delete clicked for:', invoice.invoice_number, 'ID:', invoice.id);
            onDelete(invoice);
          }}
          title={t('servicesModule.invoiceManagement.deleteInvoice')}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          console.log('📧 Email clicked for:', invoice.invoice_number, 'ID:', invoice.id);
          onSendEmail(invoice);
        }}
        disabled={invoice.email_sent}
        title={t('servicesModule.invoiceManagement.sendByEmail')}
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖨️ Print clicked for:', invoice.invoice_number, 'ID:', invoice.id);
          onPrint(invoice);
        }}
        title={t('servicesModule.common.print')}
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function InvoiceManagement() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    loadInvoices();
    loadCompletedAppointments();
  }, [profile]);

  // Escuchar evento para cambiar a facturas y cargar datos pre-cargados
  useEffect(() => {
    const handleSwitchToInvoices = () => {
      console.log('📋 Switching to invoices tab...');
      
      // Cargar datos pre-cargados desde localStorage
      const pendingData = localStorage.getItem('pendingInvoiceData');
      if (pendingData) {
        try {
          const data = JSON.parse(pendingData);
          console.log('📋 Loaded pending invoice data:', data);
          setPendingInvoiceData(data);
          setFormOpen(true);
          
          // Limpiar localStorage
          localStorage.removeItem('pendingInvoiceData');
        } catch (error) {
          console.error('Error parsing pending invoice data:', error);
        }
      }
    };

    window.addEventListener('switchToInvoices', handleSwitchToInvoices);
    
    // Verificar si hay datos pendientes al montar el componente
    handleSwitchToInvoices();

    return () => {
      window.removeEventListener('switchToInvoices', handleSwitchToInvoices);
    };
  }, []);

  const loadInvoices = async () => {
    if (!profile?.business_id) return;

    try {
      setLoading(true);
      
      // Primero obtener las facturas
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('service_invoices')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('status', { ascending: true }) // Pendientes primero
        .order('invoice_number', { ascending: false }); // Mayor a menor

      if (invoicesError) throw invoicesError;

      // Obtener los items de las facturas para saber cuáles vienen de citas
      let invoiceItemsMap = new Map<string, boolean>();
      if (invoicesData && invoicesData.length > 0) {
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: itemsData } = await supabase
          .from('service_invoice_items')
          .select('invoice_id, appointment_id')
          .in('invoice_id', invoiceIds);

        // Marcar facturas que tienen items con appointment_id
        itemsData?.forEach(item => {
          if (item.appointment_id) {
            invoiceItemsMap.set(item.invoice_id, true);
          }
        });
      }

      // Luego obtener los datos de los clientes
      if (invoicesData && invoicesData.length > 0) {
        const clientIds = [...new Set(invoicesData.map(inv => inv.client_id))];
        
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, full_name, email')
          .in('id', clientIds);

        if (clientsError) throw clientsError;

        // Crear un mapa de clientes por ID
        const clientsMap = new Map(
          clientsData?.map(client => [client.id, client]) || []
        );

        // Combinar los datos
        const invoicesWithClients = invoicesData.map(invoice => ({
          ...invoice,
          clients: clientsMap.get(invoice.client_id) || { full_name: 'N/A', email: '' },
          isFromAppointment: invoiceItemsMap.get(invoice.id) || false
        }));

        // Ordenar manualmente: pendientes/vencidas primero, luego por número descendente
        const sortedInvoices = invoicesWithClients.sort((a, b) => {
          // Primero ordenar por estado (pendientes y vencidas primero)
          const statusOrder: Record<string, number> = {
            'pending': 1,
            'overdue': 2,
            'paid': 3,
            'cancelled': 4
          };
          
          const statusA = statusOrder[a.status] || 999;
          const statusB = statusOrder[b.status] || 999;
          
          if (statusA !== statusB) {
            return statusA - statusB;
          }
          
          // Si tienen el mismo estado, ordenar por número de factura (mayor a menor)
          const numA = parseInt(a.invoice_number.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.invoice_number.replace(/\D/g, '')) || 0;
          return numB - numA;
        });

        setInvoices(sortedInvoices);
      } else {
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast.error(t('servicesModule.invoiceManagement.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedAppointments = async () => {
    if (!profile?.business_id) return;

    try {
      setLoadingAppointments(true);
      
      // Cargar citas completadas
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          client_id,
          staff_id,
          service_id,
          notes,
          client:clients!appointments_client_id_fkey(full_name, email),
          staff:profiles!appointments_staff_id_fkey(full_name),
          service:services(name, price, commission_percentage)
        `)
        .eq('business_id', profile.business_id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Verificar cuáles ya están facturadas
      const appointmentIds = appointments?.map(a => a.id) || [];
      let invoicedAppointmentIds: string[] = [];

      if (appointmentIds.length > 0) {
        const { data: invoiceItems, error: invoiceError } = await supabase
          .from('service_invoice_items')
          .select('appointment_id')
          .in('appointment_id', appointmentIds)
          .not('appointment_id', 'is', null);

        if (!invoiceError && invoiceItems) {
          invoicedAppointmentIds = invoiceItems.map(item => item.appointment_id).filter(Boolean) as string[];
        }
      }

      // Marcar las citas que ya están facturadas
      const appointmentsWithInvoiceStatus = appointments?.map(apt => ({
        ...apt,
        is_invoiced: invoicedAppointmentIds.includes(apt.id)
      })) || [];

      // Ordenar: primero las NO facturadas, luego las facturadas
      const sortedAppointments = appointmentsWithInvoiceStatus.sort((a, b) => {
        // Si a no está facturada y b sí, a va primero (return -1)
        if (!a.is_invoiced && b.is_invoiced) return -1;
        // Si a está facturada y b no, b va primero (return 1)
        if (a.is_invoiced && !b.is_invoiced) return 1;
        // Si ambas tienen el mismo estado, ordenar por fecha (más reciente primero)
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      });

      console.log('📅 Loaded completed appointments:', sortedAppointments);
      setCompletedAppointments(sortedAppointments as any);
    } catch (error: any) {
      console.error('Error loading completed appointments:', error);
      toast.error('Error al cargar citas completadas');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleCreateInvoiceFromAppointment = (appointment: CompletedAppointment) => {
    // Cargar los datos de la cita en el formulario
    const invoiceData = {
      clientId: appointment.client_id,
      staffId: appointment.staff_id,
      items: [{
        serviceId: appointment.service_id,
        description: appointment.service?.name || '',
        quantity: 1,
        price: appointment.service?.price || 0,
        commissionPercentage: appointment.service?.commission_percentage || 0,
        appointmentId: appointment.id
      }]
    };
    
    setPendingInvoiceData(invoiceData);
    setActiveTab('invoices');
    setFormOpen(true);
    
    toast.success('Datos cargados. Completa la factura.');
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      console.log('📧 Sending email for invoice:', invoice.invoice_number, 'ID:', invoice.id);
      
      const response = await fetch(`${baseUrl}/api/services/send-invoice-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      console.log('📧 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Error al enviar email');
      }

      const result = await response.json();
      console.log('✅ Email sent successfully:', result);

      toast.success(t('servicesModule.invoiceManagement.emailSentSuccess'));
      loadInvoices();
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      toast.error(error.message || t('servicesModule.invoiceManagement.errorSendingEmail'));
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      console.log('🔍 handleUpdateStatus called with:', { invoiceId, newStatus });
      
      const { error } = await supabase
        .from('service_invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      console.log('✅ Status updated successfully for invoice:', invoiceId);
      toast.success(t('servicesModule.invoiceManagement.statusUpdatedSuccess'));
      await loadInvoices();
      
      // Disparar evento para que el dashboard se recargue
      window.dispatchEvent(new Event('invoiceUpdated'));
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      toast.error(t('servicesModule.invoiceManagement.errorUpdatingStatus'));
    }
  };

  const handleEdit = (invoice: Invoice) => {
    console.log('✏️ Editing invoice:', invoice.invoice_number);
    setInvoiceToEdit(invoice);
    setFormOpen(true);
  };

  const handlePrint = (invoice: Invoice) => {
    console.log('🖨️ Opening invoice for print:', invoice.invoice_number);
    setSelectedInvoice(invoice);
    setAutoPrint(true);
    setViewOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    console.log('🗑️ Preparing to delete invoice:', invoice.invoice_number);
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) {
      console.error('❌ No invoice to delete');
      return;
    }

    // Verificar que la factura no esté pagada
    if (invoiceToDelete.status === 'paid') {
      toast.error(t('servicesModule.invoiceManagement.cannotDeletePaid'));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      return;
    }

    try {
      console.log('🗑️ Starting delete process for invoice:', {
        id: invoiceToDelete.id,
        number: invoiceToDelete.invoice_number,
        status: invoiceToDelete.status,
        business_id: profile?.business_id,
        user_id: profile?.id
      });

      // Verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);

      if (!user) {
        toast.error(t('servicesModule.invoiceManagement.notAuthenticated'));
        return;
      }

      // Verificar que la factura pertenece al negocio del usuario
      const { data: invoiceCheck, error: checkError } = await supabase
        .from('service_invoices')
        .select('id, business_id, status')
        .eq('id', invoiceToDelete.id)
        .single();

      if (checkError) {
        console.error('❌ Error checking invoice:', checkError);
        throw checkError;
      }

      console.log('🔍 Invoice verification:', {
        invoice_business_id: invoiceCheck?.business_id,
        user_business_id: profile?.business_id,
        match: invoiceCheck?.business_id === profile?.business_id
      });

      if (invoiceCheck?.business_id !== profile?.business_id) {
        toast.error(t('servicesModule.invoiceManagement.invoiceNotBelongToBusiness'));
        return;
      }

      // Primero verificar cuántos items tiene la factura
      const { data: itemsCount, error: countError } = await supabase
        .from('service_invoice_items')
        .select('id', { count: 'exact', head: false })
        .eq('invoice_id', invoiceToDelete.id);

      if (countError) {
        console.error('❌ Error counting items:', countError);
        throw countError;
      }

      console.log(`📊 Found ${itemsCount?.length || 0} items to delete`);

      // Eliminar los items de la factura
      const { error: itemsError, count: deletedItemsCount } = await supabase
        .from('service_invoice_items')
        .delete({ count: 'exact' })
        .eq('invoice_id', invoiceToDelete.id);

      if (itemsError) {
        console.error('❌ Error deleting items:', {
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint,
          code: itemsError.code
        });
        throw itemsError;
      }

      console.log(`✅ Deleted ${deletedItemsCount || 0} items successfully`);

      // Eliminar la factura
      const { error: invoiceError, count: deletedInvoiceCount, data: deletedData } = await supabase
        .from('service_invoices')
        .delete({ count: 'exact' })
        .eq('id', invoiceToDelete.id)
        .select();

      if (invoiceError) {
        console.error('❌ Error deleting invoice:', {
          message: invoiceError.message,
          details: invoiceError.details,
          hint: invoiceError.hint,
          code: invoiceError.code
        });
        throw invoiceError;
      }

      console.log(`✅ Delete operation completed:`, {
        count: deletedInvoiceCount,
        data: deletedData
      });

      if (deletedInvoiceCount === 0) {
        console.warn('⚠️ No invoice was deleted. Possible RLS policy issue.');
        console.warn('🔍 Debugging info:', {
          invoice_id: invoiceToDelete.id,
          user_id: user.id,
          business_id: profile?.business_id,
          invoice_business_id: invoiceCheck?.business_id
        });
        toast.error(t('servicesModule.invoiceManagement.errorDeletingPermissions'));
        return;
      }

      toast.success(t('servicesModule.invoiceManagement.deleteSuccess', { number: invoiceToDelete.invoice_number }));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      // Recargar la lista de facturas
      await loadInvoices();
      
      // Disparar evento para que el dashboard se recargue
      window.dispatchEvent(new Event('invoiceUpdated'));
      
    } catch (error: any) {
      console.error('❌ Error deleting invoice:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      let errorMessage = t('servicesModule.invoiceManagement.errorDeleting');
      
      if (error.code === '42501') {
        errorMessage = t('servicesModule.invoiceManagement.errorDeletingNoPermissions');
      } else if (error.code === 'PGRST301') {
        errorMessage = t('servicesModule.invoiceManagement.errorDeletingRLS');
      } else if (error.message) {
        errorMessage = `${t('servicesModule.common.error')}: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: t('servicesModule.invoiceManagement.statuses.pending') },
      paid: { variant: 'default', label: t('servicesModule.invoiceManagement.statuses.paid') },
      cancelled: { variant: 'destructive', label: t('servicesModule.invoiceManagement.statuses.cancelled') },
      overdue: { variant: 'destructive', label: t('servicesModule.invoiceManagement.statuses.overdue') },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'invoice_number',
      label: t('servicesModule.invoiceManagement.invoiceNumber'),
      sortable: true,
    },
    {
      key: 'clients',
      label: t('servicesModule.common.client'),
      render: (row: Invoice) => row.clients?.full_name || 'N/A',
    },
    {
      key: 'invoice_date',
      label: t('servicesModule.common.date'),
      render: (row: Invoice) => format(new Date(row.invoice_date), 'dd/MM/yyyy', { locale: es }),
      sortable: true,
    },
    {
      key: 'total',
      label: t('servicesModule.common.total'),
      render: (row: Invoice) => `$${row.total.toFixed(2)}`,
      sortable: true,
    },
    {
      key: 'status',
      label: t('servicesModule.invoiceManagement.status'),
      render: (row: Invoice) => getStatusBadge(row.status),
    },
    {
      key: 'source',
      label: t('servicesModule.invoiceManagement.source'),
      render: (row: any) => (
        row.isFromAppointment ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="h-3 w-3 mr-1" />
            {t('servicesModule.invoiceManagement.fromAppointment')}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('servicesModule.invoiceManagement.manual')}
          </Badge>
        )
      ),
    },
    {
      key: 'email_sent',
      label: t('servicesModule.common.email'),
      render: (row: Invoice) => (
        <Badge variant={row.email_sent ? 'default' : 'secondary'}>
          {row.email_sent ? t('servicesModule.invoiceManagement.sent') : t('servicesModule.invoiceManagement.notSent')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('servicesModule.common.actions'),
      render: (row: Invoice) => (
        <InvoiceActions
          invoice={row}
          onView={(inv) => {
            setSelectedInvoice(inv);
            setAutoPrint(false);
            setViewOpen(true);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          onSendEmail={handleSendEmail}
          onPrint={handlePrint}
        />
      ),
    },
  ];

  const appointmentColumns = [
    {
      key: 'start_time',
      label: 'Fecha',
      render: (row: CompletedAppointment) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {format(new Date(row.start_time), 'dd/MM/yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(row.start_time), 'HH:mm')}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      className: 'w-[140px]',
    },
    {
      key: 'client',
      label: 'Cliente',
      render: (row: CompletedAppointment) => (
        <div>
          <div className="font-medium">{(row.client as any)?.full_name || 'Sin nombre'}</div>
          <div className="text-xs text-muted-foreground">{(row.client as any)?.email}</div>
        </div>
      ),
      sortable: true,
      className: 'min-w-[180px]',
    },
    {
      key: 'service',
      label: 'Servicio',
      render: (row: CompletedAppointment) => (
        <div>
          <div className="font-medium">{(row.service as any)?.name || 'Sin servicio'}</div>
          <div className="text-xs text-muted-foreground">
            ${(row.service as any)?.price?.toFixed(2) || '0.00'}
          </div>
        </div>
      ),
      sortable: true,
      className: 'min-w-[160px]',
    },
    {
      key: 'staff',
      label: 'Personal',
      render: (row: CompletedAppointment) => (row.staff as any)?.full_name || 'Sin asignar',
      sortable: true,
      className: 'w-[140px]',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row: CompletedAppointment) => (
        row.is_invoiced ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Facturada
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      ),
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row: CompletedAppointment) => (
        <Button
          variant={row.is_invoiced ? "ghost" : "default"}
          size="sm"
          onClick={() => handleCreateInvoiceFromAppointment(row)}
          disabled={row.is_invoiced}
        >
          <FileText className="h-4 w-4 mr-2" />
          {row.is_invoiced ? 'Facturada' : 'Crear Factura'}
        </Button>
      ),
      className: 'w-[160px]',
    },
  ];

  // Filtrar solo las citas no facturadas
  const pendingAppointments = completedAppointments.filter(apt => !apt.is_invoiced);

  // Filtrar facturas según el término de búsqueda
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const invoiceNumber = invoice.invoice_number.toLowerCase();
    const clientName = invoice.clients?.full_name?.toLowerCase() || '';
    const clientEmail = invoice.clients?.email?.toLowerCase() || '';
    
    return (
      invoiceNumber.includes(search) ||
      clientName.includes(search) ||
      clientEmail.includes(search)
    );
  });

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('servicesModule.invoiceManagement.title')}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Citas Completadas
            {pendingAppointments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('servicesModule.invoiceManagement.title')}</CardTitle>
                    <CardDescription>
                      {t('servicesModule.invoiceManagement.description')}
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setInvoiceToEdit(null);
                    setFormOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('servicesModule.invoiceManagement.newInvoice')}
                  </Button>
                </div>
                
                {/* Campo de búsqueda */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('servicesModule.invoiceManagement.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredInvoices}
                columns={columns}
                loading={loading}
                emptyMessage={searchTerm ? t('servicesModule.invoiceManagement.noResultsFound') : t('servicesModule.invoiceManagement.noInvoices')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Citas Completadas</CardTitle>
                  <CardDescription>
                    Citas completadas pendientes de facturación
                  </CardDescription>
                </div>
                {pendingAppointments.length > 0 && (
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {pendingAppointments.length} pendiente{pendingAppointments.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={completedAppointments}
                columns={appointmentColumns}
                loading={loadingAppointments}
                emptyMessage="No hay citas completadas"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InvoiceForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setInvoiceToEdit(null);
            setPendingInvoiceData(null);
          }
        }}
        onSuccess={() => {
          loadInvoices();
          loadCompletedAppointments();
          setInvoiceToEdit(null);
          setPendingInvoiceData(null);
        }}
        invoiceToEdit={invoiceToEdit}
        pendingInvoiceData={pendingInvoiceData}
      />

      {selectedInvoice && (
        <InvoiceView
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) {
              setAutoPrint(false);
            }
          }}
          invoiceId={selectedInvoice.id}
          autoPrint={autoPrint}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('servicesModule.invoiceManagement.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('servicesModule.invoiceManagement.deleteConfirmDescription', { number: invoiceToDelete?.invoice_number })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('servicesModule.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('servicesModule.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
























































