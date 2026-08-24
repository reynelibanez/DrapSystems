import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { baseUrl } from '../../lib/base-url';
import { generateBookingLink } from '../../lib/encryption';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
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
  CreditCard,
  Trash2,
  Link,
  Copy,
  Check,
  UserPlus,
  CalendarDays,
  MessageSquare,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { BusinessSettings } from '../business/BusinessSettings';
import { CreateBusiness } from '../business/CreateBusiness';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface SMSStats {
  used: number;
  exceeded: number;
  limit: number;
}

interface BusinessWithStats extends Business {
  total_users?: number;
  total_clients?: number;
  total_appointments?: number;
  owner_email?: string;
  sms_stats?: SMSStats;
  days_remaining?: number;
}

export function BusinessCards() {
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      // Cargar empresas con información del propietario
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          *,
          profiles:owner_id (
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

          // Obtener estadísticas de SMS desde la tabla businesses
          // Solo los planes professional y enterprise tienen SMS
          const hasSMS = business.subscription_plan === 'professional' || 
                        business.subscription_plan === 'enterprise';
          
          let smsStats = null;
          if (hasSMS) {
            const smsLimit = (business as any).sms_limit || 0;
            const smsUsed = (business as any).sms_used_current_month || 0;
            const smsExceeded = Math.max(0, smsUsed - smsLimit);

            smsStats = {
              used: smsUsed,
              exceeded: smsExceeded,
              limit: smsLimit
            };
          }

          // Calcular días restantes de suscripción
          let daysRemaining = null;
          if (business.subscription_end_date) {
            const endDate = new Date(business.subscription_end_date);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (business.trial_ends_at && business.subscription_status === 'trial') {
            const endDate = new Date(business.trial_ends_at);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            ...business,
            total_users: users.count || 0,
            total_clients: clients.count || 0,
            total_appointments: appointments.count || 0,
            owner_email: business.profiles?.email || null,
            sms_stats: smsStats,
            days_remaining: daysRemaining
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

  const handleEdit = (business: Business) => {
    setSelectedBusiness(business);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    // Recargar los datos del negocio actualizado
    if (selectedBusiness) {
      const { data: updatedBusiness } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', selectedBusiness.id)
        .single();
      
      if (updatedBusiness) {
        setSelectedBusiness(updatedBusiness);
      }
    }
    
    await loadBusinesses();
  };

  const handleCreate = () => {
    loadBusinesses();
    setShowCreateDialog(false);
  };

  const handleDelete = (business: Business) => {
    setBusinessToDelete(business);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!businessToDelete) return;

    setDeleteLoading(true);
    try {
      console.log('=== INICIANDO ELIMINACIÓN DE EMPRESA ===');
      console.log('Business ID:', businessToDelete.id);
      
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar al endpoint API
      const response = await fetch(`${baseUrl}/api/admin/delete-business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ businessId: businessToDelete.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la empresa');
      }

      console.log('Respuesta del servidor:', result);
      console.log('=== ELIMINACIÓN COMPLETADA ===');

      toast.success('Empresa eliminada exitosamente');
      setDeleteDialogOpen(false);
      setBusinessToDelete(null);
      
      // Recargar la lista
      await loadBusinesses();
    } catch (error: any) {
      console.error('Error completo:', error);
      toast.error(`Error al eliminar la empresa: ${error.message || 'Error desconocido'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyBookingLink = async (businessId: string) => {
    try {
      const bookingLink = generateBookingLink(businessId, window.location.origin + baseUrl);
      await navigator.clipboard.writeText(bookingLink);
      setCopiedId(businessId);
      toast.success('Enlace copiado al portapapeles');
      
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Error al copiar el enlace');
    }
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
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getBillingText = (business: Business) => {
    const billing = (business.settings as any)?.billing_period || 'month';
    return billing === 'year' ? 'Anual' : 'Mensual';
  };

  const getSMSStatusColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDaysRemainingColor = (days: number | null) => {
    if (days === null) return 'text-muted-foreground';
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Empresas</h3>
          <p className="text-muted-foreground">Vista de tarjetas de todas las empresas del sistema</p>
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
          title="No hay empresas registradas"
          description="Crea la primera empresa para comenzar"
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
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={getPlanBadgeVariant(business.subscription_plan)}>
                    {business.subscription_plan}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(business.subscription_status)}>
                    {getStatusText(business.subscription_status)}
                  </Badge>
                  <Badge variant="outline">
                    {getBillingText(business)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Propietario */}
                {business.owner_email && (
                  <div className="pb-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">Propietario:</span>
                    </div>
                    <div className="text-sm mt-1 truncate">{business.owner_email}</div>
                  </div>
                )}

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
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      Usuarios
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {business.total_clients}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      Clientes
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {business.total_appointments}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Citas
                    </div>
                  </div>
                </div>

                {/* Estadísticas de SMS */}
                {business.sms_stats && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-medium">SMS del mes</span>
                      </div>
                      <span className={`font-bold ${getSMSStatusColor(business.sms_stats.used, business.sms_stats.limit)}`}>
                        {business.sms_stats.used} / {business.sms_stats.limit}
                      </span>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          (business.sms_stats.used / business.sms_stats.limit) * 100 >= 90 
                            ? 'bg-red-500' 
                            : (business.sms_stats.used / business.sms_stats.limit) * 100 >= 70 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((business.sms_stats.used / business.sms_stats.limit) * 100, 100)}%` 
                        }}
                      />
                    </div>

                    {/* SMS Excedentes */}
                    {business.sms_stats.exceeded > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{business.sms_stats.exceeded} SMS excedentes</span>
                      </div>
                    )}

                    {/* Porcentaje usado */}
                    <div className="text-xs text-muted-foreground text-center">
                      {business.sms_stats.limit > 0 
                        ? `${((business.sms_stats.used / business.sms_stats.limit) * 100).toFixed(1)}% utilizado`
                        : '0% utilizado'
                      }
                    </div>
                  </div>
                )}

                {/* Días restantes de suscripción */}
                {business.days_remaining !== null && business.days_remaining !== undefined && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {business.subscription_status === 'trial' ? 'Prueba termina en' : 'Suscripción vence en'}
                        </span>
                      </div>
                      <span className={`font-bold ${getDaysRemainingColor(business.days_remaining)}`}>
                        {business.days_remaining > 0 
                          ? `${business.days_remaining} día${business.days_remaining !== 1 ? 's' : ''}`
                          : 'Vencida'
                        }
                      </span>
                    </div>

                    {/* Alerta si quedan pocos días */}
                    {business.days_remaining <= 7 && business.days_remaining > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>¡Renovación próxima!</span>
                      </div>
                    )}

                    {business.days_remaining <= 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Suscripción vencida</span>
                      </div>
                    )}
                  </div>
                )}

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

                {business.subscription_end_date && business.subscription_status === 'active' && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Vence: {new Date(business.subscription_end_date).toLocaleDateString()}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyBookingLink(business.id)}
                  >
                    {copiedId === business.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(business)}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
          <CreateBusiness onSuccess={handleCreate} isAdmin={true} />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente:
            </AlertDialogDescription>
            <div className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>La empresa {businessToDelete?.name}</li>
                <li>Todas las citas asociadas</li>
                <li>Todos los clientes</li>
                <li>Todos los servicios</li>
                <li>Las relaciones con los usuarios</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




