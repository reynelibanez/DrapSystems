import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad: string | null;
  categoria_id: string | null;
  marca_id: string | null;
  modelo: string | null;
  stock_minimo: number;
  stock_maximo: number;
  costo: number;
  precio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface Catalogo {
  id: string;
  tipo: string;
  nombre: string;
}

interface ProductosViewProps {
  businessId?: string;
  onUpdate?: () => void;
}

export function ProductosView({ businessId, onUpdate }: ProductosViewProps) {
  const { t } = useTranslation();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Catalogo[]>([]);
  const [marcas, setMarcas] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad: 'UND',
    categoria_id: '',
    marca_id: '',
    modelo: '',
    stock_minimo: 0,
    stock_maximo: 0,
    costo: 0,
    precio: 0,
    activo: true
  });

  useEffect(() => {
    loadProductos();
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      const { data: categoriasData } = await supabase
        .from('ng_catalogos_inventario')
        .select('*')
        .eq('business_id', businessId)
        .eq('tipo', 'categoria')
        .order('nombre');

      const { data: marcasData } = await supabase
        .from('ng_catalogos_inventario')
        .select('*')
        .eq('business_id', businessId)
        .eq('tipo', 'marca')
        .order('nombre');

      setCategorias(categoriasData || []);
      setMarcas(marcasData || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadProductos = async () => {
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ng_productos_inventario')
        .select('*')
        .eq('business_id', businessId)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error(t('inventario.productos.errorCargar', 'Error al cargar productos'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        unidad: producto.unidad || 'UND',
        categoria_id: producto.categoria_id || '',
        marca_id: producto.marca_id || '',
        modelo: producto.modelo || '',
        stock_minimo: producto.stock_minimo,
        stock_maximo: producto.stock_maximo,
        costo: producto.costo,
        precio: producto.precio,
        activo: producto.activo
      });
    } else {
      setEditingProducto(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        unidad: 'UND',
        categoria_id: '',
        marca_id: '',
        modelo: '',
        stock_minimo: 0,
        stock_maximo: 0,
        costo: 0,
        precio: 0,
        activo: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.codigo.trim() || !formData.nombre.trim()) {
        toast.error(t('inventario.productos.camposRequeridos', 'Código y nombre son requeridos'));
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (editingProducto) {
        // Actualizar
        const { error } = await supabase
          .from('ng_productos_inventario')
          .update({
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            unidad: formData.unidad,
            categoria_id: formData.categoria_id || null,
            marca_id: formData.marca_id || null,
            modelo: formData.modelo || null,
            stock_minimo: formData.stock_minimo,
            stock_maximo: formData.stock_maximo,
            costo: formData.costo,
            precio: formData.precio,
            activo: formData.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProducto.id);

        if (error) throw error;
        toast.success(t('inventario.productos.actualizado', 'Producto actualizado correctamente'));
      } else {
        // Crear
        if (!businessId) {
          toast.error('No se encontró el ID del negocio');
          return;
        }

        const { error } = await supabase
          .from('ng_productos_inventario')
          .insert({
            business_id: businessId,
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            unidad: formData.unidad,
            categoria_id: formData.categoria_id || null,
            marca_id: formData.marca_id || null,
            modelo: formData.modelo || null,
            stock_minimo: formData.stock_minimo,
            stock_maximo: formData.stock_maximo,
            costo: formData.costo,
            precio: formData.precio,
            activo: formData.activo
          });

        if (error) throw error;
        toast.success(t('inventario.productos.creado', 'Producto creado correctamente'));
      }

      setDialogOpen(false);
      loadProductos();
      onUpdate?.();
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast.error(t('inventario.productos.errorGuardar', 'Error al guardar el producto'));
    }
  };

  const handleDelete = async () => {
    if (!productoToDelete) return;

    try {
      // Verificar si hay existencias
      const { data: existencias } = await supabase
        .from('il_existencias_inventario')
        .select('id')
        .eq('idproducto', productoToDelete.id)
        .limit(1);

      if (existencias && existencias.length > 0) {
        toast.error(t('inventario.productos.tieneExistencias', 'No se puede eliminar el producto porque tiene existencias registradas'));
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('ng_productos_inventario')
        .delete()
        .eq('id', productoToDelete.id);

      if (error) throw error;

      toast.success(t('inventario.productos.eliminado', 'Producto eliminado correctamente'));
      setDeleteDialogOpen(false);
      setProductoToDelete(null);
      loadProductos();
      onUpdate?.();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error(t('inventario.productos.errorEliminar', 'Error al eliminar el producto'));
    }
  };

  const columns = [
    {
      key: 'codigo',
      label: t('inventario.productos.codigo', 'Código'),
      sortable: true
    },
    {
      key: 'nombre',
      label: t('inventario.productos.nombre', 'Nombre'),
      sortable: true
    },
    {
      key: 'unidad',
      label: t('inventario.productos.unidad', 'Unidad'),
      render: (producto: Producto) => <span>{producto.unidad || '-'}</span>
    },
    {
      key: 'precio',
      label: t('inventario.productos.precioVenta', 'Precio Venta'),
      render: (producto: Producto) => (
        <span className="font-medium">
          ${producto.precio.toLocaleString('es-CL')}
        </span>
      )
    },
    {
      key: 'activo',
      label: t('inventario.productos.estado', 'Estado'),
      render: (producto: Producto) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {producto.activo ? t('common.active', 'Activo') : t('common.inactive', 'Inactivo')}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('common.actions', 'Acciones'),
      render: (producto: Producto) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(producto)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProductoToDelete(producto);
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
                <Package className="h-5 w-5" />
                {t('inventario.productos.title', 'Gestión de Productos')}
              </CardTitle>
              <CardDescription>
                {t('inventario.productos.description', 'Administra el catálogo de productos')}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventario.productos.nuevo', 'Nuevo Producto')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={productos}
            columns={columns}
            loading={loading}
            searchable
            searchPlaceholder={t('inventario.productos.buscar', 'Buscar producto...')}
          />
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProducto 
                ? t('inventario.productos.editar', 'Editar Producto')
                : t('inventario.productos.crear', 'Crear Producto')}
            </DialogTitle>
            <DialogDescription>
              {t('inventario.productos.dialogDescription', 'Ingresa los datos del producto')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                {t('inventario.productos.codigo', 'Código')} *
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="PRD-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">
                {t('inventario.productos.nombre', 'Nombre')} *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">
                {t('inventario.productos.descripcion', 'Descripción')}
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidad">
                {t('inventario.productos.unidad', 'Unidad')}
              </Label>
              <Select
                value={formData.unidad}
                onValueChange={(value) => setFormData({ ...formData, unidad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UND">Unidad</SelectItem>
                  <SelectItem value="KG">Kilogramo</SelectItem>
                  <SelectItem value="LT">Litro</SelectItem>
                  <SelectItem value="MT">Metro</SelectItem>
                  <SelectItem value="CJ">Caja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">
                {t('inventario.productos.categoria', 'Categoría')}
              </Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">
                {t('inventario.productos.marca', 'Marca')}
              </Label>
              <Select
                value={formData.marca_id}
                onValueChange={(value) => setFormData({ ...formData, marca_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">
                {t('inventario.productos.modelo', 'Modelo')}
              </Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Modelo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_minimo">
                {t('inventario.productos.stockMinimo', 'Stock Mínimo')}
              </Label>
              <Input
                id="stock_minimo"
                type="number"
                min="0"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_maximo">
                {t('inventario.productos.stockMaximo', 'Stock Máximo')}
              </Label>
              <Input
                id="stock_maximo"
                type="number"
                min="0"
                value={formData.stock_maximo}
                onChange={(e) => setFormData({ ...formData, stock_maximo: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">
                {t('inventario.productos.precioCompra', 'Precio Compra')}
              </Label>
              <Input
                id="costo"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">
                {t('inventario.productos.precioVenta', 'Precio Venta')}
              </Label>
              <Input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
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
        title={t('inventario.productos.confirmarEliminar', 'Confirmar Eliminación')}
        description={t('inventario.productos.confirmarEliminarDesc', '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')}
      />
    </>
  );
}








