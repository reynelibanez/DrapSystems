import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar as CalendarIcon, Clock, Loader2, Plus, UserPlus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Database } from '../../lib/database.types';
import { sendEmailViaAPI } from '../../lib/notifications';
import { baseUrl } from '../../lib/base-url';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SubscriptionStatus } from '../../lib/subscription-validator';
import { ClientForm } from './ClientForm';
import { getClientBaseUrl } from '../../lib/base-url';
import { canSendSMS } from '../../lib/plan-limits';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { getPublicSiteUrl } from '../../lib/base-url';
import { generateAppointmentConfirmationLink } from '../../lib/encryption';

type Service = Database['public']['Tables']['services']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface AppointmentFormProps {
  businessId: string;
  appointment?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedDate?: string;
  subscriptionStatus?: SubscriptionStatus | null;
  keepOpenAfterSuccess?: boolean; // Nueva prop para controlar si se cierra automáticamente
}

export function AppointmentForm({ businessId, appointment, open, onOpenChange, onSuccess, preselectedDate, subscriptionStatus, keepOpenAfterSuccess = false }: AppointmentFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Estados para diálogos de creación rápida
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [newServiceData, setNewServiceData] = useState<{
    name: string;
    description: string;
    duration_minutes: number | '';
    price: number | '';
  }>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
  });

  const [formData, setFormData] = useState({
    client_id: '',
    staff_id: '',
    service_id: '',
    start_date: preselectedDate || (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    start_time: '',
    status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    notes: '',
  });

  const [showClientForm, setShowClientForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [loadingBusinessHours, setLoadingBusinessHours] = useState(true);
  const [closedDates, setClosedDates] = useState<string[]>([]); // Array de fechas cerradas en formato YYYY-MM-DD
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open && businessId && !dataLoaded) {
      const initializeForm = async () => {
        try {
          setLoadingData(true);
          
          // 1. Verificar si hay una sesión de cliente en localStorage
          const clientSessionStr = localStorage.getItem('client_session');
          let user: any = null;
          let profile: any = null;

          if (clientSessionStr) {
            // Es un cliente con sesión personalizada
            try {
              const clientSession = JSON.parse(clientSessionStr);
              
              // Crear un objeto de usuario simulado para mantener compatibilidad
              user = { id: clientSession.id };
              profile = {
                id: clientSession.id,
                email: clientSession.email || '',
                full_name: clientSession.full_name,
                role: 'client',
                business_id: clientSession.business_id,
                avatar_url: clientSession.avatar_url,
                phone: clientSession.phone,
              };
              
              setCurrentUser(profile);
            } catch (error) {
              console.error('❌ Error parseando sesión de cliente:', error);
            }
          } else {
            // Es un usuario normal de Supabase Auth
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
              setLoadingData(false);
              return;
            }
            user = authUser;

            // Obtener el perfil del usuario
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();

            if (profileData) {
              profile = profileData;
              setCurrentUser(profileData);
            }

            if (!user || !profile) {
              setLoadingData(false);
              return;
            }
          }

          // 2. Cargar todos los datos en paralelo para mayor velocidad
          await Promise.all([
            loadServices(),
            loadStaff(),
            loadClients()
          ]);
          setDataLoaded(true);
        } catch (error) {
          console.error('❌ Error inicializando formulario:', error);
        } finally {
          setLoadingData(false);
        }
      };

      initializeForm();
    } else if (!open) {
      // Resetear el formulario cuando se cierra el diálogo
      resetForm();
      setAvailableSlots([]);
      setDataLoaded(false);
    }
  }, [open, businessId, appointment, preselectedDate]);

  // Actualizar la fecha cuando cambie preselectedDate
  useEffect(() => {
    if (preselectedDate && open) {
      setFormData(prev => ({
        ...prev,
        start_date: preselectedDate,
        start_time: '' // Limpiar la hora para que el usuario seleccione una nueva
      }));
    }
  }, [preselectedDate, open]);

  // Cargar datos de la cita cuando se está editando
  useEffect(() => {
    if (appointment && open) {
      const startTime = new Date(appointment.start_time);
      const year = startTime.getFullYear();
      const month = String(startTime.getMonth() + 1).padStart(2, '0');
      const day = String(startTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

      setFormData({
        client_id: appointment.client_id || '',
        staff_id: appointment.staff_id || '',
        service_id: appointment.service_id || '',
        start_date: dateStr,
        start_time: timeStr,
        status: appointment.status as any,
        notes: appointment.notes || '',
      });
    }
  }, [appointment, open]);

  const loadServices = async () => {
    if (!businessId) return;
    
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (servicesError) {
        throw servicesError;
      }
      setServices(servicesData || []);
    } catch (error) {
      console.error('❌ Error en loadServices:', error);
    }
  };

  const loadStaff = async () => {
    if (!businessId) return;
    
    try {
      // Cargar personal - primero intentar con staff
      let { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', businessId)
        .in('role', ['staff', 'business_owner', 'admin'])
        .order('full_name');

      if (staffError) {
        throw staffError;
      }
      setStaff(staffData || []);
    } catch (error) {
      console.error('❌ Error en loadStaff:', error);
    }
  };

  const loadClients = async () => {
    if (!businessId) return;
    
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessId)
        .order('full_name');

      if (clientsError) {
        throw clientsError;
      }
      setClients(clientsData || []);
    } catch (error) {
      console.error('❌ Error en loadClients:', error);
    }
  };

  // Función para crear un nuevo servicio rápidamente
  const handleCreateService = async () => {
    // Convertir valores vacíos a números para validación
    const duration = typeof newServiceData.duration_minutes === 'string' ? 0 : newServiceData.duration_minutes;
    const price = typeof newServiceData.price === 'string' ? 0 : newServiceData.price;
    
    if (!newServiceData.name || duration < 15 || price < 0) {
      toast.error(t('completeRequiredFields'));
      return;
    }

    setLoading(true);
    try {
      const { data: newService, error } = await supabase
        .from('services')
        .insert([{
          business_id: businessId,
          name: newServiceData.name,
          description: newServiceData.description || null,
          duration_minutes: duration,
          price: price,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(t('serviceCreatedSuccessfully'));
      
      // Recargar servicios
      await loadServices();
      
      // Seleccionar el nuevo servicio
      setFormData({ ...formData, service_id: newService.id });
      
      // Cerrar diálogo y resetear formulario
      setShowServiceDialog(false);
      setNewServiceData({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 0,
      });
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(error.message || t('errorCreatingService'));
    } finally {
      setLoading(false);
    }
  };

  // Callback cuando se crea un cliente exitosamente
  const handleClientCreated = async () => {
    await loadClients();
    setShowClientDialog(false);
  };

  const loadData = async () => {
    if (!businessId) return;
    
    setLoadingData(true);
    
    try {
      await Promise.all([
        loadServices(),
        loadStaff(),
        loadClients()
      ]);
    } catch (error) {
      console.error('❌ Error general cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      staff_id: '',
      service_id: '',
      start_date: '',
      start_time: '',
      status: 'pending',
      notes: '',
    });
  };

  // Función para verificar si un día está cerrado
  const isDayDisabled = (date: Date) => {
    // Si no hay businessHours cargados aún, no deshabilitar ningún día
    if (!businessHours) {
      return false;
    }

    // Verificar si la fecha está en los días cerrados específicos
    // Usar formato local en lugar de ISO para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log('Checking date:', dateStr, 'against closedDates:', closedDates);
    
    if (closedDates.includes(dateStr)) {
      console.log('Date is closed!', dateStr);
      return true;
    }

    // Verificar si el día de la semana está cerrado
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const daySchedule = businessHours[dayName as keyof typeof businessHours];
    return daySchedule?.closed || false;
  };

  // Cargar horarios del negocio
  useEffect(() => {
    const loadBusinessHours = async () => {
      // Resetear estados al cambiar de empresa
      setLoadingBusinessHours(true);
      setBusinessHours(null);
      setClosedDates([]);
      
      try {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('settings')
          .eq('id', businessId)
          .single();

        if (error) {
          console.error('Error cargando horarios:', error);
          setLoadingBusinessHours(false);
          return;
        }

        const settings = business?.settings as any;
        
        // Mapeo de nombres de días en español a inglés
        const spanishToEnglish: Record<string, string> = {
          'Lunes': 'monday',
          'Martes': 'tuesday',
          'Miércoles': 'wednesday',
          'Jueves': 'thursday',
          'Viernes': 'friday',
          'Sábado': 'saturday',
          'Domingo': 'sunday'
        };
        
        // Días válidos en inglés (minúsculas)
        const validEnglishDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        let hours: any = {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '18:00', closed: true },
          sunday: { open: '09:00', close: '18:00', closed: true }
        };
        
        // Verificar si existe business_hours (array) o businessHours (objeto)
        if (settings?.business_hours && Array.isArray(settings.business_hours)) {
          // Convertir array a objeto
          const hoursObj: any = {};
          settings.business_hours.forEach((daySchedule: any) => {
            let englishDay: string | undefined;
            
            // Verificar si el día ya está en inglés
            if (validEnglishDays.includes(daySchedule.day.toLowerCase())) {
              englishDay = daySchedule.day.toLowerCase();
            } else {
              // Si no, intentar convertir desde español
              englishDay = spanishToEnglish[daySchedule.day];
            }
            
            if (englishDay) {
              hoursObj[englishDay] = {
                open: daySchedule.open,
                close: daySchedule.close,
                closed: daySchedule.closed,
                hasLunch: daySchedule.hasLunch || false,
                lunchStart: daySchedule.lunchStart,
                lunchEnd: daySchedule.lunchEnd
              };
            }
          });
          hours = hoursObj;
        } else if (settings?.businessHours) {
          // Usar el formato objeto directamente
          hours = settings.businessHours;
        }
        
        setBusinessHours(hours);

        // Cargar días cerrados específicos
        if (settings?.closed_dates && Array.isArray(settings.closed_dates)) {
          setClosedDates(settings.closed_dates);
        } else {
          setClosedDates([]);
        }
      } catch (error) {
        console.error('Error cargando horarios:', error);
      } finally {
        setLoadingBusinessHours(false);
      }
    };

    // Solo cargar cuando el diálogo está abierto y hay businessId
    if (businessId && open) {
      loadBusinessHours();
    }
  }, [businessId, open]);

  // Calcular horarios disponibles
  const calculateAvailableSlots = async (serviceId: string, date: string, staffId?: string) => {
    if (!serviceId || !date) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) {
        setLoadingSlots(false);
        return;
      }

      console.log('📅 Calculando slots para:', {
        date,
        service: service.name,
        duration: service.duration_minutes,
        staffId: staffId || 'any'
      });

      // Obtener horarios de trabajo de la empresa
      const { data: business } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', businessId)
        .single();

      const settings = business?.settings as any;
      
      // Mapeo de nombres de días en español a inglés
      const spanishToEnglish: Record<string, string> = {
        'Lunes': 'monday',
        'Martes': 'tuesday',
        'Miércoles': 'wednesday',
        'Jueves': 'thursday',
        'Viernes': 'friday',
        'Sábado': 'saturday',
        'Domingo': 'sunday'
      };
      
      // Días válidos en inglés (minúsculas)
      const validEnglishDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      let businessHours: any = {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: true },
        sunday: { open: '09:00', close: '18:00', closed: true }
      };
      
      // Verificar si existe business_hours (array) o businessHours (objeto)
      if (settings?.business_hours && Array.isArray(settings.business_hours)) {
        // Convertir array a objeto
        const hoursObj: any = {};
        settings.business_hours.forEach((daySchedule: any) => {
          let englishDay: string | undefined;
          
          // Verificar si el día ya está en inglés
          if (validEnglishDays.includes(daySchedule.day.toLowerCase())) {
            englishDay = daySchedule.day.toLowerCase();
          } else {
            // Si no, intentar convertir desde español
            englishDay = spanishToEnglish[daySchedule.day];
          }
          
          if (englishDay) {
            hoursObj[englishDay] = {
              open: daySchedule.open,
              close: daySchedule.close,
              closed: daySchedule.closed,
              hasLunch: daySchedule.hasLunch || false,
              lunchStart: daySchedule.lunchStart,
              lunchEnd: daySchedule.lunchEnd
            };
          }
        });
        businessHours = hoursObj;
      } else if (settings?.businessHours) {
        // Usar el formato objeto directamente
        businessHours = settings.businessHours;
      }

      // Crear fecha en hora local usando los componentes de la fecha
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      
      // Obtener el día de la semana
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const daySchedule = businessHours[dayName];

      console.log('🕐 Horario del día:', {
        dayName,
        schedule: daySchedule
      });

      // Verificar si la fecha está en los días cerrados específicos
      if (settings?.closed_dates && Array.isArray(settings.closed_dates)) {
        if (settings.closed_dates.includes(date)) {
          console.log('🚫 Día cerrado (fecha específica)');
          setAvailableSlots([]);
          toast.error('Este día está cerrado');
          setLoadingSlots(false);
          return;
        }
      }

      // Si el día está cerrado, no hay slots disponibles
      if (daySchedule?.closed) {
        console.log('🚫 Día cerrado (día de la semana)');
        setAvailableSlots([]);
        toast.error('Este día está cerrado');
        setLoadingSlots(false);
        return;
      }

      // Parsear horarios de apertura y cierre
      const [openHour, openMinute] = (daySchedule?.open || '09:00').split(':').map(Number);
      const [closeHour, closeMinute] = (daySchedule?.close || '18:00').split(':').map(Number);

      // Cargar citas existentes para esa fecha
      // Crear fechas de inicio y fin del día en la zona horaria local
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      console.log('🔍 Buscando citas entre:', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });

      let query = supabase
        .from('appointments')
        .select('id, start_time, end_time, status, staff_id')
        .eq('business_id', businessId)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString());

      // Si hay staff seleccionado, filtrar por ese staff
      if (staffId && staffId !== 'unassigned') {
        query = query.eq('staff_id', staffId);
        console.log('👤 Filtrando por staff:', staffId);
      }

      const { data: appointments, error: appointmentsError } = await query;
      
      if (appointmentsError) {
        console.error('❌ Error cargando citas:', appointmentsError);
      }

      console.log('📋 Citas existentes:', appointments?.length || 0);
      if (appointments && appointments.length > 0) {
        appointments.forEach(apt => {
          const start = new Date(apt.start_time);
          const end = new Date(apt.end_time);
          console.log('  📌 Cita:', {
            id: apt.id,
            start: start.toLocaleTimeString(),
            end: end.toLocaleTimeString(),
            staff: apt.staff_id
          });
        });
      }
      
      setExistingAppointments(appointments || []);

      // Generar slots cada 30 minutos (FIJO)
      const slots: string[] = [];

      // Obtener fecha y hora actual
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();

      console.log('⏰ Es hoy?', isToday);

      // Crear fecha de inicio y fin del horario laboral
      const workStart = new Date(year, month - 1, day, openHour, openMinute, 0, 0);
      const workEnd = new Date(year, month - 1, day, closeHour, closeMinute, 0, 0);

      console.log('🏢 Horario laboral:', {
        start: workStart.toLocaleTimeString(),
        end: workEnd.toLocaleTimeString()
      });

      let currentSlot = new Date(workStart);
      let slotCount = 0;
      let conflictCount = 0;

      while (currentSlot < workEnd) {
        slotCount++;
        
        // Calcular el fin del slot usando la duración COMPLETA del servicio
        const slotEnd = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
        
        const timeStr = `${currentSlot.getHours().toString().padStart(2, '0')}:${currentSlot.getMinutes().toString().padStart(2, '0')}`;
        const endTimeStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;
        
        console.log(`🔍 Evaluando slot #${slotCount}:`, {
          inicio: timeStr,
          fin: endTimeStr,
          duracionServicio: service.duration_minutes,
          horarioCierre: `${workEnd.getHours().toString().padStart(2, '0')}:${workEnd.getMinutes().toString().padStart(2, '0')}`,
          slotEndTime: slotEnd.getTime(),
          workEndTime: workEnd.getTime(),
          excedeCierre: slotEnd > workEnd
        });
        
        // Si es hoy, filtrar horarios que ya pasaron
        if (isToday && currentSlot <= now) {
          console.log(`  ⏭️  Slot ${timeStr} - ${endTimeStr}: Ya pasó`);
          currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000); // Avanzar según duración del servicio
          continue;
        }

        // ✅ CORRECCIÓN: El servicio debe TERMINAR antes o exactamente a la hora de cierre
        // Si el slot terminaría DESPUÉS del cierre, no es válido
        if (slotEnd > workEnd) {
          console.log(`  ❌ RECHAZADO: Slot ${timeStr} - ${endTimeStr}: La cita terminaría después del cierre (${workEnd.getHours().toString().padStart(2, '0')}:${workEnd.getMinutes().toString().padStart(2, '0')})`);
          break; // No hay más slots posibles
        }

        // Verificar si el slot cae durante el horario de almuerzo
        let isDuringLunch = false;
        if (daySchedule?.hasLunch && daySchedule?.lunchStart && daySchedule?.lunchEnd) {
          const [lunchStartHour, lunchStartMinute] = daySchedule.lunchStart.split(':').map(Number);
          const [lunchEndHour, lunchEndMinute] = daySchedule.lunchEnd.split(':').map(Number);
          
          const lunchStart = new Date(year, month - 1, day, lunchStartHour, lunchStartMinute, 0, 0);
          const lunchEnd = new Date(year, month - 1, day, lunchEndHour, lunchEndMinute, 0, 0);
          
          // El slot NO es válido si:
          // 1. Comienza durante el almuerzo (pero no exactamente cuando termina)
          // 2. Termina durante el almuerzo (pero no exactamente cuando empieza)
          // 3. Contiene completamente el horario de almuerzo
          // 4. Está contenido completamente dentro del horario de almuerzo
          isDuringLunch = (
            (currentSlot >= lunchStart && currentSlot < lunchEnd) ||
            (slotEnd > lunchStart && slotEnd <= lunchEnd) ||
            (currentSlot < lunchStart && slotEnd > lunchEnd) ||
            (currentSlot >= lunchStart && slotEnd <= lunchEnd)
          );
          
          if (isDuringLunch) {
            console.log(`  🍽️ RECHAZADO: Slot ${timeStr} - ${endTimeStr}: Cae durante el horario de almuerzo (${daySchedule.lunchStart} - ${daySchedule.lunchEnd})`);
            currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
            continue;
          }
        }

        // Verificar si hay conflicto con citas existentes
        const hasConflict = appointments?.some(apt => {
          // Si estamos editando, ignorar la cita actual
          if (appointment && apt.id === appointment.id) {
            return false;
          }

          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);

          // Hay conflicto si hay CUALQUIER solapamiento entre el slot y la cita existente
          // El slot va de currentSlot a slotEnd
          // La cita va de aptStart a aptEnd
          
          // Solapamiento: el slot comienza antes de que termine la cita Y termina después de que empiece la cita
          const overlaps = currentSlot < aptEnd && slotEnd > aptStart;
          
          if (overlaps) {
            conflictCount++;
            console.log(`  🚫 Slot ${timeStr} - ${endTimeStr}: CONFLICTO con cita`, {
              appointmentId: apt.id,
              appointmentStart: `${aptStart.getHours().toString().padStart(2, '0')}:${aptStart.getMinutes().toString().padStart(2, '0')}`,
              appointmentEnd: `${aptEnd.getHours().toString().padStart(2, '0')}:${aptEnd.getMinutes().toString().padStart(2, '0')}`,
              slotStart: timeStr,
              slotEnd: endTimeStr
            });
          }

          return overlaps;
        });

        if (!hasConflict) {
          slots.push(timeStr);
          console.log(`  ✅ Slot ${timeStr} - ${endTimeStr}: Disponible`);
        }

        // Avanzar según la duración del servicio
        currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
      }

      console.log('📊 Resumen:', {
        slotsEvaluados: slotCount,
        conflictos: conflictCount,
        slotsDisponibles: slots.length
      });

      // Si estamos editando, asegurar que el horario actual esté en la lista
      // solo si la fecha no ha cambiado
      if (appointment && formData.start_time) {
        const originalDate = new Date(appointment.start_time).toISOString().split('T')[0];
        if (date === originalDate && !slots.includes(formData.start_time)) {
          console.log('📝 Agregando horario original de la cita:', formData.start_time);
          slots.push(formData.start_time);
          slots.sort();
        }
      }

      console.log('✅ Slots finales:', slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('❌ Error calculating slots:', error);
      toast.error('Error al calcular horarios disponibles');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Recalcular slots cuando cambie servicio, fecha o staff
  useEffect(() => {
    if (formData.service_id && formData.start_date) {
      calculateAvailableSlots(formData.service_id, formData.start_date, formData.staff_id);
    }
  }, [formData.service_id, formData.start_date, formData.staff_id, services.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar suscripción antes de crear/editar cita
    if (subscriptionStatus && !subscriptionStatus.canAccess && !appointment) {
      toast.error('Your subscription has expired. Please renew to create new appointments.');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      const service = services.find(s => s.id === formData.service_id);
      if (!service) {
        toast.error('Selecciona un servicio válido');
        setLoading(false);
        return;
      }

      // Validar que la fecha y hora no sean en el pasado
      const [year, month, day] = formData.start_date.split('-').map(Number);
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      
      const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();

      // Si estamos creando una nueva cita, no permitir fechas pasadas
      if (!appointment && selectedDateTime <= now) {
        toast.error('No puedes crear una cita en una fecha u hora que ya pasó');
        setLoading(false);
        return;
      }

      // Si estamos editando, permitir mantener la fecha original pero no cambiar a fechas pasadas
      if (appointment) {
        const originalDateTime = new Date(appointment.start_time);
        const originalYear = originalDateTime.getFullYear();
        const originalMonth = String(originalDateTime.getMonth() + 1).padStart(2, '0');
        const originalDay = String(originalDateTime.getDate()).padStart(2, '0');
        const originalDateStr = `${originalYear}-${originalMonth}-${originalDay}`;
        const originalTimeStr = originalDateTime.toTimeString().slice(0, 5);

        // Si cambió la fecha o la hora
        const dateChanged = formData.start_date !== originalDateStr;
        const timeChanged = formData.start_time !== originalTimeStr;

        if ((dateChanged || timeChanged) && selectedDateTime <= now) {
          toast.error('No puedes cambiar la cita a una fecha u hora que ya pasó');
          setLoading(false);
          return;
        }
      }

      // Obtener el usuario actual (puede ser de Supabase Auth o de sesión de cliente)
      let user: any = null;
      
      const clientSessionStr = localStorage.getItem('client_session');
      if (clientSessionStr) {
        // Es un cliente con sesión personalizada
        try {
          const clientSession = JSON.parse(clientSessionStr);
          user = { id: clientSession.id };
        } catch (error) {
          console.error('❌ Error parseando sesión de cliente:', error);
        }
      } else {
        // Es un usuario normal de Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      }

      if (!user) {
        toast.error('No se pudo obtener el usuario actual');
        setLoading(false);
        return;
      }

      const startTime = selectedDateTime;
      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      // Asegurar que siempre haya un staff_id válido
      let staffId = formData.staff_id;
      
      // Si no hay staff_id seleccionado, usar el del usuario actual
      if (!staffId || staffId === '') {
        staffId = user.id;
      }

      const appointmentData = {
        business_id: businessId,
        client_id: formData.client_id,
        staff_id: staffId, // Siempre usar un staff_id válido
        service_id: formData.service_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: formData.status,
        notes: formData.notes || null,
      };

      console.log('📝 Datos de la cita a guardar:', appointmentData);

      if (appointment) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);

        if (error) {
          console.error('❌ Error al actualizar cita:', error);
          throw error;
        }
        toast.success('Cita actualizada exitosamente');
      } else {
        const { data: newAppointment, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();

        if (error) throw error;
        
        // Enviar email de confirmación al cliente
        let emailSent = false;
        let smsSent = false;
        
        try {
          const client = clients.find(c => c.id === formData.client_id);
          const { data: business } = await supabase
            .from('businesses')
            .select('name, address, subscription_plan, subscription_status, email')
            .eq('id', businessId)
            .single();

          if (client && business) {
            // Obtener el idioma preferido del cliente (por defecto español)
            const clientLanguage = (client as any).preferred_language || 'es';
            
            // Preparar datos comunes
            const appointmentDate = startTime.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            
            const appointmentTime = startTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // ENVIAR EMAIL AL CLIENTE si el cliente tiene email
            if (client.email) {
              try {
                // Generar enlace de confirmación
                const siteUrl = getPublicSiteUrl(); // Ya incluye el baseUrl
                const confirmationUrl = generateAppointmentConfirmationLink(newAppointment.id, siteUrl);
                
                console.log('🔐 Confirmation link generated in AppointmentForm:');
                console.log('  - Appointment ID:', newAppointment.id);
                console.log('  - Confirmation URL:', confirmationUrl);
                console.log('  - Site URL:', siteUrl);
                
                const emailPayload = {
                  to: client.email,
                  subject: clientLanguage === 'en' 
                    ? `Appointment Confirmed - ${business.name}`
                    : `Cita confirmada - ${business.name}`,
                  html: '', // Se generará en el servidor
                  type: 'appointment_created',
                  appointmentData: {
                    clientName: client.full_name,
                    serviceName: service.name,
                    date: appointmentDate,
                    time: appointmentTime,
                    notes: formData.notes,
                    businessName: business.name,
                    businessAddress: business.address,
                    siteUrl: siteUrl,
                    language: clientLanguage,
                    appointmentId: newAppointment.id,
                    confirmationUrl: confirmationUrl
                  }
                };

                // Construir URL completa para evitar problemas de CORS
                const apiUrl = `${window.location.origin}${baseUrl}/api/notifications/send-email`;

                // Enviar email usando el endpoint de la API
                const emailResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailPayload),
                });

                // Leer la respuesta
                const emailResponseText = await emailResponse.text();

                if (!emailResponse.ok) {
                  let errorMessage = 'Error al enviar email';
                  try {
                    const errorData = JSON.parse(emailResponseText);
                    errorMessage = errorData.error || errorMessage;
                    console.error('❌ Error del servidor (email cliente):', errorData);
                  } catch (e) {
                    console.error('❌ Respuesta no es JSON (email cliente):', emailResponseText.substring(0, 500));
                    errorMessage = `Error ${emailResponse.status}: ${emailResponse.statusText}`;
                  }
                  throw new Error(errorMessage);
                }

                // Intentar parsear como JSON
                try {
                  const emailResult = JSON.parse(emailResponseText);
                  emailSent = true;
                  console.log('✅ Email enviado al cliente exitosamente');
                } catch (e) {
                  emailSent = true;
                  console.log('✅ Email enviado al cliente exitosamente');
                }
              } catch (emailError: any) {
                console.error('❌ Error enviando email al cliente:', emailError);
                // No fallar la creación de la cita si falla el email
              }
            }

            // ENVIAR EMAIL AL NEGOCIO si el negocio tiene email configurado
            if (business.email) {
              try {
                const businessEmailPayload = {
                  to: business.email,
                  subject: `New Appointment Booked - ${business.name}`,
                  html: '', // Se generará en el servidor
                  type: 'business_appointment_notification',
                  appointmentData: {
                    clientName: client.full_name,
                    clientEmail: client.email,
                    clientPhone: client.phone,
                    serviceName: service.name,
                    date: appointmentDate,
                    time: appointmentTime,
                    notes: formData.notes,
                    businessName: business.name,
                    businessAddress: business.address,
                    siteUrl: getPublicSiteUrl() // Ya incluye el baseUrl
                  }
                };

                const businessApiUrl = `${window.location.origin}${baseUrl}/api/notifications/send-email`;

                const businessEmailResponse = await fetch(businessApiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(businessEmailPayload),
                });

                const businessEmailResponseText = await businessEmailResponse.text();

                if (businessEmailResponse.ok) {
                  console.log('✅ Email enviado al negocio exitosamente');
                } else {
                  console.warn('⚠️ Error al enviar email al negocio:', businessEmailResponseText);
                }
              } catch (businessEmailError: any) {
                console.error('❌ Error enviando email al negocio:', businessEmailError);
                // No fallar la creación de la cita si falla el email al negocio
              }
            } else {
              console.log('⚠️ No se puede enviar email al negocio: email no configurado');
            }

            // ENVIAR SMS si el plan lo tiene activado y el cliente tiene teléfono
            if (client.phone) {
              try {
                // Verificar si el plan incluye SMS usando la función de plan-limits
                const planIncludesSMS = business.subscription_plan && 
                  canSendSMS(business.subscription_plan) &&
                  business.subscription_status === 'active';

                if (planIncludesSMS) {
                  // Generar mensaje SMS en el idioma preferido del cliente
                  const smsMessage = clientLanguage === 'en'
                    ? `Hello ${client.full_name}, your appointment at ${business.name} has been confirmed for ${appointmentDate} at ${appointmentTime}. Service: ${service.name}`
                    : `Hola ${client.full_name}, tu cita en ${business.name} ha sido confirmada para el ${appointmentDate} a las ${appointmentTime}. Servicio: ${service.name}`;

                  // Asegurar que el teléfono tenga el formato E.164 (+1234567890)
                  let phoneNumber = client.phone.trim();
                  if (!phoneNumber.startsWith('+')) {
                    phoneNumber = '+' + phoneNumber;
                  }

                  const smsPayload = {
                    to: phoneNumber,
                    message: smsMessage,
                    type: 'appointment_created',
                    businessId: businessId, // Usar el businessId del prop, no del currentUser
                    appointmentId: newAppointment.id,
                    clientId: client.id,
                    preferredLanguage: clientLanguage
                  };

                  const smsUrl = `${window.location.origin}${baseUrl}/api/notifications/send-sms`;

                  const smsResponse = await fetch(smsUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(smsPayload),
                  });

                  const smsResponseText = await smsResponse.text();

                  if (smsResponse.ok) {
                    try {
                      const smsResult = JSON.parse(smsResponseText);
                      smsSent = true;
                    } catch (e) {
                      smsSent = true;
                    }
                  } else {
                    try {
                      const errorData = JSON.parse(smsResponseText);
                      console.warn('⚠️ Error al enviar SMS:', errorData);
                    } catch (e) {
                      console.warn('⚠️ Error al enviar SMS:', smsResponseText);
                    }
                  }
                }
              } catch (smsError: any) {
                console.error('❌ Error enviando SMS:', smsError);
                // No fallar la creación de la cita si falla el SMS
              }
            }
          } else {
            // No hay cliente o negocio para enviar notificaciones
          }
        } catch (notificationError: any) {
          console.error('❌ Error general en notificaciones:', notificationError);
          // No fallar la creación de la cita si fallan las notificaciones
        }
        
        // Mensaje de éxito personalizado según lo que se envió
        let successMessage = 'Cita creada exitosamente';
        if (emailSent && smsSent) {
          successMessage += '. Se ha enviado un email y SMS de confirmación al cliente.';
        } else if (emailSent) {
          successMessage += '. Se ha enviado un email de confirmación al cliente.';
        } else if (smsSent) {
          successMessage += '. Se ha enviado un SMS de confirmación al cliente.';
        } else {
          successMessage += '.';
        }
        
        toast.success(successMessage);
      }

      // Notificar éxito
      onSuccess();
      
      // Solo cerrar el diálogo si keepOpenAfterSuccess es false
      if (!keepOpenAfterSuccess) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error(error.message || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <div className="p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              {appointment ? t('editAppointment') : t('newAppointment')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {appointment ? t('editAppointmentDescription') : t('newAppointmentDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loadingData || loadingBusinessHours ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{t('loadingData')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client" className="text-sm">{t('client')} *</Label>
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.client_id} 
                        onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                        required
                        disabled={loadingData || currentUser?.role === 'client'}
                      >
                        <SelectTrigger id="client" className="h-10 sm:h-11">
                          <SelectValue placeholder={loadingData ? t('loading') : t('selectClient')} />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.length === 0 ? (
                            <div className="p-3 text-xs text-center text-muted-foreground">
                              <p className="font-medium mb-1">{t('noClientsAvailable')}</p>
                              <p className="text-[10px] opacity-70">
                                {t('createClientsFromSection')}
                              </p>
                            </div>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{client.full_name}</span>
                                  {client.email && (
                                    <span className="text-xs text-muted-foreground">{client.email}</span>
                                  )}
                                  {client.phone && !client.email && (
                                    <span className="text-xs text-muted-foreground">{client.phone}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {currentUser?.role !== 'client' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowClientDialog(true)}
                          disabled={loadingData}
                          className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0"
                          title={t('addNewClient')}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {clients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {clients.length} {clients.length !== 1 ? t('clientsAvailable') : t('clientAvailable')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-sm">{t('service')} *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.service_id} 
                        onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                        required
                      >
                        <SelectTrigger id="service" className="h-10 sm:h-11">
                          <SelectValue placeholder={t('selectService')} />
                        </SelectTrigger>
                        <SelectContent>
                          {services.length === 0 ? (
                            <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                              {t('noServicesAvailable')}
                            </div>
                          ) : (
                            services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                                  <span className="font-medium">{service.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ${service.price} • {service.duration_minutes}min
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowServiceDialog(true)}
                        disabled={loadingData}
                        className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0"
                        title={t('addNewService')}
                      >
                        <Briefcase className="w-4 h-4" />
                      </Button>
                    </div>
                    {services.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('createServicesInSection')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff" className="text-sm">{t('assignedStaff')}</Label>
                    <Select 
                      value={formData.staff_id || currentUser?.id || ''} 
                      onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                    >
                      <SelectTrigger id="staff" className="h-10 sm:h-11">
                        <SelectValue placeholder={loadingData ? t('loading') : t('selectStaff')} />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.length === 0 ? (
                          <div className="p-3 text-xs text-center text-muted-foreground">
                            <p className="font-medium mb-1">{t('noStaffAvailable')}</p>
                          </div>
                        ) : (
                          staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.full_name || member.email}</span>
                                {member.id === currentUser?.id && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    {t('you')}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('selectStaffMemberForAppointment')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm">{t('status')} *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      required
                    >
                      <SelectTrigger id="status" className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                        {/* Solo mostrar estos estados si NO es cliente */}
                        {currentUser?.role !== 'client' && (
                          <>
                            <SelectItem value="completed">{t('completed')}</SelectItem>
                            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                            <SelectItem value="no_show">{t('noShow')}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {currentUser?.role === 'client' && (
                      <p className="text-xs text-muted-foreground">
                        {t('clientsCanOnlySetPendingOrConfirmed')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm">{t('date')} *</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 sm:h-11",
                            !formData.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? (
                            format((() => {
                              const [year, month, day] = formData.start_date.split('-').map(Number);
                              return new Date(year, month - 1, day);
                            })(), "PPP", { locale: es })
                          ) : (
                            <span>{t('selectDate')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date ? (() => {
                            const [year, month, day] = formData.start_date.split('-').map(Number);
                            return new Date(year, month - 1, day);
                          })() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const dateStr = `${year}-${month}-${day}`;
                              setFormData({ ...formData, start_date: dateStr, start_time: '' });
                              setCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            // Deshabilitar fechas pasadas (excepto si es edición y es la fecha original)
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isBeforeToday = date < today;
                            
                            if (appointment) {
                              const originalDate = new Date(appointment.start_time);
                              originalDate.setHours(0, 0, 0, 0);
                              const isOriginalDate = date.getTime() === originalDate.getTime();
                              
                              // Permitir la fecha original aunque sea pasada
                              if (isOriginalDate) return false;
                            }
                            
                            // Deshabilitar fechas pasadas
                            if (isBeforeToday) {
                              return true;
                            }
                            
                            // Deshabilitar días cerrados
                            return isDayDisabled(date);
                          }}
                          modifiers={{
                            closed: isDayDisabled
                          }}
                          modifiersStyles={{
                            closed: {
                              backgroundColor: 'var(--muted)',
                              color: 'var(--muted-foreground)',
                              opacity: 0.4,
                              cursor: 'not-allowed',
                              textDecoration: 'line-through',
                            },
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {appointment && (
                      <p className="text-xs text-muted-foreground">
                        {t('canKeepOriginalDateButNotPastDates')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Horarios disponibles */}
                {formData.start_date && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('availableSlots')}</Label>
                      {loadingSlots && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('loading')}
                        </span>
                      )}
                    </div>
                    
                    {availableSlots.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setFormData({ ...formData, start_time: slot })}
                              className={`
                                h-12 sm:h-14
                                px-2 py-2
                                rounded-lg border-2 
                                font-medium text-sm sm:text-base
                                transition-all duration-200
                                flex flex-col items-center justify-center
                                ${formData.start_time === slot
                                  ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                                  : 'border-input bg-background hover:border-primary/50 hover:bg-accent'
                                }
                              `}
                            >
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mb-1" />
                              <span className="font-semibold text-xs sm:text-sm">{slot}</span>
                            </button>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          {availableSlots.length} {availableSlots.length !== 1 ? t('slotsAvailable') : t('slotAvailable')}
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 sm:p-8 text-center border-2 border-dashed border-muted rounded-lg bg-muted/30">
                        <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {t('noSlotsAvailable')}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {t('selectAnotherDateOrService')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!formData.service_id && (
                  <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground border rounded-md bg-muted/30">
                    {t('selectServiceAndDate')}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">{t('notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('additionalNotes')}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || services.length === 0 || clients.length === 0 || !formData.start_time}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {appointment ? t('update') : t('create')} {t('appointment')}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        </div>
      </DialogContent>

      {/* Diálogo para crear nuevo cliente */}
      <ClientForm
        businessId={businessId}
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onSuccess={handleClientCreated}
      />

      {/* Diálogo para crear nuevo servicio */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {t('newService')}
            </DialogTitle>
            <DialogDescription>
              {t('createNewServiceQuickly')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">{t('serviceName')} *</Label>
              <Input
                id="service-name"
                value={newServiceData.name}
                onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                placeholder={t('enterServiceName')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">{t('description')}</Label>
              <Textarea
                id="service-description"
                value={newServiceData.description}
                onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                placeholder={t('enterServiceDescription')}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-duration">{t('duration')} (min) *</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="15"
                  step="15"
                  value={newServiceData.duration_minutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewServiceData({ 
                      ...newServiceData, 
                      duration_minutes: value === '' ? '' as any : parseInt(value) || 0
                    });
                  }}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">{t('price')} ($) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newServiceData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewServiceData({ 
                      ...newServiceData, 
                      price: value === '' ? '' as any : parseFloat(value) || 0
                    });
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowServiceDialog(false);
                setNewServiceData({
                  name: '',
                  description: '',
                  duration_minutes: 60,
                  price: 0,
                });
              }}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateService}
              disabled={loading || !newServiceData.name}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}































































































































































































