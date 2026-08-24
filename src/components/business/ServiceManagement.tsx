import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Plus, Edit, Trash2, Users, UserCheck, Loader2, CheckCircle2, Percent } from 'lucide-react';
import { getPlanLimits, formatLimit, isNearLimit } from '../../lib/plan-limits';
import { toast } from 'sonner';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];

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

interface ServiceManagementProps {
  businessId: string;
  planFeatures?: {
    maxStaff: number;
    maxServices: number;
    maxClients: number;
    hasAdvancedReports: boolean;
    hasCustomBranding: boolean;
    hasApiAccess: boolean;
  };
}

export function ServiceManagement({ businessId, planFeatures }: ServiceManagementProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Estados para gestión de personal
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [associations, setAssociations] = useState<ServiceStaffAssociation[]>([]);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [selectedServiceForStaff, setSelectedServiceForStaff] = useState<Service | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    duration_minutes: number | '';
    price: number | '';
    commission_percentage: number | '';
    is_active: boolean;
  }>({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    commission_percentage: 0,
    is_active: true,
  });

  useEffect(() => {
    loadServices();
    loadStaffAndAssociations();
  }, [businessId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

      if (!error && data) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffAndAssociations = async () => {
    try {
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
      console.error('Error loading staff and associations:', error);
    }
  };

  const getStaffCountForService = (serviceId: string): number => {
    return associations.filter(a => a.service_id === serviceId).length;
  };

  const openStaffDialog = (service: Service) => {
    setSelectedServiceForStaff(service);
    
    // Cargar staff actualmente asociados
    const currentStaffIds = associations
      .filter(a => a.service_id === service.id)
      .map(a => a.staff_id);
    
    setSelectedStaffIds(currentStaffIds);
    setStaffDialogOpen(true);
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

  const handleSelectAllStaff = () => {
    if (selectedStaffIds.length === staffMembers.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staffMembers.map(s => s.id));
    }
  };

  const handleSaveStaff = async () => {
    if (!selectedServiceForStaff) return;

    try {
      setSavingStaff(true);

      // Eliminar asociaciones existentes para este servicio
      const { error: deleteError } = await supabase
        .from('service_staff')
        .delete()
        .eq('service_id', selectedServiceForStaff.id)
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      // Crear nuevas asociaciones
      if (selectedStaffIds.length > 0) {
        const newAssociations = selectedStaffIds.map(staffId => ({
          service_id: selectedServiceForStaff.id,
          staff_id: staffId,
          business_id: businessId
        }));

        const { error: insertError } = await supabase
          .from('service_staff')
          .insert(newAssociations);

        if (insertError) throw insertError;
      }

      toast.success(t('changesSaved') || 'Cambios guardados exitosamente');
      
      // Recargar asociaciones
      await loadStaffAndAssociations();
      
      // Cerrar diálogo
      setStaffDialogOpen(false);
      setSelectedServiceForStaff(null);
      setSelectedStaffIds([]);

    } catch (error: any) {
      console.error('Error saving staff associations:', error);
      toast.error(t('errorSavingChanges') || 'Error al guardar cambios');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convertir valores vacíos a números para validación
    const duration = typeof formData.duration_minutes === 'string' ? 0 : formData.duration_minutes;
    const price = typeof formData.price === 'string' ? 0 : formData.price;
    const commission = typeof formData.commission_percentage === 'string' ? 0 : formData.commission_percentage;

    if (!formData.name || duration < 15 || price < 0) {
      return;
    }

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        duration_minutes: duration,
        price: price,
        commission_percentage: commission,
        is_active: formData.is_active,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(dataToSave)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([{ ...dataToSave, business_id: businessId }]);

        if (error) throw error;
      }

      setDialogOpen(false);
      resetForm();
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      commission_percentage: service.commission_percentage || 0,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm(t('confirmDeleteService'))) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (!error) {
        loadServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const toggleActive = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', serviceId);

      if (!error) {
        loadServices();
      }
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
      commission_percentage: 0,
      is_active: true,
    });
    setEditingService(null);
  };

  if (loading) {
    return <div className="text-center py-8">{t('loadingServices')}</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('serviceManagement')}
                {planFeatures && (
                  <Badge variant={isNearLimit(services.length, planFeatures.maxServices === -1 ? 'unlimited' : planFeatures.maxServices) ? "destructive" : "secondary"}>
                    {services.length}/{planFeatures.maxServices === -1 ? t('unlimited') : planFeatures.maxServices}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {t('manageBusinessServices')}
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('newService')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? t('editService') : t('newService')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('modifyServiceInfo') || t('completeServiceInfo')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('serviceName')}</Label>
                      <Input
                        id="name"
                        placeholder={t('serviceName')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('description')}</Label>
                      <Textarea
                        id="description"
                        placeholder={t('describeService') || t('description')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">{t('durationMinutes')}</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="15"
                          step="15"
                          value={formData.duration_minutes}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ 
                              ...formData, 
                              duration_minutes: value === '' ? '' : parseInt(value) || 0
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">{t('price')}</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ 
                              ...formData, 
                              price: value === '' ? '' : parseFloat(value) || 0
                            });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commission" className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        {t('commissionPercentage') || 'Porcentaje de Comisión'}
                      </Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.commission_percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ 
                            ...formData, 
                            commission_percentage: value === '' ? '' : parseFloat(value) || 0
                          });
                        }}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('commissionHelp') || 'Porcentaje que se asigna al personal que realiza el servicio'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="active">{t('activeService')}</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {t('common.saveChanges') || t('save')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noServicesRegistered')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('serviceLabel')}</TableHead>
                  <TableHead>{t('duration')}</TableHead>
                  <TableHead>{t('price')}</TableHead>
                  <TableHead>{t('commissionPercentage') || 'Comisión'}</TableHead>
                  <TableHead>{t('staff') || 'Personal'}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const staffCount = getStaffCountForService(service.id);
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.duration_minutes} min</TableCell>
                      <TableCell>${service.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{service.commission_percentage || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStaffDialog(service)}
                          className="gap-2"
                        >
                          <Users className="w-4 h-4" />
                          {staffCount > 0 ? (
                            <Badge variant="secondary" className="ml-1">
                              {staffCount}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('assign') || 'Asignar'}
                            </span>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => toggleActive(service.id, service.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Asignación de Personal */}
      <Dialog open={staffDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setStaffDialogOpen(false);
          setSelectedServiceForStaff(null);
          setSelectedStaffIds([]);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('assignStaffToService')}
            </DialogTitle>
            <DialogDescription>
              {selectedServiceForStaff?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {staffMembers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t('noStaffAvailable')}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b">
                  <Label className="text-sm font-medium">
                    {t('selectWorkers')}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllStaff}
                  >
                    {selectedStaffIds.length === staffMembers.length 
                      ? t('deselectAll')
                      : t('selectAll')
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
                            ? t('owner')
                            : t('staff')
                          }
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStaffDialogOpen(false);
                  setSelectedServiceForStaff(null);
                  setSelectedStaffIds([]);
                }}
                className="flex-1"
                disabled={savingStaff}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSaveStaff}
                className="flex-1"
                disabled={savingStaff || staffMembers.length === 0}
              >
                {savingStaff ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
























