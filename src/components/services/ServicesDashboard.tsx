import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, TrendingUp, Users, BarChart3, ShoppingBag, Receipt, FileBarChart, Settings, User, UserCog } from 'lucide-react';
import { ServiceManagement } from './ServiceManagement';
import { InvoiceManagement } from './InvoiceManagement';
import { ServiceReports } from './ServiceReports';
import { DetailedReports } from './DetailedReports';
import { ClientManagement } from '@/components/business/ClientManagement';
import { ServicesBusinessSettings } from './ServicesBusinessSettings';
import { UserProfile } from '@/components/shared/UserProfile';
import { StaffManagement } from '@/components/business/StaffManagement';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getPlanLimits } from '@/lib/plan-limits';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export function ServicesDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [planFeatures, setPlanFeatures] = useState({
    maxStaff: -1,
    maxServices: -1,
    maxClients: -1,
    hasAdvancedReports: true,
    hasCustomBranding: true,
    hasApiAccess: true,
  });
  const [dashboardData, setDashboardData] = useState({
    monthlyRevenue: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    totalCommissions: 0,
    netProfit: 0,
    paidInvoices: 0,
    cancelledInvoices: 0,
    topServices: [] as Array<{ name: string; revenue: number; count: number }>,
  });

  useEffect(() => {
    if (profile?.business_id) {
      loadDashboardData();
      loadBusiness();
    }
  }, [profile?.business_id]);

  // Escuchar evento para cambiar a facturas
  useEffect(() => {
    const handleSwitchToInvoices = () => {
      console.log('📋 Switching to invoices tab from dashboard...');
      setActiveTab('invoices');
    };

    window.addEventListener('switchToInvoices', handleSwitchToInvoices);

    return () => {
      window.removeEventListener('switchToInvoices', handleSwitchToInvoices);
    };
  }, []);

  // Escuchar evento para recargar datos cuando se actualice una factura
  useEffect(() => {
    const handleInvoiceUpdated = () => {
      console.log('🔄 Invoice updated, reloading dashboard data...');
      loadDashboardData();
    };

    window.addEventListener('invoiceUpdated', handleInvoiceUpdated);

    return () => {
      window.removeEventListener('invoiceUpdated', handleInvoiceUpdated);
    };
  }, [profile?.business_id]);

  const loadBusiness = async () => {
    if (!profile?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single();

      if (!error && data) {
        setBusiness(data);
        loadPlanFeatures(data.subscription_plan);
      }
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  const loadPlanFeatures = (plan: string) => {
    const limits = getPlanLimits(plan);
    
    setPlanFeatures({
      maxStaff: limits.users === 'unlimited' ? -1 : limits.users,
      maxServices: -1, // No hay límite de servicios definido en plan-limits
      maxClients: limits.clients === 'unlimited' ? -1 : limits.clients,
      hasAdvancedReports: limits.features.includes('reports_advanced') || limits.features.includes('advanced_reports'),
      hasCustomBranding: limits.features.includes('custom_branding'),
      hasApiAccess: limits.features.includes('api_access'),
    });
  };

  const loadDashboardData = async () => {
    if (!profile?.business_id) return;

    try {
      setLoading(true);
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      console.log('📊 Loading dashboard data for business:', profile.business_id);
      console.log('📅 Date range:', startDate, 'to', endDate);

      // Cargar TODAS las facturas del mes (manuales y automáticas)
      const { data: invoices, error: invoicesError } = await supabase
        .from('service_invoices')
        .select('*')
        .eq('business_id', profile.business_id)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (invoicesError) throw invoicesError;

      console.log('📊 Loaded invoices (including auto-generated):', invoices?.length || 0);
      console.log('📊 Invoices by status:', {
        pending: invoices?.filter(i => i.status === 'pending').length || 0,
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
        cancelled: invoices?.filter(i => i.status === 'cancelled').length || 0,
        overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
      });

      // Cargar items de facturas (incluye appointment_id para facturas automáticas)
      const invoiceIds = invoices?.map(inv => inv.id) || [];
      let invoiceItems: any[] = [];
      
      if (invoiceIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('service_invoice_items')
          .select('*')
          .in('invoice_id', invoiceIds);

        if (itemsError) throw itemsError;
        invoiceItems = itemsData || [];
        
        console.log('📊 Loaded invoice items:', invoiceItems.length);
        console.log('📊 Items from appointments:', invoiceItems.filter(i => i.appointment_id).length);
      }

      // Cargar servicios
      const serviceIds = [...new Set(invoiceItems.map(item => item.service_id).filter(Boolean))];
      let servicesMap = new Map<string, string>();
      
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        servicesMap = new Map(servicesData?.map(s => [s.id, s.name]) || []);
      }

      // Calcular métricas (incluye facturas automáticas)
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending') || [];
      const cancelledInvoices = invoices?.filter(inv => inv.status === 'cancelled') || [];

      const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      // Calcular comisiones de TODAS las facturas pagadas
      const totalCommissions = invoiceItems
        .filter(item => {
          const invoice = paidInvoices.find(inv => inv.id === item.invoice_id);
          return invoice !== undefined;
        })
        .reduce((sum, item) => sum + (item.commission_amount || 0), 0);

      const netProfit = monthlyRevenue - totalCommissions;

      // Top servicios (incluye servicios de citas completadas)
      const serviceStats = new Map<string, { revenue: number; count: number }>();
      invoiceItems.forEach(item => {
        const invoice = paidInvoices.find(inv => inv.id === item.invoice_id);
        if (!invoice) return;

        const serviceName = servicesMap.get(item.service_id) || item.description || t('servicesModule.common.noName');
        const existing = serviceStats.get(serviceName) || { revenue: 0, count: 0 };
        
        serviceStats.set(serviceName, {
          revenue: existing.revenue + (item.subtotal || 0),
          count: existing.count + (item.quantity || 0),
        });
      });

      const topServices = Array.from(serviceStats.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const newDashboardData = {
        monthlyRevenue,
        pendingInvoices: pendingInvoices.length,
        pendingAmount,
        totalCommissions,
        netProfit,
        paidInvoices: paidInvoices.length,
        cancelledInvoices: cancelledInvoices.length,
        topServices,
      };

      console.log('📊 Dashboard metrics calculated:', newDashboardData);

      setDashboardData(newDashboardData);
      
      console.log('✅ Dashboard data updated successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('servicesModule.common.loading')}</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const isBusinessOwner = profile.role === 'business_owner';

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full"
      activationMode="manual"
    >
      <div className="flex gap-3 sm:gap-4 p-1 sm:p-2 mt-4">
        {/* Columna Izquierda - Perfil (solo desktop) */}
        <aside className="hidden lg:block w-48 lg:w-56 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <Card className="border-2 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || t('servicesModule.common.user')} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <span className="text-2xl font-bold text-primary">
                          {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <h3 className="text-sm font-semibold mb-1 truncate">
                      {profile.full_name || profile.email}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {isAdmin && t('admin')}
                      {isBusinessOwner && t('business_owner')}
                    </span>
                    {profile.email && (
                      <p className="text-xs text-muted-foreground mt-1.5 break-all line-clamp-2">
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Columna Central - Contenido Principal */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 pb-28 lg:pb-0">
          <div className="pb-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t('servicesModule.title')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t('servicesModule.description')}
            </p>
          </div>

          {/* Tarjeta de información del usuario (solo móvil) */}
          <Card className="border-2 shadow-sm lg:hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || t('servicesModule.common.user')} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-2xl sm:text-3xl font-bold text-primary">
                        {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold truncate">
                    {profile.full_name || profile.email}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {isAdmin && t('admin')}
                      {isBusinessOwner && t('business_owner')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs fijos en la parte inferior para móvil */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 mobile-tabs-fixed overflow-x-auto">
            <TabsList className="flex h-auto gap-1 bg-transparent p-2 pb-safe mobile-tabs-scroll w-full min-w-full">
              <TabsTrigger value="overview" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.services')}</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <Users className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.clients')}</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <UserCog className="w-5 h-5" />
                <span className="text-xs">{t('staff')}</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <Receipt className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.invoices')}</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.reports')}</span>
              </TabsTrigger>
              <TabsTrigger value="detailed-reports" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <FileBarChart className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.detailedReports')}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <Settings className="w-5 h-5" />
                <span className="text-xs">{t('servicesModule.tabs.settings')}</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                <User className="w-5 h-5" />
                <span className="text-xs">{t('profile')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido de los Tabs */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('servicesModule.common.loading')}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Gráficas principales */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Gráfica de Resumen Financiero */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('servicesModule.overview.summary')}</CardTitle>
                      <CardDescription>{t('servicesModule.overview.incomeExpensesProfit')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              name: t('servicesModule.overview.financial'),
                              [t('servicesModule.overview.income')]: dashboardData.monthlyRevenue,
                              [t('servicesModule.common.commission')]: dashboardData.totalCommissions,
                              [t('servicesModule.overview.profit')]: dashboardData.netProfit,
                            }
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `$${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Bar dataKey={t('servicesModule.overview.income')} fill="#22c55e" />
                          <Bar dataKey={t('servicesModule.common.commission')} fill="#ef4444" />
                          <Bar dataKey={t('servicesModule.overview.profit')} fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.overview.income')}</p>
                          <p className="text-lg font-bold text-green-600">${dashboardData.monthlyRevenue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.common.commission')}</p>
                          <p className="text-lg font-bold text-red-600">${dashboardData.totalCommissions.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.overview.profit')}</p>
                          <p className="text-lg font-bold text-blue-600">${dashboardData.netProfit.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfica de Estado de Facturas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('servicesModule.invoiceManagement.status')}</CardTitle>
                      <CardDescription>{t('servicesModule.serviceReports.invoicesByStatus')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('servicesModule.invoiceManagement.statuses.paid'), value: dashboardData.paidInvoices, color: '#22c55e' },
                              { name: t('servicesModule.invoiceManagement.statuses.pending'), value: dashboardData.pendingInvoices, color: '#f59e0b' },
                              { name: t('servicesModule.invoiceManagement.statuses.cancelled'), value: dashboardData.cancelledInvoices, color: '#ef4444' },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: t('servicesModule.invoiceManagement.statuses.paid'), value: dashboardData.paidInvoices, color: '#22c55e' },
                              { name: t('servicesModule.invoiceManagement.statuses.pending'), value: dashboardData.pendingInvoices, color: '#f59e0b' },
                              { name: t('servicesModule.invoiceManagement.statuses.cancelled'), value: dashboardData.cancelledInvoices, color: '#ef4444' },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.invoiceManagement.statuses.paid')}</p>
                          <p className="text-lg font-bold text-green-600">{dashboardData.paidInvoices}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.invoiceManagement.statuses.pending')}</p>
                          <p className="text-lg font-bold text-orange-600">{dashboardData.pendingInvoices}</p>
                          <p className="text-xs text-muted-foreground">${dashboardData.pendingAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('servicesModule.invoiceManagement.statuses.cancelled')}</p>
                          <p className="text-lg font-bold text-red-600">{dashboardData.cancelledInvoices}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfica de Top Servicios */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('servicesModule.serviceReports.topServices')}</CardTitle>
                      <CardDescription>{t('servicesModule.serviceReports.topServicesDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.topServices.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          {t('servicesModule.serviceReports.noData')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={dashboardData.topServices}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip 
                              formatter={(value: number) => `$${value.toFixed(2)}`}
                              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Bar dataKey="revenue" fill="#5AC1FF" name={t('servicesModule.overview.income')} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gráfica de Distribución de Ganancias */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('servicesModule.serviceReports.revenueDistribution')}</CardTitle>
                      <CardDescription>{t('servicesModule.serviceReports.revenueDistributionDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('servicesModule.overview.companyProfit'), value: dashboardData.netProfit, color: '#22c55e' },
                              { name: t('servicesModule.common.commission'), value: dashboardData.totalCommissions, color: '#ef4444' },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {[
                              { name: t('servicesModule.overview.companyProfit'), value: dashboardData.netProfit, color: '#22c55e' },
                              { name: t('servicesModule.common.commission'), value: dashboardData.totalCommissions, color: '#ef4444' },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `$${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-center">
                        <p className="text-xs text-muted-foreground">{t('servicesModule.overview.profitMargin')}</p>
                        <p className="text-3xl font-bold text-green-600">
                          {dashboardData.monthlyRevenue > 0 
                            ? ((dashboardData.netProfit / dashboardData.monthlyRevenue) * 100).toFixed(1)
                            : '0.0'}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <ClientManagement 
              businessId={profile.business_id || ''} 
              showSMSOption={false}
              showAppointmentNotes={false}
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-0">
            <StaffManagement 
              businessId={profile.business_id || ''} 
              planFeatures={planFeatures}
            />
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            <InvoiceManagement />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ServiceReports />
          </TabsContent>

          <TabsContent value="detailed-reports" className="mt-0">
            <DetailedReports />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ServicesBusinessSettings 
              business={business} 
              onUpdate={loadBusiness}
              initialTab="info"
            />
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            <UserProfile />
          </TabsContent>
        </div>

        {/* Columna Derecha - Tabs de navegación (solo desktop) */}
        <aside className="hidden lg:block w-48 xl:w-56 flex-shrink-0">
          <div className="fixed top-[105px] w-48 xl:w-56 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pl-2">
            <Card className="border-2 shadow-sm">
              <CardContent className="p-2 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
                <TabsList className="flex flex-col w-full h-auto bg-transparent gap-1">
                  <TabsTrigger value="overview" className="w-full justify-start gap-2 px-2 py-2">
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.overview')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="services" className="w-full justify-start gap-2 px-2 py-2">
                    <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.services')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="w-full justify-start gap-2 px-2 py-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.clients')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="w-full justify-start gap-2 px-2 py-2">
                    <UserCog className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('staff')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="w-full justify-start gap-2 px-2 py-2">
                    <Receipt className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.invoices')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="w-full justify-start gap-2 px-2 py-2">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.reports')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="detailed-reports" className="w-full justify-start gap-2 px-2 py-2">
                    <FileBarChart className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.detailedReports')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="w-full justify-start gap-2 px-2 py-2">
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('servicesModule.tabs.settings')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="w-full justify-start gap-2 px-2 py-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs xl:text-sm truncate">{t('profile')}</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </Tabs>
  );
}

















































