





import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Building2, Calendar, 
  DollarSign, Package, Gem, MessageSquare, Activity,
  ArrowUpRight, ArrowDownRight, Sparkles, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface OverviewStats {
  totalBusinesses: number;
  totalUsers: number;
  totalAppointments: number;
  totalInvoices: number;
  totalRevenue: number;
  totalJewelryItems: number;
  totalSMSSent: number;
  activeModules: {
    appointments: number;
    services: number;
    jewelry: number;
  };
  planDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  appointmentsByBusiness: {
    name: string;
    appointments: number;
    revenue: number;
  }[];
  monthlyTrends: {
    month: string;
    appointments: number;
    invoices: number;
    revenue: number;
    sms: number;
  }[];
  moduleUsage: {
    module: string;
    users: number;
    percentage: number;
  }[];
  appointmentsByStatus: {
    status: string;
    count: number;
    color: string;
  }[];
  revenueByBusiness: {
    name: string;
    revenue: number;
    invoices: number;
  }[];
  usersByRole: {
    role: string;
    count: number;
    color: string;
  }[];
  dailyActivity: {
    day: string;
    appointments: number;
    invoices: number;
    users: number;
  }[];
  modulePerformance: {
    module: string;
    adoption: number;
    satisfaction: number;
    growth: number;
  }[];
  businessGrowth: {
    month: string;
    newBusinesses: number;
    totalBusinesses: number;
    growthRate: number;
  }[];
}

const COLORS = ['#6B7280', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

// Colores específicos para cada estado de cita - coinciden con StatusBadge
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',      // Amarillo/Naranja - secondary
  confirmed: '#5AC1FF',    // Azul primario - primary
  cancelled: '#FF5C5C',    // Rojo - destructive
  completed: '#10B981',    // Verde - success
  no_show: '#EF4444',      // Rojo oscuro - destructive
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#FF5C5C',
  owner: '#5AC1FF',
  staff: '#8FD4FF',
  client: '#A78BFA'
};

