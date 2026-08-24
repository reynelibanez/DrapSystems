import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Package,
  Factory,
  Download,
  FileText
} from 'lucide-react';
import { 
  getReporteFinanciero,
  getReporteVentas,
  getReporteProduccion,
  getReporteInventario,
  getReporteClientes
} from '../../lib/api/jewelry';
import type { 
  JwlReporteFinanciero,
  JwlReporteVentas,
  JwlReporteProduccion,
  JwlReporteInventario
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { ReporteMateriaPrima } from './ReporteMateriaPrima';

interface ReportesViewProps {
  businessId: string;
}

export function ReportesView({ businessId }: ReportesViewProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [reporteGastos, setReporteGastos] = useState<{ categoria: string; total: number }[]>([]);
  const [reporteIngresos, setReporteIngresos] = useState<{ categoria: string; total: number; utilidad: number }[]>([]);
  const [resumenVentas, setResumenVentas] = useState<any[]>([]);
  const [reporteClientes, setReporteClientes] = useState<{ cliente: string; total_ventas: number; cantidad_compras: number; total_gastado: number; utilidad_generada: number }[]>([]);

  // Cargar reportes automáticamente al montar el componente
  useEffect(() => {
    loadReportes();
  }, [businessId]);

  const loadReportes = async () => {
    console.log('🚀 INICIO - loadReportes ejecutándose');
    console.log('📅 Fechas:', { fechaInicio, fechaFin });
    console.log('🏢 Business ID:', businessId);
    
    try {
      setLoading(true);
      console.log('🔍 Cargando reportes para período:', fechaInicio, 'a', fechaFin);
      
      console.log('📡 Llamando a getReporteFinanciero...');
      const gastos = await getReporteFinanciero(fechaInicio, fechaFin);
      console.log('✅ Gastos recibidos:', gastos);
      
      console.log('📡 Llamando a getReporteVentas...');
      const ingresos = await getReporteVentas(fechaInicio, fechaFin);
      console.log('✅ Ingresos recibidos:', ingresos);
      
      console.log('📡 Llamando a getReporteProduccion...');
      const ventas = await getReporteProduccion(fechaInicio, fechaFin);
      console.log('✅ Ventas recibidas:', ventas);
      
      console.log('📡 Llamando a getReporteClientes...');
      const clientes = await getReporteClientes(fechaInicio, fechaFin);
      console.log('✅ Clientes recibidos:', clientes);
      
      console.log('📊 RESUMEN DE REPORTES:');
      console.log('  - Gastos:', gastos.length, 'registros');
      console.log('  - Ingresos:', ingresos.length, 'registros');
      console.log('  - Ventas:', ventas.length, 'registros');
      console.log('  - Clientes:', clientes.length, 'registros');
      
      setReporteGastos(gastos);
      setReporteIngresos(ingresos);
      setResumenVentas(ventas);
      setReporteClientes(clientes);
      
      if (gastos.length === 0 && ingresos.length === 0 && ventas.length === 0 && clientes.length === 0) {
        console.warn('⚠️ No hay datos para mostrar');
        toast.info(t('jewelry.reports.noData'));
      } else {
        console.log('✅ Reportes generados con éxito');
        toast.success(t('jewelry.reports.generated'));
      }
    } catch (error) {
      console.error('❌ ERROR COMPLETO:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
      console.log('🏁 FIN - loadReportes completado');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const totalGastos = reporteGastos.reduce((sum, g) => sum + g.total, 0);
  const totalIngresos = reporteIngresos.reduce((sum, i) => sum + i.total, 0);
  const totalUtilidad = reporteIngresos.reduce((sum, i) => sum + i.utilidad, 0);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error(t('jewelry.common.noData'));
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${fechaInicio}_${fechaFin}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('jewelry.common.saveSuccess'));
  };

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general">
          <FileText className="h-4 w-4 mr-2" />
          {t('jewelry.reports.title')}
        </TabsTrigger>
        <TabsTrigger value="clientes">
          <Package className="h-4 w-4 mr-2" />
          {t('jewelry.reports.clients')}
        </TabsTrigger>
        <TabsTrigger value="materiales">
          <Package className="h-4 w-4 mr-2" />
          {t('jewelry.rawMaterials.title')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>{t('jewelry.reports.title')}</CardTitle>
            <CardDescription>
              {t('jewelry.reports.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('jewelry.reports.startDate')}</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('jewelry.reports.endDate')}</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadReportes} className="w-full" disabled={loading}>
                  {loading ? t('jewelry.reports.generating') : t('jewelry.reports.generate')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen general */}
        {(reporteGastos.length > 0 || reporteIngresos.length > 0) && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('jewelry.reports.totalExpenses')}</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatearMonto(totalGastos)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('jewelry.reports.totalIncome')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatearMonto(totalIngresos)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('jewelry.reports.netProfit')}</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatearMonto(totalUtilidad)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reporte de gastos */}
        {reporteGastos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('jewelry.reports.materialExpenses')}</CardTitle>
                  <CardDescription>
                    {t('jewelry.reports.dateRange')}: {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(reporteGastos, 'gastos_materiales')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('jewelry.reports.export')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reporteGastos.map((gasto, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="font-medium">{gasto.categoria}</span>
                    <span className="font-bold">{formatearMonto(gasto.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded font-bold">
                  <span>{t('jewelry.common.total').toUpperCase()}</span>
                  <span>{formatearMonto(totalGastos)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reporte de ingresos */}
        {reporteIngresos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('jewelry.reports.salesIncome')}</CardTitle>
                  <CardDescription>
                    {t('jewelry.reports.dateRange')}: {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(reporteIngresos, 'ingresos_ventas')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('jewelry.reports.export')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reporteIngresos.map((ingreso, index) => (
                  <div key={index} className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{ingreso.categoria}</span>
                      <span className="font-bold text-green-600">{formatearMonto(ingreso.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                      <span>{t('jewelry.reports.summary.profitMargin')}:</span>
                      <span>{formatearMonto(ingreso.utilidad)}</span>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-primary/10 rounded">
                  <div className="flex justify-between items-center font-bold">
                    <span>{t('jewelry.reports.totalIncome').toUpperCase()}</span>
                    <span className="text-green-600">{formatearMonto(totalIngresos)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold mt-1">
                    <span>{t('jewelry.reports.summary.profitMargin').toUpperCase()}</span>
                    <span className="text-primary">{formatearMonto(totalUtilidad)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de ventas por joya */}
        {resumenVentas.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('jewelry.reports.summary.title')}</CardTitle>
                  <CardDescription>
                    {t('jewelry.reports.summary.description')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(resumenVentas, 'resumen_ventas_joyas')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('jewelry.reports.export')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resumenVentas.map((venta, index) => (
                  <Card key={index}>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <p className="font-medium">{venta.nombre}</p>
                          <p className="text-xs text-muted-foreground">SKU: {venta.sku} | {venta.categoria}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.sales.title')}:</span>
                          <p className="font-medium">{venta.total_ventas}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.production.form.quantity')}:</span>
                          <p className="font-medium">{venta.cantidad_vendida} {t('jewelry.inventory.table.stock')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.reports.totalIncome')}:</span>
                          <p className="font-bold text-green-600">{formatearMonto(venta.ingresos_totales)}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className="text-muted-foreground">{t('jewelry.reports.summary.profitMargin')}:</span>
                          <p className="font-bold text-primary">{formatearMonto(venta.utilidad_total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && reporteGastos.length === 0 && reporteIngresos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('jewelry.reports.noData')}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="clientes" className="space-y-4">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>{t('jewelry.reports.clientsReport')}</CardTitle>
            <CardDescription>
              {t('jewelry.reports.clientsReportDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('jewelry.reports.startDate')}</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('jewelry.reports.endDate')}</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadReportes} className="w-full" disabled={loading}>
                  {loading ? t('jewelry.reports.generating') : t('jewelry.reports.generate')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporte de clientes */}
        {reporteClientes.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('jewelry.reports.topClients')}</CardTitle>
                  <CardDescription>
                    {t('jewelry.reports.dateRange')}: {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(reporteClientes, 'reporte_clientes')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('jewelry.reports.export')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reporteClientes.map((cliente, index) => (
                  <Card key={index}>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="md:col-span-1">
                          <p className="font-medium">{cliente.cliente}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.reports.totalPurchases')}:</span>
                          <p className="font-medium">{cliente.total_ventas}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.reports.itemsPurchased')}:</span>
                          <p className="font-medium">{cliente.cantidad_compras}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.reports.totalSpent')}:</span>
                          <p className="font-bold text-green-600">{formatearMonto(cliente.total_gastado)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.reports.profitGenerated')}:</span>
                          <p className="font-bold text-primary">{formatearMonto(cliente.utilidad_generada)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && reporteClientes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('jewelry.reports.noData')}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="materiales">
        <ReporteMateriaPrima businessId={businessId} />
      </TabsContent>
    </Tabs>
  );
}



















