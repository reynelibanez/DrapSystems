import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Edit, Trash2, Warehouse } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Almacen {
  id: string;
  almacen: string;
  codigo: string | null;
  abierto: boolean;
  puntoventa: boolean;
  created_at: string;
  updated_at: string;
}

interface AlmacenesViewProps {
  businessId?: string;
  onUpdate?: () => void;
}

export function AlmacenesView({ businessId, onUpdate }: AlmacenesViewProps) {
  const { t } = useTranslation();
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [almacenToDelete, setAlmacenToDelete] = useState<Almacen | null>(null);
  
  const [formData, setFormData] = useState({
    almacen: '',
    codigo: '',
    abierto: true,
    puntoventa: false
  });

  useEffect(() => {
    loadAlmacenes();
  }, []);

  const loadAlmacenes = async () => {
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ng_almacen_inventario')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlmacenes(data || []);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
      toast.error(t('inventario.almacenes.errorCargar', 'Error al cargar almacenes'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (almacen?: Almacen) => {
    if (almacen) {
      setEditingAlmacen(almacen);
      setFormData({
        almacen: almacen.almacen,
        codigo: almacen.codigo || '',
        abierto: almacen.abierto,
        puntoventa: almacen.puntoventa
      });
    } else {
      setEditingAlmacen(null);
      setFormData({
        almacen: '',
        codigo: '',
        abierto: true,
        puntoventa: false
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.almacen.trim()) {
        toast.error(t('inventario.almacenes.nombreRequerido', 'El nombre del almacén es requerido'));
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (editingAlmacen) {
        // Actualizar
        const { error } = await supabase
          .from('ng_almacen_inventario')
          .update({
            almacen: formData.almacen,
            codigo: formData.codigo || null,
            abierto: formData.abierto,
            puntoventa: formData.puntoventa,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAlmacen.id);

        if (error) throw error;
        toast.success(t('inventario.almacenes.actualizado', 'Almacén actualizado correctamente'));
      } else {
        // Crear
        if (!businessId) {
          toast.error('No se encontró el ID del negocio');
          return;
        }

        const { error } = await supabase
          .from('ng_almacen_inventario')
          .insert({
            business_id: businessId,
            almacen: formData.almacen,
            codigo: formData.codigo || null,
            abierto: formData.abierto,
            puntoventa: formData.puntoventa
          });

        if (error) throw error;
        toast.success(t('inventario.almacenes.creado', 'Almacén creado correctamente'));
      }

      setDialogOpen(false);
      loadAlmacenes();
      onUpdate?.();
    } catch (error) {
      console.error('Error guardando almacén:', error);
      toast.error(t('inventario.almacenes.errorGuardar', 'Error al guardar el almacén'));
    }
  };

  const handleDelete = async () => {
    if (!almacenToDelete) return;

    try {
      // Verificar si hay existencias
      const { data: existencias } = await supabase
        .from('il_existencias_inventario')
        .select('id')
        .eq('idalmacen', almacenToDelete.id)
        .limit(1);

      if (existencias && existencias.length > 0) {
        toast.error(t('inventario.almacenes.tieneExistencias', 'No se puede eliminar el almacén porque tiene existencias registradas'));
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('ng_almacen_inventario')
        .delete()
        .eq('id', almacenToDelete.id);

      if (error) throw error;

      toast.success(t('inventario.almacenes.eliminado', 'Almacén eliminado correctamente'));
      setDeleteDialogOpen(false);
      setAlmacenToDelete(null);
      loadAlmacenes();
      onUpdate?.();
    } catch (error) {
      console.error('Error eliminando almacén:', error);
      toast.error(t('inventario.almacenes.errorEliminar', 'Error al eliminar el almacén'));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }

    try {
      const { error } = await supabase
        .from('ng_almacen_inventario')
        .insert({
          business_id: businessId,
          almacen: formData.almacen,
          codigo: formData.codigo || null,
          abierto: formData.abierto,
          puntoventa: formData.puntoventa
        });

      if (error) throw error;
      toast.success(t('inventario.almacenes.creado', 'Almacén creado correctamente'));
    } catch (error) {
      console.error('Error creando almacén:', error);
      toast.error(t('inventario.almacenes.errorCrear', 'Error al crear el almacén'));
    }
  };

  const columns = [
    {
      key: 'almacen',
      label: t('inventario.almacenes.nombre', 'Nombre'),
      sortable: true
    },
    {
      key: 'codigo',
      label: t('inventario.almacenes.codigo', 'Código'),
      sortable: true,
      render: (almacen: Almacen) => <span>{almacen.codigo || '-'}</span>
    },
    {
      key: 'abierto',
      label: t('inventario.almacenes.estado', 'Estado'),
      render: (almacen: Almacen) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          almacen.abierto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {almacen.abierto ? t('inventario.almacenes.abierto', 'Abierto') : t('inventario.almacenes.cerrado', 'Cerrado')}
        </span>
      )
    },
    {
      key: 'puntoventa',
      label: t('inventario.almacenes.puntoVenta', 'Punto de Venta'),
      render: (almacen: Almacen) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          almacen.puntoventa ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {almacen.puntoventa ? t('common.yes', 'Sí') : t('common.no', 'No')}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('common.actions', 'Acciones'),
      render: (almacen: Almacen) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(almacen)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAlmacenToDelete(almacen);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                {t('inventario.almacenes.title', 'Gestión de Almacenes')}
              </CardTitle>
              <CardDescription>
                {t('inventario.almacenes.description', 'Administra las ubicaciones de almacenamiento')}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventario.almacenes.nuevo', 'Nuevo Almacén')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={almacenes}
            columns={columns}
            loading={loading}
            searchable
            searchPlaceholder={t('inventario.almacenes.buscar', 'Buscar almacén...')}
          />
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAlmacen 
                ? t('inventario.almacenes.editar', 'Editar Almacén')
                : t('inventario.almacenes.crear', 'Crear Almacén')}
            </DialogTitle>
            <DialogDescription>
              {t('inventario.almacenes.dialogDescription', 'Ingresa los datos del almacén')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="almacen">
                {t('inventario.almacenes.nombre', 'Nombre')} *
              </Label>
              <Input
                id="almacen"
                value={formData.almacen}
                onChange={(e) => setFormData({ ...formData, almacen: e.target.value })}
                placeholder={t('inventario.almacenes.nombrePlaceholder', 'Ej: Almacén Principal')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">
                {t('inventario.almacenes.codigo', 'Código')}
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder={t('inventario.almacenes.codigoPlaceholder', 'Ej: ALM-01')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="abierto">
                {t('inventario.almacenes.abierto', 'Almacén Abierto')}
              </Label>
              <Switch
                id="abierto"
                checked={formData.abierto}
                onCheckedChange={(checked) => setFormData({ ...formData, abierto: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="puntoventa">
                {t('inventario.almacenes.puntoVenta', 'Es Punto de Venta')}
              </Label>
              <Switch
                id="puntoventa"
                checked={formData.puntoventa}
                onCheckedChange={(checked) => setFormData({ ...formData, puntoventa: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button onClick={handleSave}>
              {t('common.save', 'Guardar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('inventario.almacenes.confirmarEliminar', 'Confirmar Eliminación')}
        description={t('inventario.almacenes.confirmarEliminarDesc', '¿Estás seguro de que deseas eliminar este almacén? Esta acción no se puede deshacer.')}
      />
    </>
  );
}






