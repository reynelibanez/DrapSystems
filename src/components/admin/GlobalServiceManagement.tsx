import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Search, Trash2, Briefcase, Building2, DollarSign, Plus, Edit } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ServiceWithBusiness {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  business_id: string;
  business_name: string;
  total_appointments: number;
  upcoming_appointments: number;
}

export function GlobalServiceManagement() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceWithBusiness[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceWithBusiness | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    is_active: true,
    business_id: ''
  });

  useEffect(() => {
    loadAllServices();
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, services]);

  const loadAllServices = async () => {
    try {
      setLoading(true);

      // Obtener todos los servicios con información del negocio
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          businesses (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      if (!servicesData || servicesData.length === 0) {
        setServices([]);
        setFilteredServices([]);
        setLoading(false);
        return;
      }

      // Obtener estadísticas de cada servicio
      const servicesWithStats = await Promise.all(
        servicesData.map(async (service) => {
          const now = new Date().toISOString();

          const [totalAppts, upcomingAppts] = await Promise.all([
            // Total de citas
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id),
            
            // Citas próximas
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id)
              .gte('start_time', now)
              .in('status', ['pending', 'confirmed'])
          ]);

          return {
            id: service.id,
            name: service.name,
            description: service.description || '',
            duration_minutes: service.duration_minutes,
            price: service.price,
            is_active: service.is_active,
            business_id: service.business_id,
            business_name: service.businesses?.name || 'Sin negocio',
            total_appointments: totalAppts.count || 0,
            upcoming_appointments: upcomingAppts.count || 0
          };
        })
      );

      setServices(servicesWithStats);
      setFilteredServices(servicesWithStats);
    } catch (err: any) {
      console.error('Error loading services:', err);
      toast.error(t('globalServices.errors.loadServices'));
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
        setFormData(prev => ({ ...prev, business_id: data[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading businesses:', err);
      toast.error(t('globalServices.errors.loadBusinesses'));
    }
  };

  const filterServices = () => {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = services.filter(
      (service) =>
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.business_name.toLowerCase().includes(term)
    );
    setFilteredServices(filtered);
  };

  const handleDeleteClick = (service: ServiceWithBusiness) => {
    setServiceToDelete({ id: service.id, name: service.name });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete.id);

      if (error) throw error;

      toast.success(t('globalServices.success.deleteService'));
      loadAllServices();
    } catch (err: any) {
      console.error('Error deleting service:', err);
      toast.error(t('globalServices.errors.deleteService'));
    } finally {
      setShowDeleteDialog(false);
      setServiceToDelete(null);
    }
  };

  const totalServices = services.length;
  const activeServices = services.filter(s => s.is_active).length;
  const totalAppointments = services.reduce((sum, s) => sum + s.total_appointments, 0);
  const totalRevenue = services.reduce((sum, s) => sum + (s.price * s.total_appointments), 0);

  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
      is_active: true,
      business_id: businesses[0]?.id || ''
    });
    setShowCreateDialog(true);
  };

  const handleEditClick = (service: ServiceWithBusiness) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price: service.price,
      is_active: service.is_active,
      business_id: service.business_id
    });
    setShowEditDialog(true);
  };

  const handleCreateService = async () => {
    if (!formData.name || !formData.business_id) {
      toast.error(t('globalServices.errors.requiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active,
          business_id: formData.business_id
        }]);

      if (error) throw error;

      toast.success(t('globalServices.success.createService'));
      setShowCreateDialog(false);
      loadAllServices();
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(error.message || t('globalServices.errors.createService'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService || !formData.name) {
      toast.error(t('globalServices.errors.requiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active,
          business_id: formData.business_id
        })
        .eq('id', selectedService.id);

      if (error) throw error;

      toast.success(t('globalServices.success.updateService'));
      setShowEditDialog(false);
      loadAllServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || t('globalServices.errors.updateService'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalServices.stats.totalServices')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalServices.stats.activeServices')}</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalServices.stats.totalAppointments')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('globalServices.stats.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('globalServices.title')}</CardTitle>
              <CardDescription>{t('globalServices.description')}</CardDescription>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              {t('globalServices.actions.newService')}
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
                  placeholder={t('globalServices.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tabla */}
            {filteredServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? t('globalServices.search.noResults') : t('globalServices.search.noServices')}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('globalServices.table.name')}</TableHead>
                      <TableHead>{t('globalServices.table.description')}</TableHead>
                      <TableHead>{t('globalServices.table.business')}</TableHead>
                      <TableHead>{t('globalServices.table.duration')}</TableHead>
                      <TableHead>{t('globalServices.table.price')}</TableHead>
                      <TableHead>{t('globalServices.table.status')}</TableHead>
                      <TableHead>{t('globalServices.table.totalAppointments')}</TableHead>
                      <TableHead>{t('globalServices.table.upcoming')}</TableHead>
                      <TableHead>{t('globalServices.table.revenue')}</TableHead>
                      <TableHead className="text-right">{t('globalServices.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {service.description || t('globalServices.table.noDescription')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{service.business_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{service.duration_minutes} {t('globalServices.table.minutes')}</TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell>
                          <Badge variant={service.is_active ? 'default' : 'secondary'}>
                            {service.is_active ? t('globalServices.status.active') : t('globalServices.status.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{service.total_appointments}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.upcoming_appointments > 0 ? 'default' : 'outline'}>
                            {service.upcoming_appointments}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(service.price * service.total_appointments)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(service)}
                              title={t('globalServices.actions.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(service)}
                              title={t('globalServices.actions.delete')}
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

      {/* Diálogo Crear Servicio */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('globalServices.dialog.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('globalServices.dialog.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business">{t('globalServices.form.business')} *</Label>
              <Select
                value={formData.business_id}
                onValueChange={(value) => setFormData({ ...formData, business_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('globalServices.form.selectBusiness')} />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('globalServices.form.serviceName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('globalServices.form.serviceNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('globalServices.form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('globalServices.form.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">{t('globalServices.form.duration')} *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t('globalServices.form.price')} *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{t('globalServices.form.activeService')}</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateService}>
                {t('globalServices.actions.createService')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar Servicio */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('globalServices.dialog.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('globalServices.dialog.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-business">{t('globalServices.form.business')} *</Label>
              <Select
                value={formData.business_id}
                onValueChange={(value) => setFormData({ ...formData, business_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('globalServices.form.selectBusiness')} />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('globalServices.form.serviceName')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('globalServices.form.serviceNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('globalServices.form.description')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('globalServices.form.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">{t('globalServices.form.duration')} *</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">{t('globalServices.form.price')} *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">{t('globalServices.form.activeService')}</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setSelectedService(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateService}>
                {t('common.saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={t('globalServices.dialog.deleteTitle')}
        description={t('globalServices.dialog.deleteDescription', { name: serviceToDelete?.name })}
        confirmText={t('common.delete')}
        variant="destructive"
      />
    </div>
  );
}

































