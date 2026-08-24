import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Clock } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client?: { full_name: string; email: string; phone: string };
  service?: { name: string; duration_minutes: number };
};

interface StaffAppointmentsProps {
  staffId: string;
  onUpdate: () => void;
}

export function StaffAppointments({ staffId, onUpdate }: StaffAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const { t } = useTranslation();

  useEffect(() => {
    loadAppointments();

    // Suscribirse a cambios en tiempo real
    console.log('🔔 Setting up realtime subscription for staff appointments...');
    
    const channel = supabase
      .channel('staff-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `staff_id=eq.${staffId}`
        },
        (payload) => {
          console.log('🔔 Appointment change detected for staff:', payload);
          loadAppointments();
          onUpdate(); // Notificar al componente padre
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from staff appointments changes...');
      supabase.removeChannel(channel);
    };
  }, [staffId, filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients!appointments_client_id_fkey(full_name, email, phone),
          service:services(name, duration_minutes)
        `)
        .eq('staff_id', staffId)
        .order('start_time', { ascending: true });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (filter === 'today') {
        query = query
          .gte('start_time', today.toISOString())
          .lt('start_time', tomorrow.toISOString());
      } else if (filter === 'upcoming') {
        query = query.gte('start_time', now.toISOString());
      }

      const { data, error } = await query;

      if (!error && data) {
        setAppointments(data as any);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (!error) {
        loadAppointments();
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: t('pending') },
      confirmed: { variant: 'default', label: t('confirmed') },
      completed: { variant: 'outline', label: t('completed') },
      cancelled: { variant: 'destructive', label: t('cancelled') },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando citas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('myAppointments')}
        </CardTitle>
        <CardDescription>
          {t('viewManageAppointments')}
        </CardDescription>
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t('all')}
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            {t('upcoming')}
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('past')}
          >
            {t('past')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">{t('loadingAppointments')}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('noAppointmentsFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('time')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('service')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('duration')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{appointment.start_time}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.clients?.full_name}</div>
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          {appointment.clients?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {appointment.services?.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {appointment.services?.duration} {t('minutes')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(appointment.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






