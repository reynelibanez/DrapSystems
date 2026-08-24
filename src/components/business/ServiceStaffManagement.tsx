import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ServiceStaffAssociation {
  service_id: string;
  staff_id: string;
}

interface ServiceStaffManagementProps {
  businessId: string;
}

export function ServiceStaffManagement({ businessId }: ServiceStaffManagementProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [associations, setAssociations] = useState<ServiceStaffAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar servicios activos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Cargar staff del negocio
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('business_id', businessId)
        .in('role', ['staff', 'business_owner'])
        .order('full_name');

      if (staffError) throw staffError;
      setStaffMembers(staffData || []);

      // Cargar asociaciones existentes
      const { data: associationsData, error: associationsError } = await supabase
        .from('service_staff')
        .select('service_id, staff_id')
        .eq('business_id', businessId);

      if (associationsError) throw associationsError;
      setAssociations(associationsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(t('errorLoadingData') || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getStaffForService = (serviceId: string): StaffMember[] => {
    const staffIds = associations
      .filter(a => a.service_id === serviceId)
      .map(a => a.staff_id);
    
    return staffMembers.filter(s => staffIds.includes(s.id));
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    
    // Cargar staff actualmente asociados
    const currentStaffIds = associations
      .filter(a => a.service_id === service.id)
      .map(a => a.staff_id);
    
    setSelectedStaffIds(currentStaffIds);
    setDialogOpen(true);
  };

  const handleStaffToggle = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedService) return;

    try {
      setSaving(true);

      // Eliminar asociaciones existentes para este servicio
      const { error: deleteError } = await supabase
        .from('service_staff')
        .delete()
        .eq('service_id', selectedService.id)
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      // Crear nuevas asociaciones
      if (selectedStaffIds.length > 0) {
        const newAssociations = selectedStaffIds.map(staffId => ({
          service_id: selectedService.id,
          staff_id: staffId,
          business_id: businessId
        }));

        const { error: insertError } = await supabase
          .from('service_staff')
          .insert(newAssociations);

        if (insertError) throw insertError;
      }

      toast.success(t('changesSaved') || 'Cambios guardados exitosamente');
      
      // Recargar datos
      await loadData();
      
      // Cerrar diálogo
      setDialogOpen(false);
      setSelectedService(null);
      setSelectedStaffIds([]);

    } catch (error: any) {
      console.error('Error saving associations:', error);
      toast.error(t('errorSavingChanges') || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.length === staffMembers.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staffMembers.map(s => s.id));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('serviceStaffManagement') || 'Gestión de Personal por Servicio'}
          </CardTitle>
          <CardDescription>
            {t('serviceStaffManagementDescription') || 'Asigna trabajadores a cada servicio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('noStaffAvailable') || 'No hay personal disponible. Primero debes agregar trabajadores a tu negocio.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('serviceStaffManagement') || 'Gestión de Personal por Servicio'}
        </CardTitle>
        <CardDescription>
          {t('serviceStaffManagementDescription') || 'Asigna trabajadores a cada servicio. Los horarios disponibles se calcularán según la disponibilidad de cada trabajador.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('serviceStaffInfo') || 'Si un servicio tiene múltiples trabajadores asignados, el sistema mostrará horarios disponibles mientras al menos uno esté libre. La cita se asignará automáticamente al trabajador disponible.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {services.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('noServicesAvailable') || 'No hay servicios disponibles. Primero debes crear servicios.'}
              </AlertDescription>
            </Alert>
          ) : (
            services.map(service => {
              const assignedStaff = getStaffForService(service.id);
              const hasStaff = assignedStaff.length > 0;

              return (
                <Card key={service.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <Badge variant={hasStaff ? "default" : "secondary"}>
                            {hasStaff ? (
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                {assignedStaff.length} {assignedStaff.length === 1 ? t('worker') : t('workers')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <UserX className="w-3 h-3" />
                                {t('noWorkersAssigned') || 'Sin asignar'}
                              </span>
                            )}
                          </Badge>
                        </div>
                        
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {service.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>{service.duration_minutes} min</span>
                          <span>${service.price}</span>
                        </div>

                        {hasStaff && (
                          <div className="flex flex-wrap gap-2">
                            {assignedStaff.map(staff => (
                              <Badge key={staff.id} variant="outline" className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                {staff.full_name || staff.email}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Dialog open={dialogOpen && selectedService?.id === service.id} onOpenChange={(open) => {
                        if (!open) {
                          setDialogOpen(false);
                          setSelectedService(null);
                          setSelectedStaffIds([]);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            {t('assignStaff') || 'Asignar Personal'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              {t('assignStaffToService') || 'Asignar Personal al Servicio'}
                            </DialogTitle>
                            <DialogDescription>
                              {service.name}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                              <Label className="text-sm font-medium">
                                {t('selectWorkers') || 'Seleccionar Trabajadores'}
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAll}
                              >
                                {selectedStaffIds.length === staffMembers.length 
                                  ? t('deselectAll') || 'Deseleccionar todos'
                                  : t('selectAll') || 'Seleccionar todos'
                                }
                              </Button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {staffMembers.map(staff => (
                                <div
                                  key={staff.id}
                                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                >
                                  <Checkbox
                                    id={`staff-${staff.id}`}
                                    checked={selectedStaffIds.includes(staff.id)}
                                    onCheckedChange={() => handleStaffToggle(staff.id)}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`staff-${staff.id}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {staff.full_name || staff.email}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {staff.email}
                                    </p>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {staff.role === 'business_owner' 
                                        ? t('owner') || 'Propietario'
                                        : t('staff') || 'Personal'
                                      }
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {selectedStaffIds.length === 0 && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  {t('selectAtLeastOneWorker') || 'Debes seleccionar al menos un trabajador para este servicio.'}
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDialogOpen(false);
                                  setSelectedService(null);
                                  setSelectedStaffIds([]);
                                }}
                                className="flex-1"
                                disabled={saving}
                              >
                                {t('cancel') || 'Cancelar'}
                              </Button>
                              <Button
                                onClick={handleSave}
                                className="flex-1"
                                disabled={saving || selectedStaffIds.length === 0}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('saving') || 'Guardando...'}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    {t('save') || 'Guardar'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
