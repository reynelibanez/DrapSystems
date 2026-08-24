import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Search, Eye, Trash2, Package, Lock, Unlock, FileText, Edit, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { baseUrl } from '@/lib/base-url';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RecepcionesViewProps {
  businessId: string;
  onUpdate?: () => void;
}

interface Recepcion {
  id: string;
  numero: string;
  fecha: string;
  idalmacen: string;
  observaciones: string | null;
  anulada: boolean;
  inventariada: boolean;
  almacen?: { almacen: string };
  usuario?: { full_name: string };
  created_at: string;
}

interface DetalleItem {
  id?: string;
  idproducto: string;
  cantidad: number;
  costo: number;
  producto?: {
    codigo: string;
    nombre: string;
    unidad: string;
  };
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  costo: number;
}

interface Almacen {
  id: string;
  almacen: string;
}

export function RecepcionesView({ businessId, onUpdate }: RecepcionesViewProps) {
  const { t } = useTranslation();
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [detalle, setDetalle] = useState<DetalleItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recepcionToDelete, setRecepcionToDelete] = useState<Recepcion | null>(null);
  
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    idalmacen: '',
    observaciones: '',
    inventariada: false
  });

  useEffect(() => {
    loadRecepciones();
    loadProductos();
    loadAlmacenes();
  }, [businessId]);

  const loadRecepciones = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/recepciones`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        setRecepciones(result.data || []);
      } else {
        console.error('Error loading recepciones:', result);
        toast.error(result.error || 'Error al cargar recepciones');
      }
    } catch (error) {
      console.error('Error cargando recepciones:', error);
      toast.error('Error al cargar recepciones');
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('ng_productos_inventario')
        .select('id, codigo, producto, costo, precio')
        .eq('business_id', businessId)
        .eq('activo', true)
        .order('producto');

      if (error) throw error;
      
      // Mapear a la estructura esperada
      const productosFormateados = (data || []).map(p => {
        // Usar costo si existe, sino usar precio
        const costoFinal = p.costo || p.precio || 0;
        
        return {
          id: p.id,
          codigo: p.codigo || '',
          nombre: p.producto,
          unidad: '',
          costo: costoFinal
        };
      });
      
      setProductos(productosFormateados);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadAlmacenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ng_almacen_inventario')
        .select('id, almacen')
        .eq('business_id', businessId)
        .eq('abierto', true)
        .order('almacen');

      if (error) throw error;
      setAlmacenes(data || []);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
    }
  };

  const handleNew = () => {
    setSelectedRecepcion(null);
    setViewMode(false);
    setEditMode(false);
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      idalmacen: '',
      observaciones: '',
      inventariada: false
    });
    setDetalle([]);
    setDialogOpen(true);
  };

  const handleEdit = async (recepcion: Recepcion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/recepciones/${recepcion.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setSelectedRecepcion(data);
        setFormData({
          fecha: data.fecha,
          idalmacen: data.idalmacen,
          observaciones: data.observaciones || '',
          inventariada: data.inventariada || false
        });
        setDetalle(data.detalle || []);
        setViewMode(false);
        setEditMode(true);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error cargando recepción:', error);
      toast.error('Error al cargar recepción');
    }
  };

  const handleView = async (recepcion: Recepcion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/recepciones/${recepcion.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setSelectedRecepcion(data);
        setFormData({
          fecha: data.fecha,
          idalmacen: data.idalmacen,
          observaciones: data.observaciones || '',
          inventariada: data.inventariada || false
        });
        setDetalle(data.detalle || []);
        setViewMode(true);
        setEditMode(false);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error cargando recepción:', error);
      toast.error('Error al cargar recepción');
    }
  };

  const handlePrint = () => {
    if (!selectedRecepcion) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const almacenNombre = almacenes.find(a => a.id === formData.idalmacen)?.almacen || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recepción ${selectedRecepcion.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .header { margin-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Recepción de Inventario</h1>
          <div class="header">
            <div class="info">
              <div><strong>Número:</strong> ${selectedRecepcion.numero}</div>
              <div><strong>Fecha:</strong> ${format(new Date(formData.fecha), 'dd/MM/yyyy')}</div>
            </div>
            <div class="info">
              <div><strong>Almacén:</strong> ${almacenNombre}</div>
              <div><strong>Estado:</strong> ${formData.inventariada ? 'Inventariada' : 'Pendiente'}</div>
            </div>
            ${formData.observaciones ? `<div><strong>Observaciones:</strong> ${formData.observaciones}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${detalle.map(item => `
                <tr>
                  <td>${item.producto?.codigo || ''}</td>
                  <td>${item.producto?.nombre || ''}</td>
                  <td>${item.cantidad}</td>
                  <td>$${item.costo.toFixed(2)}</td>
                  <td>$${(item.cantidad * item.costo).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total: $${detalle.reduce((sum, item) => sum + (item.cantidad * item.costo), 0).toFixed(2)}
          </div>
          
          <div style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Imprimir
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Cerrar
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleToggleInventariada = async (recepcion: Recepcion) => {
    const nuevoEstado = !recepcion.inventariada;
    const mensaje = nuevoEstado 
      ? '¿Está seguro de marcar esta recepción como inventariada? No podrá modificarla después.'
      : '¿Está seguro de desbloquear esta recepción?';
    
    if (!confirm(mensaje)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${baseUrl}/api/inventario/recepciones/${recepcion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ inventariada: nuevoEstado })
      });

      if (response.ok) {
        toast.success(nuevoEstado ? 'Recepción inventariada correctamente' : 'Recepción desbloqueada correctamente');
        loadRecepciones();
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar recepción');
      }
    } catch (error) {
      console.error('Error actualizando recepción:', error);
      toast.error('Error al actualizar recepción');
    }
  };

  const confirmDelete = (recepcion: Recepcion) => {
    setRecepcionToDelete(recepcion);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recepcionToDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Si está inventariada, solo anular (marcar como anulada)
      // Si NO está inventariada, eliminar completamente
      if (recepcionToDelete.inventariada) {
        // Anular (marcar como anulada pero mantener el registro)
        const response = await fetch(`${baseUrl}/api/inventario/recepciones/${recepcionToDelete.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ anulada: true })
        });

        if (response.ok) {
          toast.success('Recepción anulada correctamente');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Error al anular recepción');
        }
      } else {
        // Eliminar completamente
        const response = await fetch(`${baseUrl}/api/inventario/recepciones/${recepcionToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          toast.success('Recepción eliminada correctamente');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Error al eliminar recepción');
        }
      }

      setDeleteDialogOpen(false);
      setRecepcionToDelete(null);
      setDialogOpen(false);
      loadRecepciones();
      onUpdate?.();
    } catch (error) {
      console.error('Error procesando recepción:', error);
      toast.error('Error al procesar la recepción');
    }
  };

  const addDetalleItem = () => {
    setDetalle([...detalle, {
      idproducto: '',
      cantidad: 1,
      costo: 0
    }]);
  };

  const removeDetalleItem = (index: number) => {
    setDetalle(detalle.filter((_, i) => i !== index));
  };

  const updateDetalleItem = (index: number, field: keyof DetalleItem, value: any) => {
    const newDetalle = [...detalle];
    
    // Si cambia el producto, validar que no esté duplicado
    if (field === 'idproducto') {
      const productoYaExiste = detalle.some((item, i) => i !== index && item.idproducto === value);
      if (productoYaExiste) {
        toast.error('Este producto ya está agregado en la recepción');
        return;
      }
      
      const producto = productos.find(p => p.id === value);
      console.log('Producto seleccionado:', producto);
      if (producto) {
        newDetalle[index].costo = producto.costo || 0;
        newDetalle[index].idproducto = value;
        console.log('Costo asignado:', producto.costo);
      }
    } else {
      newDetalle[index] = { ...newDetalle[index], [field]: value };
    }
    
    setDetalle(newDetalle);
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.fecha) {
      toast.error('La fecha es requerida');
      return;
    }

    if (!formData.idalmacen) {
      toast.error('Debe seleccionar un almacén');
      return;
    }

    if (detalle.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    // Validar que todos los productos tengan cantidad y costo
    const detalleInvalido = detalle.some(item => !item.idproducto || item.cantidad <= 0 || item.costo < 0);
    if (detalleInvalido) {
      toast.error('Todos los productos deben tener cantidad y costo válidos');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const recepcionData = {
        business_id: businessId,
        fecha: formData.fecha,
        idalmacen: formData.idalmacen,
        observaciones: formData.observaciones,
        inventariada: formData.inventariada,
        detalle
      };

      console.log('Datos a enviar:', recepcionData);

      const url = editMode && selectedRecepcion
        ? `${baseUrl}/api/inventario/recepciones/${selectedRecepcion.id}`
        : `${baseUrl}/api/inventario/recepciones`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(recepcionData)
      });

      if (response.ok) {
        toast.success(editMode ? 'Recepción actualizada correctamente' : 'Recepción creada correctamente');
        setDialogOpen(false);
        loadRecepciones();
        onUpdate?.();
      } else {
        const error = await response.json();
        console.error('Error del servidor:', error);
        toast.error(error.error || 'Error al guardar recepción');
      }
    } catch (error) {
      console.error('Error guardando recepción:', error);
      toast.error('Error al guardar recepción');
    }
  };

  const filteredRecepciones = recepciones.filter(r =>
    r.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.almacen?.almacen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
      render: (item: Recepcion) => item.numero || '-'
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (item: Recepcion) => {
        if (!item.fecha) return '-';
        try {
          const date = new Date(item.fecha);
          if (isNaN(date.getTime())) return '-';
          return format(date, 'dd/MM/yyyy', { locale: es });
        } catch (error) {
          console.error('Error formateando fecha:', item.fecha, error);
          return '-';
        }
      }
    },
    {
      key: 'almacen',
      label: 'Almacén',
      render: (item: Recepcion) => item.almacen?.almacen || '-'
    },
    {
      key: 'usuario',
      label: 'Usuario',
      render: (item: Recepcion) => item.usuario?.full_name || '-'
    },
    {
      key: 'inventariada',
      label: 'Inventariada',
      render: (item: Recepcion) => (
        <span className={`px-2 py-1 rounded text-xs ${item.inventariada ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
          {item.inventariada ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      key: 'anulada',
      label: 'Estado',
      render: (item: Recepcion) => (
        <span className={`px-2 py-1 rounded text-xs ${item.anulada ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {item.anulada ? 'Anulada' : 'Activa'}
        </span>
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
      condition: (item: Recepcion) => !item.anulada && !item.inventariada
    },
    {
      label: (item: Recepcion) => item.inventariada ? 'Desbloquear' : 'Inventariar',
      icon: (item: Recepcion) => item.inventariada ? Unlock : Lock,
      onClick: handleToggleInventariada,
      condition: (item: Recepcion) => !item.anulada
    },
    {
      label: (item: Recepcion) => item.inventariada ? 'Anular' : 'Eliminar',
      icon: Trash2,
      onClick: confirmDelete,
      variant: 'destructive' as const,
      condition: (item: Recepcion) => !item.anulada
    }
  ];

  const totalRecepcion = detalle.reduce((sum, item) => sum + (item.cantidad * item.costo), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('inventario.recepciones.titulo', 'Recepciones de Inventario')}
          </CardTitle>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t('inventario.recepciones.nueva', 'Nueva Recepción')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('inventario.recepciones.buscar', 'Buscar por número o almacén...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          data={filteredRecepciones}
          columns={columns}
          actions={actions}
          loading={loading}
          emptyMessage={t('inventario.recepciones.sinDatos', 'No hay recepciones registradas')}
        />
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>
              {viewMode 
                ? `Recepción ${selectedRecepcion?.numero}` 
                : editMode
                ? `Editar Recepción ${selectedRecepcion?.numero}`
                : t('inventario.recepciones.nueva', 'Nueva Recepción')}
            </DialogTitle>
            <p id="dialog-description" className="text-sm text-muted-foreground">
              {viewMode 
                ? 'Detalle de la recepción de inventario'
                : editMode
                ? 'Modifique los datos de la recepción'
                : 'Complete los datos para crear una nueva recepción'}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewMode && (
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={selectedRecepcion?.numero}
                    disabled
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  disabled={viewMode || (editMode && formData.inventariada)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idalmacen">Almacén *</Label>
                <Select
                  id="idalmacen"
                  value={formData.idalmacen}
                  onValueChange={(value) => setFormData({ ...formData, idalmacen: value })}
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

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  disabled={viewMode}
                  rows={2}
                />
              </div>

              {!viewMode && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventariada"
                    checked={formData.inventariada}
                    onCheckedChange={(checked) => setFormData({ ...formData, inventariada: checked as boolean })}
                  />
                  <Label htmlFor="inventariada" className="text-sm font-normal cursor-pointer">
                    Marcar como inventariada (no se podrá modificar después)
                  </Label>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Detalle de Productos</h3>
                {!viewMode && (
                  <Button onClick={addDetalleItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {detalle.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-5">
                      <Label className="text-xs">Producto</Label>
                      {viewMode ? (
                        <div className="text-sm">{item.producto?.nombre}</div>
                      ) : (
                        <Select
                          value={item.idproducto}
                          onValueChange={(value) => updateDetalleItem(index, 'idproducto', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map((producto) => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.codigo} - {producto.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateDetalleItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                        disabled={viewMode}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Costo Unit.</Label>
                      <Input
                        type="number"
                        value={item.costo}
                        onChange={(e) => updateDetalleItem(index, 'costo', parseFloat(e.target.value) || 0)}
                        disabled={viewMode}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Total</Label>
                      <div className="text-sm font-semibold">
                        ${(item.cantidad * item.costo).toFixed(2)}
                      </div>
                    </div>

                    {!viewMode && (
                      <div className="col-span-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDetalleItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {detalle.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Recepción</div>
                    <div className="text-2xl font-bold">${totalRecepcion.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {viewMode && selectedRecepcion && !selectedRecepcion.anulada && (
              <Button variant="destructive" onClick={() => confirmDelete(selectedRecepcion)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {selectedRecepcion.inventariada ? 'Anular' : 'Eliminar'}
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
                {editMode ? 'Actualizar' : 'Guardar'} Recepción
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {recepcionToDelete?.inventariada ? (
                <>
                  Esta acción anulará la recepción {recepcionToDelete?.numero}. 
                  La recepción quedará marcada como anulada pero se mantendrá en el sistema para fines de auditoría.
                </>
              ) : (
                <>
                  Esta acción eliminará permanentemente la recepción {recepcionToDelete?.numero}. 
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {recepcionToDelete?.inventariada ? 'Anular Recepción' : 'Eliminar Recepción'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
















