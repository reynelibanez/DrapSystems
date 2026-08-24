import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { AppointmentNotes } from '../shared/AppointmentNotes';
import type { Database } from '../../lib/database.types';
import { useTranslation } from 'react-i18next';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client?: { full_name: string; email: string };
  staff?: { full_name: string };
  service?: { name: string };
};

interface AppointmentManagementProps {
  businessId: string;
}

export function AppointmentManagement({ businessId }: AppointmentManagementProps) {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  useEffect(() => {
    loadAppointments();

    // Suscribirse a cambios en tiempo real
    console.log('🔔 Setting up realtime subscription for appointment management...');
    
    const channel = supabase
      .channel('appointment-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('🔔 Appointment change detected in management:', payload);
          loadAppointments();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from appointment management changes...');
      supabase.removeChannel(channel);
    };
  }, [businessId, filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients!appointments_client_id_fkey(full_name, email),
          staff:profiles!appointments_staff_id_fkey(full_name),
          service:services(name)
        `)
        .eq('business_id', businessId)
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
      } else if (filter === 'past') {
        query = query.lt('start_time', now.toISOString());
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

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (!error) {
        loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', label: t('pending') },
      confirmed: { variant: 'default', label: t('confirmed') },
      cancelled: { variant: 'destructive', label: t('cancelled') },
      completed: { variant: 'secondary', label: t('completed') },
      no_show: { variant: 'destructive', label: t('noShow') },
    };
    return variants[status] || variants.pending;
  };

  const handleViewNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowNotesDialog(true);
  };

  if (loading) {
    return <div className="text-center py-8">{t('loadingAppointmentsList')}</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('appointmentManagementTitle')}
              </CardTitle>
              <CardDescription>
                Administra todas las citas de tu empresa
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="upcoming">{t('upcoming')}</SelectItem>
                <SelectItem value="past">{t('past')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No hay citas para mostrar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dateAndTime')}</TableHead>
                    <TableHead>{t('client')}</TableHead>
                    <TableHead>{t('staff')}</TableHead>
                    <TableHead>{t('service')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => {
                    const statusInfo = getStatusBadge(appointment.status);
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {new Date(appointment.start_time).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {(appointment.client as any)?.full_name || t('noClientName')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(appointment.client as any)?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(appointment.staff as any)?.full_name || t('noStaffAssigned')}
                        </TableCell>
                        <TableCell>
                          {(appointment.service as any)?.name || t('noServiceAssigned')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={appointment.status}
                              onValueChange={(value) => updateAppointmentStatus(appointment.id, value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="confirmed">Confirmada</SelectItem>
                                <SelectItem value="completed">Completada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                <SelectItem value="no_show">No asistió</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewNotes(appointment)}
                              title={t('viewAddNotes')}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de notas */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('notesForAppointmentDialog')}</DialogTitle>
            <DialogDescription>
              Agrega y visualiza notas sobre esta cita
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentNotes
              appointmentId={selectedAppointment.id}
              clientId={selectedAppointment.client_id}
              businessId={selectedAppointment.business_id}
              readOnly={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}




