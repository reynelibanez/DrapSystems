import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  commission_percentage: number;
  business_id: string;
  created_at: string;
}

export function ServiceManagement() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    commission_percentage: 0,
  });

  useEffect(() => {
    loadServices();
  }, [profile]);

  const loadServices = async () => {
    if (!profile?.business_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, duration_minutes, price, commission_percentage, business_id, created_at')
        .eq('business_id', profile.business_id)
        .order('name');

      if (error) throw error;
      
      console.log('📊 Loaded services:', data);
      setServices(data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(t('servicesModule.serviceManagement.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes || 30,
        price: service.price,
        commission_percentage: service.commission_percentage || 0,
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: 30,
        price: 0,
        commission_percentage: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!profile?.business_id) return;

    if (!formData.name.trim()) {
      toast.error(t('servicesModule.serviceManagement.nameRequired'));
      return;
    }

    if (formData.price <= 0) {
      toast.error(t('servicesModule.serviceManagement.priceRequired'));
      return;
    }

    if (formData.commission_percentage < 0 || formData.commission_percentage > 100) {
      toast.error(t('servicesModule.serviceManagement.commissionRange'));
      return;
    }

    try {
      const serviceData = {
        ...formData,
        business_id: profile.business_id,
      };

      if (selectedService) {
        // Actualizar
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', selectedService.id);

        if (error) throw error;
        toast.success(t('servicesModule.serviceManagement.updateSuccess'));
      } else {
        // Crear
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
        toast.success(t('servicesModule.serviceManagement.createSuccess'));
      }

      setDialogOpen(false);
      loadServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(t('servicesModule.serviceManagement.errorSaving'));
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', selectedService.id);

      if (error) throw error;

      toast.success(t('servicesModule.serviceManagement.deleteSuccess'));
      setDeleteDialogOpen(false);
      setSelectedService(null);
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(t('servicesModule.serviceManagement.errorDeleting'));
    }
  };

  const columns = [
    {
      key: 'name',
      label: t('servicesModule.serviceManagement.name'),
      sortable: true,
      className: 'min-w-[200px]',
    },
    {
      key: 'duration_minutes',
      label: t('servicesModule.serviceManagement.duration'),
      render: (row: Service) => `${row.duration_minutes || 0} ${t('servicesModule.serviceManagement.minutes')}`,
      sortable: true,
      className: 'w-[120px]',
    },
    {
      key: 'price',
      label: t('servicesModule.common.price'),
      render: (row: Service) => `$${row.price.toFixed(2)}`,
      sortable: true,
      className: 'w-[120px]',
    },
    {
      key: 'commission_percentage',
      label: t('servicesModule.common.commission'),
      render: (row: Service) => (
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3" />
          {row.commission_percentage || 0}%
        </div>
      ),
      sortable: true,
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      label: t('servicesModule.common.actions'),
      render: (row: Service) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedService(row);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('servicesModule.serviceManagement.title')}</CardTitle>
              <CardDescription>
                {t('servicesModule.serviceManagement.description')}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('servicesModule.serviceManagement.newService')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={services}
            columns={columns}
            loading={loading}
            emptyMessage={t('servicesModule.serviceManagement.noServices')}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? t('servicesModule.serviceManagement.editService') : t('servicesModule.serviceManagement.newService')}
            </DialogTitle>
            <DialogDescription>
              {t('servicesModule.serviceManagement.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('servicesModule.serviceManagement.serviceName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('servicesModule.serviceManagement.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('servicesModule.serviceManagement.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('servicesModule.serviceManagement.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">{t('servicesModule.serviceManagement.durationLabel')} *</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t('servicesModule.serviceManagement.priceLabel')} *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="commission">{t('servicesModule.serviceManagement.commissionLabel')} *</Label>
              <div className="flex gap-2">
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-center px-3 bg-muted rounded-md">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('servicesModule.common.commission')}: ${((formData.price * formData.commission_percentage) / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('servicesModule.common.cancel')}
            </Button>
            <Button type="button" onClick={handleSave}>
              {selectedService ? t('servicesModule.common.update') : t('servicesModule.common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('servicesModule.serviceManagement.deleteTitle')}
        description={t('servicesModule.serviceManagement.deleteDescription', { name: selectedService?.name })}
        confirmText={t('servicesModule.common.delete')}
        variant="destructive"
      />
    </>
  );
}

















