import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Edit,
  Plus,
  Clock,
  CreditCard
} from 'lucide-react';
import { BusinessSettings } from './BusinessSettings';
import { CreateBusiness } from './CreateBusiness';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessWithStats extends Business {
  total_users?: number;
  total_clients?: number;
  total_appointments?: number;
}

export function BusinessList() {
  const { profile } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [profile]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('businesses').select('*');
      
      // Si es admin, ver todas las empresas
      // Si es business_owner, solo ver sus empresas
      if (profile?.role === 'business_owner') {
        query = query.eq('owner_id', profile.id);
      }
      
      const { data: businessData, error: businessError } = await query.order('created_at', { ascending: false });

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
            total_appointments: appointments.count || 0
          };
        })
      );

      setBusinesses(businessesWithStats);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (business: Business) => {
    setSelectedBusiness(business);
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    loadBusinesses();
    setShowEditDialog(false);
    setSelectedBusiness(null);
  };

  const handleCreate = () => {
    loadBusinesses();
    setShowCreateDialog(false);
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'default';
      case 'business': return 'secondary';
      case 'professional': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'trial': return 'text-yellow-600';
      case 'inactive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'trial': return 'Prueba';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Mis Empresas</h3>
          <p className="text-muted-foreground">Gestiona la información de tus empresas</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Lista de empresas */}
      {businesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No tienes empresas registradas"
          description="Crea tu primera empresa para comenzar a gestionar citas"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Empresa
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {business.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {business.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Badge variant={getPlanBadgeVariant(business.subscription_plan)}>
                    {business.subscription_plan}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(business.subscription_status)}>
                    {getStatusText(business.subscription_status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2 text-sm">
                  {business.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  
                  {business.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{business.address}</span>
                    </div>
                  )}
                </div>

                {/* Horarios */}
                {business.business_hours && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Horarios</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {Object.entries(business.business_hours as Record<string, any>).slice(0, 2).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span>
                            {hours.open ? `${hours.start} - ${hours.end}` : 'Cerrado'}
                          </span>
                        </div>
                      ))}
                      {Object.keys(business.business_hours as Record<string, any>).length > 2 && (
                        <div className="text-center text-muted-foreground">...</div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Suscripción */}
                {business.subscription_status === 'trial' && business.trial_ends_at && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        Prueba termina: {new Date(business.trial_ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(business)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para editar empresa */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          {selectedBusiness && (
            <BusinessSettings 
              business={selectedBusiness} 
              onUpdate={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para crear empresa */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Empresa</DialogTitle>
          </DialogHeader>
          <CreateBusiness onSuccess={handleCreate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

