import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { AppointmentForm } from '../business/AppointmentForm';
import { DayAppointmentsList } from './DayAppointmentsList';
import { useTranslation } from 'react-i18next';
import type { SubscriptionStatus } from '../../lib/subscription-validator';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  client?: { full_name: string };
  service?: { name: string; duration_minutes?: number; price?: number };
  business?: { name: string };
}

interface AppointmentCalendarProps {
  appointments?: Appointment[];
  onDateSelect?: (date: Date) => void;
  isAdmin?: boolean;
  businessId?: string;
  onAppointmentCreated?: () => void;
  clientId?: string; // Agregar prop para el ID del cliente
  onStatsChange?: (stats: DayStats) => void; // Nueva prop para notificar cambios en estadísticas
  onNextAppointmentChange?: (appointment: AppointmentWithDetails | null) => void; // Nueva prop para notificar cambios en la próxima cita
  subscriptionStatus?: SubscriptionStatus | null; // Estado de la suscripción
}

interface DayStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  occupancyRate: number;
  uniqueClients: number;
}

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export function AppointmentCalendar({ 
  appointments: propAppointments, 
  onDateSelect, 
  isAdmin = false,
  businessId,
  onAppointmentCreated,
  clientId, // Recibir el clientId
  onStatsChange, // Recibir callback de estadísticas
  onNextAppointmentChange,
  subscriptionStatus // Recibir estado de suscripción
}: AppointmentCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(propAppointments || []);
  const [loading, setLoading] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showDayAppointments, setShowDayAppointments] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [dayStats, setDayStats] = useState<DayStats>({
    total: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
    occupancyRate: 0,
    uniqueClients: 0
  });
  const [calendarKey, setCalendarKey] = useState(0); // Para forzar re-render

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    if (businessId) {
      loadBusinessAppointments();
      loadBusinessHours();
    } else if (clientId) {
      loadClientAppointments();
    } else if (propAppointments) {
      setAppointments(propAppointments);
    }

    // Suscribirse a cambios en tiempo real
    console.log('🔔 Setting up realtime subscription for calendar appointments...');
    
    let channel;
    
    if (businessId) {
      channel = supabase
        .channel('calendar-business-appointments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `business_id=eq.${businessId}`
          },
          (payload) => {
            console.log('🔔 Appointment change detected in calendar (business):', payload);
            loadBusinessAppointments();
          }
        )
        .subscribe();
    } else if (clientId) {
      channel = supabase
        .channel('calendar-client-appointments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            console.log('🔔 Appointment change detected in calendar (client):', payload);
            loadClientAppointments();
          }
        )
        .subscribe();
    }

    // Cleanup
    return () => {
      if (channel) {
        console.log('🔕 Unsubscribing from calendar appointments changes...');
        supabase.removeChannel(channel);
      }
    };
  }, [businessId, clientId, propAppointments, currentDate]);

  useEffect(() => {
    calculateDayStats();
  }, [appointments, currentDate]);

  // Función para notificar cambios en la próxima cita
  const notifyNextAppointmentChange = useCallback(async () => {
    if (!onNextAppointmentChange) return;
    
    console.log('🔔 notifyNextAppointmentChange - Starting...');
    
    try {
      // Obtener la próxima cita
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ notifyNextAppointmentChange - No user found');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id, role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.log('⚠️ notifyNextAppointmentChange - No profile found');
        return;
      }

      console.log('🔍 notifyNextAppointmentChange - Profile:', { role: profile.role, businessId: profile.business_id });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*)
        `)
        .gte('start_time', startOfToday)
        .in('status', ['pending', 'confirmed']) // Solo citas activas
        .order('start_time', { ascending: true })
        .limit(1);

      if (profile.role === 'business_owner' || profile.role === 'staff') {
        console.log('🔍 notifyNextAppointmentChange - Filtering by business_id:', profile.business_id);
        query = query.eq('business_id', profile.business_id);
      } else if (profile.role === 'client') {
        console.log('🔍 notifyNextAppointmentChange - Filtering by client_id:', user.id);
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ notifyNextAppointmentChange - Error:', error);
        return;
      }
      
      console.log('✅ notifyNextAppointmentChange - Found appointment:', data?.[0]?.id || 'none');
      onNextAppointmentChange(data?.[0] || null);
    } catch (error) {
      console.error('Error notifying next appointment change:', error);
    }
  }, [onNextAppointmentChange]);

  // Llamar a notifyNextAppointmentChange cuando se cree, actualice o elimine una cita
  useEffect(() => {
    notifyNextAppointmentChange();
  }, [appointments, notifyNextAppointmentChange]);

  // Nueva función para cargar horarios del negocio
  const loadBusinessHours = async () => {
    if (!businessId) return;
    
    // Resetear estado al cambiar de empresa
    setBusinessHours(null);
    
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('❌ Error loading business hours:', error);
        return;
      }

      const settings = business?.settings as any;
      
      // Mapeo de nombres de días en español a inglés
      const dayMapping: Record<string, string> = {
        'lunes': 'monday',
        'martes': 'tuesday',
        'miércoles': 'wednesday',
        'miercoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday',
        'sabado': 'saturday',
        'domingo': 'sunday'
      };
      
      // Verificar si existe business_hours (array) o businessHours (objeto)
      let hours: BusinessHours | null = null;
      
      if (settings?.business_hours && Array.isArray(settings.business_hours)) {
        // Convertir array a objeto
        const hoursObj: any = {};
        settings.business_hours.forEach((daySchedule: any) => {
          // Normalizar el nombre del día (quitar acentos y convertir a minúsculas)
          let dayName = daySchedule.day?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
          
          // Si está en español, convertir a inglés
          if (dayMapping[dayName]) {
            dayName = dayMapping[dayName];
          }
          
          if (dayName) {
            hoursObj[dayName] = {
              open: daySchedule.open || '09:00',
              close: daySchedule.close || '18:00',
              closed: daySchedule.closed || false
            };
          }
        });
        hours = hoursObj as BusinessHours;
      } else if (settings?.businessHours) {
        // Ya está en formato objeto
        hours = settings.businessHours as BusinessHours;
      }
      
      setBusinessHours(hours);
    } catch (error) {
      console.error('❌ Error loading business hours:', error);
    }
  };

  const calculateDayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= today && aptDate < tomorrow;
    });

    const confirmed = todayAppointments.filter(a => a.status === 'confirmed').length;
    const completed = todayAppointments.filter(a => a.status === 'completed').length;
    const pending = todayAppointments.filter(a => a.status === 'pending').length;
    const cancelled = todayAppointments.filter(a => a.status === 'cancelled').length;

    const revenue = todayAppointments
      .filter(a => a.status === 'confirmed' || a.status === 'completed')
      .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

    // Calcular ocupación (asumiendo 8 horas laborales = 480 minutos)
    const totalMinutes = todayAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, apt) => sum + (apt.service?.duration_minutes || 0), 0);
    const occupancyRate = Math.min((totalMinutes / 480) * 100, 100);

    // Contar clientes únicos
    const uniqueClients = new Set(todayAppointments.map(a => a.client?.full_name)).size;

    const newStats = {
      total: todayAppointments.length,
      confirmed,
      completed,
      pending,
      cancelled,
      revenue,
      occupancyRate,
      uniqueClients
    };

    setDayStats(newStats);
    
    // Notificar al componente padre sobre los cambios en las estadísticas
    onStatsChange?.(newStats);
  };

  const loadBusinessAppointments = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      // Calcular rango: mes actual + 1 mes antes y después
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
      const startDate = new Date(currentYear, currentMonth - 1, 1); // 1 mes antes
      const endDate = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59); // Último día del mes siguiente
      
      console.log(`📅 Cargando citas para: ${monthNames[currentMonth]} ${currentYear}`);
      console.log(`📊 Rango: ${startDate.toISOString()} - ${endDate.toISOString()}`);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          client:clients!appointments_client_id_fkey(full_name),
          service:services(name, duration_minutes, price),
          business:businesses(name)
        `)
        .eq('business_id', businessId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error cargando citas:', error);
        setAppointments([]);
        return;
      }

      console.log(`✅ Citas cargadas: ${data?.length || 0}`);
      setAppointments(data as any || []);
    } catch (error) {
      console.error('Error loading business appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientAppointments = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      // Primero obtener el client_id desde la tabla clients usando el profile_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', clientId)
        .single();

      if (clientError || !clientData) {
        console.error('Error obteniendo datos del cliente:', clientError);
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Calcular rango: mes actual + 1 mes antes y después
      const startDate = new Date(currentYear, currentMonth - 1, 1); // 1 mes antes
      const endDate = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59); // Último día del mes siguiente

      console.log(`📅 Cargando citas del cliente para: ${monthNames[currentMonth]} ${currentYear}`);
      console.log(`📊 Rango: ${startDate.toISOString()} - ${endDate.toISOString()}`);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          client:clients!appointments_client_id_fkey(full_name),
          service:services(name, duration_minutes, price),
          business:businesses(name)
        `)
        .eq('client_id', clientData.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error cargando citas del cliente:', error);
        setAppointments([]);
        return;
      }

      console.log(`✅ Citas del cliente cargadas: ${data?.length || 0}`);
      setAppointments(data as any || []);
    } catch (error) {
      console.error('Error loading client appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si un día está cerrado
  const isDayClosed = useCallback((day: number): boolean => {
    if (!businessHours) {
      return false;
    }
    
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof BusinessHours;
    
    // IMPORTANTE: Verificar primero si el día existe en businessHours
    const daySchedule = businessHours[dayName];
    
    if (!daySchedule) {
      return false;
    }
    
    // PRIORIDAD AL FLAG CLOSED - Si está marcado como cerrado, está cerrado
    // No importa si tiene horarios configurados
    const isClosed = daySchedule.closed === true;
    
    return isClosed;
  }, [businessHours, currentYear, currentMonth]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];

  const dayNames = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
  const dayNamesMobile = [t('sundayShort'), t('mondayShort'), t('tuesdayShort'), t('wednesdayShort'), t('thursdayShort'), t('fridayShort'), t('saturdayShort')];
  
  // Rango para el selector de años
  const yearsRange = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const getAppointmentsForDate = useCallback((day: number) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === currentMonth &&
        aptDate.getFullYear() === currentYear
      );
    });
  }, [appointments, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  const handleDateClick = useCallback((day: number) => {
    // CORREGIDO: Crear la fecha en formato local sin conversión de zona horaria
    // Usar el formato YYYY-MM-DD directamente para evitar problemas de zona horaria
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr + 'T00:00:00'); // Agregar hora para evitar conversión UTC
    
    setSelectedDate(date);
    onDateSelect?.(date);
    
    // Solo mostrar el listado de citas del día si la suscripción está activa o es admin
    if (isAdmin || !subscriptionStatus || subscriptionStatus.canAccess) {
      setShowDayAppointments(true);
    }
  }, [currentYear, currentMonth, onDateSelect, isAdmin, subscriptionStatus]);

  const handleAppointmentSuccess = (keepDayListOpen = false) => {
    // Recargar inmediatamente tras crear/editar (no depender solo del realtime)
    if (businessId) {
      loadBusinessAppointments();
    } else if (clientId) {
      loadClientAppointments();
    }
    
    // Notificar al padre si existe el callback
    onAppointmentCreated?.();
    
    // Notificar cambios en la próxima cita
    notifyNextAppointmentChange();
    
    // Si keepDayListOpen es false, cerrar el diálogo de día (comportamiento por defecto)
    // Si es true, mantenerlo abierto (cuando se actualiza desde DayAppointmentsList)
    if (!keepDayListOpen) {
      setShowDayAppointments(false);
    }
  };

  // Handler para cuando se cierra el diálogo de día
  const handleDayDialogClose = (open: boolean) => {
    setShowDayAppointments(open);
    
    // Si se está cerrando el diálogo, recalcular estadísticas y forzar re-render
    if (!open) {
      calculateDayStats();
      // Forzar re-render del calendario incrementando el key
      setCalendarKey(prev => prev + 1);
    }
  };

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm';
      case 'pending':
        return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm';
      case 'completed':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm';
    }
  }, []);

  const renderCalendarDays = useMemo(() => {
    const days = [];
    
    // Celdas vacías con el estilo original redondeado
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-1 sm:p-3 bg-muted/30 rounded-md sm:rounded-lg"></div>
      );
    }

    // Días con el diseño original de tarjetas independientes - responsive
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAppointments = getAppointmentsForDate(day);
      const today = new Date();
      const isToday = 
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();
      
      const isSelected = 
        selectedDate &&
        day === selectedDate.getDate() &&
        currentMonth === selectedDate.getMonth() &&
        currentYear === selectedDate.getFullYear();

      const isClosed = isDayClosed(day);

      days.push(
        <div
          key={day}
          onClick={() => !isClosed && handleDateClick(day)}
          className={`
            group relative p-1.5 sm:p-3 min-h-[60px] sm:min-h-[100px] rounded-md sm:rounded-lg
            border-2
            transition-all duration-200 ease-in-out
            ${isClosed
              ? 'opacity-40 cursor-not-allowed bg-muted/50 border-muted'
              : subscriptionStatus && !subscriptionStatus.canAccess && businessId
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
            }
            ${!isClosed && isToday 
              ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/50 shadow-md' 
              : !isClosed
                ? 'bg-card border-border hover:bg-accent/50 hover:border-primary/30 hover:shadow-md'
                : ''
            }
            ${!isClosed && isSelected ? 'border-primary shadow-lg scale-[1.02]' : ''}
            ${!isClosed && businessId && (!subscriptionStatus || subscriptionStatus.canAccess) ? 'hover:border-primary/40' : ''}
          `}
          title={
            isClosed
              ? t('businessClosedOnThisDay')
              : subscriptionStatus && !subscriptionStatus.canAccess && businessId
                ? 'Subscription expired - Please renew to create appointments'
                : businessId 
                  ? t('clickToCreateAppointment')
                  : ''
          }
        >
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <span className={`
              text-xs sm:text-sm font-semibold transition-colors
              ${isClosed
                ? 'text-muted-foreground line-through'
                : isToday 
                  ? 'text-primary sm:text-base' 
                  : 'text-foreground group-hover:text-primary'
              }
            `}>
              {day}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {dayAppointments.length > 0 && (
                <Badge 
                  variant={isToday ? "default" : "secondary"} 
                  className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5 shadow-sm h-4 sm:h-auto"
                >
                  {dayAppointments.length}
                </Badge>
              )}
              {businessId && !isClosed && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              )}
            </div>
          </div>
          
          {isClosed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground">
                {t('closed')}
              </span>
            </div>
          )}
          
          {!isClosed && (
            <div className="space-y-0.5 sm:space-y-1.5">
              {dayAppointments.slice(0, 2).map((apt, idx) => (
                <div
                  key={idx}
                  className={`
                    text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1.5 rounded-sm sm:rounded-md truncate
                    transform transition-all duration-200
                    hover:scale-105 hover:shadow-md
                    ${getStatusColor(apt.status)}
                  `}
                  title={apt.service?.name}
                >
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-2 h-2 sm:w-3 sm:h-3 opacity-80 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {/* Convertir a hora local del navegador */}
                      {new Date(apt.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {dayAppointments.length > 2 && (
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium px-1 sm:px-2 py-0.5 sm:py-1 bg-muted/50 rounded-sm sm:rounded-md">
                  +{dayAppointments.length - 2}
                </div>
              )}
            </div>
          )}

          {/* Indicador de día actual animado original */}
          {isToday && !isClosed && (
            <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      );
    }

    return days;
  }, [appointments, currentMonth, currentYear, selectedDate, subscriptionStatus, businessId, firstDayOfMonth, daysInMonth, t, getAppointmentsForDate, isDayClosed, handleDateClick, getStatusColor, businessHours]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">{t('loadingAppointments')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div key={calendarKey}>
      {/* Tarjetas de Estadísticas del Día */}
      <div id="calendar-stats-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('appointmentsToday')}</CardTitle>
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.total}</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {dayStats.confirmed} {t('confirmedCount')}, {dayStats.completed} {t('completedCount')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('revenueToday')}</CardTitle>
            <TrendingUp className="h-3 w-3 text-green-500" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.revenue.toFixed(0)} US$</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {t('confirmedAndCompleted')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('pending')}</CardTitle>
            <Clock className="h-3 w-3 text-amber-500" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.pending}</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {t('today')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('cancelled')}</CardTitle>
            <XCircle className="h-3 w-3 text-red-500" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.cancelled}</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {t('today')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('occupancy')}</CardTitle>
            <CheckCircle className="h-3 w-3 text-blue-500" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.occupancyRate.toFixed(0)}%</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {t('ofTheDay')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
            <CardTitle className="text-[10px] sm:text-xs font-medium">{t('upcoming')}</CardTitle>
            <Users className="h-3 w-3 text-purple-500" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{dayStats.uniqueClients}</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
              {t('clientsToday')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="truncate">{t('calendar')}</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                {monthNames[currentMonth]} {currentYear}
              </CardDescription>
            </div>
            
            {/* CONTROLADORES RESPONSIVE */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Botón crear cita - full width en móvil */}
              {businessId && (
                <Button
                  onClick={() => {
                    setPreselectedDate('');
                    setShowAppointmentForm(true);
                  }}
                  size="default"
                  disabled={subscriptionStatus && !subscriptionStatus.canAccess}
                  title={subscriptionStatus && !subscriptionStatus.canAccess ? 'Subscription expired - Please renew to create appointments' : ''}
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('newAppointment')}
                </Button>
              )}
              
              {/* Controles de navegación */}
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                {/* Selectores de mes y año */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="bg-background border border-border rounded-md px-2 py-1.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-sm"
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="bg-background border border-border rounded-md px-2 py-1.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-sm"
                  >
                    {yearsRange.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Botones de navegación */}
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevMonth}
                    className="hover:bg-primary/10 hover:border-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="hover:bg-primary/10 hover:border-primary transition-colors h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                  >
                    {t('today')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextMonth}
                    className="hover:bg-primary/10 hover:border-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-2 sm:p-6">
          {/* Mensaje informativo */}
          {businessId && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="font-medium">
                  {t('clickToViewAppointments')}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
            {/* Cabeceras - mostrar versión corta en móvil */}
            {dayNames.map((day, index) => (
              <div
                key={day}
                className="p-1.5 sm:p-3 text-center font-bold text-xs sm:text-sm bg-gradient-to-br from-primary/10 to-primary/5 rounded-md sm:rounded-lg text-foreground"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{dayNamesMobile[index]}</span>
              </div>
            ))}
            {/* Celdas del calendario - responsive */}
            {renderCalendarDays}
          </div>

          {/* Leyenda - responsive */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6 p-2 sm:p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded shadow-sm flex-shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium">{t('confirmed')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded shadow-sm flex-shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium">{t('pendingStatus')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm flex-shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium">{t('completed')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-400 to-red-500 rounded shadow-sm flex-shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium">{t('cancelledStatus')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listado de citas del día seleccionado */}
      {businessId && showDayAppointments && selectedDate && (
        <DayAppointmentsList
          date={selectedDate}
          businessId={businessId}
          open={showDayAppointments}
          onOpenChange={handleDayDialogClose}
          onAppointmentChange={() => handleAppointmentSuccess(true)}
          subscriptionStatus={subscriptionStatus}
        />
      )}

      {/* Formulario de citas - solo desde botón "Nueva Cita" */}
      {businessId && (
        <AppointmentForm
          key={businessId} // Forzar re-renderizado completo al cambiar de empresa
          businessId={businessId}
          open={showAppointmentForm}
          onOpenChange={setShowAppointmentForm}
          onSuccess={handleAppointmentSuccess}
          preselectedDate={preselectedDate}
          subscriptionStatus={subscriptionStatus}
        />
      )}
    </div>
  );
}






























































































