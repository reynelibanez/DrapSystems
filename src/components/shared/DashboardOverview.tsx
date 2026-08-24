import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';
import { NextAppointmentCard } from './NextAppointmentCard';
import { QuickStats } from './QuickStats';
import { DayAppointmentsList } from './DayAppointmentsList';

export function DashboardOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalClients: 0,
    totalServices: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();

    // Suscribirse a cambios en tiempo real
    console.log('🔔 Setting up realtime subscriptions for dashboard stats...');
    
    const appointmentsChannel = supabase
      .channel('dashboard-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('🔔 Appointment change detected in dashboard:', payload);
          loadStats();
          // Forzar actualización de componentes hijos
          setRefreshKey(prev => prev + 1);
        }
      )
      .subscribe();

    const clientsChannel = supabase
      .channel('dashboard-clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('🔔 Client change detected in dashboard:', payload);
          loadStats();
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('dashboard-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('🔔 Service change detected in dashboard:', payload);
          loadStats();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from dashboard changes...');
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.business_id) return;

      // Cargar estadísticas según el rol
      const isClient = profile.role === 'client';
      
      if (isClient) {
        // Para clientes, solo mostrar sus propias citas
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id);

        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`);

        setStats({
          totalAppointments: appointmentsCount || 0,
          totalClients: 0,
          totalServices: 0,
          todayAppointments: todayCount || 0
        });
      } else {
        // Para staff, business owner y admin
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', profile.business_id);

        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', profile.business_id);

        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', profile.business_id);

        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', profile.business_id)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`);

        setStats({
          totalAppointments: appointmentsCount || 0,
          totalClients: clientsCount || 0,
          totalServices: servicesCount || 0,
          todayAppointments: todayCount || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.totalAppointments')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.todayAppointments')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
          </CardContent>
        </Card>

        {stats.totalClients > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.totalClients')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
        )}

        {stats.totalServices > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.totalServices')}
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Próxima cita - pasar refreshKey para forzar actualización */}
      <NextAppointmentCard key={refreshKey} />

      {/* Citas de hoy */}
      <DayAppointmentsList key={`day-${refreshKey}`} />
    </div>
  );
}

