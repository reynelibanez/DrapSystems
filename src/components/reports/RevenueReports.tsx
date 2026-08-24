

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../AuthProvider';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Alert, AlertDescription } from '../ui/alert';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { Calendar as CalendarComponent } from '../ui/calendar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface RevenueData {
  total: number;
  byService: Array<{
    service_name: string;
    total: number;
    count: number;
  }>;
  byMonth: Array<{
    month: string;
    total: number;
    cumulative: number;
  }>;
  byPaymentMethod: Array<{
    payment_method: string;
    total: number;
  }>;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export function RevenueReports() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [allTimeCumulativeData, setAllTimeCumulativeData] = useState<Array<{ month: string; cumulative: number }>>([]);
  const [period, setPeriod] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    // Inicializar selectedBusinessId según el rol
    if (profile?.role === 'business_owner' && profile?.business_id) {
      setSelectedBusinessId(profile.business_id);
    } else if (profile?.role === 'staff' && profile?.business_id) {
      setSelectedBusinessId(profile.business_id);
    } else if (profile?.role === 'admin') {
      loadBusinesses();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadRevenueData();
      loadAllTimeCumulativeData(); // ✅ Cargar datos acumulativos de todo el tiempo
    }
  }, [period, selectedBusinessId, profile, customStartDate, customEndDate]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      setBusinesses(data || []);
      if (data && data.length > 0) {
        setSelectedBusinessId('all');
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
    }
  };

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (period === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        switch (period) {
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          default:
            startDate = subMonths(now, 12);
            endDate = now;
        }
      }

      // Construir query base
      let query = supabase
        .from('appointments')
        .select(`
          id,
          service_id,
          start_time,
          services (
            name,
            price
          )
        `)
        .eq('status', 'completed')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      // Filtrar según el rol - business_owner y staff solo ven su empresa
      if (profile?.role === 'business_owner' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id);
      } else if (profile?.role === 'staff' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id);
      } else if (profile?.role === 'admin' && selectedBusinessId && selectedBusinessId !== 'all') {
        query = query.eq('business_id', selectedBusinessId);
      }
      // Si es admin y selectedBusinessId === 'all', no filtramos por business_id (todas las empresas)

      const { data: appointments, error: appointmentsError } = await query;

      if (appointmentsError) throw appointmentsError;

      // Calcular totales
      const total = appointments?.reduce((sum, apt) => sum + (apt.services?.price || 0), 0) || 0;

      // Agrupar por servicio
      const serviceMap = new Map<string, { total: number; count: number }>();
      appointments?.forEach(apt => {
        const serviceName = apt.services?.name || 'Sin servicio';
        const current = serviceMap.get(serviceName) || { total: 0, count: 0 };
        serviceMap.set(serviceName, {
          total: current.total + (apt.services?.price || 0),
          count: current.count + 1
        });
      });

      const byService = Array.from(serviceMap.entries()).map(([service_name, data]) => ({
        service_name,
        ...data
      })).sort((a, b) => b.total - a.total);

      // Agrupar por mes
      const monthMap = new Map<string, number>();
      appointments?.forEach(apt => {
        const month = format(new Date(apt.start_time), 'MMM yyyy', { locale: es });
        monthMap.set(month, (monthMap.get(month) || 0) + (apt.services?.price || 0));
      });

      const byMonth = Array.from(monthMap.entries()).map(([month, total]) => ({
        month,
        total
      }));

      // Calcular ingresos acumulativos
      let cumulative = 0;
      const byMonthWithCumulative = byMonth.map(item => {
        cumulative += item.total;
        return {
          ...item,
          cumulative
        };
      });

      setRevenueData({
        total,
        byService,
        byMonth: byMonthWithCumulative,
        byPaymentMethod: []
      });
    } catch (err) {
      console.error('Error loading revenue data:', err);
      setError(t('errorLoadingRevenueData'));
    } finally {
      setLoading(false);
    }
  };

  const loadAllTimeCumulativeData = async () => {
    try {
      // Construir query base SIN filtro de fecha
      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          services (
            price
          )
        `)
        .eq('status', 'completed')
        .order('start_time', { ascending: true });

      // Filtrar según el rol - business_owner y staff solo ven su empresa
      if (profile?.role === 'business_owner' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id);
      } else if (profile?.role === 'staff' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id);
      } else if (profile?.role === 'admin' && selectedBusinessId && selectedBusinessId !== 'all') {
        query = query.eq('business_id', selectedBusinessId);
      }

      const { data: appointments, error: appointmentsError } = await query;

      if (appointmentsError) throw appointmentsError;

      // Agrupar por mes
      const monthMap = new Map<string, number>();
      appointments?.forEach(apt => {
        const month = format(new Date(apt.start_time), 'MMM yyyy', { locale: es });
        monthMap.set(month, (monthMap.get(month) || 0) + (apt.services?.price || 0));
      });

      const byMonth = Array.from(monthMap.entries()).map(([month, total]) => ({
        month,
        total
      }));

      // Calcular ingresos acumulativos
      let cumulative = 0;
      const cumulativeData = byMonth.map(item => {
        cumulative += item.total;
        return {
          month: item.month,
          cumulative
        };
      });

      setAllTimeCumulativeData(cumulativeData);
    } catch (err) {
      console.error('Error loading all-time cumulative data:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const exportData = () => {
    if (!revenueData) return;

    const csvContent = [
      ['Reporte de Ingresos'],
      ['Período', period],
      [''],
      ['Resumen'],
      ['Total de Ingresos', formatCurrency(revenueData.total)],
      [''],
      ['Por Servicio'],
      ['Servicio', 'Cantidad', 'Ingresos', 'Promedio'],
      ...revenueData.byService.map(s => [
        s.service_name,
        s.count,
        formatCurrency(s.total),
        formatCurrency(s.total / s.count)
      ]),
      [''],
      ['Por Mes'],
      ['Mes', 'Ingresos'],
      ...revenueData.byMonth.map(m => [m.month, formatCurrency(m.total)]),
    ]
      .map(row => row.join(','))
      .join('\n');

    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ingresos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    // Agregar al DOM, hacer click y remover
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar el URL después de un pequeño delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success(t('reportExportedSuccessfully'));
  };

  if (loading && !revenueData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
          <CardDescription>{t('selectBusinessAndPeriod')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>{t('period')}</Label>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t('thisMonth')}</SelectItem>
                  <SelectItem value="year">{t('thisYear')}</SelectItem>
                  <SelectItem value="all">{t('last12Months')}</SelectItem>
                  <SelectItem value="custom">{t('customRange')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <Label>{t('startDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'PPP', { locale: es }) : t('selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>{t('endDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'PPP', { locale: es }) : t('selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Solo mostrar selector de negocio para admin */}
            {profile?.role === 'admin' && (
              <div>
                <Label>{t('business')}</Label>
                <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBusiness')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={exportData} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {t('export')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('totalIncome')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "font-bold",
            (revenueData?.total || 0) >= 1000000 ? "text-2xl" : (revenueData?.total || 0) >= 100000 ? "text-3xl" : "text-4xl"
          )}>
            {formatCurrency(revenueData?.total || 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {period === 'month' && t('inCurrentMonth')}
            {period === 'year' && t('inCurrentYear')}
            {period === 'all' && t('inLast12Months')}
            {period === 'custom' && t('inSelectedPeriod')}
          </p>
        </CardContent>
      </Card>

      {/* Gráficas de Ingresos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfica de Barras - Ingresos por Mes */}
        {revenueData?.byMonth && revenueData.byMonth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('revenueByMonth')}</CardTitle>
              <CardDescription>{t('monthlyRevenueTrend')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="total" fill="#10B981" name={t('revenue')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfica de Líneas - Tendencia de Ingresos Acumulativos */}
        {allTimeCumulativeData && allTimeCumulativeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('revenueTrend')}</CardTitle>
              <CardDescription>{t('cumulativeRevenueEvolution')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={allTimeCumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name={t('cumulativeRevenue')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfica de Pastel - Distribución por Servicio */}
      {revenueData?.byService && revenueData.byService.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('revenueDistributionByService')}</CardTitle>
            <CardDescription>{t('serviceContribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData.byService.slice(0, 10)}
                    dataKey="total"
                    nameKey="service_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.service_name}: ${formatCurrency(entry.total)}`}
                  >
                    {revenueData.byService.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingresos por Servicio - Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>{t('revenueByService')}</CardTitle>
          <CardDescription>{t('mostProfitableServices')}</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData?.byService && revenueData.byService.length > 0 ? (
            <div className="space-y-4">
              {revenueData.byService.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{service.service_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.count} {service.count === 1 ? t('appointment') : t('appointments')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      service.total >= 100000 ? "text-base" : service.total >= 10000 ? "text-lg" : "text-xl"
                    )}>
                      {formatCurrency(service.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(service.total / service.count)} {t('average')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('noRevenueData')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

















