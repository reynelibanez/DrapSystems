





import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Save, Eye, RefreshCw, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { Material3DViewer } from './Material3DViewer';
import { Material3DPreview } from './Material3DPreview';
import { useAuth } from '../AuthProvider';
import type { JwlCatalogoMaterial, JwlCatalogoMaterialInsert, JwlForma3D } from '../../lib/types/jewelry.types';
import {
  getCatalogoMateriales,
  createCatalogoMaterial,
  updateCatalogoMaterial,
  deleteCatalogoMaterial,
  initializeMaterialCatalog
} from '../../lib/api/jewelry';

const CATEGORIES = [
  'Metales Preciosos',
  'Metales Comunes',
  'Aleaciones',
  'Piedras Preciosas',
  'Piedras Semi-Preciosas',
  'Materiales Orgánicos',
  'Materiales Sintéticos',
  'Broches y Cierres',
  'Vidrios y Cristales',
  'Colores',
  'Acabados',
  'Efectos Especiales',
  'Formas',
  'Tamaños'
];

const SHAPES: Array<{ value: JwlForma3D; label: string }> = [
  { value: 'box', label: 'Lingote' },
  { value: 'cone', label: 'Diamante' }
];

export function MaterialKeywordsManager() {
  const { user, profile } = useAuth();
  const [catalog, setCatalog] = useState<JwlCatalogoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<JwlCatalogoMaterial | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<JwlCatalogoMaterialInsert>>({
    nombre: '',
    categoria: 'Metales Preciosos',
    palabras_clave: [],
    color: '#FFD700',
    forma: 'box',
    metalness: 0.5,
    roughness: 0.5,
    transparente: false,
    transmission: 0.8,
    intensidad_emisiva: 0.1
  });
  const [newKeyword, setNewKeyword] = useState('');

  // Cargar catálogo
  useEffect(() => {
    loadCatalog();
  }, [profile]);

  const loadCatalog = async () => {
    const businessId = profile?.business_id;
    if (!businessId) {
      console.log('No business_id found in profile');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading catalog for business:', businessId);
      const data = await getCatalogoMateriales(businessId);
      console.log('Catalog loaded:', data.length, 'materials');
      setCatalog(data);
    } catch (error) {
      console.error('Error loading catalog:', error);
      toast.error('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar catálogo con datos base
  const handleInitializeCatalog = async () => {
    const businessId = profile?.business_id;
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }
    
    try {
      console.log('Initializing catalog for business:', businessId);
      await initializeMaterialCatalog(businessId);
      toast.success('Catálogo inicializado con materiales base');
      await loadCatalog();
    } catch (error) {
      console.error('Error initializing catalog:', error);
      toast.error('Error al inicializar el catálogo');
    }
  };

  // Agregar keyword
  const addKeyword = () => {
    if (newKeyword.trim() && formData.palabras_clave) {
      setFormData({
        ...formData,
        palabras_clave: [...formData.palabras_clave, newKeyword.trim().toLowerCase()]
      });
      setNewKeyword('');
    }
  };

  // Eliminar keyword
  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      palabras_clave: formData.palabras_clave?.filter(k => k !== keyword) || []
    });
  };

  // Guardar material
  const handleSaveMaterial = async () => {
    const businessId = profile?.business_id;
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }
    
    if (!formData.nombre?.trim()) {
      toast.error('Debes ingresar un nombre para el material');
      return;
    }
    if (!formData.palabras_clave || formData.palabras_clave.length === 0) {
      toast.error('Debes agregar al menos una palabra clave');
      return;
    }

    try {
      const materialData: JwlCatalogoMaterialInsert = {
        business_id: businessId,
        nombre: formData.nombre,
        categoria: formData.categoria || 'Metales Preciosos',
        palabras_clave: formData.palabras_clave,
        color: formData.color || '#FFD700',
        color_secundario: formData.color_secundario,
        forma: formData.forma || 'box',
        metalness: formData.metalness || 0.5,
        roughness: formData.roughness || 0.5,
        transparente: formData.transparente || false,
        transmission: formData.transmission,
        color_emisivo: formData.color_emisivo,
        intensidad_emisiva: formData.intensidad_emisiva
      };

      if (editingMaterial) {
        await updateCatalogoMaterial(editingMaterial.id, materialData);
        toast.success('Material actualizado correctamente');
      } else {
        await createCatalogoMaterial(materialData);
        toast.success('Material agregado al catálogo');
      }

      setShowAddDialog(false);
      resetForm();
      await loadCatalog();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Error al guardar el material');
    }
  };

  // Eliminar material
  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteCatalogoMaterial(id);
      toast.success('Material eliminado del catálogo');
      await loadCatalog();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error al eliminar el material');
    }
  };

  // Editar material
  const handleEditMaterial = (material: JwlCatalogoMaterial) => {
    setEditingMaterial(material);
    setFormData({
      nombre: material.nombre,
      categoria: material.categoria,
      palabras_clave: material.palabras_clave,
      color: material.color,
      color_secundario: material.color_secundario,
      forma: material.forma,
      metalness: material.metalness,
      roughness: material.roughness,
      transparente: material.transparente,
      transmission: material.transmission,
      color_emisivo: material.color_emisivo,
      intensidad_emisiva: material.intensidad_emisiva
    });
    setShowAddDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      nombre: '',
      categoria: 'Metales Preciosos',
      palabras_clave: [],
      color: '#FFD700',
      forma: 'box',
      metalness: 0.5,
      roughness: 0.5,
      transparente: false,
      transmission: 0.8,
      intensidad_emisiva: 0.1
    });
    setNewKeyword('');
  };

  // Exportar catálogo
  const exportCatalog = () => {
    const dataStr = JSON.stringify(catalog, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'material-catalog.json';
    link.click();
    toast.success('Catálogo exportado');
  };

  // Agrupar materiales por categoría
  const groupedMaterials = catalog.reduce((acc, material) => {
    if (!acc[material.categoria]) {
      acc[material.categoria] = [];
    }
    acc[material.categoria].push(material);
    return acc;
  }, {} as Record<string, JwlCatalogoMaterial[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo de Materiales IA</CardTitle>
              <CardDescription>
                Gestiona los materiales que el sistema de IA usa para generar modelos 3D
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {catalog.length === 0 && (
                <Button onClick={handleInitializeCatalog} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cargar Catálogo Base
                </Button>
              )}
              <Button onClick={exportCatalog} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={showAddDialog} onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMaterial ? 'Editar Material' : 'Agregar Nuevo Material'}
                    </DialogTitle>
                    <DialogDescription>
                      Define las palabras clave y propiedades 3D del material
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Nombre del Material */}
                    <div className="space-y-2">
                      <Label>Nombre del Material</Label>
                      <Input
                        placeholder="Ej: Platino, Topacio, Madera"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Palabras Clave */}
                    <div className="space-y-2">
                      <Label>Palabras Clave</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: platino, platinum, pt"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button onClick={addKeyword} type="button">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.palabras_clave?.map(keyword => (
                          <Badge key={keyword} variant="secondary" className="gap-1">
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Tabs defaultValue="appearance" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                        <TabsTrigger value="material">Material</TabsTrigger>
                        <TabsTrigger value="effects">Efectos</TabsTrigger>
                      </TabsList>

                      <TabsContent value="appearance" className="space-y-4">
                        {/* Forma */}
                        <div className="space-y-2">
                          <Label>Forma 3D</Label>
                          <Select
                            value={formData.forma}
                            onValueChange={(value: JwlForma3D) => setFormData({ ...formData, forma: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SHAPES.map(shape => (
                                <SelectItem key={shape.value} value={shape.value}>
                                  {shape.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Color Principal */}
                        <div className="space-y-2">
                          <Label>Color Principal</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              placeholder="#FFD700"
                            />
                          </div>
                        </div>

                        {/* Color Secundario */}
                        <div className="space-y-2">
                          <Label>Color Secundario (Opcional)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.color_secundario || '#FFFFFF'}
                              onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={formData.color_secundario || ''}
                              onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                              placeholder="#FFA500"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="material" className="space-y-4">
                        {/* Metalness */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Metalness (Brillo Metálico)</Label>
                            <span className="text-sm text-muted-foreground">
                              {formData.metalness?.toFixed(2)}
                            </span>
                          </div>
                          <Slider
                            value={[formData.metalness || 0.5]}
                            onValueChange={([value]) => setFormData({ ...formData, metalness: value })}
                            min={0}
                            max={1}
                            step={0.01}
                          />
                        </div>

                        {/* Roughness */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Roughness (Rugosidad)</Label>
                            <span className="text-sm text-muted-foreground">
                              {formData.roughness?.toFixed(2)}
                            </span>
                          </div>
                          <Slider
                            value={[formData.roughness || 0.5]}
                            onValueChange={([value]) => setFormData({ ...formData, roughness: value })}
                            min={0}
                            max={1}
                            step={0.01}
                          />
                        </div>

                        {/* Transparencia */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Transparente</Label>
                            <Switch
                              checked={formData.transparente || false}
                              onCheckedChange={(checked) => setFormData({ ...formData, transparente: checked })}
                            />
                          </div>
                        </div>

                        {/* Transmission */}
                        {formData.transparente && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Nivel de Transparencia</Label>
                              <span className="text-sm text-muted-foreground">
                                {formData.transmission?.toFixed(2) || '0.80'}
                              </span>
                            </div>
                            <Slider
                              value={[formData.transmission || 0.8]}
                              onValueChange={([value]) => setFormData({ ...formData, transmission: value })}
                              min={0}
                              max={1}
                              step={0.01}
                            />
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="effects" className="space-y-4">
                        {/* Color Emisivo */}
                        <div className="space-y-2">
                          <Label>Color Emisivo (Brillo Interno)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.color_emisivo || '#FFFFFF'}
                              onChange={(e) => setFormData({ ...formData, color_emisivo: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={formData.color_emisivo || ''}
                              onChange={(e) => setFormData({ ...formData, color_emisivo: e.target.value })}
                              placeholder="#FFD700"
                            />
                          </div>
                        </div>

                        {/* Intensidad Emisiva */}
                        {formData.color_emisivo && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Intensidad de Brillo</Label>
                              <span className="text-sm text-muted-foreground">
                                {formData.intensidad_emisiva?.toFixed(2) || '0.10'}
                              </span>
                            </div>
                            <Slider
                              value={[formData.intensidad_emisiva || 0.1]}
                              onValueChange={([value]) => setFormData({ ...formData, intensidad_emisiva: value })}
                              min={0}
                              max={1}
                              step={0.01}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label>Vista Previa 3D</Label>
                      <div className="w-full h-64 rounded-lg bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                        <Material3DPreview
                          nombre={formData.nombre || 'Preview'}
                          categoria={formData.categoria || 'Metales Preciosos'}
                          color={formData.color || '#FFD700'}
                          colorSecundario={formData.color_secundario}
                          forma={formData.forma || 'box'}
                          metalness={formData.metalness || 0.5}
                          roughness={formData.roughness || 0.5}
                          transparente={formData.transparente || false}
                          transmission={formData.transmission}
                          colorEmisivo={formData.color_emisivo}
                          intensidadEmisiva={formData.intensidad_emisiva}
                          autoRotate={true}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowAddDialog(false);
                        resetForm();
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveMaterial}>
                        <Save className="h-4 w-4 mr-2" />
                        {editingMaterial ? 'Actualizar' : 'Guardar'} Material
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {catalog.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay materiales en el catálogo
              </p>
              <Button onClick={handleInitializeCatalog}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Cargar Catálogo Base
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{catalog.length}</div>
                    <p className="text-xs text-muted-foreground">Total Materiales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{Object.keys(groupedMaterials).length}</div>
                    <p className="text-xs text-muted-foreground">Categorías</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {catalog.reduce((sum, m) => sum + m.palabras_clave.length, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Palabras Clave</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {catalog.filter(m => m.transparente).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Transparentes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Materiales por Categoría */}
              <Tabs defaultValue={Object.keys(groupedMaterials)[0]} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                  {Object.keys(groupedMaterials).map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category} ({groupedMaterials[category].length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(groupedMaterials).map(([category, materials]) => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {materials.map((material) => (
                        <Card key={material.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{material.nombre}</CardTitle>
                                <CardDescription>{material.categoria}</CardDescription>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMaterial(material)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteMaterial(material.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Keywords */}
                            <div>
                              <p className="text-sm font-medium mb-2">Palabras Clave:</p>
                              <div className="flex flex-wrap gap-1">
                                {material.palabras_clave.map(keyword => (
                                  <Badge key={keyword} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Propiedades */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Color:</p>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: material.color }}
                                  />
                                  <span className="text-xs">{material.color}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Forma:</p>
                                <p className="font-medium capitalize">{material.forma}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Metalness:</p>
                                <p className="font-medium">{material.metalness.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Roughness:</p>
                                <p className="font-medium">{material.roughness.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Efectos */}
                            <div className="flex gap-2">
                              {material.transparente && (
                                <Badge variant="outline" className="text-xs">
                                  Transparente
                                </Badge>
                              )}
                              {material.color_emisivo && (
                                <Badge variant="outline" className="text-xs">
                                  Emisivo
                                </Badge>
                              )}
                            </div>

                            {/* Preview Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Preview 3D
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{material.nombre}</DialogTitle>
                                </DialogHeader>
                                <div className="w-full h-96 rounded-lg bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                                  <Material3DViewer
                                    key={`dialog-${material.id}-${Date.now()}`}
                                    categoria={material.categoria}
                                    materialName={material.nombre}
                                    autoRotate={true}
                                    className="w-full h-full"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}












