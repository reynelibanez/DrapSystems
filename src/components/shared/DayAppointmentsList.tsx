import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Calendar, Clock, User, Briefcase, FileText, Plus, Edit, Trash2, Loader2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AppointmentForm } from '../business/AppointmentForm';
import { ConfirmDialog } from './ConfirmDialog';
import { ViewClientProfile } from './ViewClientProfile';
import type { SubscriptionStatus } from '../../lib/subscription-validator';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  client?: { 
    id: string;
    full_name: string;
    email: string;
  };
  service?: { 
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  };
  staff?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface DayAppointmentsListProps {
  date: Date | null;
  businessId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentChange?: () => void;
  subscriptionStatus?: SubscriptionStatus | null;
}

export function DayAppointmentsList({ 
  date, 
  businessId, 
  open, 
  onOpenChange,
  onAppointmentChange,
  subscriptionStatus
}: DayAppointmentsListProps) {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAppointmentForNote, setSelectedAppointmentForNote] = useState<string | null>(null);

  // Cargar citas cuando se abre el diálogo o cambia la fecha
  useEffect(() => {
    if (open && date) {
      loadAppointments();
    }
  }, [open, date]);

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!businessId || !date) return;

    const channel = supabase
      .channel(`today-appointments-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, date]);

  const loadAppointments = async () => {
    if (!businessId || !date) return;

    setLoading(true);
    try {
      // Crear fechas de inicio y fin del día en la zona horaria local
      const selectedDateObj = new Date(date);
      const startOfDay = new Date(selectedDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, full_name, email, phone),
          service:services(id, name, duration_minutes, price),
          staff:profiles!appointments_staff_id_fkey(id, full_name, email)
        `)
        .eq('business_id', businessId)
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error(t('errorLoadingAppointments'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPreselectedDate('');
    setShowAppointmentForm(true);
  };

  const handleViewClientProfile = (clientId: string, appointmentId: string) => {
    setSelectedClientId(clientId);
    setSelectedAppointmentForNote(appointmentId);
    setShowClientProfile(true);
  };

  const handleDelete = async (appointmentId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success(t('appointmentDeleted'));
      
      // Recargar la lista sin cerrar el diálogo
      await loadAppointments();
      
      // Notificar al calendario principal para que se actualice
      onAppointmentChange?.();
      
      // Limpiar el estado
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error(t('errorDeletingAppointment'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAppointmentSuccess = () => {
    // Recargar inmediatamente tras crear/editar (no depender solo del realtime)
    loadAppointments();
    
    // Notificar al calendario principal
    onAppointmentChange?.();
    
    // Cerrar el formulario de edición/creación
    setShowAppointmentForm(false);
    setSelectedAppointment(null);
    setPreselectedDate('');
    
    // NO cerrar el diálogo principal - el usuario puede seguir viendo las citas actualizadas
    // El diálogo principal (DayAppointmentsList) permanece abierto
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'pending':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      case 'no_show':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('confirmed');
      case 'pending':
        return t('pending');
      case 'completed':
        return t('completed');
      case 'cancelled':
        return t('cancelled');
      case 'no_show':
        return t('noShow');
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4 sm:p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="truncate">{date && formatDate(date)}</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {appointments.length === 0 
                  ? t('noAppointmentsScheduled')
                  : `${appointments.length} ${appointments.length !== 1 ? t('appointments') : t('appointment')}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              {/* Botón para crear nueva cita */}
              {businessId && (
                <Button
                  onClick={() => {
                    setSelectedAppointment(null);
                    // Pasar la fecha seleccionada al formulario
                    if (date) {
                      // CORREGIDO: Crear el string de fecha manualmente para evitar conversión UTC
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      
                      setPreselectedDate(dateStr);
                    }
                    setShowAppointmentForm(true);
                  }}
                  disabled={subscriptionStatus && !subscriptionStatus.canAccess}
                  title={subscriptionStatus && !subscriptionStatus.canAccess ? 'Subscription expired - Please renew to create appointments' : ''}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all h-11 sm:h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('newAppointment')}
                </Button>
              )}

              {/* Lista de citas */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">{t('loadingAppointmentsEllipsis')}</p>
                </div>
              ) : appointments.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-8 sm:py-12 text-center">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-base sm:text-lg">
                      {t('noAppointmentsScheduled')}
                    </p>
                    {businessId && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        {t('clickNewAppointment')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <Card 
                      key={appointment.id} 
                      className="border-2 hover:shadow-lg transition-all duration-200"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                            {/* Hora y Estado */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                  {/* Convertir a hora local del navegador */}
                                  {new Date(appointment.start_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                  {' - '}
                                  {new Date(appointment.end_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </span>
                              </div>
                              <Badge className={`${getStatusColor(appointment.status)} text-white text-xs`}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>

                            {/* Cliente */}
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm sm:text-base truncate">
                                {appointment.client?.full_name || appointment.client?.email || t('withoutClient')}
                              </span>
                            </div>

                            {/* Servicio */}
                            {appointment.service && (
                              <div className="flex items-start gap-2">
                                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                                  <span className="text-sm sm:text-base truncate">
                                    {appointment.service.name}
                                  </span>
                                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                    ${appointment.service.price} • {appointment.service.duration_minutes}min
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Personal */}
                            {appointment.staff && (
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {t('staff')}: {appointment.staff.full_name || appointment.staff.email}
                                </span>
                              </div>
                            )}

                            {/* Notas */}
                            {appointment.notes && (
                              <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-xs sm:text-sm text-muted-foreground flex-1 break-words">
                                  {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Acciones */}
                          {businessId && (
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                              {/* Botón Ver Perfil del Cliente */}
                              {appointment.client?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewClientProfile(appointment.client!.id, appointment.id)}
                                  className="hover:bg-blue-500/10 hover:text-blue-600 flex-1 sm:flex-none h-9"
                                  title={t('viewClientProfile')}
                                >
                                  <UserCircle className="w-4 h-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">{t('viewProfile')}</span>
                                </Button>
                              )}
                              {/* Botón Agregar Nota */}
                              {appointment.client?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewClientProfile(appointment.client!.id, appointment.id)}
                                  className="hover:bg-green-500/10 hover:text-green-600 flex-1 sm:flex-none h-9"
                                  title={t('addNote')}
                                >
                                  <FileText className="w-4 h-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">{t('addNote')}</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(appointment)}
                                className="hover:bg-primary/10 flex-1 sm:flex-none h-9"
                              >
                                <Edit className="w-4 h-4 sm:mr-0 mr-2" />
                                <span className="sm:hidden">{t('edit')}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAppointmentToDelete(appointment.id)}
                                className="hover:bg-destructive/10 hover:text-destructive flex-1 sm:flex-none h-9"
                              >
                                <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                                <span className="sm:hidden">{t('delete')}</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de citas */}
      {businessId && (
        <AppointmentForm
          key={businessId} // Forzar re-renderizado completo al cambiar de empresa
          businessId={businessId}
          appointment={selectedAppointment}
          open={showAppointmentForm}
          onOpenChange={(open) => {
            setShowAppointmentForm(open);
            if (!open) {
              setSelectedAppointment(null);
              setPreselectedDate('');
            }
          }}
          onSuccess={handleAppointmentSuccess}
          preselectedDate={preselectedDate}
          subscriptionStatus={subscriptionStatus}
          keepOpenAfterSuccess={true}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => !open && setAppointmentToDelete(null)}
        onConfirm={() => appointmentToDelete && handleDelete(appointmentToDelete)}
        title={t('deleteAppointment')}
        description={t('deleteAppointmentDescription')}
        loading={deleting}
      />

      {/* Diálogo de perfil del cliente */}
      {selectedClientId && (
        <Dialog open={showClientProfile} onOpenChange={(open) => {
          setShowClientProfile(open);
          if (!open) {
            setSelectedClientId(null);
            setSelectedAppointmentForNote(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('clientProfile')}</DialogTitle>
              <DialogDescription>
                {t('viewClientInformation')}
              </DialogDescription>
            </DialogHeader>
            <ViewClientProfile 
              clientId={selectedClientId}
              allowEdit={false}
              preselectedAppointmentId={selectedAppointmentForNote || undefined}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}



















































