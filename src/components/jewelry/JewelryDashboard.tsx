import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  LayoutDashboard, 
  Gem, 
  Package, 
  Factory, 
  ShoppingCart, 
  Warehouse, 
  BarChart3,
  Boxes,
  TrendingUp,
  DollarSign,
  Settings,
  User,
  Users,
  AlertTriangle
} from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getEstadisticasGenerales } from '../../lib/api/jewelry';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { CurrencySelector } from './CurrencySelector';
import type { JwlEstadisticas } from '../../lib/types/jewelry.types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthProvider';

// Importar los componentes de cada sección
import { MateriaPrimasList } from './MateriaPrimasList';
import { JoyasList } from './JoyasList';
import { ProduccionList } from './ProduccionList';
import { VentasList } from './VentasList';
import { InventarioView } from './InventarioView';
import { ReportesView } from './ReportesView';
import { BusinessSettings } from '../business/BusinessSettings';
import { UserProfile } from '../shared/UserProfile';
import { ClientManagement } from '../business/ClientManagement';

interface JewelryDashboardProps {
  businessId: string;
  business?: any;
}

export function JewelryDashboard({ businessId, business }: JewelryDashboardProps) {
  console.log('🔍 JewelryDashboard: Recibido businessId como prop:', businessId, 'tipo:', typeof businessId);
  console.log('🏢 JewelryDashboard: Recibido business:', business);
  
  const { t } = useTranslation();
  const [stats, setStats] = useState<JwlEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    if (!businessId) {
      console.error('❌ loadDashboard: businessId no está disponible');
      setLoading(false);
      return;
    }

    try {
      // NO setear loading a true si ya tenemos stats
      // Solo mostrar loading en la carga inicial
      if (!stats) {
        setLoading(true);
      }
      console.log('🔄 JewelryDashboard: Obteniendo estadísticas...');
      const statsData = await getEstadisticasGenerales();
      console.log('✅ JewelryDashboard: Estadísticas cargadas:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ JewelryDashboard: Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 JewelryDashboard useEffect: businessId =', businessId);
    if (businessId) {
      console.log('✅ JewelryDashboard: Cargando dashboard con businessId:', businessId);
      loadDashboard();
    } else {
      console.error('❌ JewelryDashboard: businessId no está disponible en useEffect');
      setLoading(false);
    }
  }, [businessId]);

  // Validar que businessId esté disponible ANTES de renderizar cualquier cosa
  if (!businessId) {
    console.error('❌ JewelryDashboard: businessId no está disponible, mostrando error');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('jewelry.common.error')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    console.log('⏳ JewelryDashboard: Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  console.log('✅ JewelryDashboard: Renderizando contenido con businessId:', businessId);
  // Ahora que sabemos que businessId existe, podemos usar el hook
  return <JewelryDashboardContent businessId={businessId} business={business} stats={stats} onUpdate={loadDashboard} />;
}

// Componente separado que usa el hook useCurrency
function JewelryDashboardContent({ 
  businessId, 
  business: businessProp,
  stats, 
  onUpdate 
}: { 
  businessId: string;
  business?: any;
  stats: JwlEstadisticas | null;
  onUpdate: () => void;
}) {
  const { t } = useTranslation();
  const { formatearMontoConvertido, moneda, reloadCurrency } = useCurrency(businessId);
  const [business, setBusiness] = useState<any>(businessProp);
  const [loadingBusiness, setLoadingBusiness] = useState(!businessProp);

  // Cargar business si no se pasó como prop
  useEffect(() => {
    const loadBusiness = async () => {
      if (businessProp) {
        setBusiness(businessProp);
        setLoadingBusiness(false);
        return;
      }

      try {
        setLoadingBusiness(true);
        const { supabase } = await import('../../lib/supabase');
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        if (!error && data) {
          setBusiness(data);
        }
      } catch (error) {
        console.error('Error loading business:', error);
      } finally {
        setLoadingBusiness(false);
      }
    };

    loadBusiness();
  }, [businessId, businessProp]);

  const formatCurrency = (value: number) => {
    return formatearMontoConvertido(value, 'CLP');
  };

  // Callback para cuando cambie la moneda
  const handleCurrencyChange = async () => {
    await reloadCurrency();
    await onUpdate(); // También recargar las estadísticas
  };

  // Callback para cuando se actualice el business
  const handleBusinessUpdate = async () => {
    // Recargar el business
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (!error && data) {
        setBusiness(data);
      }
    } catch (error) {
      console.error('Error reloading business:', error);
    }
    
    // También llamar al onUpdate original
    await onUpdate();
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gem className="h-8 w-8 text-primary" />
            {t('jewelry.dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('jewelry.description')}
          </p>
        </div>
        <CurrencySelector 
          businessId={businessId} 
          onCurrencyChange={handleCurrencyChange}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('jewelry.rawMaterials.title')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.valor_inventario_materiales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_materiales || 0} {t('jewelry.rawMaterials.noMaterials').toLowerCase().replace('no hay ', '').replace(' registradas', ' registrados')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('jewelry.inventory.title')}
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.valor_inventario_joyas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_joyas || 0} {t('jewelry.inventory.noItems').toLowerCase().replace('no hay ', '').replace(' en el inventario', ' en catálogo')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('jewelry.sales.title')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.ingresos_totales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_ventas || 0} {t('jewelry.sales.noSales').toLowerCase().replace('no hay ', '').replace(' registradas', ' realizadas')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('jewelry.reports.summary.profitMargin')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.ganancia_neta || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('jewelry.rawMaterials.table.cost')}: {formatCurrency(stats?.gastos_totales || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="materiales" className="space-y-4">
        {/* Tabs para Desktop - ocultos en móvil */}
        <TabsList className="hidden lg:inline-flex w-full h-auto flex-wrap gap-2 p-2 bg-muted">
          <TabsTrigger value="materiales" className="flex items-center gap-2 px-4 py-2">
            <Package className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.rawMaterials')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.rawMaterials').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="joyas" className="flex items-center gap-2 px-4 py-2">
            <Gem className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.inventory')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.inventory').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="produccion" className="flex items-center gap-2 px-4 py-2">
            <Factory className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.production')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.production').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="ventas" className="flex items-center gap-2 px-4 py-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.sales')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.sales').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="inventario" className="flex items-center gap-2 px-4 py-2">
            <Boxes className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.inventoryView')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.inventoryView').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2 px-4 py-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden xl:inline">{t('jewelry.tabs.reports')}</span>
            <span className="xl:hidden">{t('jewelry.tabs.reports').split(' ')[0]}</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2 px-4 py-2">
            <Users className="h-4 w-4" />
            <span>{t('clients')}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2">
            <Settings className="h-4 w-4" />
            <span>{t('settings')}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-2">
            <User className="h-4 w-4" />
            <span>{t('profile')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tabs fijos en la parte inferior para móvil */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 mobile-tabs-fixed overflow-x-auto">
          <TabsList className="flex h-auto gap-1 bg-transparent p-2 pb-safe mobile-tabs-scroll w-full min-w-full">
            <TabsTrigger value="materiales" className="flex-shrink-0">
              <Package className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.rawMaterials')}</span>
            </TabsTrigger>
            <TabsTrigger value="joyas" className="flex-shrink-0">
              <Gem className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.inventory')}</span>
            </TabsTrigger>
            <TabsTrigger value="produccion" className="flex-shrink-0">
              <Factory className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.production')}</span>
            </TabsTrigger>
            <TabsTrigger value="ventas" className="flex-shrink-0">
              <ShoppingCart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.sales')}</span>
            </TabsTrigger>
            <TabsTrigger value="inventario" className="flex-shrink-0">
              <Boxes className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.inventoryView')}</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex-shrink-0">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('jewelry.tabs.reports')}</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex-shrink-0">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('clients')}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-shrink-0">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('settings')}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-shrink-0">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('profile')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="materiales" className="space-y-4">
          <MateriaPrimasList businessId={businessId} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="joyas" className="space-y-4">
          <JoyasList businessId={businessId} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="produccion" className="space-y-4">
          <ProduccionList businessId={businessId} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="ventas" className="space-y-4">
          <VentasList businessId={businessId} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <InventarioView businessId={businessId} />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-6">
          <ReportesView businessId={businessId} />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientManagement 
            businessId={businessId}
            showSMSOption={false}
            showAppointmentNotes={false}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {loadingBusiness ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : business ? (
            <BusinessSettings business={business} onUpdate={handleBusinessUpdate} />
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('jewelry.common.error')}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <UserProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
}

















































