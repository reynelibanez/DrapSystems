import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Plus, Eye, Edit, Trash2, XCircle, Search, Printer, CheckSquare } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { baseUrl } from '@/lib/base-url';

interface Transferencia {
  id: string;
  numero: string;
  fecha: string;
  almacen_origen?: {
    almacen: string;
  };
  almacen_destino?: {
    almacen: string;
  };
  observaciones?: string;
  inventariada: boolean;
  anulada: boolean;
  created_at: string;
}

interface DetalleTransferencia {
  id?: string;
  idproducto: string;
  producto?: {
    nombre: string;
    codigo: string;
  };
  cantidad: number;
}

interface Almacen {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  stock_disponible?: number;
}

interface TransferenciasViewProps {
  businessId?: string;
  onUpdate?: () => void;
}

export function TransferenciasView({ businessId, onUpdate }: TransferenciasViewProps) {
  const { t } = useTranslation();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [selectedTransferencia, setSelectedTransferencia] = useState<Transferencia | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    idalmacenorigen: '',
    idalmacendestino: '',
    observaciones: '',
    inventariada: false
  });
  const [detalles, setDetalles] = useState<DetalleTransferencia[]>([]);
  const [currentDetalle, setCurrentDetalle] = useState({
    idproducto: '',
    cantidad: 0
  });

  useEffect(() => {
    if (businessId) {
      loadTransferencias();
      loadAlmacenes();
    }
  }, [businessId]);

  useEffect(() => {
    if (formData.idalmacenorigen) {
      loadProductosByAlmacen(formData.idalmacenorigen);
    }
  }, [formData.idalmacenorigen]);

  useEffect(() => {
    if (dialogOpen && businessId) {
      loadAlmacenes();
    }
  }, [dialogOpen, businessId]);

  const loadTransferencias = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const response = await fetch(`${baseUrl}/api/inventario/transferencias?business_id=${businessId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar transferencias');

      const data = await response.json();
      setTransferencias(data.transferencias || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las transferencias');
    } finally {
      setLoading(false);
    }
  };

  const loadAlmacenes = async () => {
    if (!businessId) return;

    try {
      console.log('Cargando almacenes para businessId:', businessId);
      const { data, error } = await supabase
        .from('ng_almacen_inventario')
        .select('id, almacen')
        .eq('business_id', businessId)
        .order('almacen');

      if (error) throw error;
      console.log('Almacenes cargados:', data);
      
      // Mapear almacen a nombre para mantener compatibilidad con el resto del código
      const almacenesFormateados = (data || []).map(a => ({
        id: a.id,
        nombre: a.almacen
      }));
      
      setAlmacenes(almacenesFormateados);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
      toast.error('Error al cargar los almacenes');
    }
  };

  const loadProductosByAlmacen = async (almacenId: string) => {
    if (!businessId || !almacenId) return;

    try {
      console.log('Cargando productos para almacén:', almacenId, 'businessId:', businessId);
      
      // Cargar todos los productos activos
      const { data: productosData, error: productosError } = await supabase
        .from('ng_productos_inventario')
        .select('id, codigo, nombre')
        .eq('business_id', businessId)
        .eq('activo', true)
        .order('nombre');

      if (productosError) {
        console.error('Error en query de productos:', productosError);
        throw productosError;
      }

      console.log('Productos activos recibidos:', productosData);

      // Cargar existencias del almacén
      const { data: existenciasData, error: existenciasError } = await supabase
        .from('il_existencias_inventario')
        .select('idproducto, cantidad')
        .eq('business_id', businessId)
        .eq('idalmacen', almacenId)
        .gt('cantidad', 0);

      if (existenciasError) {
        console.error('Error en query de existencias:', existenciasError);
        throw existenciasError;
      }

      console.log('Existencias del almacén:', existenciasData);

      // Crear un mapa de existencias por producto
      const existenciasMap = new Map(
        (existenciasData || []).map((e: any) => [e.idproducto, Number(e.cantidad)])
      );

      // Combinar productos con sus existencias
      const productosConStock = (productosData || []).map((producto: any) => ({
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        stock_disponible: existenciasMap.get(producto.id) || 0
      }));

      console.log('Productos con stock formateados:', productosConStock);
      setProductos(productosConStock);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar los productos');
    }
  };

  const handleOpenDialog = async (transferencia?: Transferencia) => {
    if (transferencia) {
      setEditMode(true);
      setSelectedTransferencia(transferencia);
      
      // Cargar los datos completos de la transferencia desde el backend
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const response = await fetch(`${baseUrl}/api/inventario/transferencias/${transferencia.id}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (!response.ok) throw new Error('Error al cargar transferencia');

        const data = await response.json();
        const transferenciaCompleta = data.transferencia;

        setFormData({
          numero: transferenciaCompleta.numero || '',
          fecha: transferenciaCompleta.fecha || format(new Date(), 'yyyy-MM-dd'),
          idalmacenorigen: transferenciaCompleta.idalmacenorigen || '',
          idalmacendestino: transferenciaCompleta.idalmacendestino || '',
          observaciones: transferenciaCompleta.observaciones || '',
          inventariada: transferenciaCompleta.inventariada || false
        });
        
        await loadDetalles(transferencia.id);
      } catch (error) {
        console.error('Error cargando transferencia:', error);
        toast.error('Error al cargar los datos de la transferencia');
        return;
      }
    } else {
      setEditMode(false);
      setSelectedTransferencia(null);
      setFormData({
        numero: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        idalmacenorigen: '',
        idalmacendestino: '',
        observaciones: '',
        inventariada: false
      });
      setDetalles([]);
    }
    setDialogOpen(true);
  };

  const loadDetalles = async (transferenciaId: string) => {
    try {
      const { data, error } = await supabase
        .from('il_transferencias_detalle_inventario')
        .select(`
          id,
          idproducto,
          cantidad,
          producto:ng_productos_inventario(nombre, codigo)
        `)
        .eq('idtransferencia', transferenciaId);

      if (error) throw error;

      const detallesFormateados = (data || []).map((item: any) => ({
        id: item.id,
        idproducto: item.idproducto,
        cantidad: Number(item.cantidad),
        producto: item.producto
      }));

      setDetalles(detallesFormateados);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      toast.error('Error al cargar los detalles');
    }
  };

  const handleViewTransferencia = async (transferencia: Transferencia) => {
    setSelectedTransferencia(transferencia);
    await loadDetalles(transferencia.id);
    setViewDialogOpen(true);
  };

  const handleAddDetalle = () => {
    if (!currentDetalle.idproducto || currentDetalle.cantidad <= 0) {
      toast.error('Seleccione un producto y cantidad válida');
      return;
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = detalles.find(d => d.idproducto === currentDetalle.idproducto);
    if (productoExistente) {
      toast.error('Este producto ya está en la lista');
      return;
    }

    // Verificar stock disponible
    const producto = productos.find(p => p.id === currentDetalle.idproducto);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }

    const stockDisponible = producto.stock_disponible ?? 0;
    console.log('Stock disponible del producto:', stockDisponible, 'Cantidad solicitada:', currentDetalle.cantidad);

    // Advertencia si no hay existencias registradas
    if (stockDisponible === 0) {
      toast.warning('⚠️ Este producto no tiene existencias registradas en el almacén origen. Asegúrate de crear una recepción primero.');
    } else if (currentDetalle.cantidad > stockDisponible) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }

    const productoInfo = productos.find(p => p.id === currentDetalle.idproducto);
    
    setDetalles([...detalles, {
      idproducto: currentDetalle.idproducto,
      cantidad: currentDetalle.cantidad,
      producto: productoInfo ? {
        nombre: productoInfo.nombre,
        codigo: productoInfo.codigo
      } : undefined
    }]);

    setCurrentDetalle({ idproducto: '', cantidad: 0 });
    toast.success('Producto agregado');
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!businessId) return;

    // Validaciones
    if (!formData.fecha) {
      toast.error('La fecha es requerida');
      return;
    }

    if (!formData.idalmacenorigen) {
      toast.error('Seleccione el almacén de origen');
      return;
    }

    if (!formData.idalmacendestino) {
      toast.error('Seleccione el almacén de destino');
      return;
    }

    if (formData.idalmacenorigen === formData.idalmacendestino) {
      toast.error('El almacén de origen y destino deben ser diferentes');
      return;
    }

    if (detalles.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const payload = {
        ...formData,
        business_id: businessId,
        detalles,
        user_id: user.id
      };

      const url = editMode && selectedTransferencia
        ? `${baseUrl}/api/inventario/transferencias/${selectedTransferencia.id}`
        : `${baseUrl}/api/inventario/transferencias`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast.success(editMode ? 'Transferencia actualizada' : 'Transferencia creada exitosamente');
      setDialogOpen(false);
      loadTransferencias();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar la transferencia');
    }
  };

  const handleAnular = async (transferencia: Transferencia) => {
    if (!confirm('¿Está seguro de anular esta transferencia?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const response = await fetch(`${baseUrl}/api/inventario/transferencias/${transferencia.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Error al anular');

      toast.success('Transferencia anulada exitosamente');
      loadTransferencias();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al anular la transferencia');
    }
  };

  const handleInventariar = async (transferencia: Transferencia) => {
    if (!confirm('¿Está seguro de inventariar esta transferencia? Una vez inventariada no se podrá modificar.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('il_transferencias_inventario')
        .update({ inventariada: true })
        .eq('id', transferencia.id)
        .eq('business_id', businessId);

      if (error) throw error;

      toast.success('Transferencia inventariada exitosamente');
      loadTransferencias();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al inventariar la transferencia');
    }
  };

  const handlePrint = (transferencia: Transferencia) => {
    toast.info('Función de impresión en desarrollo');
  };

  const filteredTransferencias = transferencias.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    return (
      t.numero?.toLowerCase().includes(searchLower) ||
      (t.almacen_origen as any)?.almacen?.toLowerCase().includes(searchLower) ||
      (t.almacen_destino as any)?.almacen?.toLowerCase().includes(searchLower)
    );
  });

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
      render: (item: Transferencia) => {
        try {
          return item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }) : '-';
        } catch {
          return '-';
        }
      }
    },
    {
      key: 'almacen_origen',
      label: 'Almacén Origen',
      render: (item: Transferencia) => (item.almacen_origen as any)?.almacen || '-'
    },
    {
      key: 'almacen_destino',
      label: 'Almacén Destino',
      render: (item: Transferencia) => (item.almacen_destino as any)?.almacen || '-'
    },
    {
      key: 'anulada',
      label: 'Estado',
      render: (item: Transferencia) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.anulada 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {item.anulada ? 'Anulada' : 'Activa'}
          </span>
          {item.inventariada && !item.anulada && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Inventariada
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
      onClick: handleViewTransferencia
    },
    {
      label: 'Inventariar',
      icon: CheckSquare,
      onClick: handleInventariar,
      condition: (item: Transferencia) => !item.inventariada && !item.anulada,
      variant: 'default' as const
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: handleOpenDialog,
      condition: (item: Transferencia) => !item.inventariada && !item.anulada
    },
    {
      label: 'Imprimir',
      icon: Printer,
      onClick: handlePrint
    },
    {
      label: 'Anular',
      icon: XCircle,
      onClick: handleAnular,
      condition: (item: Transferencia) => !item.inventariada && !item.anulada,
      variant: 'destructive' as const
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Transferencias entre Almacenes
              </CardTitle>
              <CardDescription>
                Gestiona las transferencias de productos entre almacenes
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transferencia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o almacén..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            data={filteredTransferencias}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="No hay transferencias registradas"
          />
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Editar Transferencia' : 'Nueva Transferencia'}
            </DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Modifica los datos de la transferencia' 
                : 'Completa los datos para crear una nueva transferencia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Se generará automáticamente"
                  disabled={editMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="almacen-origen">Almacén Origen *</Label>
                <Select
                  value={formData.idalmacenorigen}
                  onValueChange={(value) => {
                    // Si el almacén seleccionado es el mismo que el destino, limpiar el destino
                    const newFormData = { 
                      ...formData, 
                      idalmacenorigen: value 
                    };
                    
                    if (value === formData.idalmacendestino) {
                      newFormData.idalmacendestino = '';
                    }
                    
                    setFormData(newFormData);
                    setDetalles([]);
                    setCurrentDetalle({ idproducto: '', cantidad: 0 });
                  }}
                >
                  <SelectTrigger id="almacen-origen">
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {almacenes
                      .filter(a => a.id !== formData.idalmacendestino)
                      .map((almacen) => (
                        <SelectItem key={almacen.id} value={almacen.id}>
                          {almacen.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="almacen-destino">Almacén Destino *</Label>
                <Select
                  value={formData.idalmacendestino}
                  onValueChange={(value) => {
                    // Si el almacén seleccionado es el mismo que el origen, limpiar el origen
                    const newFormData = { 
                      ...formData, 
                      idalmacendestino: value 
                    };
                    
                    if (value === formData.idalmacenorigen) {
                      newFormData.idalmacenorigen = '';
                      setDetalles([]);
                      setCurrentDetalle({ idproducto: '', cantidad: 0 });
                    }
                    
                    setFormData(newFormData);
                  }}
                >
                  <SelectTrigger id="almacen-destino">
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {almacenes
                      .filter(a => a.id !== formData.idalmacenorigen)
                      .map((almacen) => (
                        <SelectItem key={almacen.id} value={almacen.id}>
                          {almacen.nombre}
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
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>

            {/* Checkbox de inventariada */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inventariada"
                checked={formData.inventariada}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, inventariada: checked as boolean })
                }
              />
              <Label 
                htmlFor="inventariada" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Marcar como inventariada (no se podrá modificar después)
              </Label>
            </div>

            {/* Agregar productos */}
            {formData.idalmacenorigen && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Productos a Transferir</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={currentDetalle.idproducto}
                      onValueChange={(value) => {
                        console.log('Producto seleccionado:', value);
                        const producto = productos.find(p => p.id === value);
                        console.log('Info del producto:', producto);
                        setCurrentDetalle({ ...currentDetalle, idproducto: value });
                      }}
                      disabled={!formData.idalmacenorigen}
                    >
                      <SelectTrigger id="producto">
                        <SelectValue placeholder={
                          !formData.idalmacenorigen 
                            ? "Primero selecciona un almacén origen" 
                            : "Seleccionar producto"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No hay productos disponibles
                          </div>
                        ) : (
                          productos.map((producto) => {
                            const stockDisponible = producto.stock_disponible ?? 0;
                            return (
                              <SelectItem 
                                key={producto.id} 
                                value={producto.id}
                              >
                                {producto.codigo} - {producto.nombre} 
                                {stockDisponible > 0 
                                  ? ` (Stock: ${stockDisponible})` 
                                  : ' ⚠️ (Sin existencias registradas)'}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {productos.length > 0 && productos.every(p => (p.stock_disponible ?? 0) === 0) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ No hay existencias registradas. Crea recepciones primero para registrar stock.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cantidad"
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentDetalle.cantidad || ''}
                        onChange={(e) => setCurrentDetalle({ ...currentDetalle, cantidad: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddDetalle}
                        className="whitespace-nowrap"
                        disabled={!currentDetalle.idproducto || currentDetalle.cantidad <= 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    {currentDetalle.idproducto && currentDetalle.cantidad > 0 && (
                      <p className="text-xs text-muted-foreground">
                        👆 Haz clic en "Agregar" para incluir este producto en la transferencia
                      </p>
                    )}
                  </div>
                </div>

                {/* Lista de productos agregados */}
                {detalles.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Código</th>
                          <th className="text-left p-2">Producto</th>
                          <th className="text-right p-2">Cantidad</th>
                          <th className="text-center p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((detalle, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{detalle.producto?.codigo}</td>
                            <td className="p-2">{detalle.producto?.nombre}</td>
                            <td className="p-2 text-right">{detalle.cantidad}</td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDetalle(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editMode ? 'Actualizar' : 'Crear'} Transferencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de Transferencia</DialogTitle>
            <DialogDescription>
              Información completa de la transferencia
            </DialogDescription>
          </DialogHeader>

          {selectedTransferencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número</Label>
                  <p className="font-medium">{selectedTransferencia.numero}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">
                    {selectedTransferencia.fecha 
                      ? format(new Date(selectedTransferencia.fecha), 'dd/MM/yyyy', { locale: es })
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Almacén Origen</Label>
                  <p className="font-medium">{(selectedTransferencia.almacen_origen as any)?.almacen}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Almacén Destino</Label>
                  <p className="font-medium">{(selectedTransferencia.almacen_destino as any)?.almacen}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Estado</Label>
                  <p className="font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTransferencia.anulada 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {selectedTransferencia.anulada ? 'Anulada' : 'Activa'}
                    </span>
                    {selectedTransferencia.inventariada && !selectedTransferencia.anulada && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Inventariada
                      </span>
                    )}
                  </p>
                </div>
                {selectedTransferencia.observaciones && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Observaciones</Label>
                    <p className="font-medium">{selectedTransferencia.observaciones}</p>
                  </div>
                )}
              </div>

              {/* Detalles de productos */}
              {detalles.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Código</th>
                        <th className="text-left p-2">Producto</th>
                        <th className="text-right p-2">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((detalle, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{detalle.producto?.codigo}</td>
                          <td className="p-2">{detalle.producto?.nombre}</td>
                          <td className="p-2 text-right">{detalle.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




























