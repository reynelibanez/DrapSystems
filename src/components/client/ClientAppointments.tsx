import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, Clock, X, Edit2, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { AppointmentNotes } from '../shared/AppointmentNotes';
import { toast } from 'sonner';
import type { Database } from '../../lib/database.types';
import { useTranslation } from 'react-i18next';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  business?: { name: string; id: string };
  staff?: { full_name: string };
  service?: { name: string; price: number };
  client?: { full_name: string };
};

interface ClientAppointmentsProps {
  clientId: string;
  onUpdate: () => void;
}

export function ClientAppointments({ clientId, onUpdate }: ClientAppointmentsProps) {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  useEffect(() => {
    loadAppointments();

    // Suscribirse a cambios en tiempo real
    console.log('🔔 Setting up realtime subscription for client appointments...');
    
    const channel = supabase
      .channel('client-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('🔔 Appointment change detected for client:', payload);
          loadAppointments();
          onUpdate(); // Notificar al componente padre
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from client appointments changes...');
      supabase.removeChannel(channel);
    };
  }, [clientId, filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          business:businesses(name, id),
          staff:profiles!appointments_staff_id_fkey(full_name),
          service:services(name, price),
          client:clients(full_name)
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: filter === 'upcoming' });

      const now = new Date().toISOString();

      if (filter === 'upcoming') {
        query = query.gte('start_time', now);
      } else {
        query = query.lt('start_time', now);
      }

      const { data, error } = await query;

      if (!error && data) {
        setAppointments(data as any);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error(t('errorLoadingAppointments'));
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm(t('confirmCancelAppointment'))) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (!error) {
        toast.success(t('appointmentCancelledSuccess'));
        loadAppointments();
        onUpdate();
      } else {
        toast.error(t('errorCancellingAppointment'));
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(t('errorCancellingAppointment'));
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleViewNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowNotesDialog(true);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">{t('loadingAppointmentsList')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {filter === 'upcoming' ? t('upcomingAppointmentsTitle') : t('appointmentHistoryTitle')}
              </CardTitle>
              <CardDescription>
                {filter === 'upcoming' 
                  ? t('yourScheduledAppointments') 
                  : t('pastAppointmentsDescription')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('upcoming')}
              >
                Próximas
              </Button>
              <Button
                variant={filter === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('past')}
              >
                Pasadas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filter === 'upcoming' 
                  ? t('noUpcomingAppointments') 
                  : t('noPastAppointments')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dateAndTime')}</TableHead>
                    <TableHead>{t('company')}</TableHead>
                    <TableHead>{t('service')}</TableHead>
                    <TableHead>{t('staff')}</TableHead>
                    <TableHead>{t('priceLabel')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => {
                    const statusInfo = getStatusBadge(appointment.status);
                    const canCancel = filter === 'upcoming' && 
                      appointment.status !== 'cancelled' && 
                      appointment.status !== 'completed';

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
                        <TableCell className="font-medium">
                          {(appointment.business as any)?.name || t('noBusinessAssigned')}
                        </TableCell>
                        <TableCell>
                          {(appointment.service as any)?.name || t('noServiceAssigned')}
                        </TableCell>
                        <TableCell>
                          {(appointment.staff as any)?.full_name || t('noStaffAssigned')}
                        </TableCell>
                        <TableCell>
                          ${(appointment.service as any)?.price || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(appointment)}
                              title={t('viewDetails')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewNotes(appointment)}
                              title={t('viewNotes')}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelAppointment(appointment.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title={t('cancelAppointmentAction')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
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

      {/* Dialog de detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('appointmentDetailsDialog')}</DialogTitle>
            <DialogDescription>
              Información completa de tu cita
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('date')}</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedAppointment.start_time).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('time')}</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedAppointment.start_time).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - {new Date(selectedAppointment.end_time).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('company')}</Label>
                  <p className="text-sm mt-1">{(selectedAppointment.business as any)?.name || t('noBusinessAssigned')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('service')}</Label>
                  <p className="text-sm mt-1">{(selectedAppointment.service as any)?.name || t('noServiceAssigned')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('staff')}</Label>
                  <p className="text-sm mt-1">{(selectedAppointment.staff as any)?.full_name || t('noStaffAssigned')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('priceLabel')}</Label>
                  <p className="text-sm mt-1">${(selectedAppointment.service as any)?.price || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('status')}</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadge(selectedAppointment.status).variant}>
                      {getStatusBadge(selectedAppointment.status).label}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('notesForAppointmentDialog')}</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de notas */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('notesForAppointmentDialog')}</DialogTitle>
            <DialogDescription>
              Historial de notas y observaciones
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentNotes
              appointmentId={selectedAppointment.id}
              clientId={selectedAppointment.client_id}
              businessId={(selectedAppointment.business as any)?.id || ''}
              readOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}



