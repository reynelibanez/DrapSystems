import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, TrendingUp, TrendingDown, DollarSign, AlertTriangle, BarChart3, Box, ArrowLeftRight } from 'lucide-react';
import { AlmacenesView } from './AlmacenesView';
import { ProductosView } from './ProductosView';
import { ExistenciasView } from './ExistenciasView';
import { RecepcionesView } from './RecepcionesView';
import { TransferenciasView } from './TransferenciasView';
import { ValesSalidaView } from './ValesSalidaView';
import { ReportesInventarioView } from './ReportesInventarioView';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DashboardStats {
  totalProductos: number;
  totalAlmacenes: number;
  valorInventario: number;
  productosActivos: number;
  productosBajoStock: number;
  movimientosHoy: number;
}

interface InventarioDashboardProps {
  businessId?: string;
}

export function InventarioDashboard({ businessId }: InventarioDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('resumen');
  const [stats, setStats] = useState<DashboardStats>({
    totalProductos: 0,
    totalAlmacenes: 0,
    valorInventario: 0,
    productosActivos: 0,
    productosBajoStock: 0,
    movimientosHoy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadStats();
    }
  }, [businessId]);

  const loadStats = async () => {
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }

    try {
      setLoading(true);

      // Cargar estadísticas en paralelo
      const [productosResult, almacenesResult, existenciasResult] = await Promise.all([
        supabase
          .from('ng_productos_inventario')
          .select('*', { count: 'exact' })
          .eq('business_id', businessId),
        
        supabase
          .from('ng_almacen_inventario')
          .select('*', { count: 'exact' })
          .eq('business_id', businessId),
        
        supabase
          .from('il_existencias_inventario')
          .select('cantidad, costo')
          .eq('business_id', businessId)
      ]);

      // Verificar errores
      if (productosResult.error) throw productosResult.error;
      if (almacenesResult.error) throw almacenesResult.error;
      if (existenciasResult.error) throw existenciasResult.error;

      // Extraer datos
      const existencias = existenciasResult.data || [];

      // Calcular valor total del inventario
      const valorInventario = existencias.reduce((sum, item) => {
        return sum + (Number(item.cantidad) * Number(item.costo));
      }, 0);

      // Productos bajo stock (menos de 10 unidades)
      const productosBajoStock = existencias.filter(e => Number(e.cantidad) < 10).length;

      setStats({
        totalProductos: productosResult.count || 0,
        totalAlmacenes: almacenesResult.count || 0,
        valorInventario,
        productosActivos: productosResult.count || 0,
        productosBajoStock,
        movimientosHoy: 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('inventario.title', 'Gestión de Inventario')}
          </h1>
          <p className="text-muted-foreground">
            {t('inventario.subtitle', 'Control completo de productos, almacenes y movimientos')}
          </p>
        </div>
      </div>

      {/* Layout principal con tabs y contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda - Contenido (Stats + TabsContent) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Stats Cards - Dentro de la columna izquierda */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('inventario.stats.totalProductos', 'Total Productos')}
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProductos}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.productosActivos} {t('inventario.stats.activos', 'activos')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('inventario.stats.almacenes', 'Almacenes')}
                  </CardTitle>
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAlmacenes}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('inventario.stats.ubicaciones', 'ubicaciones de almacenamiento')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('inventario.stats.valorInventario', 'Valor Inventario')}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats.valorInventario.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('inventario.stats.costoTotal', 'costo total de existencias')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('inventario.stats.bajoStock', 'Productos Bajo Stock')}
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.productosBajoStock}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('inventario.stats.requierenAtencion', 'requieren atención')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('inventario.stats.movimientosHoy', 'Movimientos Hoy')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.movimientosHoy}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('inventario.stats.recepcionesHoy', 'recepciones registradas')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contenido de los tabs */}
            <TabsContent value="resumen" className="mt-0">
              <ReportesInventarioView businessId={businessId} />
            </TabsContent>

            <TabsContent value="productos" className="mt-0">
              <ProductosView businessId={businessId} onUpdate={loadStats} />
            </TabsContent>

            <TabsContent value="almacenes" className="mt-0">
              <AlmacenesView businessId={businessId} onUpdate={loadStats} />
            </TabsContent>

            <TabsContent value="existencias" className="mt-0">
              <ExistenciasView businessId={businessId} />
            </TabsContent>

            <TabsContent value="recepciones" className="mt-0">
              <RecepcionesView businessId={businessId} onUpdate={loadStats} />
            </TabsContent>

            <TabsContent value="vales" className="mt-0">
              <ValesSalidaView businessId={businessId} onUpdate={loadStats} />
            </TabsContent>

            <TabsContent value="transferencias" className="mt-0">
              <TransferenciasView businessId={businessId} onUpdate={loadStats} />
            </TabsContent>
          </div>

          {/* Columna derecha - Tabs fijos */}
          <aside className="lg:col-span-3">
            <div className="lg:fixed lg:top-[105px] lg:w-[calc((100vw-3rem-((100vw-3rem)/12*9)-1.5rem))] lg:right-[1.5rem] space-y-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Secciones</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-1 space-y-0.5">
                    <TabsTrigger 
                      value="resumen" 
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.resumen', 'Resumen')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="productos"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.productos', 'Productos')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="almacenes"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Warehouse className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.almacenes', 'Almacenes')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="existencias"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Box className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.existencias', 'Existencias')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="recepciones"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.recepciones', 'Recepciones')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="vales"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <TrendingDown className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.vales', 'Vales Salida')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transferencias"
                      className="w-full justify-start py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('inventario.tabs.transferencias', 'Transferencias')}</span>
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </Tabs>
    </div>
  );
}



















