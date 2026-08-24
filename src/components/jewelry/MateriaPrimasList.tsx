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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Plus, Edit, Trash2, ShoppingBag, AlertTriangle, Search, Settings, Package, MoreVertical, Image, AlertCircle } from 'lucide-react';
import { 
  getMateriaPrimas, 
  createMateriaPrima, 
  updateMateriaPrima, 
  deleteMateriaPrima,
  createCompraMaterial,
  getComprasByMaterial
} from '../../lib/api/jewelry';
import type { 
  JwlMateriaPrima, 
  JwlMateriaPrimaFormData,
  JwlCompraMaterialFormData,
  JwlCompraMaterial
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import { useMaterialCatalog } from '../../lib/hooks/useMaterialCatalog';
import { UnidadesMedidaManager } from './UnidadesMedidaManager';
import { Predefined3DViewer, PREDEFINED_3D_OBJECTS, getPredefined3DObjectsByCategory, type Predefined3DObject } from './Predefined3DObjects';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  tipo: string;
  activo: boolean;
}

interface MateriaPrimasListProps {
  businessId: string;
  onUpdate?: () => void;
}

export function MateriaPrimasList({ businessId, onUpdate }: MateriaPrimasListProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const { catalog, loading: catalogoLoading, error: catalogError } = useMaterialCatalog(businessId);
  const [materiales, setMateriales] = useState<JwlMateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [showStockBajo, setShowStockBajo] = useState(false);
  
  // Estado para unidades de medida
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [showUnidadesDialog, setShowUnidadesDialog] = useState(false);

  // Diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompraDialog, setShowCompraDialog] = useState(false);
  const [showHistorialDialog, setShowHistorialDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<JwlMateriaPrima | null>(null);
  const [historialCompras, setHistorialCompras] = useState<JwlCompraMaterial[]>([]);

  // Formularios - DECLARAR ANTES DE LOS USEMEMO
  const [formData, setFormData] = useState<JwlMateriaPrimaFormData>({
    nombre: '',
    categoria: 'Metal',
    tipo: '',
    stock_actual: 0,
    stock_minimo: 0,
    unidad_medida: '',
    costo_unitario_actual: 0,
    object_3d_id: '' // ID del objeto 3D predefinido
  });

  const [compraData, setCompraData] = useState<JwlCompraMaterialFormData>({
    materia_prima_id: '',
    cantidad: 0,
    costo_unitario: 0,
    proveedor: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    notas: ''
  });

  // Obtener categorías únicas del catálogo de IA
  const categorias = React.useMemo(() => {
    console.log('🔄 Calculando categorías del catálogo:', {
      catalogoLength: catalog?.length || 0,
      loading: catalogoLoading,
      error: catalogError?.message
    });
    
    if (!catalog || catalog.length === 0) {
      console.log('⚠️  Catálogo vacío o no disponible');
      return [];
    }
    
    const uniqueCategories = [...new Set(catalog.map(item => item.categoria))];
    console.log('✅ Categorías únicas encontradas:', uniqueCategories);
    return uniqueCategories;
  }, [catalog, catalogoLoading, catalogError]);

  // Materiales del catálogo filtrados por categoría seleccionada
  const materialesCatalogo = React.useMemo(() => {
    if (!catalog || !formData.categoria) return [];
    return catalog.filter(item => item.categoria === formData.categoria);
  }, [catalog, formData.categoria]);

  // Debug: Log del catálogo
  useEffect(() => {
    console.log('📚 Catálogo de IA cargado:', {
      total: catalog?.length || 0,
      categorias: categorias,
      loading: catalogoLoading
    });
  }, [catalog, categorias, catalogoLoading]);

  // Debug: Log de materiales filtrados
  useEffect(() => {
    console.log('🔍 Materiales filtrados por categoría:', {
      categoria: formData.categoria,
      materiales: materialesCatalogo.length,
      lista: materialesCatalogo.map(m => m.nombre)
    });
  }, [formData.categoria, materialesCatalogo]);

  // Función para seleccionar un material del catálogo
  const handleSelectMaterialCatalogo = (materialNombre: string) => {
    // Buscar el material en el catálogo para obtener su tipo
    const materialCatalogo = catalog.find(m => m.nombre === materialNombre);
    
    console.log('🎯 Material seleccionado del catálogo:', {
      nombre: materialNombre,
      materialEncontrado: materialCatalogo,
      tipo: materialCatalogo?.tipo
    });
    
    setFormData({ 
      ...formData, 
      nombre: materialNombre,
      tipo: materialCatalogo?.tipo || ''
    });
  };

  useEffect(() => {
    loadMateriales();
    loadUnidadesMedida();
  }, []);

  const loadUnidadesMedida = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Primero verificar si existen unidades para este negocio
      const { data: existingUnits, error: checkError } = await supabase
        .from('jwl_unidades_medida')
        .select('id')
        .eq('business_id', businessId)
        .limit(1);

      if (checkError) throw checkError;

      // Si no existen unidades, insertar las por defecto
      if (!existingUnits || existingUnits.length === 0) {
        const { error: insertError } = await supabase.rpc('insert_default_jewelry_units', {
          p_business_id: businessId
        });

        if (insertError) {
          console.error('Error insertando unidades por defecto:', insertError);
        }
      }

      // Cargar todas las unidades activas
      const { data, error } = await supabase
        .from('jwl_unidades_medida')
        .select('*')
        .eq('business_id', businessId)
        .eq('activo', true)
        .order('tipo', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;

      setUnidadesMedida(data || []);
      
      // Si hay unidades y el formData no tiene una unidad válida, usar la primera
      if (data && data.length > 0 && !formData.unidad_medida) {
        setFormData(prev => ({ ...prev, unidad_medida: data[0].nombre }));
      }
    } catch (error) {
      console.error('Error loading unidades:', error);
      toast.error('Error al cargar unidades de medida');
    }
  };

  const loadMateriales = async () => {
    try {
      setLoading(true);
      const data = await getMateriaPrimas();
      setMateriales(data);
    } catch (error) {
      console.error('Error loading materiales:', error);
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createMateriaPrima(formData);
      toast.success(t('jewelry.common.saveSuccess'));
      setShowCreateDialog(false);
      resetForm();
      await loadMateriales();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleEdit = async () => {
    if (!selectedMaterial) return;
    try {
      await updateMateriaPrima(selectedMaterial.id, formData);
      toast.success(t('jewelry.common.saveSuccess'));
      setShowEditDialog(false);
      resetForm();
      await loadMateriales();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      await deleteMateriaPrima(deletingId);
      toast.success(t('jewelry.common.deleteSuccess'));
      setShowDeleteDialog(false);
      setDeletingId(null);
      loadMateriales();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error(error instanceof Error ? error.message : t('jewelry.common.error'));
    }
  };

  const handleCompra = async () => {
    try {
      await createCompraMaterial(compraData);
      toast.success(t('jewelry.common.saveSuccess'));
      setShowCompraDialog(false);
      resetCompraForm();
      await loadMateriales();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating compra:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleShowHistorial = async (material: JwlMateriaPrima) => {
    try {
      const historial = await getComprasByMaterial(material.id);
      setHistorialCompras(historial);
      setSelectedMaterial(material);
      setShowHistorialDialog(true);
    } catch (error) {
      console.error('Error loading historial:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'Metal',
      tipo: '',
      stock_actual: 0,
      stock_minimo: 0,
      unidad_medida: '',
      costo_unitario_actual: 0,
      object_3d_id: ''
    });
    setSelectedMaterial(null);
  };

  const resetCompraForm = () => {
    setCompraData({
      materia_prima_id: '',
      cantidad: 0,
      costo_unitario: 0,
      proveedor: '',
      fecha_compra: new Date().toISOString().split('T')[0],
      notas: ''
    });
  };

  const openEditDialog = (material: JwlMateriaPrima) => {
    setSelectedMaterial(material);
    setFormData({
      nombre: material.nombre,
      categoria: material.categoria,
      tipo: material.tipo || '',
      stock_actual: material.stock_actual,
      stock_minimo: material.stock_minimo,
      unidad_medida: material.unidad_medida,
      costo_unitario_actual: material.costo_unitario_actual,
      object_3d_id: material.object_3d_id || ''
    });
    setShowEditDialog(true);
  };

  const openCompraDialog = (material: JwlMateriaPrima) => {
    setSelectedMaterial(material);
    setCompraData({
      materia_prima_id: material.id,
      cantidad: 0,
      costo_unitario: material.costo_unitario_actual,
      proveedor: material.proveedor || '',
      fecha_compra: new Date().toISOString().split('T')[0],
      notas: ''
    });
    setShowCompraDialog(true);
  };

  const filteredMateriales = materiales.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'all' || m.categoria === filterCategoria;
    const matchesStockBajo = !showStockBajo || m.stock_actual <= m.stock_minimo;
    return matchesSearch && matchesCategoria && matchesStockBajo;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y botón */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('jewelry.rawMaterials.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('jewelry.rawMaterials.addMaterial')}
        </Button>
      </div>

      {/* Lista de materias primas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">{t('jewelry.common.loading')}</p>
        </div>
      ) : filteredMateriales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron materias primas' : t('jewelry.rawMaterials.noMaterials')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMateriales.map((material) => (
            <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{material.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {material.tipo || 'Sin tipo'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(material)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('jewelry.common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeletingId(material.id);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('jewelry.common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Modelo 3D - Solo renderiza cuando es visible */}
                <div className="relative">
                  {material.object_3d_id ? (
                    <Predefined3DViewer 
                      objectId={material.object_3d_id}
                      className="w-full h-32 rounded-lg border bg-gradient-to-br from-background to-muted/20"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg border bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {material.imagen_url && (
                    <div className="absolute top-2 right-2">
                      <div className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border flex items-center justify-center">
                        <Image className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Información del material */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('jewelry.rawMaterials.table.stock')}</p>
                    <p className="font-medium">
                      {material.stock_actual?.toFixed(2) || '0.00'} {material.unidad_medida}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('jewelry.rawMaterials.table.cost')}</p>
                    <p className="font-medium">
                      {formatearMonto(material.costo_unitario_actual || 0)}
                    </p>
                  </div>
                </div>

                {material.stock_actual !== undefined && 
                 material.stock_minimo !== undefined && 
                 material.stock_actual < material.stock_minimo && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-1.5 rounded">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>Stock bajo</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Crear Material */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('jewelry.rawMaterials.addMaterial')}</DialogTitle>
            <DialogDescription>
              Selecciona un objeto 3D predefinido o crea uno personalizado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vista previa del objeto seleccionado */}
            {formData.object_3d_id && (
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/30 border-2 border-primary">
                  <Predefined3DViewer 
                    objectId={formData.object_3d_id}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Selector de categoría */}
            <div>
              <Label className="text-base font-semibold">{t('jewelry.rawMaterials.form.type')}</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value, object_3d_id: '' })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(PREDEFINED_3D_OBJECTS.map(obj => obj.category))].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de objetos 3D predefinidos */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Objetos 3D Disponibles
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[100px]">Vista 3D</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead className="w-[100px]">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPredefined3DObjectsByCategory(formData.categoria).map((obj) => (
                        <TableRow 
                          key={obj.id}
                          className={formData.object_3d_id === obj.id ? 'bg-primary/10' : ''}
                        >
                          <TableCell>
                            <div className="w-20 h-20 rounded border bg-gradient-to-br from-background to-muted/20">
                              <Predefined3DViewer 
                                objectId={obj.id}
                                className="w-full h-full"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{obj.name}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{obj.shape}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant={formData.object_3d_id === obj.id ? 'default' : 'outline'}
                              onClick={() => setFormData({ 
                                ...formData, 
                                object_3d_id: obj.id,
                                nombre: formData.nombre || obj.name
                              })}
                            >
                              {formData.object_3d_id === obj.id ? 'Seleccionado' : 'Seleccionar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Botón para agregar nuevo tipo */}
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Aquí se puede abrir un diálogo para agregar un nuevo tipo personalizado
                  toast.info('Funcionalidad de agregar tipo personalizado próximamente');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nuevo Tipo de Material
              </Button>
            </div>

            {/* Campos del formulario */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>{t('jewelry.rawMaterials.form.name')} *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder={t('jewelry.rawMaterials.form.namePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.rawMaterials.form.unit')} *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.unidad_medida}
                      onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map(unidad => (
                          <SelectItem key={unidad.id} value={unidad.nombre}>
                            {unidad.nombre} ({unidad.abreviatura})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowUnidadesDialog(true)}
                      title="Gestionar unidades de medida"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>{t('jewelry.rawMaterials.form.cost')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.costo_unitario_actual || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, costo_unitario_actual: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.rawMaterials.form.stock')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={formData.stock_actual || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, stock_actual: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>{t('jewelry.rawMaterials.form.minStock')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={formData.stock_minimo || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, stock_minimo: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>{t('jewelry.rawMaterials.form.supplier')}</Label>
                <Input
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  placeholder={t('jewelry.rawMaterials.form.supplierPlaceholder')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('jewelry.common.cancel')}
            </Button>
            <Button 
              type="button" 
              onClick={handleCreate}
              disabled={!formData.nombre || !formData.object_3d_id || !formData.unidad_medida}
            >
              {t('jewelry.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Material */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('jewelry.rawMaterials.editMaterial')}</DialogTitle>
            <DialogDescription>
              Modifica el objeto 3D y los datos del material
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vista previa del objeto seleccionado */}
            {formData.object_3d_id && (
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/30 border-2 border-primary">
                  <Predefined3DViewer 
                    objectId={formData.object_3d_id}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Selector de categoría */}
            <div>
              <Label className="text-base font-semibold">{t('jewelry.rawMaterials.form.type')}</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(PREDEFINED_3D_OBJECTS.map(obj => obj.category))].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de objetos 3D predefinidos */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Cambiar Objeto 3D
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[100px]">Vista 3D</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead className="w-[100px]">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPredefined3DObjectsByCategory(formData.categoria).map((obj) => (
                        <TableRow 
                          key={obj.id}
                          className={formData.object_3d_id === obj.id ? 'bg-primary/10' : ''}
                        >
                          <TableCell>
                            <div className="w-20 h-20 rounded border bg-gradient-to-br from-background to-muted/20">
                              <Predefined3DViewer 
                                objectId={obj.id}
                                className="w-full h-full"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{obj.name}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{obj.shape}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant={formData.object_3d_id === obj.id ? 'default' : 'outline'}
                              onClick={() => setFormData({ 
                                ...formData, 
                                object_3d_id: obj.id
                              })}
                            >
                              {formData.object_3d_id === obj.id ? 'Seleccionado' : 'Seleccionar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>{t('jewelry.rawMaterials.form.name')} *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.rawMaterials.form.unit')} *</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.unidad_medida}
                      onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map(unidad => (
                          <SelectItem key={unidad.id} value={unidad.nombre}>
                            {unidad.nombre} ({unidad.abreviatura})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setShowUnidadesDialog(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      {t('jewelry.rawMaterials.form.units')}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>{t('jewelry.rawMaterials.form.cost')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.costo_unitario_actual || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, costo_unitario_actual: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.rawMaterials.form.stock')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={formData.stock_actual || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, stock_actual: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>{t('jewelry.rawMaterials.form.minStock')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={formData.stock_minimo || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, stock_minimo: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>{t('jewelry.rawMaterials.form.supplier')}</Label>
                <Input
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('jewelry.common.cancel')}
            </Button>
            <Button 
              type="button" 
              onClick={handleEdit}
              disabled={!formData.nombre || !formData.object_3d_id || !formData.unidad_medida}
            >
              {t('jewelry.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Compra */}
      <Dialog open={showCompraDialog} onOpenChange={(open) => {
        setShowCompraDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent 
          className="max-w-2xl"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('jewelry.common.add')}</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.nombre} - {t('jewelry.rawMaterials.table.stock')}: {selectedMaterial?.stock_actual} {selectedMaterial?.unidad_medida}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('jewelry.production.form.quantity')} *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={compraData.cantidad || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setCompraData({ ...compraData, cantidad: value === '' ? 0 : parseFloat(value) });
                    }
                  }}
                />
              </div>
              <div>
                <Label>{t('jewelry.rawMaterials.form.cost')} *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={compraData.costo_unitario || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setCompraData({ ...compraData, costo_unitario: value === '' ? 0 : parseFloat(value) });
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label>{t('jewelry.common.total')}</Label>
              <Input
                value={formatearMonto(compraData.cantidad * compraData.costo_unitario)}
                disabled
              />
            </div>
            <div>
              <Label>{t('date')}</Label>
              <Input
                type="date"
                value={compraData.fecha_compra}
                onChange={(e) => setCompraData({ ...compraData, fecha_compra: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('jewelry.rawMaterials.form.supplier')}</Label>
              <Input
                value={compraData.proveedor}
                onChange={(e) => setCompraData({ ...compraData, proveedor: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('notes')}</Label>
              <Input
                value={compraData.notas}
                onChange={(e) => setCompraData({ ...compraData, notas: e.target.value })}
                placeholder={t('jewelry.production.form.notesPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCompraDialog(false)}>
              {t('jewelry.common.cancel')}
            </Button>
            <Button type="button" onClick={handleCompra}>{t('jewelry.common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Historial de Compras */}
      <Dialog open={showHistorialDialog} onOpenChange={setShowHistorialDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('jewelry.reports.title')}</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {historialCompras.map(compra => (
              <Card key={compra.id}>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('date')}:</span>
                      <p className="font-medium">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('jewelry.production.form.quantity')}:</span>
                      <p className="font-medium">{compra.cantidad}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('jewelry.rawMaterials.form.cost')}:</span>
                      <p className="font-medium">{formatearMonto(compra.costo_unitario)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('jewelry.common.total')}:</span>
                      <p className="font-bold">{formatearMonto(compra.costo_total || 0)}</p>
                    </div>
                    {compra.proveedor && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">{t('jewelry.rawMaterials.form.supplier')}:</span>
                        <p>{compra.proveedor}</p>
                      </div>
                    )}
                    {compra.notas && (
                      <div className="col-span-2 md:col-span-4">
                        <span className="text-muted-foreground">{t('notes')}:</span>
                        <p className="text-xs">{compra.notas}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {historialCompras.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('jewelry.common.noData')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jewelry.common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('jewelry.rawMaterials.confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDeletingId(null);
            }}>
              {t('jewelry.common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('jewelry.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Gestionar Unidades de Medida */}
      <UnidadesMedidaManager
        open={showUnidadesDialog}
        onOpenChange={setShowUnidadesDialog}
        unidades={unidadesMedida}
        onUnidadesChange={loadUnidadesMedida}
        businessId={businessId}
      />
    </div>
  );
}






































































