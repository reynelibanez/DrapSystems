import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
}

interface NextAppointmentCardProps {
  userId?: string;
  role?: string;
  businessId?: string;
  onAppointmentChange?: (appointment: AppointmentWithDetails | null) => void;
  appointment?: AppointmentWithDetails | null; // Prop opcional para controlar desde el padre
}

export function NextAppointmentCard({ userId: propUserId, role: propRole, businessId: propBusinessId, onAppointmentChange, appointment: propAppointment }: NextAppointmentCardProps) {
  const { t } = useTranslation();
  const [nextAppointment, setNextAppointment] = useState<AppointmentWithDetails | null>(propAppointment || null);
  const [loading, setLoading] = useState(!propAppointment);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [role, setRole] = useState<string | null>(propRole || null);
  const [businessId, setBusinessId] = useState<string | null>(propBusinessId || null);
  
  // Usar useRef para mantener una referencia estable a onAppointmentChange
  const onAppointmentChangeRef = useRef(onAppointmentChange);
  
  // Flag para evitar múltiples cargas simultáneas
  const isLoadingRef = useRef(false);
  
  // Actualizar la ref cuando cambie el callback
  useEffect(() => {
    onAppointmentChangeRef.current = onAppointmentChange;
  }, [onAppointmentChange]);

  // Si se proporciona appointment como prop, usarlo directamente
  useEffect(() => {
    if (propAppointment !== undefined) {
      setNextAppointment(propAppointment);
      setLoading(false);
    }
  }, [propAppointment]);

  // Obtener datos del usuario si no se proporcionan como props
  useEffect(() => {
    const getUserData = async () => {
      if (propUserId && propRole) {
        setUserId(propUserId);
        setRole(propRole);
        setBusinessId(propBusinessId || null);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('business_id, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserId(user.id);
          setRole(profile.role);
          setBusinessId(profile.business_id || null);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };

    getUserData();
  }, [propUserId, propRole, propBusinessId]);

  const loadNextAppointment = useCallback(async () => {
    if (!userId || !role) {
      return;
    }

    // Prevenir múltiples ejecuciones simultáneas
    if (isLoadingRef.current) {
      console.log('⏭️ Skipping loadNextAppointment - already loading');
      return;
    }

    isLoadingRef.current = true;
    console.log('🔄 Loading next appointment...', { userId, role, businessId });

    try {
      setLoading(true);
      
      // Obtener el inicio del día actual (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      // Query simple sin joins
      let simpleQuery = supabase
        .from('appointments')
        .select('*')
        .gte('start_time', startOfToday)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(10);

      // Filtrar según el rol
      if (role === 'staff' && businessId) {
        simpleQuery = simpleQuery.eq('business_id', businessId);
      } else if (role === 'client') {
        simpleQuery = simpleQuery.eq('client_id', userId);
      } else if ((role === 'business_owner' || role === 'admin') && businessId) {
        simpleQuery = simpleQuery.eq('business_id', businessId);
      }

      const { data: simpleData, error: simpleError } = await simpleQuery;

      if (simpleError) {
        console.error('❌ Error loading appointments:', simpleError);
        throw simpleError;
      }

      if (!simpleData || simpleData.length === 0) {
        console.log('ℹ️ No upcoming appointments');
        setNextAppointment(null);
        onAppointmentChangeRef.current?.(null);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      // Cargar detalles de la primera cita
      const appointmentId = simpleData[0].id;
      
      const { data: detailedData, error: detailedError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (detailedError) {
        console.error('❌ Error loading appointment details:', detailedError);
        throw detailedError;
      }

      if (detailedData) {
        const appointment = detailedData as AppointmentWithDetails;
        
        // Validación adicional
        if (role === 'business_owner' && businessId && appointment.business_id !== businessId) {
          console.error('❌ Appointment does not belong to business');
          setNextAppointment(null);
          onAppointmentChangeRef.current?.(null);
          isLoadingRef.current = false;
          return;
        }

        console.log('✅ Next appointment loaded:', appointment.id);
        setNextAppointment(appointment);
        onAppointmentChangeRef.current?.(appointment);
      } else {
        setNextAppointment(null);
        onAppointmentChangeRef.current?.(null);
      }
    } catch (error) {
      console.error('❌ Error in loadNextAppointment:', error);
      setNextAppointment(null);
      onAppointmentChangeRef.current?.(null);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId, role, businessId]);

  useEffect(() => {
    // Si se proporciona appointment como prop, no cargar datos
    if (propAppointment !== undefined) {
      return;
    }

    if (!userId || !role) {
      return;
    }

    console.log('🔄 NextAppointmentCard initialized');
    loadNextAppointment();

    // Suscribirse a cambios en tiempo real
    const channelName = `next-appointment-${userId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('🔔 Appointment change detected:', payload.eventType);
          // Recargar después de un pequeño delay
          setTimeout(() => {
            loadNextAppointment();
          }, 500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to appointment changes');
        }
      });

    return () => {
      console.log('🔕 Unsubscribing from appointment changes');
      supabase.removeChannel(channel);
    };
  }, [userId, role, businessId, loadNextAppointment, propAppointment]);

  if (loading) {
    return (
      <Card className="border border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-2">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextAppointment) {
    return (
      <Card className="border border-muted shadow-sm bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="p-2">
          <p className="text-xs text-muted-foreground text-center">
            {t('noUpcomingAppointments')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const appointmentDate = new Date(nextAppointment.start_time);
  const appointmentEndDate = new Date(nextAppointment.end_time);

  return (
    <Card className="border border-primary/30 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
      <CardContent className="p-2 space-y-1.5">
        {/* Título compacto */}
        <div className="flex items-center gap-1 text-primary mb-1">
          <Calendar className="w-3 h-3" />
          <span className="text-xs font-semibold">{t('nextAppointmentTitle')}</span>
        </div>

        {/* Cliente - versión compacta */}
        {nextAppointment.client && (
          <div className="flex items-center gap-1.5 p-1.5 bg-card rounded border border-border/50">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs text-foreground truncate">
                {nextAppointment.client.full_name || nextAppointment.client.email || t('clientWithoutName')}
              </p>
            </div>
          </div>
        )}

        {/* Fecha y Hora - en una sola línea */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-medium">
              {format(appointmentDate, "d MMM", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-medium">
              {format(appointmentDate, 'HH:mm')} - {format(appointmentEndDate, 'HH:mm')}
            </span>
          </div>
        </div>

        {/* Servicio - versión compacta */}
        {nextAppointment.service && (
          <div className="p-1.5 bg-secondary/50 rounded border border-border/50">
            <p className="text-xs font-medium text-foreground truncate">
              {nextAppointment.service.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}










































