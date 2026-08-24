import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Building2, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { DataTable } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessWithStats extends Business {
  total_users?: number;
  total_clients?: number;
  total_appointments?: number;
  owner_email?: string;
}

export function BusinessList() {
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithStats | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      // Cargar empresas con el email del propietario
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          *,
          owner:owner_id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (businessError) throw businessError;

      // Cargar estadísticas para cada empresa
      const businessesWithStats = await Promise.all(
        (businessData || []).map(async (business) => {
          const [users, clients, appointments] = await Promise.all([
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id)
              .in('role', ['business_owner', 'staff']),
            
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id)
              .eq('role', 'client'),
            
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id)
          ]);

          return {
            ...business,
            total_users: users.count || 0,
            total_clients: clients.count || 0,
            total_appointments: appointments.count || 0,
            owner_email: business.owner?.email || null
          };
        })
      );

      setBusinesses(businessesWithStats);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast.error('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (business: BusinessWithStats) => {
    setSelectedBusiness(business);
    setShowViewDialog(true);
  };

  const handleEdit = (business: BusinessWithStats) => {
    setSelectedBusiness(business);
    setEditForm({
      name: business.name,
      description: business.description || '',
      email: business.email || '',
      phone: business.phone || '',
      address: business.address || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBusiness) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: editForm.name,
          description: editForm.description,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address
        })
        .eq('id', selectedBusiness.id);

      if (error) throw error;

      toast.success('Empresa actualizada exitosamente');
      setShowEditDialog(false);
      loadBusinesses();
    } catch (error: any) {
      console.error('Error updating business:', error);
      toast.error('Error al actualizar la empresa');
    }
  };

  const handleDeleteClick = (business: BusinessWithStats) => {
    setBusinessToDelete({ id: business.id, name: business.name });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessToDelete.id);

      if (error) throw error;

      toast.success('Empresa eliminada exitosamente');
      loadBusinesses();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      toast.error('Error al eliminar la empresa: ' + error.message);
    } finally {
      setShowDeleteDialog(false);
      setBusinessToDelete(null);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.phone?.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'all' || 
      business.subscription_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'default';
      case 'business': return 'secondary';
      case 'professional': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            size="sm"
          >
            Activas
          </Button>
          <Button
            variant={filterStatus === 'trial' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('trial')}
            size="sm"
          >
            Prueba
          </Button>
          <Button
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('inactive')}
            size="sm"
          >
            Inactivas
          </Button>
        </div>
      </div>

      {/* Lista de empresas */}
      {filteredBusinesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No se encontraron empresas"
          description={searchTerm ? "Intenta con otros términos de búsqueda" : "Aún no hay empresas registradas"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {business.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {business.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Badge variant={getPlanBadgeVariant(business.subscription_plan)}>
                    {business.subscription_plan}
                  </Badge>
                  <StatusBadge 
                    status={business.subscription_status}
                    variant={getStatusBadgeVariant(business.subscription_status)}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2 text-sm">
                  {business.owner_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="truncate">Propietario: {business.owner_email}</span>
                    </div>
                  )}
                  
                  {business.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  
                  {business.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{business.address}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {business.total_users}
                    </div>
                    <div className="text-xs text-muted-foreground">Usuarios</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {business.total_clients}
                    </div>
                    <div className="text-xs text-muted-foreground">Clientes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {business.total_appointments}
                    </div>
                    <div className="text-xs text-muted-foreground">Citas</div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Creada: {new Date(business.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(business)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(business)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(business)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{businesses.length}</div>
              <div className="text-xs text-muted-foreground">Total Empresas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {businesses.filter(b => b.subscription_status === 'active').length}
              </div>
              <div className="text-xs text-muted-foreground">Activas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {businesses.filter(b => b.subscription_status === 'trial').length}
              </div>
              <div className="text-xs text-muted-foreground">En Prueba</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {businesses.filter(b => b.subscription_status === 'inactive').length}
              </div>
              <div className="text-xs text-muted-foreground">Inactivas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo Ver Detalles */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Empresa</DialogTitle>
            <DialogDescription>Información completa de la empresa</DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <Badge variant={getPlanBadgeVariant(selectedBusiness.subscription_plan)}>
                    {selectedBusiness.subscription_plan}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descripción</Label>
                <p className="text-sm text-muted-foreground">{selectedBusiness.description || 'Sin descripción'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Propietario</Label>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.owner_email || 'No asignado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email de la Empresa</Label>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.email || 'No especificado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.phone || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Dirección</Label>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.address || 'No especificada'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Usuarios</Label>
                  <p className="text-2xl font-bold text-primary">{selectedBusiness.total_users}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Clientes</Label>
                  <p className="text-2xl font-bold text-primary">{selectedBusiness.total_clients}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Citas</Label>
                  <p className="text-2xl font-bold text-primary">{selectedBusiness.total_appointments}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <StatusBadge 
                    status={selectedBusiness.subscription_status}
                    variant={getStatusBadgeVariant(selectedBusiness.subscription_status)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha de Creación</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedBusiness.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Actualiza la información de la empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descripción de la empresa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editForm.name.trim()}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Empresa"
        description={`¿Estás seguro de que deseas eliminar la empresa "${businessToDelete?.name}"? Esta acción eliminará todos los datos asociados y no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
















