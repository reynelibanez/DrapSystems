import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, PLAN_FEATURES } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  subscription_plan: string;
}

export function SystemStats() {
  const { t, i18n } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState<any[]>([]);
  const [appointmentsByBusiness, setAppointmentsByBusiness] = useState<any[]>([]);
  const [clientsByBusiness, setClientsByBusiness] = useState<any[]>([]);
  const [businessStats, setBusinessStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinesses();
    // Si no hay negocio seleccionado, cargar stats globales inmediatamente
    if (!selectedBusinessId) {
      loadStats();
    }
  }, []);

  useEffect(() => {
    if (businesses.length > 0 && selectedBusinessId) {
      loadStats();
    }
  }, [selectedBusinessId]);

  const loadBusinesses = async () => {
    try {
      const { data } = await supabase
        .from('businesses')
        .select('id, name, subscription_plan')
        .order('name');

      if (data) {
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);

      // Ejecutar todas las consultas en paralelo
      const [
        { data: allBusinesses },
        monthlyData,
        businessAppointmentsData,
        businessClientsData,
        selectedBusinessData
      ] = await Promise.all([
        // Distribución de planes
        supabase.from('businesses').select('subscription_plan'),
        
        // Citas por mes (últimos 6 meses)
        Promise.all(
          Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            let query = supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .gte('start_time', firstDay.toISOString())
              .lte('start_time', lastDay.toISOString());

            if (selectedBusinessId !== 'all') {
              query = query.eq('business_id', selectedBusinessId);
            }

            return query.then(({ count }) => ({
              month: date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short' }),
              [t('systemStats.charts.appointments')]: count || 0,
            }));
          })
        ),

        // Citas por empresa (top 10)
        Promise.all(
          businesses.slice(0, 10).map(async (business) => {
            const { count } = await supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id);

            return {
              name: business.name.length > 20 ? business.name.substring(0, 20) + '...' : business.name,
              appointments: count || 0,
              plan: PLAN_FEATURES[business.subscription_plan as keyof typeof PLAN_FEATURES].name,
            };
          })
        ),

        // Clientes por empresa (top 10)
        Promise.all(
          businesses.slice(0, 10).map(async (business) => {
            const { count } = await supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id);

            return {
              name: business.name.length > 20 ? business.name.substring(0, 20) + '...' : business.name,
              clients: count || 0,
            };
          })
        ),

        // Estadísticas de la empresa seleccionada
        selectedBusinessId !== 'all'
          ? Promise.all([
              supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', selectedBusinessId),
              supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', selectedBusinessId),
              supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', selectedBusinessId)
                .eq('role', 'staff'),
              supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', selectedBusinessId)
                .eq('status', 'completed'),
            ])
          : Promise.resolve(null)
      ]);

      // Procesar distribución de planes
      if (allBusinesses) {
        const distribution = Object.entries(
          allBusinesses.reduce((acc: any, b) => {
            acc[b.subscription_plan] = (acc[b.subscription_plan] || 0) + 1;
            return acc;
          }, {})
        ).map(([plan, count]) => ({
          name: PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES].name,
          value: count,
        }));

        setPlanDistribution(distribution);
      }

      // Establecer datos mensuales
      setMonthlyAppointments(monthlyData);

      // Establecer citas por empresa
      setAppointmentsByBusiness(businessAppointmentsData.sort((a, b) => b.appointments - a.appointments));

      // Establecer clientes por empresa
      setClientsByBusiness(businessClientsData.sort((a, b) => b.clients - a.clients));

      // Establecer estadísticas de la empresa seleccionada
      if (selectedBusinessData) {
        const [
          { count: totalAppointments },
          { count: totalClients },
          { count: totalStaff },
          { count: completedAppointments }
        ] = selectedBusinessData;

        const business = businesses.find(b => b.id === selectedBusinessId);

        setBusinessStats({
          totalAppointments: totalAppointments || 0,
          totalClients: totalClients || 0,
          totalStaff: totalStaff || 0,
          completedAppointments: completedAppointments || 0,
          completionRate: totalAppointments ? ((completedAppointments || 0) / totalAppointments * 100).toFixed(1) : 0,
          plan: business ? PLAN_FEATURES[business.subscription_plan as keyof typeof PLAN_FEATURES].name : '',
        });
      } else {
        setBusinessStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Selector de empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('systemStats.filterByBusiness', 'Filtrar por Empresa')}
          </CardTitle>
          <CardDescription>
            {t('systemStats.filterDescription', 'Selecciona una empresa para ver sus estadísticas detalladas')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('systemStats.selectBusiness', 'Seleccionar empresa')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('systemStats.allBusinesses', 'Todas las empresas')}</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name} ({PLAN_FEATURES[business.subscription_plan as keyof typeof PLAN_FEATURES].name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estadísticas de la empresa seleccionada */}
      {businessStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('systemStats.totalAppointments', 'Total de Citas')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessStats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {businessStats.completedAppointments} {t('systemStats.completed', 'completadas')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('systemStats.totalClients', 'Total de Clientes')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessStats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {t('systemStats.registeredClients', 'clientes registrados')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('systemStats.totalStaff', 'Personal')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessStats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                {t('systemStats.staffMembers', 'miembros del personal')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('systemStats.completionRate', 'Tasa de Completado')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessStats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {businessStats.plan}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución de planes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('systemStats.planDistribution.title')}</CardTitle>
            <CardDescription>
              {t('systemStats.planDistribution.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Citas por mes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBusinessId === 'all' 
                ? t('systemStats.monthlyAppointments.title') 
                : t('systemStats.monthlyAppointmentsBusiness', 'Citas Mensuales de la Empresa')}
            </CardTitle>
            <CardDescription>
              {selectedBusinessId === 'all'
                ? t('systemStats.monthlyAppointments.description')
                : `${businesses.find(b => b.id === selectedBusinessId)?.name || ''} - ${t('systemStats.last6Months', 'Últimos 6 meses')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={t('systemStats.charts.appointments')} 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparativa entre empresas */}
      {selectedBusinessId === 'all' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Citas por empresa */}
          <Card>
            <CardHeader>
              <CardTitle>{t('systemStats.appointmentsByBusiness', 'Citas por Empresa')}</CardTitle>
              <CardDescription>
                {t('systemStats.top10Businesses', 'Top 10 empresas con más citas')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={appointmentsByBusiness} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="appointments" fill="#8884d8" name={t('systemStats.appointments', 'Citas')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Clientes por empresa */}
          <Card>
            <CardHeader>
              <CardTitle>{t('systemStats.clientsByBusiness', 'Clientes por Empresa')}</CardTitle>
              <CardDescription>
                {t('systemStats.top10BusinessesClients', 'Top 10 empresas con más clientes')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientsByBusiness} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="clients" fill="#00C49F" name={t('systemStats.clients', 'Clientes')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}











