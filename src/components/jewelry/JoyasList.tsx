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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, FileText } from 'lucide-react';
import { 
  getJoyas, 
  createJoya, 
  updateJoya, 
  deleteJoya,
  getMateriaPrimas,
  getFichaCostoByJoya,
  addMaterialToFichaCosto,
  removeMaterialFromFichaCosto
} from '../../lib/api/jewelry';
import type { 
  JwlJoya, 
  JwlJoyaFormData,
  JwlMateriaPrima,
  JwlJoyaMaterial,
  JwlFichaCosto
} from '../../lib/types/jewelry.types';
import { 
  JWL_CATEGORIAS_JOYA,
  JWL_ESTADOS_JOYA
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ImageUpload } from '../shared/ImageUpload';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { useTranslation } from 'react-i18next';

interface JoyasListProps {
  businessId: string;
  onUpdate?: () => void;
}

export function JoyasList({ businessId, onUpdate }: JoyasListProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [joyas, setJoyas] = useState<JwlJoya[]>([]);
  const [materiales, setMateriales] = useState<JwlMateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFichaDialog, setShowFichaDialog] = useState(false);
  const [selectedJoya, setSelectedJoya] = useState<JwlJoya | null>(null);
  const [fichaCosto, setFichaCosto] = useState<JwlFichaCosto[]>([]);

  // Formularios
  const [formData, setFormData] = useState<JwlJoyaFormData>({
    sku: '',
    nombre: '',
    descripcion: '',
    categoria: 'Anillo',
    margen_ganancia: 50,
    precio_venta: 0,
    precio_por_peso: 0,
    stock_actual: 0,
    imagen_url: ''
  });

  // Estado adicional para controlar si es venta por peso
  const [esPorPeso, setEsPorPeso] = useState(false);

  const [newMaterial, setNewMaterial] = useState({
    materia_prima_id: '',
    cantidad_usada: 0
  });

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Estado para controlar qué campo se está editando (para evitar loops infinitos)
  const [lastEditedField, setLastEditedField] = useState<'margin' | 'price' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Calcular automáticamente precio de venta o margen de ganancia
  useEffect(() => {
    const costoProd = formData.costo_produccion || 0;
    
    if (costoProd <= 0) return;

    if (lastEditedField === 'margin') {
      // Si se editó el margen, calcular el precio correspondiente
      const nuevoPrecio = costoProd * (1 + formData.margen_ganancia / 100);
      if (esPorPeso) {
        setFormData(prev => ({ ...prev, precio_por_peso: parseFloat(nuevoPrecio.toFixed(2)) }));
      } else {
        setFormData(prev => ({ ...prev, precio_venta: parseFloat(nuevoPrecio.toFixed(2)) }));
      }
      setLastEditedField(null);
    } else if (lastEditedField === 'price') {
      // Si se editó el precio, calcular el margen
      const precio = esPorPeso ? (formData.precio_por_peso || 0) : (formData.precio_venta || 0);
      if (precio > costoProd) {
        const nuevoMargen = ((precio - costoProd) / costoProd) * 100;
        setFormData(prev => ({ ...prev, margen_ganancia: parseFloat(nuevoMargen.toFixed(2)) }));
      }
      setLastEditedField(null);
    }
  }, [lastEditedField, formData.costo_produccion, formData.margen_ganancia, formData.precio_venta, formData.precio_por_peso, esPorPeso]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [joyasData, materialesData] = await Promise.all([
        getJoyas(),
        getMateriaPrimas()
      ]);
      setJoyas(joyasData);
      setMateriales(materialesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      // Preparar datos según si es por peso o no
      const dataToSend = {
        ...formData,
        precio_venta: esPorPeso ? 0 : formData.precio_venta,
        precio_por_peso: esPorPeso ? formData.precio_por_peso : 0
      };
      
      // Crear la joya
      await createJoya(dataToSend);
      
      // Recargar datos
      await loadData();
      
      // Notificar al padre (sin esperar)
      onUpdate?.();
      
      // Mostrar éxito
      toast.success(t('jewelry.common.saveSuccess'));
      
      // Cerrar diálogo y resetear formulario
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating joya:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, imagen_url: url });
  };

  const handleEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!selectedJoya) return;
    
    try {
      // Preparar datos según si es por peso o no
      const dataToSend = {
        ...formData,
        precio_venta: esPorPeso ? 0 : formData.precio_venta,
        precio_por_peso: esPorPeso ? formData.precio_por_peso : 0
      };
      
      // Actualizar la joya
      await updateJoya(selectedJoya.id, dataToSend);
      
      // Recargar datos
      await loadData();
      
      // Notificar al padre (sin esperar)
      onUpdate?.();
      
      // Mostrar éxito
      toast.success(t('jewelry.common.saveSuccess'));
      
      // Cerrar diálogo y resetear formulario
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error updating joya:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('jewelry.common.confirmDelete'))) return;
    try {
      await deleteJoya(id);
      toast.success(t('jewelry.common.deleteSuccess'));
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting joya:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleShowFicha = async (joya: JwlJoya) => {
    try {
      const ficha = await getFichaCostoByJoya(joya.id);
      setFichaCosto(ficha);
      setSelectedJoya(joya);
      setShowFichaDialog(true);
    } catch (error) {
      console.error('Error loading ficha:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedJoya || !newMaterial.materia_prima_id || newMaterial.cantidad_usada <= 0) {
      toast.error(t('jewelry.common.error'));
      return;
    }
    try {
      await addMaterialToFichaCosto({
        joya_id: selectedJoya.id,
        materia_prima_id: newMaterial.materia_prima_id,
        cantidad_usada: newMaterial.cantidad_usada
      });
      toast.success(t('jewelry.common.saveSuccess'));
      const ficha = await getFichaCostoByJoya(selectedJoya.id);
      setFichaCosto(ficha);
      setNewMaterial({ materia_prima_id: '', cantidad_usada: 0 });
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleRemoveMaterial = async (id: string) => {
    if (!confirm(t('jewelry.common.confirmDelete'))) return;
    try {
      await removeMaterialFromFichaCosto(id);
      toast.success(t('jewelry.common.deleteSuccess'));
      if (selectedJoya) {
        const ficha = await getFichaCostoByJoya(selectedJoya.id);
        setFichaCosto(ficha);
      }
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      nombre: '',
      descripcion: '',
      categoria: 'Anillo',
      margen_ganancia: 50,
      precio_venta: 0,
      precio_por_peso: 0,
      stock_actual: 0,
      imagen_url: ''
    });
    setSelectedJoya(null);
    setEsPorPeso(false);
  };

  const openEditDialog = (joya: JwlJoya) => {
    setSelectedJoya(joya);
    const tienePrecioPorPeso = (joya.precio_por_peso || 0) > 0;
    setEsPorPeso(tienePrecioPorPeso);
    setFormData({
      sku: joya.sku,
      nombre: joya.nombre,
      descripcion: joya.descripcion || '',
      categoria: joya.categoria,
      margen_ganancia: joya.margen_ganancia,
      costo_produccion: joya.costo_produccion || 0,
      precio_venta: joya.precio_venta,
      precio_por_peso: joya.precio_por_peso || 0,
      stock_actual: joya.stock_actual,
      imagen_url: joya.imagen_url || ''
    });
    setShowEditDialog(true);
  };

  const filteredJoyas = joyas.filter(j => 
    j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const costoTotalFicha = fichaCosto.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('jewelry.inventory.title')}</CardTitle>
              <CardDescription>
                {t('jewelry.inventory.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('jewelry.inventory.addItem')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={t('jewelry.inventory.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Lista de joyas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJoyas.map(joya => (
          <Card key={joya.id}>
            {/* Imagen del producto */}
            {joya.imagen_url ? (
              <div className="w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                <img 
                  src={joya.imagen_url} 
                  alt={joya.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-muted rounded-t-lg">
                <Package className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{joya.nombre}</CardTitle>
                  <CardDescription>SKU: {joya.sku}</CardDescription>
                </div>
                <Package className={`h-5 w-5 ${joya.stock_actual > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.inventory.table.type')}:</span>
                  <span>{joya.categoria}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.inventory.table.stock')}:</span>
                  <span className="font-medium">{joya.stock_actual} pzas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.inventory.form.cost')}:</span>
                  <span className="font-medium">{formatearMonto(joya.costo_produccion)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.inventory.form.price')}:</span>
                  <span className="font-bold text-green-600">{formatearMonto(joya.precio_venta)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.inventory.form.pricePerWeight')}:</span>
                  <span className="font-bold text-green-600">{formatearMonto(joya.precio_por_peso)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('jewelry.reports.summary.profitMargin')}:</span>
                  <span>{joya.margen_ganancia}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShowFicha(joya)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {t('jewelry.common.actions')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(joya)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(joya.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJoyas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('jewelry.inventory.noItems')}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Crear Joya */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          // Prevenir cualquier navegación
          setTimeout(() => {
            setShowCreateDialog(false);
            resetForm();
          }, 0);
        } else {
          setShowCreateDialog(open);
        }
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
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreate(e);
          }}>
            <DialogHeader>
              <DialogTitle>{t('jewelry.inventory.addItem')}</DialogTitle>
              <DialogDescription>
                {t('jewelry.inventory.form.createProduct')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.inventory.form.sku')}</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder={t('jewelry.inventory.form.skuPlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('jewelry.inventory.form.category')}</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JWL_CATEGORIAS_JOYA.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.name')}</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder={t('jewelry.inventory.form.namePlaceholder')}
                />
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.description')}</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder={t('jewelry.inventory.form.descriptionPlaceholder')}
                />
              </div>
              
              {/* Switch para venta por peso */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="es-por-peso-create" className="text-base">
                    {t('jewelry.inventory.form.sellByWeight') || 'Vender por peso'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('jewelry.inventory.form.sellByWeightHelp') || 'Activar si esta joya se vende por gramo/peso'}
                  </p>
                </div>
                <Switch
                  id="es-por-peso-create"
                  checked={esPorPeso}
                  onCheckedChange={setEsPorPeso}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.inventory.form.profitMargin')} (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.margen_ganancia}
                    onChange={(e) => {
                      const newMargin = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, margen_ganancia: newMargin });
                      setLastEditedField('margin');
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('jewelry.inventory.form.profitMarginHelp') || 'Porcentaje de ganancia sobre el costo'}
                  </p>
                </div>
                <div>
                  <Label>{t('jewelry.inventory.form.productionCost')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.costo_produccion || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const newCost = value === '' ? 0 : parseFloat(value);
                        setFormData({ ...formData, costo_produccion: newCost });
                        // Si hay un margen definido, recalcular precio de venta
                        if (formData.margen_ganancia > 0) {
                          setLastEditedField('margin');
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>
                  {esPorPeso 
                    ? t('jewelry.inventory.form.pricePerWeight') 
                    : t('jewelry.inventory.form.salePrice')
                  }
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={esPorPeso ? (formData.precio_por_peso || '') : (formData.precio_venta || '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const newPrice = value === '' ? 0 : parseFloat(value);
                      if (esPorPeso) {
                        setFormData({ ...formData, precio_por_peso: newPrice });
                      } else {
                        setFormData({ ...formData, precio_venta: newPrice });
                      }
                      setLastEditedField('price');
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {esPorPeso
                    ? (t('jewelry.inventory.form.pricePerWeightAutoHelp') || 'Precio por gramo/peso. Se calcula automáticamente según el margen')
                    : (t('jewelry.inventory.form.salePriceHelp') || 'Se calcula automáticamente según el margen, o edítalo manualmente')
                  }
                </p>
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.productImage')}</Label>
                <ImageUpload
                  currentImageUrl={formData.imagen_url}
                  onImageUploaded={handleImageUpload}
                  bucket="jewelry-images"
                  folder="joyas"
                  variant="product"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateDialog(false);
                }}
              >
                {t('jewelry.common.cancel')}
              </Button>
              <Button type="submit">{t('jewelry.inventory.addItem')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Joya */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          // Prevenir cualquier navegación
          setTimeout(() => {
            setShowEditDialog(false);
            resetForm();
          }, 0);
        } else {
          setShowEditDialog(open);
        }
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
          <form onSubmit={(e) => {
            e.preventDefault();
            handleEdit(e);
          }}>
            <DialogHeader>
              <DialogTitle>{t('jewelry.common.edit')}</DialogTitle>
              <DialogDescription>
                {t('jewelry.inventory.form.editProduct')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.inventory.form.sku')}</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('jewelry.inventory.form.category')}</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JWL_CATEGORIAS_JOYA.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.name')}</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.description')}</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              
              {/* Switch para venta por peso - EDITAR */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="es-por-peso-edit" className="text-base">
                    {t('jewelry.inventory.form.sellByWeight') || 'Vender por peso'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('jewelry.inventory.form.sellByWeightHelp') || 'Activar si esta joya se vende por gramo/peso'}
                  </p>
                </div>
                <Switch
                  id="es-por-peso-edit"
                  checked={esPorPeso}
                  onCheckedChange={setEsPorPeso}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.inventory.form.profitMargin')} (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.margen_ganancia}
                    onChange={(e) => {
                      const newMargin = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, margen_ganancia: newMargin });
                      setLastEditedField('margin');
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('jewelry.inventory.form.profitMarginHelp') || 'Porcentaje de ganancia sobre el costo'}
                  </p>
                </div>
                <div>
                  <Label>{t('jewelry.inventory.form.productionCost')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.costo_produccion || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const newCost = value === '' ? 0 : parseFloat(value);
                        setFormData({ ...formData, costo_produccion: newCost });
                        // Si hay un margen definido, recalcular precio de venta
                        if (formData.margen_ganancia > 0) {
                          setLastEditedField('margin');
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>
                  {esPorPeso 
                    ? t('jewelry.inventory.form.pricePerWeight') 
                    : t('jewelry.inventory.form.salePrice')
                  }
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={esPorPeso ? (formData.precio_por_peso || '') : (formData.precio_venta || '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const newPrice = value === '' ? 0 : parseFloat(value);
                      if (esPorPeso) {
                        setFormData({ ...formData, precio_por_peso: newPrice });
                      } else {
                        setFormData({ ...formData, precio_venta: newPrice });
                      }
                      setLastEditedField('price');
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {esPorPeso
                    ? (t('jewelry.inventory.form.pricePerWeightAutoHelp') || 'Precio por gramo/peso. Se calcula automáticamente según el margen')
                    : (t('jewelry.inventory.form.salePriceHelp') || 'Se calcula automáticamente según el margen, o edítalo manualmente')
                  }
                </p>
              </div>
              <div>
                <Label>{t('jewelry.inventory.form.productImage')}</Label>
                <ImageUpload
                  currentImageUrl={formData.imagen_url}
                  onImageUploaded={handleImageUpload}
                  bucket="jewelry-images"
                  folder="joyas"
                  variant="product"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEditDialog(false);
                }}
              >
                {t('jewelry.common.cancel')}
              </Button>
              <Button type="submit">{t('jewelry.common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ficha de Costo */}
      <Dialog open={showFichaDialog} onOpenChange={setShowFichaDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('jewelry.inventory.costSheet.title')} - {selectedJoya?.nombre}</DialogTitle>
            <DialogDescription>
              SKU: {selectedJoya?.sku} | {t('jewelry.inventory.form.category')}: {selectedJoya?.categoria}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Agregar material */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('jewelry.inventory.costSheet.addMaterial')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>{t('jewelry.inventory.costSheet.material')}</Label>
                    <Select
                      value={newMaterial.materia_prima_id}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, materia_prima_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('jewelry.inventory.costSheet.materialPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {materiales.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre} ({m.unidad_medida}) - {formatearMonto(m.costo_unitario_actual)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('jewelry.inventory.costSheet.quantity')}</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={newMaterial.cantidad_usada}
                      onChange={(e) => setNewMaterial({ ...newMaterial, cantidad_usada: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button type="button" onClick={handleAddMaterial} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('jewelry.inventory.costSheet.addMaterial')}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de materiales */}
            <div className="space-y-2">
              <h3 className="font-semibold">{t('jewelry.inventory.costSheet.materialsUsed')}</h3>
              {fichaCosto.map(item => (
                <Card key={item.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.costSheet.material')}:</span>
                          <p className="font-medium">{item.materia_prima?.nombre}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.costSheet.quantity')}:</span>
                          <p>{item.cantidad_usada} {item.materia_prima?.unidad_medida}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.costSheet.unitCost')}:</span>
                          <p>{formatearMonto(item.costo_unitario_momento)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.costSheet.subtotal')}:</span>
                          <p className="font-bold">{formatearMonto(item.subtotal || 0)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMaterial(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {fichaCosto.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {t('jewelry.inventory.costSheet.noMaterials')}
                </p>
              )}
            </div>

            {/* Resumen */}
            <Card className="bg-primary/5">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('jewelry.inventory.costSheet.totalCost')}</p>
                    <p className="text-2xl font-bold">{formatearMonto(costoTotalFicha)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('jewelry.inventory.costSheet.suggestedPrice')} ({selectedJoya?.margen_ganancia}%)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearMonto(costoTotalFicha * (1 + (selectedJoya?.margen_ganancia || 0) / 100))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFichaDialog(false);
              }}
            >
              {t('jewelry.inventory.costSheet.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
