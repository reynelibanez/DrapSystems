
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
} from 'date-fns';
import { es } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { Calendar as CalendarComponent } from '../ui/calendar';

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  byStatus: { status: string; statusKey: string; count: number; percentage: number }[];
  byService: { service: string; count: number; revenue: number }[];
  byMonth: { month: string; count: number }[];
  byDay: { day: string; count: number }[];
  averageDuration: number;
  completionRate: number;
}

// Colores específicos para cada estado de cita
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',      // Amarillo/Naranja - secondary
  confirmed: '#5AC1FF',    // Azul primario - default/primary
  cancelled: '#FF5C5C',    // Rojo - destructive
  completed: '#10B981',    // Verde - success/outline
  no_show: '#EF4444',      // Rojo oscuro - destructive
};

// Función para obtener el color según el estado
const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || '#6B7280'; // Gris por defecto
};

// Función para traducir el nombre del estado
const getStatusLabel = (status: string, t: any): string => {
  const labels: Record<string, string> = {
    pending: t('pending'),
    confirmed: t('confirmed'),
    cancelled: t('cancelled'),
    completed: t('completed'),
    no_show: t('noShow'),
  };
  return labels[status] || status;
};

export function AppointmentReports() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    // Inicializar selectedBusiness según el rol
    if (profile?.role === 'business_owner' && profile?.business_id) {
      setSelectedBusiness(profile.business_id);
    } else if (profile?.role === 'staff' && profile?.business_id) {
      setSelectedBusiness(profile.business_id);
    } else if (profile?.role === 'admin') {
      setSelectedBusiness('all');
      loadBusinesses(); // Cargar lista de empresas para admin
    }
  }, [profile]);

  useEffect(() => {
    if (selectedBusiness && selectedBusiness !== 'all') {
      loadServices(selectedBusiness);
    } else {
      setServices([]);
      setSelectedService('all');
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedBusiness) {
      loadStats();
    }
  }, [dateRange, selectedBusiness, selectedService, profile]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
      // No establecer selectedBusinessId aquí, ya se inicializa en 'all'
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadServices = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }

    switch (dateRange) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        start = subMonths(now, 3);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'last-year':
        start = startOfYear(subYears(now, 1));
        end = endOfYear(subYears(now, 1));
        break;
      default:
        start = startOfMonth(now);
    }

    return { start, end };
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (name, price, duration_minutes),
          clients (full_name),
          businesses (name)
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      // Filtrar según el rol - business_owner y staff solo ven su empresa
      if (profile?.role === 'business_owner' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id);
      } else if (profile?.role === 'staff' && profile?.business_id) {
        query = query.eq('business_id', profile.business_id).eq('staff_id', profile.id);
      } else if (profile?.role === 'admin' && selectedBusiness !== 'all') {
        query = query.eq('business_id', selectedBusiness);
      }

      if (selectedService !== 'all') {
        query = query.eq('service_id', selectedService);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      const total = appointments?.length || 0;
      const completed = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;
      const pending = appointments?.filter(a => a.status === 'pending').length || 0;

      const statusCounts = appointments?.reduce((acc: any, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});

      const byStatus = Object.entries(statusCounts || {}).map(([status, count]) => ({
        status: getStatusLabel(status, t),
        statusKey: status,
        count: count as number,
        percentage: total > 0 ? ((count as number) / total) * 100 : 0,
      }));

      const serviceCounts = appointments?.reduce((acc: any, apt) => {
        const serviceName = apt.services?.name || 'Sin servicio';
        if (!acc[serviceName]) {
          acc[serviceName] = { count: 0, revenue: 0 };
        }
        acc[serviceName].count += 1;
        if (apt.status === 'completed') {
          acc[serviceName].revenue += apt.services?.price || 0;
        }
        return acc;
      }, {});

      const byService = Object.entries(serviceCounts || {}).map(([service, data]: [string, any]) => ({
        service,
        count: data.count,
        revenue: data.revenue,
      }));

      const monthCounts = appointments?.reduce((acc: any, apt) => {
        const month = format(new Date(apt.start_time), 'MMM yyyy', { locale: es });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const byMonth = Object.entries(monthCounts || {}).map(([month, count]) => ({
        month,
        count: count as number,
      }));

      const dayCounts = appointments?.reduce((acc: any, apt) => {
        const day = format(new Date(apt.start_time), 'EEEE', { locale: es });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const byDay = Object.entries(dayCounts || {}).map(([day, count]) => ({
        day,
        count: count as number,
      }));

      const totalDuration = appointments?.reduce(
        (sum, apt) => sum + (apt.services?.duration_minutes || 0),
        0
      ) || 0;

      const averageDuration = total > 0 ? totalDuration / total : 0;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      setStats({
        total,
        completed,
        cancelled,
        pending,
        byStatus,
        byService,
        byMonth,
        byDay,
        averageDuration,
        completionRate,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error(t('errorLoadingStatistics'));
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!stats) return;

    const csvContent = [
      ['Reporte de Citas'],
      ['Período', dateRange],
      [''],
      ['Resumen'],
      ['Total de Citas', stats.total],
      ['Completadas', stats.completed],
      ['Canceladas', stats.cancelled],
      ['Pendientes', stats.pending],
      ['Tasa de Completación', `${stats.completionRate.toFixed(2)}%`],
      ['Duración Promedio', `${stats.averageDuration} min`],
      [''],
      ['Por Servicio'],
      ['Servicio', 'Cantidad', 'Ingresos'],
      ...stats.byService.map(s => [s.service, s.count, `$${s.revenue.toFixed(2)}`]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-citas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('reportExportedSuccessfully'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loadingStatistics')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>{t('period')}</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('lastWeek')}</SelectItem>
                  <SelectItem value="month">{t('thisMonth')}</SelectItem>
                  <SelectItem value="quarter">{t('lastQuarter')}</SelectItem>
                  <SelectItem value="year">{t('thisYear')}</SelectItem>
                  <SelectItem value="last-year">{t('lastYear')}</SelectItem>
                  <SelectItem value="custom">{t('customRange')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
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
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
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

            {services.length > 0 && (
              <div>
                <Label>{t('service')}</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalAppointments')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "font-bold",
              (stats?.total || 0) >= 10000 ? "text-xl" : (stats?.total || 0) >= 1000 ? "text-2xl" : "text-3xl"
            )}>
              {stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('inSelectedPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "font-bold",
              (stats?.completed || 0) >= 10000 ? "text-xl" : (stats?.completed || 0) >= 1000 ? "text-2xl" : "text-3xl"
            )}>
              {stats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.completionRate.toFixed(1)}% ${t('completionRate')}` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cancelled')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "font-bold",
              (stats?.cancelled || 0) >= 10000 ? "text-xl" : (stats?.cancelled || 0) >= 1000 ? "text-2xl" : "text-3xl"
            )}>
              {stats?.cancelled || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('appointmentsCancelledInPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('averageDuration')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageDuration.toFixed(0) || 0} min</div>
            <p className="text-xs text-muted-foreground">{t('averagePerAppointment')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('appointmentsByMonth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4A90E2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('appointmentStatuses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(stats?.byStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.statusKey)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('performanceByService')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byService || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="service" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#5DADE2" name={t('quantity')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



















