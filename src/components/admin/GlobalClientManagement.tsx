import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Search, Eye, Trash2, Users, Calendar, Building2, UserPlus, Edit } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ClientForm } from '../business/ClientForm';
import { ViewClientProfile } from '../shared/ViewClientProfile';

interface ClientWithBusiness {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  business_id: string;
  business_name: string;
  total_appointments: number;
  upcoming_appointments: number;
  last_appointment_date?: string;
  user_id?: string;
  // Campos adicionales del cliente
  date_of_birth?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  tags?: string[];
  avatar_url?: string;
  is_active?: boolean;
  updated_at?: string;
  // Campos de pago
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  routing_number?: string;
  payment_method?: string;
  payment_notes?: string;
}

export function GlobalClientManagement() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<ClientWithBusiness[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [defaultBusinessId, setDefaultBusinessId] = useState<string>('');

  useEffect(() => {
    loadAllClients();
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadAllClients = async () => {
    try {
      setLoading(true);
      
      // Verificar usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuario actual:', user?.id);
      
      // Verificar rol del usuario
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, business_id')
        .eq('id', user?.id)
        .single();
      
      console.log('🔑 Perfil del usuario:', profileData);
      
      console.log('🔍 Cargando todos los clientes...');

      // Primero intentar cargar solo los clientes sin joins
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Clientes obtenidos:', clientsData);
      console.log('❌ Error:', clientsError);

      if (clientsError) {
        console.error('Error al cargar clientes:', clientsError);
        toast.error(t('globalClients.errors.loadClients') + ': ' + clientsError.message);
        setLoading(false);
        return;
      }

      if (!clientsData || clientsData.length === 0) {
        console.log('⚠️ No hay clientes en la base de datos');
        setClients([]);
        setFilteredClients([]);
        setLoading(false);
        return;
      }

      console.log(`✅ Se encontraron ${clientsData.length} clientes`);

      // Obtener información de negocios y estadísticas
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          // Obtener nombre del negocio
          let businessName = 'Sin negocio';
          if (client.business_id) {
            const { data: businessData } = await supabase
              .from('businesses')
              .select('name')
              .eq('id', client.business_id)
              .single();
            
            if (businessData) {
              businessName = businessData.name;
            }
          }

          // Obtener estadísticas de citas
          const now = new Date().toISOString();

          const { count: totalCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id);

          const { count: upcomingCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .gte('start_time', now)
            .in('status', ['pending', 'confirmed']);

          const { data: lastApptData } = await supabase
            .from('appointments')
            .select('start_time')
            .eq('client_id', client.id)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Retornar todos los campos del cliente más las estadísticas
          return {
            ...client, // Incluir TODOS los campos del cliente
            business_name: businessName,
            total_appointments: totalCount || 0,
            upcoming_appointments: upcomingCount || 0,
            last_appointment_date: lastApptData?.start_time
          };
        })
      );

      console.log('📈 Clientes con estadísticas:', clientsWithStats);
      setClients(clientsWithStats);
      setFilteredClients(clientsWithStats);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      toast.error(t('globalClients.errors.loadClients') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
      if (data && data.length > 0) {
        setDefaultBusinessId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading businesses:', err);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.business_name.toLowerCase().includes(term)
    );
    setFilteredClients(filtered);
  };

  const handleDeleteClick = (client: ClientWithBusiness) => {
    setClientToDelete({ id: client.id, name: client.full_name });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      toast.success(t('globalClients.success.deleteClient'));
      loadAllClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      toast.error(t('globalClients.errors.deleteClient'));
    } finally {
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const handleViewClient = (client: ClientWithBusiness) => {
    setSelectedClient(client);
    setShowViewDialog(true);
  };

  const handleEditClient = (client: ClientWithBusiness) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    loadAllClients();
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setSelectedClient(null);
    loadAllClients();
  };

  const totalClients = clients.length;
  const totalAppointments = clients.reduce((sum, c) => sum + c.total_appointments, 0);
  const totalUpcoming = clients.reduce((sum, c) => sum + c.upcoming_appointments, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalClients.stats.totalClients')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalClients.stats.totalAppointments')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalClients.stats.upcomingAppointments')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpcoming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('globalClients.title')}</CardTitle>
              <CardDescription>{t('globalClients.description')}</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('globalClients.newClient')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('globalClients.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tabla */}
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? t('globalClients.noClientsFound') : t('globalClients.noClients')}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('globalClients.table.name')}</TableHead>
                      <TableHead>{t('globalClients.table.email')}</TableHead>
                      <TableHead>{t('globalClients.table.phone')}</TableHead>
                      <TableHead>{t('globalClients.table.business')}</TableHead>
                      <TableHead>{t('globalClients.table.totalAppointments')}</TableHead>
                      <TableHead>{t('globalClients.table.upcoming')}</TableHead>
                      <TableHead>{t('globalClients.table.lastAppointment')}</TableHead>
                      <TableHead>{t('globalClients.table.registered')}</TableHead>
                      <TableHead className="text-right">{t('globalClients.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.full_name || t('globalClients.table.noName')}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{client.business_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{client.total_appointments}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.upcoming_appointments > 0 ? 'default' : 'outline'}>
                            {client.upcoming_appointments}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.last_appointment_date
                            ? formatDate(client.last_appointment_date)
                            : t('globalClients.table.never')}
                        </TableCell>
                        <TableCell>{formatDate(client.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewClient(client)}
                              title={t('globalClients.actions.view')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClient(client)}
                              title={t('globalClients.actions.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(client)}
                              title={t('globalClients.actions.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulario Crear Cliente */}
      <ClientForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        businessId={defaultBusinessId}
        onSuccess={handleCreateSuccess}
      />

      {/* Formulario Editar Cliente */}
      <ClientForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        businessId={selectedClient?.business_id || defaultBusinessId}
        client={selectedClient}
        onSuccess={handleEditSuccess}
      />

      {/* Diálogo Ver Perfil */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('globalClients.viewProfile')}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ViewClientProfile
              clientId={selectedClient.id}
              onClose={() => {
                setShowViewDialog(false);
                setSelectedClient(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={t('globalClients.deleteDialog.title')}
        description={t('globalClients.deleteDialog.description', { name: clientToDelete?.name })}
        confirmText={t('globalClients.deleteDialog.confirm')}
        variant="destructive"
      />
    </div>
  );
}






















