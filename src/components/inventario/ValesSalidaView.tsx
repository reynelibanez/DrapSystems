




import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/shared/DataTable';
import { TrendingDown, Plus, Trash2, Eye, Edit, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { baseUrl } from '@/lib/base-url';
import { format } from 'date-fns';

interface ValesSalidaViewProps {
  businessId?: string;
  onUpdate?: () => void;
}

interface ValeSalida {
  id: string;
  numero: string;
  fecha: string;
  almacen?: {
    id: string;
    almacen: string;
  };
  observaciones?: string;
  anulada: boolean;
  inventariada: boolean;
  usuario?: {
    id: string;
    full_name: string;
  };
  detalle?: DetalleItem[];
}

interface DetalleItem {
  id?: string;
  idproducto: string;
  cantidad: number;
  precio: number;
  producto?: {
    codigo: string;
    nombre: string;
    unidad: string;
  };
}

interface Almacen {
  id: string;
  almacen: string;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  precio: number;
  existencia: number;
}

export function ValesSalidaView({ businessId, onUpdate }: ValesSalidaViewProps) {
  const { t } = useTranslation();
  const [vales, setVales] = useState<ValeSalida[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedVale, setSelectedVale] = useState<ValeSalida | null>(null);
  const [valeToDelete, setValeToDelete] = useState<ValeSalida | null>(null);

  // Form state
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [idalmacen, setIdalmacen] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [inventariada, setInventariada] = useState(false);
  const [detalle, setDetalle] = useState<DetalleItem[]>([]);

  useEffect(() => {
    if (businessId) {
      loadVales();
      loadAlmacenes();
    }
  }, [businessId]);

  // Cargar productos cuando cambia el almacén
  useEffect(() => {
    if (idalmacen && !viewMode) {
      loadProductos(idalmacen);
    }
  }, [idalmacen, viewMode]);

  const loadVales = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/vales-salida?business_id=${businessId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVales(data);
      }
    } catch (error) {
      console.error('Error cargando vales:', error);
      toast.error('Error al cargar vales de salida');
    } finally {
      setLoading(false);
    }
  };

  const loadAlmacenes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/almacenes?business_id=${businessId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlmacenes(data || []);
      }
    } catch (error) {
      console.error('Error cargando almacenes:', error);
      toast.error('Error al cargar almacenes');
    }
  };

  // Cargar productos con existencias del almacén seleccionado
  const loadProductos = async (almacenId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión no válida');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/inventario/existencias?almacen_id=${almacenId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Productos cargados:', data);
        
        // Mapear los datos de existencias a la estructura de productos
        // La vista vw_existencias_inventario tiene: idproducto, codigo_producto, nombre_producto, unidad, existencia, costo
        const productosFormateados = data.map((item: any) => ({
          id: String(item.idproducto || ''),
          codigo: String(item.codigo_producto || ''),
          nombre: String(item.nombre_producto || ''),
          unidad: String(item.unidad || ''),
          precio: Number(item.costo) || 0,
          existencia: Number(item.existencia) || 0
        }));
        
        console.log('Productos formateados:', productosFormateados);
        setProductos(productosFormateados);
      } else {
        console.error('Error al cargar productos');
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    }
  };

  const handleNew = () => {
    resetForm();
    setEditMode(false);
    setViewMode(false);
    setDialogOpen(true);
  };

  const handleView = async (vale: ValeSalida) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/vales-salida/${vale.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedVale(data);
        setNumero(data.numero || '');
        setFecha(data.fecha || format(new Date(), 'yyyy-MM-dd'));
        setIdalmacen(data.idalmacen || '');
        setObservaciones(data.observaciones || '');
        setInventariada(data.inventariada || false);
        setDetalle(data.detalle || []);
        setViewMode(true);
        setEditMode(false);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error cargando vale:', error);
      toast.error('Error al cargar vale de salida');
    }
  };

  const handleEdit = async (vale: ValeSalida) => {
    // No permitir editar si ya está inventariada
    if (vale.inventariada) {
      toast.error('No se puede editar un vale que ya ha sido inventariado');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/vales-salida/${vale.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedVale(data);
        setNumero(data.numero || '');
        setFecha(data.fecha || format(new Date(), 'yyyy-MM-dd'));
        setIdalmacen(data.idalmacen || '');
        setObservaciones(data.observaciones || '');
        setInventariada(data.inventariada || false);
        setDetalle(data.detalle || []);
        setEditMode(true);
        setViewMode(false);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error cargando vale:', error);
      toast.error('Error al cargar vale de salida');
    }
  };

  const confirmDelete = (vale: ValeSalida) => {
    // No permitir eliminar si ya está inventariada
    if (vale.inventariada) {
      toast.error('No se puede eliminar un vale que ya ha sido inventariado');
      return;
    }
    
    setValeToDelete(vale);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!valeToDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/vales-salida/${valeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Vale de salida eliminado correctamente');
        setDeleteDialogOpen(false);
        setValeToDelete(null);
        setDialogOpen(false);
        loadVales();
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar vale de salida');
      }
    } catch (error) {
      console.error('Error eliminando vale:', error);
      toast.error('Error al eliminar vale de salida');
    }
  };

  const handleSave = async () => {
    if (!idalmacen || detalle.length === 0) {
      toast.error('Complete todos los campos requeridos y agregue al menos un producto');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const valeData = {
        business_id: businessId,
        fecha,
        idalmacen,
        observaciones,
        inventariada,
        detalle
      };

      const url = editMode && selectedVale
        ? `${baseUrl}/api/inventario/vales-salida/${selectedVale.id}`
        : `${baseUrl}/api/inventario/vales-salida`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(valeData)
      });

      if (response.ok) {
        toast.success(editMode ? 'Vale actualizado correctamente' : 'Vale creado correctamente');
        setDialogOpen(false);
        resetForm();
        loadVales();
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar vale');
      }
    } catch (error) {
      console.error('Error guardando vale:', error);
      toast.error('Error al guardar vale de salida');
    }
  };

  const handlePrint = () => {
    toast.info('Función de impresión en desarrollo');
  };

  const resetForm = () => {
    setNumero('');
    setFecha(format(new Date(), 'yyyy-MM-dd'));
    setIdalmacen('');
    setObservaciones('');
    setInventariada(false);
    setDetalle([]);
    setSelectedVale(null);
    setProductos([]);
  };

  const addDetalleItem = () => {
    setDetalle([...detalle, {
      idproducto: '',
      cantidad: 0,
      precio: 0
    }]);
  };

  const removeDetalleItem = (index: number) => {
    const newDetalle = detalle.filter((_, i) => i !== index);
    setDetalle(newDetalle);
  };

  const updateDetalleItem = (index: number, field: keyof DetalleItem, value: any) => {
    const newDetalle = [...detalle];
    
    // Si cambia el producto, validar que no esté duplicado
    if (field === 'idproducto') {
      const productoYaExiste = detalle.some((item, i) => i !== index && item.idproducto === value);
      if (productoYaExiste) {
        toast.error('Este producto ya está agregado en el vale');
        return;
      }
      
      const producto = productos.find(p => p.id === value);
      console.log('Producto seleccionado:', producto);
      if (producto) {
        newDetalle[index].precio = producto.precio || 0;
        newDetalle[index].idproducto = value;
        console.log('Precio asignado:', producto.precio);
      }
    } else if (field === 'cantidad') {
      // Validar que la cantidad no exceda la existencia
      const producto = productos.find(p => p.id === newDetalle[index].idproducto);
      if (producto && value > producto.existencia) {
        toast.error(`La cantidad no puede ser mayor a la existencia disponible (${producto.existencia})`);
        return;
      }
      newDetalle[index][field] = value;
    } else {
      newDetalle[index] = { ...newDetalle[index], [field]: value };
    }
    
    setDetalle(newDetalle);
  };

  const columns = [
    {
      key: 'numero',
      label: 'Número',
      sortable: true
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (item: ValeSalida) => {
        try {
          return item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy') : '-';
        } catch {
          return '-';
        }
      }
    },
    {
      key: 'almacen',
      label: 'Almacén',
      render: (item: ValeSalida) => item.almacen?.almacen || '-'
    },
    {
      key: 'anulada',
      label: 'Estado',
      render: (item: ValeSalida) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.anulada ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {item.anulada ? 'Anulado' : 'Activo'}
          </span>
          {item.inventariada && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Inventariado
            </span>
          )}
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: Eye,
      onClick: handleView
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: handleEdit,
      condition: (item: ValeSalida) => !item.anulada && !item.inventariada
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: confirmDelete,
      variant: 'destructive' as const,
      condition: (item: ValeSalida) => !item.anulada && !item.inventariada
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Vales de Salida</CardTitle>
                <CardDescription>Gestión de salidas de inventario</CardDescription>
              </div>
            </div>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Vale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vales}
            columns={columns}
            actions={actions}
            searchable
            searchPlaceholder="Buscar vales..."
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Dialog para crear/editar/ver */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? 'Ver Vale de Salida' : editMode ? 'Editar Vale de Salida' : 'Nuevo Vale de Salida'}
            </DialogTitle>
            <DialogDescription>
              {viewMode ? 'Detalles del vale de salida' : 'Complete la información del vale de salida'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewMode && (
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={numero}
                    disabled
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  disabled={viewMode}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="almacen">Almacén *</Label>
                <Select 
                  value={idalmacen} 
                  onValueChange={(value) => {
                    setIdalmacen(value);
                    // Limpiar detalle cuando cambia el almacén
                    if (!viewMode) {
                      setDetalle([]);
                    }
                  }} 
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {almacenes.map((almacen) => (
                      <SelectItem key={almacen.id} value={almacen.id}>
                        {almacen.almacen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={viewMode}
                placeholder="Observaciones adicionales"
                rows={3}
              />
            </div>

            {/* Checkbox para marcar como inventariada */}
            {!viewMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventariada"
                  checked={inventariada}
                  onCheckedChange={(checked) => setInventariada(checked as boolean)}
                />
                <Label
                  htmlFor="inventariada"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Marcar como inventariada (esto rebajará las existencias del almacén)
                </Label>
              </div>
            )}

            {viewMode && inventariada && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  ✓ Este vale ha sido inventariado
                </span>
              </div>
            )}

            {/* Detalle de productos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Productos *</Label>
                {!viewMode && idalmacen && (
                  <Button type="button" variant="outline" size="sm" onClick={addDetalleItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                )}
              </div>

              {!idalmacen && !viewMode && (
                <p className="text-sm text-muted-foreground">
                  Seleccione un almacén para agregar productos
                </p>
              )}

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium">Producto</th>
                      <th className="text-left p-2 text-sm font-medium">Existencia</th>
                      <th className="text-left p-2 text-sm font-medium">Cantidad</th>
                      <th className="text-left p-2 text-sm font-medium">Precio Unit.</th>
                      <th className="text-left p-2 text-sm font-medium">Subtotal</th>
                      {!viewMode && <th className="text-left p-2 text-sm font-medium w-20">Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.length === 0 ? (
                      <tr>
                        <td colSpan={viewMode ? 5 : 6} className="text-center p-4 text-muted-foreground">
                          No hay productos agregados
                        </td>
                      </tr>
                    ) : (
                      detalle.map((item, index) => {
                        const producto = productos.find(p => p.id === item.idproducto);
                        return (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              {viewMode ? (
                                <span>{item.producto?.nombre || '-'}</span>
                              ) : (
                                <Select
                                  value={item.idproducto || ''}
                                  onValueChange={(value) => updateDetalleItem(index, 'idproducto', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione producto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productos.map((producto) => (
                                      <SelectItem key={producto.id} value={producto.id}>
                                        {producto.codigo} - {producto.nombre} (Stock: {producto.existencia})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                            <td className="p-2">
                              <span className="text-sm font-medium">
                                {producto?.existencia || 0}
                              </span>
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => updateDetalleItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                disabled={viewMode}
                                min="0"
                                max={producto?.existencia || 0}
                                step="0.01"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={item.precio}
                                onChange={(e) => updateDetalleItem(index, 'precio', parseFloat(e.target.value) || 0)}
                                disabled={viewMode}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2">
                              <span className="font-medium">
                                ${(item.cantidad * item.precio).toFixed(2)}
                              </span>
                            </td>
                            {!viewMode && (
                              <td className="p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDetalleItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {detalle.length > 0 && (
                    <tfoot className="bg-muted font-medium">
                      <tr>
                        <td colSpan={4} className="text-right p-2">Total:</td>
                        <td className="p-2">
                          ${detalle.reduce((sum, item) => sum + (item.cantidad * item.precio), 0).toFixed(2)}
                        </td>
                        {!viewMode && <td></td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {viewMode && selectedVale && !selectedVale.anulada && (
              <Button variant="destructive" onClick={() => confirmDelete(selectedVale)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            {viewMode && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {viewMode ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!viewMode && (
              <Button onClick={handleSave}>
                {editMode ? 'Actualizar' : 'Guardar'} Vale
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el vale de salida {valeToDelete?.numero}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Vale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}






















