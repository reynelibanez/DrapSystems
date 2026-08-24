import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Edit, Trash2, Factory, Search, X } from 'lucide-react';
import { 
  getProduccion, 
  createProduccion, 
  updateProduccion, 
  deleteProduccion,
  getJoyas,
  getMateriaPrimas
} from '../../lib/api/jewelry';
import type { 
  JwlProduccion, 
  JwlProduccionFormData,
  JwlJoya,
  JwlMateriaPrima
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { useTranslation } from 'react-i18next';

interface ProduccionListProps {
  businessId: string;
  onUpdate?: () => void;
}

interface MaterialUsado {
  material_id: string;
  cantidad: string;
}

export function ProduccionList({ businessId, onUpdate }: ProduccionListProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [producciones, setProducciones] = useState<JwlProduccion[]>([]);
  const [joyas, setJoyas] = useState<JwlJoya[]>([]);
  const [materiales, setMateriales] = useState<JwlMateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<JwlProduccionFormData>({
    joya_id: '',
    cantidad_producida: 0,
    fecha_produccion: new Date().toISOString().split('T')[0]
  });

  const [pesoProducto, setPesoProducto] = useState<string>('');
  const [materialesUsados, setMaterialesUsados] = useState<MaterialUsado[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [produccionData, joyasData, materialesData] = await Promise.all([
        getProduccion(),
        getJoyas(),
        getMateriaPrimas()
      ]);
      setProducciones(produccionData);
      setJoyas(joyasData);
      setMateriales(materialesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const agregarMaterial = () => {
    setMaterialesUsados([...materialesUsados, { material_id: '', cantidad: '' }]);
  };

  const eliminarMaterial = (index: number) => {
    setMaterialesUsados(materialesUsados.filter((_, i) => i !== index));
  };

  const actualizarMaterial = (index: number, field: keyof MaterialUsado, value: string) => {
    const nuevos = [...materialesUsados];
    nuevos[index][field] = value;
    setMaterialesUsados(nuevos);
  };

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!formData.joya_id || !formData.cantidad_producida || !formData.fecha_produccion) {
      toast.error(t('jewelry.common.error'));
      return;
    }

    // Validar materiales si se agregaron
    if (materialesUsados.length > 0) {
      const materialesIncompletos = materialesUsados.some(m => !m.material_id || !m.cantidad);
      if (materialesIncompletos) {
        toast.error(t('jewelry.common.error'));
        return;
      }
    }

    try {
      const dataToSend = {
        ...formData,
        peso_producto: pesoProducto ? parseFloat(pesoProducto) : undefined,
        materiales_usados: materialesUsados.length > 0 ? materialesUsados.map(m => ({
          material_id: m.material_id,
          cantidad: parseFloat(m.cantidad)
        })) : undefined
      };

      if (editingId) {
        await updateProduccion(editingId, dataToSend);
        toast.success(t('jewelry.common.updateSuccess'));
      } else {
        await createProduccion(dataToSend);
        toast.success(t('jewelry.common.saveSuccess'));
      }
      
      setShowDialog(false);
      resetForm();
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving produccion:', error);
      toast.error(error instanceof Error ? error.message : t('jewelry.common.error'));
    }
  };

  const handleEdit = (prod: JwlProduccion) => {
    setEditingId(prod.id);
    setFormData({
      joya_id: prod.joya_id,
      cantidad_producida: prod.cantidad_producida,
      fecha_produccion: prod.fecha_produccion
    });
    
    // Cargar peso_producto si existe
    setPesoProducto(prod.peso_producto ? prod.peso_producto.toString() : '');
    
    // Cargar materiales_usados si existen
    if (prod.materiales_usados && prod.materiales_usados.length > 0) {
      setMaterialesUsados(prod.materiales_usados.map(m => ({
        material_id: m.material_id,
        cantidad: m.cantidad.toString()
      })));
    } else {
      setMaterialesUsados([]);
    }
    
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteProduccion(deletingId);
      toast.success(t('jewelry.common.deleteSuccess'));
      setShowDeleteDialog(false);
      setDeletingId(null);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting produccion:', error);
      toast.error(error instanceof Error ? error.message : t('jewelry.common.error'));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      joya_id: '',
      cantidad_producida: 0,
      fecha_produccion: new Date().toISOString().split('T')[0]
    });
    setPesoProducto('');
    setMaterialesUsados([]);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('jewelry.production.title')}</CardTitle>
              <CardDescription>
                {t('jewelry.production.description')}
              </CardDescription>
            </div>
            <Button onClick={() => {
              resetForm();
              setShowDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('jewelry.production.form.registerProduction')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {producciones.map(prod => (
          <Card key={prod.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm flex-1">
                  <div>
                    <span className="text-muted-foreground">{t('date')}:</span>
                    <p className="font-medium">{new Date(prod.fecha_produccion).toLocaleDateString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">{t('jewelry.inventory.title')}:</span>
                    <p className="font-medium">{prod.joya?.nombre}</p>
                    <p className="text-xs text-muted-foreground">SKU: {prod.joya?.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('jewelry.production.form.quantity')}:</span>
                    <p className="font-bold">{prod.cantidad_producida} pzas</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('jewelry.production.table.batchCost')}:</span>
                    <p className="font-bold">{formatearMonto(prod.costo_total_lote)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(prod)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingId(prod.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {producciones.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('jewelry.production.noRecords')}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('jewelry.common.edit') : t('jewelry.production.form.registerProduction')}
            </DialogTitle>
            <DialogDescription>
              {t('jewelry.production.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('jewelry.inventory.title')} *</Label>
              <Select
                value={formData.joya_id}
                onValueChange={(value) => setFormData({ ...formData, joya_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('jewelry.production.form.selectJewelry')} />
                </SelectTrigger>
                <SelectContent>
                  {joyas.map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nombre} ({j.sku}) - {t('jewelry.inventory.form.cost')}: {formatearMonto(j.costo_produccion)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('jewelry.production.form.quantity')} *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('jewelry.production.form.quantityPlaceholder')}
                  value={formData.cantidad_producida || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, cantidad_producida: value === '' ? 0 : parseFloat(value) });
                    }
                  }}
                />
              </div>
              <div>
                <Label>{t('jewelry.production.form.productWeight')}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('jewelry.production.form.quantityPlaceholder')}
                  value={pesoProducto}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPesoProducto(value);
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label>{t('jewelry.production.form.date')} *</Label>
              <Input
                type="date"
                value={formData.fecha_produccion}
                onChange={(e) => setFormData({ ...formData, fecha_produccion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('jewelry.production.form.materialsUsed')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarMaterial}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('jewelry.production.form.addMaterial')}
                </Button>
              </div>

              {materialesUsados.map((material, index) => (
                <Card key={index} className="p-3">
                  <div className="grid grid-cols-[1fr,120px,40px] gap-2">
                    <div>
                      <Select
                        value={material.material_id}
                        onValueChange={(value) => actualizarMaterial(index, 'material_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('jewelry.production.form.selectMaterial')} />
                        </SelectTrigger>
                        <SelectContent>
                          {materiales.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nombre} ({m.unidad_medida}) - {t('jewelry.rawMaterials.table.stock')}: {m.stock_actual}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={t('jewelry.production.form.materialQuantity')}
                        value={material.cantidad}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            actualizarMaterial(index, 'cantidad', value);
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarMaterial(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {material.material_id && material.cantidad && formData.cantidad_producida > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Total a descontar: {(parseFloat(material.cantidad) * formData.cantidad_producida).toFixed(2)}{' '}
                      {materiales.find(m => m.id === material.material_id)?.unidad_medida}
                    </p>
                  )}
                </Card>
              ))}

              {materialesUsados.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {editingId 
                    ? 'No se modificarán los materiales al editar. Los materiales se rebajaron cuando se creó la producción.'
                    : 'No se han agregado materiales. Haz clic en "Agregar Material" para registrar los materiales utilizados.'}
                </p>
              )}
            </div>

            {formData.joya_id && formData.cantidad_producida > 0 && (
              <Card className="bg-primary/5">
                <CardContent className="py-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Costo estimado del lote:</p>
                    <p className="text-xl font-bold">
                      {formatearMonto(
                        (joyas.find(j => j.id === formData.joya_id)?.costo_produccion || 0) * formData.cantidad_producida
                      )}
                    </p>
                    {pesoProducto && (
                      <p className="text-sm text-muted-foreground">
                        Peso total: {(parseFloat(pesoProducto) * formData.cantidad_producida).toFixed(2)} g
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowDialog(false);
              resetForm();
            }}>
              {t('jewelry.common.cancel')}
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {editingId ? t('jewelry.common.update') : t('jewelry.production.form.registerProduction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jewelry.common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el registro de producción y revertirá los cambios en el inventario (devolverá los materiales y restará las joyas producidas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDeletingId(null);
            }}>
              {t('jewelry.common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('jewelry.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



