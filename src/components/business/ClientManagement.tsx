import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  MoreVertical,
  Eye,
  Trash2,
  UserPlus,
  Edit,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { ViewClientProfile } from '../shared/ViewClientProfile';
import { ClientForm } from './ClientForm';
import { SendSMSDialog } from './SendSMSDialog';
import { toast } from 'sonner';
import { baseUrl } from '../../lib/base-url';
import type { Database } from '../../lib/database.types';
import { getPlanLimits, canAddClient, formatLimit, getUsagePercentage, isNearLimit } from '../../lib/plan-limits';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientWithStats extends Client {
  total_appointments: number;
  upcoming_appointments: number;
  last_appointment_date?: string;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  routing_number?: string;
  payment_method?: string;
  payment_notes?: string;
}

interface ClientManagementProps {
  businessId: string;
  showSMSOption?: boolean; // Nueva prop para controlar si se muestra la opción de SMS
  showAppointmentNotes?: boolean; // Nueva prop para controlar si se muestran las notas de citas
}

export function ClientManagement({ businessId, showSMSOption = true, showAppointmentNotes = true }: ClientManagementProps) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientWithStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string; appointmentCount: number } | null>(null);
  const [showSendSMS, setShowSendSMS] = useState(false);
  const [clientForSMS, setClientForSMS] = useState<ClientWithStats | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const { t } = useTranslation();

  console.log('ClientManagement - businessId:', businessId);
  console.log('ClientManagement - clients:', clients);
  console.log('ClientManagement - loading:', loading);
  console.log('ClientManagement - error:', error);

  const handleEditClient = (client: ClientWithStats) => {
    console.log('=== EDITANDO CLIENTE ===');
    console.log('Cliente completo:', client);
    console.log('Campos del cliente:');
    console.log('  ID:', client.id);
    console.log('  Nombre:', client.full_name);
    console.log('  Email:', client.email);
    console.log('  Teléfono:', client.phone);
    console.log('  Fecha de nacimiento:', client.date_of_birth);
    console.log('  Dirección:', client.address);
    console.log('  Ciudad:', client.city);
    console.log('  Código postal:', client.postal_code);
    console.log('  Notas:', client.notes);
    console.log('  Tags:', client.tags);
    console.log('  Avatar URL:', client.avatar_url);
    console.log('  Activo:', client.is_active);
    console.log('  Banco:', (client as any).bank_name);
    console.log('  Titular cuenta:', (client as any).account_holder);
    console.log('  Número cuenta:', (client as any).account_number);
    console.log('  Routing:', (client as any).routing_number);
    console.log('  Método pago:', (client as any).payment_method);
    console.log('  Notas pago:', (client as any).payment_notes);
    
    setClientToEdit(client);
    setShowEditClient(true);
  };

  const handleCloseEdit = () => {
    setShowEditClient(false);
    setClientToEdit(null);
  };

  useEffect(() => {
    loadClients();
    loadBusinessPlan();
  }, [businessId]);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los clientes de este negocio desde la tabla clients
      // Especificamos explícitamente todos los campos para asegurar que se carguen
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          business_id,
          user_id,
          full_name,
          email,
          phone,
          preferred_language,
          date_of_birth,
          address,
          city,
          postal_code,
          notes,
          tags,
          avatar_url,
          is_active,
          created_at,
          updated_at,
          bank_name,
          account_holder,
          account_number,
          routing_number,
          payment_method,
          payment_notes
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      console.log('=== CLIENTES CARGADOS DESDE DB ===');
      console.log('Total de clientes:', clientsData?.length || 0);
      if (clientsData && clientsData.length > 0) {
        console.log('Primer cliente (ejemplo):', clientsData[0]);
        console.log('Campos disponibles:', Object.keys(clientsData[0]));
        console.log('Campos con valor en primer cliente:');
        Object.entries(clientsData[0]).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
          }
        });
      }

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        setFilteredClients([]);
        setLoading(false);
        return;
      }

      // Obtener estadísticas de cada cliente
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          const now = new Date().toISOString();

          const [totalAppts, upcomingAppts, lastAppt] = await Promise.all([
            // Total de citas
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', businessId)
              .eq('client_id', client.id),
            
            // Citas próximas
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', businessId)
              .eq('client_id', client.id)
              .gte('start_time', now)
              .in('status', ['pending', 'confirmed']),
            
            // Última cita
            supabase
              .from('appointments')
              .select('start_time')
              .eq('business_id', businessId)
              .eq('client_id', client.id)
              .order('start_time', { ascending: false })
              .limit(1)
              .single()
          ]);

          return {
            ...client,
            total_appointments: totalAppts.count || 0,
            upcoming_appointments: upcomingAppts.count || 0,
            last_appointment_date: lastAppt.data?.start_time
          };
        })
      );

      console.log('Clientes con estadísticas:', clientsWithStats.length);
      setClients(clientsWithStats);
      setFilteredClients(clientsWithStats);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message || 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('subscription_plan')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentPlan(data.subscription_plan);
      }
    } catch (err) {
      console.error('Error loading business plan:', err);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.full_name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term)
    );

    setFilteredClients(filtered);
  };

  const viewClientDetails = (client: ClientWithStats) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('never');
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleClientAdded = () => {
    setShowAddClient(false);
    loadClients();
  };

  const handleClientUpdated = () => {
    setShowEditClient(false);
    setClientToEdit(null);
    loadClients();
  };

  const initiateDeleteClient = async (client: ClientWithStats) => {
    try {
      // Verificar si el cliente tiene citas
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);

      setClientToDelete({
        id: client.id,
        name: client.full_name || t('noName'),
        appointmentCount: count || 0
      });
      setShowDeleteDialog(true);
    } catch (err: any) {
      console.error('Error checking client appointments:', err);
      toast.error(t('errorCheckingClientAppointments'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      setError(null);

      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar al endpoint API para eliminar el cliente
      const response = await fetch(`${baseUrl}/api/clients/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ clientId: clientToDelete.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el cliente');
      }

      toast.success(t('clientDeletedSuccessfully'));
      loadClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.message || t('errorDeletingClient'));
      toast.error(err.message || t('errorDeletingClient'));
    } finally {
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const handleSendSMS = (client: ClientWithStats) => {
    if (!client.phone) {
      toast.error(t('clientHasNoPhone'));
      return;
    }
    setClientForSMS(client);
    setShowSendSMS(true);
  };

  const handleSMSSent = () => {
    setShowSendSMS(false);
    setClientForSMS(null);
    toast.success(t('smsSentSuccessfully'));
  };

  const handleAddClientClick = () => {
    const limits = getPlanLimits(currentPlan);
    const canAdd = canAddClient(currentPlan, clients.length);

    if (!canAdd) {
      const limitValue = formatLimit(limits.clients);
      toast.error(
        `Has alcanzado el límite de ${limitValue} clientes para el plan ${currentPlan}. Actualiza tu plan para agregar más clientes.`,
        { duration: 5000 }
      );
      return;
    }

    // Advertencia si está cerca del límite
    if (isNearLimit(clients.length, limits.clients)) {
      const percentage = getUsagePercentage(clients.length, limits.clients);
      toast.warning(
        `Estás usando el ${percentage}% de tu límite de clientes. Considera actualizar tu plan.`,
        { duration: 4000 }
      );
    }

    setShowAddClient(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('clientManagement')}
                <Badge variant={isNearLimit(clients.length, getPlanLimits(currentPlan).clients) ? "destructive" : "secondary"}>
                  {clients.length}/{formatLimit(getPlanLimits(currentPlan).clients)}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('manageViewClientInfo')}
              </CardDescription>
            </div>
            <Button onClick={() => handleAddClientClick()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('addClient')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchByNameEmailPhone')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{clients.length}</div>
              <div className="text-sm text-muted-foreground">{t('totalClients')}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {clients.reduce((sum, c) => sum + c.upcoming_appointments, 0)}
              </div>
              <div className="text-sm text-muted-foreground">{t('upcomingAppointments')}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {clients.reduce((sum, c) => sum + c.total_appointments, 0)}
              </div>
              <div className="text-sm text-muted-foreground">{t('totalAppointments')}</div>
            </div>
          </div>

          {/* Lista de clientes */}
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={User}
              title={t('noClients')}
              description={searchTerm ? t('noClientsMatchSearch') : t('noClientsRegisteredYet')}
            />
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">
                          {client.full_name || t('noName')}
                        </h4>
                        {client.upcoming_appointments > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {client.upcoming_appointments} {client.upcoming_appointments > 1 ? t('upcoming_plural') : t('upcoming_singular')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-medium">
                        {client.total_appointments} {t('appointments')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('last')}: {formatDate(client.last_appointment_date)}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedClient(client);
                          setShowDetails(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('viewDetails')}
                        </DropdownMenuItem>
                        {showSMSOption && (
                          <DropdownMenuItem 
                            onClick={() => handleSendSMS(client)}
                            disabled={!client.phone}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {t('sendSMS')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => initiateDeleteClient(client)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para añadir cliente */}
      <ClientForm 
        open={showAddClient}
        onOpenChange={setShowAddClient}
        businessId={businessId}
        onSuccess={handleClientAdded}
      />

      {/* Dialog para editar cliente */}
      {clientToEdit && (
        <ClientForm 
          open={showEditClient}
          onOpenChange={handleCloseEdit}
          businessId={businessId}
          client={clientToEdit}
          onSuccess={handleClientUpdated}
        />
      )}

      {/* Dialog de detalles del cliente */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('clientProfile')}</DialogTitle>
            <DialogDescription>
              {t('completeClientInfo')}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <ViewClientProfile 
              clientId={selectedClient.id} 
              allowEdit={true}
              showAppointmentNotes={showAppointmentNotes}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setClientToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteClient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteClient', { name: clientToDelete?.name || t('thisClient') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para enviar SMS */}
      {clientForSMS && (
        <SendSMSDialog
          open={showSendSMS}
          onOpenChange={setShowSendSMS}
          clientName={clientForSMS.full_name || t('noName')}
          clientPhone={clientForSMS.phone || ''}
          businessId={businessId}
          onSuccess={handleSMSSent}
        />
      )}
    </div>
  );
}
















































