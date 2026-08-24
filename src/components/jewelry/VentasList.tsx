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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Edit, Trash2, ShoppingCart, Search, TrendingUp, UserPlus } from 'lucide-react';
import { 
  getVentas, 
  createVenta, 
  updateVenta, 
  deleteVenta,
  getJoyas
} from '../../lib/api/jewelry';
import { getClients } from '../../lib/api/clients';
import { ClientForm } from '../business/ClientForm';
import type { 
  JwlVenta, 
  JwlVentaFormData,
  JwlJoya
} from '../../lib/types/jewelry.types';
import { JWL_METODOS_PAGO } from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { useTranslation } from 'react-i18next';

interface VentasListProps {
  businessId: string;
  onUpdate?: () => void;
}

export function VentasList({ businessId, onUpdate }: VentasListProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [ventas, setVentas] = useState<JwlVenta[]>([]);
  const [joyas, setJoyas] = useState<JwlJoya[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<JwlVentaFormData>({
    joya_id: '',
    cantidad: 0,
    precio_unitario_venta: 0,
    cliente: '',
    fecha_venta: new Date().toISOString().split('T')[0],
    metodo_pago: 'Efectivo',
    notas: '',
    venta_por_peso: false,
    peso_vendido: 0,
    precio_por_peso_venta: 0
  });

  const [ventaToDelete, setVentaToDelete] = useState<JwlVenta | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ventasData, joyasData, clientsData] = await Promise.all([
        getVentas(),
        getJoyas(),
        getClients(businessId)
      ]);
      setVentas(ventasData);
      setJoyas(joyasData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!formData.joya_id || !formData.metodo_pago) {
      toast.error(t('jewelry.common.error'));
      return;
    }

    // Validación según tipo de venta
    if (formData.venta_por_peso) {
      // Venta por peso
      if (!formData.peso_vendido || formData.peso_vendido <= 0) {
        toast.error(t('jewelry.sales.form.weightSold') + ' es requerido');
        return;
      }
      if (!formData.precio_por_peso_venta || formData.precio_por_peso_venta <= 0) {
        toast.error(t('jewelry.sales.form.pricePerWeight') + ' es requerido');
        return;
      }
    } else {
      // Venta normal
      if (!formData.cantidad || formData.cantidad <= 0) {
        toast.error(t('jewelry.sales.form.quantitySold') + ' es requerido');
        return;
      }
      if (!formData.precio_unitario_venta || formData.precio_unitario_venta <= 0) {
        toast.error(t('jewelry.sales.form.unitPrice') + ' es requerido');
        return;
      }

      // Verificar stock solo para ventas normales
      const joya = joyas.find(j => j.id === formData.joya_id);
      if (joya && joya.stock_actual < formData.cantidad) {
        toast.error(`${t('jewelry.sales.insufficientStock')}. ${t('jewelry.rawMaterials.table.stock')}: ${joya.stock_actual}`);
        return;
      }
    }

    try {
      if (editingId) {
        await updateVenta(editingId, formData);
        toast.success(t('jewelry.common.updateSuccess'));
      } else {
        await createVenta(formData);
        toast.success(t('jewelry.common.saveSuccess'));
      }
      
      setShowDialog(false);
      resetForm();
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving venta:', error);
      toast.error(error instanceof Error ? error.message : t('jewelry.common.error'));
    }
  };

  const handleEdit = (venta: JwlVenta) => {
    setEditingId(venta.id);
    setFormData({
      joya_id: venta.joya_id,
      cantidad: venta.cantidad,
      precio_unitario_venta: venta.precio_unitario_venta,
      cliente: venta.cliente || '',
      fecha_venta: venta.fecha_venta,
      metodo_pago: venta.metodo_pago || 'Efectivo',
      notas: venta.notas || '',
      venta_por_peso: venta.venta_por_peso || false,
      peso_vendido: venta.peso_vendido || 0,
      precio_por_peso_venta: venta.precio_por_peso_venta || 0
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteVenta(deletingId);
      toast.success(t('jewelry.common.deleteSuccess'));
      setShowDeleteDialog(false);
      setDeletingId(null);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting venta:', error);
      toast.error(error instanceof Error ? error.message : t('jewelry.common.error'));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      joya_id: '',
      cantidad: 0,
      precio_unitario_venta: 0,
      cliente: '',
      fecha_venta: new Date().toISOString().split('T')[0],
      metodo_pago: 'Efectivo',
      notas: '',
      venta_por_peso: false,
      peso_vendido: 0,
      precio_por_peso_venta: 0
    });
  };

  const handleClientCreated = async (newClient: any) => {
    // Recargar la lista de clientes
    await loadData();
    // Seleccionar automáticamente el nuevo cliente
    setFormData({ ...formData, cliente: newClient.full_name });
    // Cerrar el diálogo de crear cliente
    setShowClientDialog(false);
    toast.success(t('jewelry.common.saveSuccess'));
  };

  const handleJoyaChange = (joyaId: string) => {
    const joya = joyas.find(j => j.id === joyaId);
    setFormData({
      ...formData,
      joya_id: joyaId,
      precio_unitario_venta: joya?.precio_venta || 0,
      precio_por_peso_venta: joya?.precio_por_peso || 0,
      venta_por_peso: false, // Resetear a venta normal por defecto
      peso_vendido: 0,
      cantidad: 0
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const totalVentas = ventas.reduce((sum, v) => sum + (v.total_venta || 0), 0);
  const totalUtilidad = ventas.reduce((sum, v) => sum + (v.utilidad || 0), 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('jewelry.sales.title')}</CardTitle>
              <CardDescription>
                {t('jewelry.sales.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('jewelry.sales.addSale')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jewelry.sales.totalSales')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMonto(totalVentas)}</div>
            <p className="text-xs text-muted-foreground">{ventas.length} {t('jewelry.sales.salesRegistered')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jewelry.sales.totalProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatearMonto(totalUtilidad)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">{t('date')}</TableHead>
                  <TableHead className="min-w-[150px]">{t('jewelry.inventory.title')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('jewelry.sales.form.saleType')}</TableHead>
                  <TableHead className="min-w-[100px] text-right">{t('jewelry.production.form.quantity')}</TableHead>
                  <TableHead className="min-w-[120px] text-right">{t('jewelry.sales.form.unitPrice')}</TableHead>
                  <TableHead className="min-w-[120px] text-right">{t('jewelry.common.total')}</TableHead>
                  <TableHead className="min-w-[120px] text-right">{t('jewelry.reports.summary.profitMargin')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('jewelry.sales.form.customer')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('jewelry.sales.form.paymentMethod')}</TableHead>
                  <TableHead className="min-w-[150px] text-right">{t('jewelry.common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {t('jewelry.sales.noSales')}
                    </TableCell>
                  </TableRow>
                ) : (
                  ventas.map(venta => (
                    <TableRow key={venta.id}>
                      <TableCell className="font-medium">
                        {new Date(venta.fecha_venta).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{venta.joya?.nombre}</p>
                          <p className="text-xs text-muted-foreground">SKU: {venta.joya?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {venta.venta_por_peso ? (
                          <Badge variant="secondary">{t('jewelry.sales.form.sellByWeight')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('jewelry.sales.form.normalSale')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {venta.venta_por_peso ? (
                          <div>
                            <p className="font-bold">{venta.peso_vendido || 0}g</p>
                          </div>
                        ) : (
                          <p className="font-bold">{venta.cantidad}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {venta.venta_por_peso ? (
                          <div>
                            <p>{formatearMonto(venta.precio_por_peso_venta || 0)}/g</p>
                          </div>
                        ) : (
                          <p>{formatearMonto(venta.precio_unitario_venta || 0)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatearMonto(venta.total_venta || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatearMonto(venta.utilidad || 0)}
                      </TableCell>
                      <TableCell>
                        {venta.cliente || '-'}
                      </TableCell>
                      <TableCell>
                        {venta.metodo_pago || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(venta)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeletingId(venta.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Registrar Venta */}
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
              {editingId ? t('jewelry.sales.editSale') : t('jewelry.sales.addSale')}
            </DialogTitle>
            <DialogDescription>
              {t('jewelry.sales.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('jewelry.inventory.title')}</Label>
              <Select
                value={formData.joya_id}
                onValueChange={handleJoyaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('jewelry.production.form.selectJewelry')} />
                </SelectTrigger>
                <SelectContent>
                  {joyas.filter(j => j.stock_actual > 0).map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nombre} ({j.sku}) - {t('jewelry.rawMaterials.table.stock')}: {j.stock_actual} - {formatearMonto(j.precio_venta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de tipo de venta */}
            {formData.joya_id && joyas.find(j => j.id === formData.joya_id)?.precio_por_peso && (
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="venta_por_peso"
                  checked={formData.venta_por_peso}
                  onChange={(e) => setFormData({ ...formData, venta_por_peso: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="venta_por_peso" className="cursor-pointer">
                  {t('jewelry.sales.form.sellByWeight')}
                </Label>
              </div>
            )}
            
            {/* Campos según tipo de venta */}
            {formData.venta_por_peso ? (
              // Venta por peso
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('jewelry.sales.form.weightSold')} (g) *</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.peso_vendido || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, peso_vendido: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>{t('jewelry.sales.form.pricePerWeight')} *</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.precio_por_peso_venta || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, precio_por_peso_venta: value === '' ? 0 : parseFloat(value) });
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              // Venta normal
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('jewelry.sales.form.quantitySold')} *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('jewelry.production.form.quantityPlaceholder')}
                  value={formData.cantidad || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, cantidad: value === '' ? 0 : parseFloat(value) });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('jewelry.sales.form.availableStock')}: {formData.joya_id ? joyas.find(j => j.id === formData.joya_id)?.stock_actual || 0 : 0}
                </p>
              </div>
              <div>
                <Label>{t('jewelry.sales.form.unitPrice')} *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.precio_unitario_venta || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, precio_unitario_venta: value === '' ? 0 : parseFloat(value) });
                    }
                  }}
                />
              </div>
            </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('jewelry.sales.form.customer')} ({t('optional')})</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.cliente}
                    onValueChange={(value) => setFormData({ ...formData, cliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('jewelry.sales.form.customerPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.full_name}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowClientDialog(true)}
                    title={t('jewelry.sales.addNewClient')}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>{t('jewelry.sales.form.paymentMethod')}</Label>
                <Select
                  value={formData.metodo_pago}
                  onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JWL_METODOS_PAGO.map(metodo => (
                      <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('jewelry.sales.form.saleDate')}</Label>
              <Input
                type="date"
                value={formData.fecha_venta}
                onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('notes')} ({t('optional')})</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder={t('jewelry.production.form.notesPlaceholder')}
              />
            </div>
            {formData.joya_id && (
              (formData.venta_por_peso && formData.peso_vendido > 0 && formData.precio_por_peso_venta > 0) ||
              (!formData.venta_por_peso && formData.cantidad > 0 && formData.precio_unitario_venta > 0)
            ) && (
              <Card className="bg-primary/5">
                <CardContent className="py-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('jewelry.sales.totalSales')}:</span>
                    <span className="font-bold">
                      {formData.venta_por_peso 
                        ? formatearMonto(formData.peso_vendido * formData.precio_por_peso_venta)
                        : formatearMonto(formData.cantidad * formData.precio_unitario_venta)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('jewelry.inventory.form.cost')}:</span>
                    <span>
                      {formatearMonto((joyas.find(j => j.id === formData.joya_id)?.costo_produccion || 0) * (formData.venta_por_peso ? 1 : formData.cantidad))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">{t('jewelry.reports.summary.profitMargin')}:</span>
                    <span className="font-bold text-green-600">
                      {formData.venta_por_peso 
                        ? formatearMonto(
                            (formData.peso_vendido * formData.precio_por_peso_venta) - 
                            (joyas.find(j => j.id === formData.joya_id)?.costo_produccion || 0)
                          )
                        : formatearMonto(
                            (formData.cantidad * formData.precio_unitario_venta) - 
                            ((joyas.find(j => j.id === formData.joya_id)?.costo_produccion || 0) * formData.cantidad)
                          )
                      }
                    </span>
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
              {editingId ? t('jewelry.common.update') : t('jewelry.sales.addSale')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jewelry.common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('jewelry.sales.confirmDeleteMessage')}
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

      {/* Diálogo para crear nuevo cliente */}
      <ClientForm
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        businessId={businessId}
        client={null}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}