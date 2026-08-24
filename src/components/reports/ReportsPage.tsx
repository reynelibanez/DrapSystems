import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AppointmentReports } from './AppointmentReports';
import { RevenueReports } from './RevenueReports';
import { SMSUsageReport } from './SMSUsageReport';
import { useAuth } from '../AuthProvider';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Alert, AlertDescription } from '../ui/alert';
import { BarChart3, DollarSign, Calendar, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

interface QuickStats {
  totalAppointments: number;
  totalRevenue: number;
  activeServices: number;
  occupancyRate: number;
}

export function ReportsPage() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ReportsPage mounted, profile:', profile);
    if (profile) {
      loadQuickStats();
    }
  }, [profile]);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      // Construir query base para citas
      let appointmentsQuery = supabase
        .from('appointments')
        .select('id, status, services(price)', { count: 'exact' })
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      // Filtrar según el rol
      if (profile?.role === 'business_owner' && profile?.business_id) {
        appointmentsQuery = appointmentsQuery.eq('business_id', profile.business_id);
      } else if (profile?.role === 'staff' && profile?.business_id) {
        appointmentsQuery = appointmentsQuery
          .eq('business_id', profile.business_id)
          .eq('staff_id', profile.id);
      }

      const { data: appointments, count: totalAppointments, error: aptError } = await appointmentsQuery;

      if (aptError) throw aptError;

      // Calcular ingresos totales
      const totalRevenue = appointments?.reduce((sum, apt: any) => {
        if (apt.status === 'completed') {
          return sum + (apt.services?.price || 0);
        }
        return sum;
      }, 0) || 0;

      // Obtener servicios activos
      let servicesQuery = supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      if (profile?.role === 'business_owner' && profile?.business_id) {
        servicesQuery = servicesQuery.eq('business_id', profile.business_id);
      } else if (profile?.role === 'staff' && profile?.business_id) {
        servicesQuery = servicesQuery.eq('business_id', profile.business_id);
      }

      const { count: activeServices, error: servicesError } = await servicesQuery;

      if (servicesError) throw servicesError;

      // Calcular tasa de ocupación (citas completadas / total de citas)
      const completedAppointments = appointments?.filter((apt: any) => apt.status === 'completed').length || 0;
      const occupancyRate = totalAppointments ? (completedAppointments / totalAppointments) * 100 : 0;

      setQuickStats({
        totalAppointments: totalAppointments || 0,
        totalRevenue,
        activeServices: activeServices || 0,
        occupancyRate,
      });
    } catch (err) {
      console.error('Error loading quick stats:', err);
      setError(t('errorLoadingStatistics'));
    } finally {
      setLoading(false);
    }
  };

  // Verificar que el usuario no sea cliente
  if (profile?.role === 'client') {
    return (
      <div className="w-full p-2 md:p-3">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('noPermissionReports')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="w-full p-2 md:p-3 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reportsAndStatistics')}</h1>
          <p className="text-muted-foreground">
            {t('detailedAnalysis')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalAppointments')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : quickStats?.totalAppointments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? t('loading') : t('thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : formatCurrency(quickStats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? t('loading') : t('thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('activeServices')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : quickStats?.activeServices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? t('loading') : t('available')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('occupancyRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : `${quickStats?.occupancyRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? t('loading') : t('thisMonth')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs de Reportes */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className={`grid w-full ${
          profile?.role === 'staff' ? 'grid-cols-1' : 
          profile?.role === 'business_owner' ? 'grid-cols-3' : 
          profile?.role === 'admin' ? 'grid-cols-3' : 
          'grid-cols-2'
        }`}>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            {t('appointmentReports')}
          </TabsTrigger>
          {profile?.role !== 'staff' && (
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              {t('revenueReports')}
            </TabsTrigger>
          )}
          {(profile?.role === 'business_owner' || profile?.role === 'admin') && (
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('smsUsageReports')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <ErrorBoundary fallback={<ErrorFallback message={t('errorLoadingAppointmentReports')} />}>
            <AppointmentReports />
          </ErrorBoundary>
        </TabsContent>

        {profile?.role !== 'staff' && (
          <TabsContent value="revenue" className="space-y-4">
            <ErrorBoundary fallback={<ErrorFallback message={t('errorLoadingRevenueReports')} />}>
              <RevenueReports />
            </ErrorBoundary>
          </TabsContent>
        )}

        {(profile?.role === 'business_owner' || profile?.role === 'admin') && (
          <TabsContent value="sms" className="space-y-4">
            <ErrorBoundary fallback={<ErrorFallback message="Error al cargar el reporte de SMS" />}>
              {profile?.role === 'business_owner' && profile?.business_id ? (
                <SMSUsageReport businessId={profile.business_id} />
              ) : (
                <SMSUsageReport />
              )}
            </ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in ReportsPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Error Fallback Component
function ErrorFallback({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}















