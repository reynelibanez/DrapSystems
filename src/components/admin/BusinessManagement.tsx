

import { useState, useEffect } from 'react';
import { supabase, PLAN_FEATURES } from '../../lib/supabase';
import { baseUrl } from '../../lib/base-url';
import { generateBookingLink } from '../../lib/encryption';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Building2, Edit, Trash2, Plus, Link, Copy, Check } from 'lucide-react';
import { CreateBusiness } from '../business/CreateBusiness';
import { BusinessSettings } from '../business/BusinessSettings';
import { toast } from 'sonner';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessWithOwner extends Business {
  owner_email?: string;
}

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState<BusinessWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          profiles:owner_id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Transformar los datos para incluir el email del propietario
        const businessesWithOwner = data.map(business => ({
          ...business,
          owner_email: business.profiles?.email || null
        }));
        setBusinesses(businessesWithOwner);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessCreated = () => {
    setCreateDialogOpen(false);
    loadBusinesses();
  };

  const handleBusinessUpdated = async () => {
    // Recargar los datos del negocio actualizado antes de cerrar
    if (selectedBusiness) {
      const { data: updatedBusiness } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', selectedBusiness.id)
        .single();
      
      if (updatedBusiness) {
        console.log('🔄 Negocio actualizado:', updatedBusiness);
        setSelectedBusiness(updatedBusiness);
      }
    }
    
    // Recargar la lista de negocios
    await loadBusinesses();
    
    // NO cerrar el diálogo automáticamente - dejar que el usuario lo cierre manualmente
    // para que pueda ver los cambios reflejados
  };

  const openEditDialog = (business: Business) => {
    setSelectedBusiness(business);
    setEditDialogOpen(true);
  };

  const updateSubscriptionPlan = async (businessId: string, plan: string, billing?: 'month' | 'year') => {
    try {
      // Obtener el negocio actual para preservar settings
      const { data: currentBusiness } = await supabase
        .from('businesses')
        .select('settings, subscription_status, subscription_plan')
        .eq('id', businessId)
        .single();

      const currentSettings = (currentBusiness?.settings as any) || {};
      
      // Si no se especifica billing, mantener el actual o usar 'month' por defecto
      const billingPeriod = billing || currentSettings.billing_period || 'month';

      // Calcular fechas de suscripción
      let subscriptionEndDate = null;
      let trialEndsAt = null;
      
      // Solo calcular fechas si NO es plan básico
      if (plan !== 'basic') {
        const now = new Date();
        
        // Si el estado actual es 'trial', establecer trial de 14 días
        if (currentBusiness?.subscription_status === 'trial') {
          trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
          // La suscripción termina después del trial
          subscriptionEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // Calcular fecha de fin según el período de facturación
          if (billingPeriod === 'year') {
            // Suscripción anual: 365 días desde ahora
            subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            // Suscripción mensual: 30 días desde ahora
            subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
      }

      const updateData: any = { 
        subscription_plan: plan,
        subscription_end_date: subscriptionEndDate,
        trial_ends_at: trialEndsAt,
        settings: {
          ...currentSettings,
          billing_period: billingPeriod
        }
      };

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId);

      if (!error) {
        const billingText = billingPeriod === 'year' ? 'anual' : 'mensual';
        toast.success(`Plan actualizado a ${plan} (${billingText}). ${subscriptionEndDate ? `Vence: ${new Date(subscriptionEndDate).toLocaleDateString()}` : 'Sin fecha de vencimiento'}`);
        loadBusinesses();
      } else {
        toast.error('Error al actualizar el plan');
        console.error('Error updating plan:', error);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error al actualizar el plan');
    }
  };

  const updateBillingCycle = async (businessId: string, billing: 'month' | 'year') => {
    try {
      // Obtener el negocio actual para preservar settings y recalcular fechas
      const { data: currentBusiness } = await supabase
        .from('businesses')
        .select('settings, subscription_plan, subscription_status')
        .eq('id', businessId)
        .single();

      const currentSettings = (currentBusiness?.settings as any) || {};
      const currentPlan = currentBusiness?.subscription_plan || 'basic';

      // Calcular nuevas fechas según el nuevo billing period
      let subscriptionEndDate = null;
      let trialEndsAt = null;
      
      // Solo calcular fechas si NO es plan básico
      if (currentPlan !== 'basic') {
        const now = new Date();
        
        // Si el estado actual es 'trial', establecer trial de 14 días
        if (currentBusiness?.subscription_status === 'trial') {
          trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
          subscriptionEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // Calcular fecha de fin según el nuevo período de facturación
          if (billing === 'year') {
            // Suscripción anual: 365 días desde ahora
            subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            // Suscripción mensual: 30 días desde ahora
            subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
      }

      const { error } = await supabase
        .from('businesses')
        .update({ 
          settings: {
            ...currentSettings,
            billing_period: billing
          },
          subscription_end_date: subscriptionEndDate,
          trial_ends_at: trialEndsAt
        })
        .eq('id', businessId);

      if (!error) {
        const billingText = billing === 'year' ? 'anual' : 'mensual';
        toast.success(`Facturación cambiada a ${billingText}. ${subscriptionEndDate ? `Nueva fecha de vencimiento: ${new Date(subscriptionEndDate).toLocaleDateString()}` : ''}`);
        loadBusinesses();
      } else {
        toast.error('Error al actualizar el ciclo de facturación');
        console.error('Error updating billing cycle:', error);
      }
    } catch (error) {
      console.error('Error updating billing cycle:', error);
      toast.error('Error al actualizar el ciclo de facturación');
    }
  };

  const updateSubscriptionStatus = async (businessId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ subscription_status: status })
        .eq('id', businessId);

      if (!error) {
        loadBusinesses();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteBusiness = async (businessId: string) => {
    setDeleteLoading(true);
    try {
      console.log('=== INICIANDO ELIMINACIÓN DE EMPRESA ===');
      console.log('Business ID:', businessId);
      
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
        body: JSON.stringify({ businessId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la empresa');
      }

      console.log('Respuesta del servidor:', result);
      console.log('=== ELIMINACIÓN COMPLETADA ===');

      // Recargar la lista
      await loadBusinesses();
      
      // Mostrar mensaje de éxito
      alert('Empresa eliminada exitosamente');
    } catch (error: any) {
      console.error('Error completo:', error);
      alert(`Error al eliminar la empresa: ${error.message || 'Error desconocido'}`);
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

  if (loading) {
    return <div className="text-center py-8">Cargando empresas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Gestión de Empresas
            </CardTitle>
            <CardDescription>
              Administra todas las empresas registradas en el sistema
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Crear Nueva Empresa</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1">
                <CreateBusiness onSuccess={handleBusinessCreated} isAdmin={true} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empresas registradas</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera empresa</p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Empresa</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1">
                  <CreateBusiness onSuccess={handleBusinessCreated} isAdmin={true} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Facturación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => {
                const currentBilling = ((business.settings as any)?.billing_period || 'month') as 'month' | 'year';
                
                return (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{business.name}</div>
                        {business.description && (
                          <div className="text-sm text-muted-foreground">
                            {business.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{business.email || 'Sin correo'}</TableCell>
                    <TableCell>
                      <Select
                        value={business.subscription_plan}
                        onValueChange={(value) => updateSubscriptionPlan(business.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="professional">Profesional</SelectItem>
                          <SelectItem value="business">Negocios</SelectItem>
                          <SelectItem value="enterprise">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentBilling}
                        onValueChange={(value: 'month' | 'year') => updateBillingCycle(business.id, value)}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Mensual</SelectItem>
                          <SelectItem value="year">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={business.subscription_status}
                        onValueChange={(value) => updateSubscriptionStatus(business.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="trial">Prueba</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyBookingLink(business.id)}
                        className="gap-2"
                      >
                        {copiedId === business.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(business.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(business)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={deleteLoading}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán permanentemente:
                              </AlertDialogDescription>
                              <div className="text-sm text-muted-foreground">
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>La empresa {business.name}</li>
                                  <li>Todas las citas asociadas</li>
                                  <li>Todos los clientes</li>
                                  <li>Todos los servicios</li>
                                  <li>Las relaciones con los usuarios</li>
                                </ul>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBusiness(business.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Diálogo de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {selectedBusiness && (
              <BusinessSettings 
                business={selectedBusiness} 
                onUpdate={handleBusinessUpdated}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}




