export function AdminOverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Calcular fecha de inicio según el rango
      const now = new Date();
      let startDate = new Date();
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(now.getDate() - 90);
      else startDate = new Date('2000-01-01');

      // Total de empresas
      const { count: totalBusinesses } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

      // Total de usuarios
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total de citas
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Total de facturas y revenue
      const { data: invoices } = await supabase
        .from('service_invoices')
        .select('total_amount, business_id')
        .gte('created_at', startDate.toISOString());

      const totalInvoices = invoices?.length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Total de items de joyería
      const { count: totalJewelryItems } = await supabase
        .from('jwl_joyas')
        .select('*', { count: 'exact', head: true });

      // Total de SMS enviados
      const { data: smsData } = await supabase
        .from('businesses')
        .select('sms_sent_this_month');

      const totalSMSSent = smsData?.reduce((sum, b) => sum + (b.sms_sent_this_month || 0), 0) || 0;

      // Módulos activos por usuario - usando user_module_permissions
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name');

      // Obtener todos los módulos del sistema
      const { data: systemModules } = await supabase
        .from('system_modules')
        .select('id, slug, name')
        .eq('is_active', true);

      console.log('System Modules:', systemModules);

      // Obtener permisos de módulos por usuario
      const { data: modulePermissions } = await supabase
        .from('user_module_permissions')
        .select(`
          user_id,
          module_id,
          system_modules!inner(slug, name)
        `);

      console.log('Module Permissions:', modulePermissions);

      // Contar usuarios únicos por módulo
      const usersByModule: Record<string, Set<string>> = {
        appointments: new Set(),
        services: new Set(),
        jewelry: new Set()
      };

      modulePermissions?.forEach(perm => {
        if (perm.user_id) {
          const moduleSlug = (perm.system_modules as any)?.slug;
          if (moduleSlug && usersByModule[moduleSlug]) {
            usersByModule[moduleSlug].add(perm.user_id);
          }
        }
      });

      const activeModules = {
        appointments: usersByModule.appointments.size,
        services: usersByModule.services.size,
        jewelry: usersByModule.jewelry.size
      };

      console.log('Users by Module:', {
        appointments: Array.from(usersByModule.appointments),
        services: Array.from(usersByModule.services),
        jewelry: Array.from(usersByModule.jewelry)
      });
      console.log('Active Modules Count (Users):', activeModules);

      // Distribución de planes
      const { data: planData } = await supabase
        .from('businesses')
        .select('subscription_plan');

      const planCounts: Record<string, number> = {};
      planData?.forEach(b => {
        const plan = b.subscription_plan || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const planDistribution = Object.entries(planCounts).map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[index % COLORS.length]
      }));

      // Citas por empresa (top 10)
      const { data: appointmentsByBusiness } = await supabase
        .from('appointments')
        .select(`
          business_id,
          businesses!inner(name)
        `)
        .gte('created_at', startDate.toISOString());

      const businessAppointments: Record<string, { name: string; count: number }> = {};
      appointmentsByBusiness?.forEach(apt => {
        const businessName = (apt.businesses as any)?.name || 'Unknown';
        if (!businessAppointments[businessName]) {
          businessAppointments[businessName] = { name: businessName, count: 0 };
        }
        businessAppointments[businessName].count++;
      });

      const topBusinesses = Object.values(businessAppointments)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(b => ({
          name: b.name,
          appointments: b.count,
          revenue: 0
        }));

      // Revenue por empresa (top 10)
      const businessRevenue: Record<string, { name: string; revenue: number; invoices: number }> = {};
      
      for (const invoice of invoices || []) {
        const { data: business } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', invoice.business_id)
          .single();
        
        if (business) {
          if (!businessRevenue[business.name]) {
            businessRevenue[business.name] = { name: business.name, revenue: 0, invoices: 0 };
          }
          businessRevenue[business.name].revenue += invoice.total_amount || 0;
          businessRevenue[business.name].invoices++;
        }
      }

      const revenueByBusiness = Object.values(businessRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Tendencias mensuales (últimos 6 meses)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count: monthAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: monthInvoices } = await supabase
          .from('service_invoices')
          .select('total_amount')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        monthlyTrends.push({
          month: date.toLocaleDateString('es-ES', { month: 'short' }),
          appointments: monthAppointments || 0,
          invoices: monthInvoices?.length || 0,
          revenue: monthInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
          sms: Math.floor(Math.random() * 500) + 100 // Placeholder
        });
      }

      // Uso de módulos con porcentajes - basado en usuarios
      const totalUsersCount = allUsers?.length || 1;
      const moduleUsage = [
        { 
          module: 'Citas', 
          users: activeModules.appointments,
          percentage: Math.round((activeModules.appointments / totalUsersCount) * 100)
        },
        { 
          module: 'Servicios', 
          users: activeModules.services,
          percentage: Math.round((activeModules.services / totalUsersCount) * 100)
        },
        { 
          module: 'Joyería', 
          users: activeModules.jewelry,
          percentage: Math.round((activeModules.jewelry / totalUsersCount) * 100)
        }
      ];

      console.log('Module Usage Data (Users):', moduleUsage);
      console.log('Active Modules:', activeModules);
      console.log('Total Users:', totalUsersCount);

      // Citas por estado
      const { data: appointmentStatuses } = await supabase
        .from('appointments')
        .select('status')
        .gte('created_at', startDate.toISOString());

      const statusCounts: Record<string, number> = {};
      appointmentStatuses?.forEach(apt => {
        const status = apt.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: STATUS_COLORS[status] || COLORS[0]
      }));

      // Usuarios por rol
      const { data: userRoles } = await supabase
        .from('profiles')
        .select('role');

      const roleCounts: Record<string, number> = {};
      userRoles?.forEach(user => {
        const role = user.role || 'client';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
        color: ROLE_COLORS[role] || COLORS[0]
      }));

      // Actividad diaria (últimos 7 días)
      const dailyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const { count: dayAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        const { count: dayInvoices } = await supabase
          .from('service_invoices')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        dailyActivity.push({
          day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
          appointments: dayAppointments || 0,
          invoices: dayInvoices || 0,
          users: Math.floor(Math.random() * 50) + 10 // Placeholder
        });
      }

      // Performance de módulos (radar chart) - basado en usuarios
      const modulePerformance = [
        {
          module: 'Citas',
          adoption: Math.round((activeModules.appointments / totalUsersCount) * 100),
          satisfaction: 85,
          growth: 75
        },
        {
          module: 'Servicios',
          adoption: Math.round((activeModules.services / totalUsersCount) * 100),
          satisfaction: 90,
          growth: 80
        },
        {
          module: 'Joyería',
          adoption: Math.round((activeModules.jewelry / totalUsersCount) * 100),
          satisfaction: 88,
          growth: 70
        }
      ];

      // Crecimiento de empresas
      const businessGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count: newBusinesses } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { count: totalAtMonth } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', monthEnd.toISOString());

        // Calcular porcentaje de crecimiento respecto al mes anterior
        const previousTotal = businessGrowth.length > 0 
          ? businessGrowth[businessGrowth.length - 1].totalBusinesses 
          : totalAtMonth || 0;
        
        const growthRate = previousTotal > 0 
          ? Math.round(((totalAtMonth || 0) - previousTotal) / previousTotal * 100)
          : 0;

        businessGrowth.push({
          month: date.toLocaleDateString('es-ES', { month: 'short' }),
          newBusinesses: newBusinesses || 0,
          totalBusinesses: totalAtMonth || 0,
          growthRate
        });
      }

      setStats({
        totalBusinesses: totalBusinesses || 0,
        totalUsers: totalUsers || 0,
        totalAppointments: totalAppointments || 0,
        totalInvoices,
        totalRevenue,
        totalJewelryItems: totalJewelryItems || 0,
        totalSMSSent,
        activeModules,
        planDistribution,
        appointmentsByBusiness: topBusinesses,
        monthlyTrends,
        moduleUsage,
        appointmentsByStatus,
        revenueByBusiness,
        usersByRole,
        dailyActivity,
        modulePerformance,
        businessGrowth
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Resumen General del Sistema
          </h2>
          <p className="text-muted-foreground">
            Análisis visual completo de todas las métricas
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 días</TabsTrigger>
            <TabsTrigger value="30d">30 días</TabsTrigger>
            <TabsTrigger value="90d">90 días</TabsTrigger>
            <TabsTrigger value="all">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mini KPI Summary - Solo 3 métricas principales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                <p className="text-3xl font-bold">{stats.totalBusinesses}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Citas</p>
                <p className="text-3xl font-bold">{stats.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas principales - 3 columnas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tendencias mensuales - Ocupa 2 columnas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>📈 Tendencias Mensuales</CardTitle>
            <CardDescription>
              Evolución de citas, facturas e ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={stats.monthlyTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5AC1FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#5AC1FF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)" 
                  stroke="#5AC1FF"
                  name="Ingresos ($)"
                />
                <Bar yAxisId="left" dataKey="appointments" fill="#3F9BE0" name="Citas" />
                <Line yAxisId="left" type="monotone" dataKey="invoices" stroke="#FF5C5C" strokeWidth={2} name="Facturas" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de planes */}
        <Card>
          <CardHeader>
            <CardTitle>🥧 Planes de Suscripción</CardTitle>
            <CardDescription>
              Distribución de empresas por plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.planDistribution.map((entry, index) => {
                    // Asignar colores específicos por plan
                    let color = COLORS[index % COLORS.length];
                    
                    // Colores específicos por nombre de plan - AMIGABLE CON DISCROMATOPSIA
                    if (entry.name.toLowerCase().includes('free') || entry.name.toLowerCase().includes('gratuito')) {
                      color = '#6B7280'; // Gris oscuro
                    } else if (entry.name.toLowerCase().includes('basic') || entry.name.toLowerCase().includes('básico')) {
                      color = '#0EA5E9'; // Azul cielo brillante (Cyan)
                    } else if (entry.name.toLowerCase().includes('business') || entry.name.toLowerCase().includes('negocio')) {
                      color = '#F97316'; // Naranja intenso
                    } else if (entry.name.toLowerCase().includes('enterprise') || entry.name.toLowerCase().includes('empresa')) {
                      color = '#EC4899'; // Rosa/Magenta fuerte
                    }
                    
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    const total = stats.planDistribution.reduce((sum, item) => sum + item.value, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} empresas (${percentage}%)`, 'Cantidad'];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Citas por estado */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Citas por Estado</CardTitle>
            <CardDescription>
              Distribución de estados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Cantidad">
                  {stats.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usuarios por rol */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Usuarios por Rol</CardTitle>
            <CardDescription>
              Distribución de roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="role"
                  label
                >
                  {stats.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Uso de módulos */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Adopción de Módulos</CardTitle>
            <CardDescription>
              Usuarios con acceso a cada módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.moduleUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="module" type="category" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#5AC1FF" name="Usuarios" label={{ position: 'right' }}>
                  {stats.moduleUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tercera fila - Gráficas avanzadas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Actividad diaria */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Actividad Diaria (Últimos 7 días)</CardTitle>
            <CardDescription>
              Citas y facturas por día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#5AC1FF" strokeWidth={2} name="Citas" />
                <Line type="monotone" dataKey="invoices" stroke="#3F9BE0" strokeWidth={2} name="Facturas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance de módulos - Radar */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Performance de Módulos</CardTitle>
            <CardDescription>
              Adopción, satisfacción y crecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={stats.modulePerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="module" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Adopción" dataKey="adoption" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} />
                <Radar name="Satisfacción" dataKey="satisfaction" stroke="#84CC16" fill="#84CC16" fillOpacity={0.6} />
                <Radar name="Crecimiento" dataKey="growth" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cuarta fila - Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top 10 Empresas por Citas</CardTitle>
          <CardDescription>
            Empresas más activas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats.appointmentsByBusiness} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="appointments" fill="#5AC1FF" name="Citas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quinta fila - Crecimiento */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Crecimiento de Empresas</CardTitle>
          <CardDescription>
            Nuevas empresas registradas y total acumulado (últimos 6 meses)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={stats.businessGrowth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Nuevas') return [value, 'Nuevas empresas'];
                  if (name === 'Total') return [value, 'Total acumulado'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Mes: ${label}`}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold mb-2">{data.month}</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                            <span>Nuevas: <strong>{data.newBusinesses}</strong></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#5AC1FF]"></span>
                            <span>Total: <strong>{data.totalBusinesses}</strong></span>
                          </p>
                          {data.growthRate !== 0 && (
                            <p className={`flex items-center gap-2 font-semibold ${
                              data.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {data.growthRate > 0 ? '↑' : '↓'} {Math.abs(data.growthRate)}% vs mes anterior
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="newBusinesses" fill="#10B981" name="Nuevas" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="totalBusinesses" stroke="#5AC1FF" strokeWidth={2} name="Total" dot={{ fill: '#5AC1FF', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}




























