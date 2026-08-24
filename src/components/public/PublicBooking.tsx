import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Calendar as CalendarIcon, Clock, Building2, User, Mail, Phone, CheckCircle2, Moon, Sun, Languages, ChevronLeft, ChevronRight } from 'lucide-react';
import { baseUrl } from '../../lib/base-url';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

// Lista de prefijos de países más comunes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+1-809', country: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
  { code: '+1-787', country: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
];

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface PublicBookingProps {
  businessId: string; // Este es el ID encriptado
}

export function PublicBooking({ businessId: encryptedBusinessId }: PublicBookingProps) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState('+1');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lunes a Viernes por defecto
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [closedDates, setClosedDates] = useState<string[]>([]); // Array de fechas cerradas en formato YYYY-MM-DD
  const [currentDate, setCurrentDate] = useState(new Date());

  // Montar el componente para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
    // Cargar tema desde localStorage al montar
    const savedTheme = localStorage.getItem('public-booking-theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setLocalTheme(initialTheme);
    
    // Aplicar tema al DOM
    const html = document.documentElement;
    if (initialTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, []);

  // Form state
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleThemeToggle = () => {
    const newTheme = localTheme === 'dark' ? 'light' : 'dark';
    
    // Actualizar estado local
    setLocalTheme(newTheme);
    
    // Aplicar al DOM
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Guardar en localStorage
    localStorage.setItem('public-booking-theme', newTheme);
  };

  // Función para verificar si un día está deshabilitado
  const isDayDisabled = (date: Date): boolean => {
    // Deshabilitar fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return true;
    }

    // Verificar si la fecha está en los días cerrados específicos
    const dateStr = date.toISOString().split('T')[0];
    if (closedDates.includes(dateStr)) {
      return true;
    }

    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Si tenemos businessHours, verificar si el día está cerrado
    if (businessHours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const daySchedule = businessHours[dayName];
      
      // Si el día está marcado como cerrado, está deshabilitado
      if (daySchedule?.closed === true) {
        return true;
      }
      
      // Si no existe configuración para este día, asumimos que está cerrado
      if (!daySchedule) {
        return true;
      }
    }
    
    return false;
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Celdas vacías
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-1 sm:p-3 bg-muted/30 rounded-md sm:rounded-lg"></div>
      );
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      // CORREGIDO: Crear la fecha correctamente sin conversión de zona horaria
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(currentYear, currentMonth, day); // Usar componentes individuales en lugar de string
      const disabled = isDayDisabled(date);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = 
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();
      
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => {
            if (!disabled) {
              setSelectedDate(dateStr);
              setSelectedTime(''); // Reset time when date changes
            }
          }}
          className={`
            group relative p-1.5 sm:p-3 min-h-[60px] sm:min-h-[100px] rounded-md sm:rounded-lg
            border-2
            transition-all duration-200 ease-in-out
            ${disabled
              ? 'opacity-50 cursor-not-allowed bg-muted/50 border-muted' 
              : 'cursor-pointer'
            }
            ${isToday && !disabled
              ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/50 shadow-md' 
              : !disabled ? 'bg-card border-border hover:bg-accent/50 hover:border-primary/30 hover:shadow-md' : ''
            }
            ${isSelected ? 'border-primary shadow-lg scale-[1.02] bg-primary/10' : ''}
          `}
          title={disabled ? t('publicBooking.notWorkingDay') || 'Día no disponible' : t('publicBooking.selectDate')}
        >
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <span className={`
              text-xs sm:text-sm font-semibold transition-colors
              ${isToday && !disabled
                ? 'text-primary sm:text-base' 
                : disabled ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'
              }
            `}>
              {day}
            </span>
          </div>

          {/* Indicador de día actual */}
          {isToday && !disabled && (
            <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          )}

          {/* Indicador de día seleccionado */}
          {isSelected && (
            <div className="absolute bottom-1 right-1">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar información del negocio (el endpoint desencriptará el ID)
        const businessResponse = await fetch(`${baseUrl}/api/public/business/${encryptedBusinessId}`);
        
        if (!businessResponse.ok) {
          const errorData = await businessResponse.json();
          throw new Error(errorData.error || t('publicBooking.errorLoadingBusiness'));
        }

        const businessData = await businessResponse.json();
        setBusiness(businessData);

        // Mapeo de nombres de días en español a inglés
        const dayMapping: Record<string, string> = {
          'Lunes': 'monday',
          'Martes': 'tuesday',
          'Miércoles': 'wednesday',
          'Jueves': 'thursday',
          'Viernes': 'friday',
          'Sábado': 'saturday',
          'Domingo': 'sunday'
        };

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
        if (businessData.settings?.business_hours && Array.isArray(businessData.settings.business_hours)) {
          // Convertir array a objeto
          const hoursObj: any = {};
          businessData.settings.business_hours.forEach((daySchedule: any) => {
            const englishDay = dayMapping[daySchedule.day];
            if (englishDay) {
              hoursObj[englishDay] = {
                open: daySchedule.open,
                close: daySchedule.close,
                closed: daySchedule.closed
              };
            }
          });
          hours = hoursObj;
        } else if (businessData.settings?.businessHours) {
          // Usar el formato objeto directamente
          hours = businessData.settings.businessHours;
        }

        setBusinessHours(hours);

        // Cargar días cerrados específicos
        if (businessData.settings?.closed_dates && Array.isArray(businessData.settings.closed_dates)) {
          setClosedDates(businessData.settings.closed_dates);
        } else {
          setClosedDates([]);
        }

        // Extraer días laborables de settings si existen
        if (businessData.settings?.workingDays) {
          setWorkingDays(businessData.settings.workingDays);
        } else {
          // Por defecto: Lunes a Viernes (1-5)
          setWorkingDays([1, 2, 3, 4, 5]);
        }

        // Cargar servicios del negocio (el endpoint desencriptará el ID)
        const servicesResponse = await fetch(`${baseUrl}/api/public/services/${encryptedBusinessId}`);
        
        if (!servicesResponse.ok) {
          const errorData = await servicesResponse.json();
          throw new Error(t('publicBooking.errorLoadingServices'));
        }

        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('publicBooking.errorLoadingBusiness'));
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [encryptedBusinessId, t]);

  // Calcular horarios disponibles cuando cambie el servicio o la fecha
  useEffect(() => {
    if (selectedService && selectedDate) {
      calculateAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedService, selectedDate]);

  const calculateAvailableSlots = async () => {
    if (!selectedService || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);

    try {
      const service = services.find(s => s.id === selectedService);
      if (!service) {
        return;
      }

      // Obtener los horarios disponibles del servidor
      const response = await fetch(`${baseUrl}/api/public/appointments/available-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: encryptedBusinessId,
          serviceId: selectedService,
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(t('publicBooking.errorLoadingSlots') || 'Error al cargar horarios disponibles');
        setAvailableSlots([]);
        return;
      }

      const data = await response.json();

      // Si el día está cerrado
      if (data.closed) {
        setAvailableSlots([]);
        toast.error(t('publicBooking.notWorkingDay') || 'Este día no está disponible para citas');
        return;
      }

      // Los slots ya vienen en formato HH:MM desde el servidor
      setAvailableSlots(data.slots);
    } catch (error) {
      toast.error(t('publicBooking.errorBooking'));
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) {
      toast.error(t('publicBooking.selectService'));
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error(t('publicBooking.selectDate') + ' ' + t('publicBooking.and') + ' ' + t('publicBooking.selectTime'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${baseUrl}/api/public/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: encryptedBusinessId, // Enviar el ID encriptado
          serviceId: selectedService,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientEmail,
          clientPhone: `${countryCode}${clientPhone}`, // Combinar prefijo + número
          notes,
          smsConsent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('publicBooking.errorBooking'));
      }

      const result = await response.json();

      setSuccess(true);
      toast.success(t('publicBooking.bookingSuccess'));
      
      // Reset form
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setCountryCode('+1');
      setNotes('');
      setSmsConsent(false);
    } catch (error: any) {
      toast.error(error.message || t('publicBooking.errorBooking'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('publicBooking.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('publicBooking.businessNotFound')}</h2>
              <p className="text-muted-foreground">
                {error || t('publicBooking.errorLoadingBusiness')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('publicBooking.bookingSuccess')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('publicBooking.bookingSuccessMessage')}
              </p>
              <Button onClick={() => setSuccess(false)} className="w-full">
                {t('publicBooking.bookAnother')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">
              {business?.name || t('publicBooking.loading')}
            </span>
          </div>
          
          {/* Theme and Language Toggles */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle - Siempre visible después de montar */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="h-9 w-9"
                title={localTheme === 'dark' ? t('publicBooking.switchToLight') : t('publicBooking.switchToDark')}
              >
                {localTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Languages className="h-4 w-4" />
                  <span className="sr-only">Change language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                  🇪🇸 Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Business Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{business.name}</CardTitle>
                  {business.description && (
                    <CardDescription className="text-base">
                      {business.description}
                    </CardDescription>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {business.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{business.email}</span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{business.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {t('publicBooking.title')}
              </CardTitle>
              <CardDescription>
                {t('publicBooking.yourInformation')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service">{t('publicBooking.selectService')} *</Label>
                  <Select value={selectedService} onValueChange={setSelectedService} required>
                    <SelectTrigger id="service">
                      <SelectValue placeholder={t('publicBooking.selectServicePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {t('publicBooking.noServicesAvailable')}
                        </div>
                      ) : (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{service.name}</span>
                              <span className="text-sm text-muted-foreground">
                                ${service.price} - {service.duration_minutes} min
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedServiceData?.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedServiceData.description}
                    </p>
                  )}
                </div>

                {/* Date and Time */}
                <div className="space-y-4">
                  {/* Calendario Personalizado */}
                  <div className="space-y-2">
                    <Label>{t('publicBooking.selectDate')} *</Label>
                    
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-3 sm:p-4">
                        <div className="flex flex-col gap-2">
                          <CardTitle className="text-sm sm:text-base">
                            {monthNames[currentMonth]} {currentYear}
                          </CardTitle>
                          
                          {/* Controles de navegación */}
                          <div className="flex items-center gap-2 justify-between">
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
                                type="button"
                                variant="outline" 
                                size="sm" 
                                onClick={handlePrevMonth}
                                className="hover:bg-primary/10 hover:border-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm"
                                onClick={() => setCurrentDate(new Date())}
                                className="hover:bg-primary/10 hover:border-primary transition-colors h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                              >
                                {t('today')}
                              </Button>
                              <Button 
                                type="button"
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
                      </CardHeader>
                      
                      <CardContent className="p-2 sm:p-4">
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                          {/* Cabeceras de días */}
                          {dayNames.map((day, index) => (
                            <div
                              key={day}
                              className="p-1.5 sm:p-2 text-center font-bold text-xs sm:text-sm bg-gradient-to-br from-primary/10 to-primary/5 rounded-md text-foreground"
                            >
                              <span className="hidden sm:inline">{day}</span>
                              <span className="sm:hidden">{dayNamesMobile[index]}</span>
                            </div>
                          ))}
                          
                          {/* Días del calendario */}
                          {renderCalendarDays()}
                        </div>

                        {/* Información de horarios */}
                        {businessHours && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-3 p-2 bg-muted/30 rounded-md">
                            <p className="font-medium">{t('publicBooking.businessHours') || 'Horarios de atención'}:</p>
                            {Object.entries(businessHours).map(([day, schedule]: [string, any]) => {
                              if (schedule.closed) return null;
                              const dayTranslation = t(day) || day;
                              return (
                                <p key={day} className="text-xs">
                                  <span className="capitalize">{dayTranslation}</span>: {schedule.open} - {schedule.close}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Horarios disponibles */}
                  {selectedDate && selectedService && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{t('publicBooking.selectTime')} *</Label>
                        {loadingSlots && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                            {t('publicBooking.loadingSlots')}
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
                                onClick={() => setSelectedTime(slot)}
                                className={`
                                  h-12 sm:h-14
                                  px-2 py-2
                                  rounded-lg border-2 
                                  font-medium text-sm sm:text-base
                                  transition-all duration-200
                                  flex flex-col items-center justify-center
                                  ${selectedTime === slot
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
                            {t('publicBooking.noSlotsAvailable')}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {t('selectAnotherDateOrService')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedService && (
                    <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground border rounded-md bg-muted/30">
                      {t('selectServiceAndDate')}
                    </div>
                  )}
                </div>

                {/* Client Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('publicBooking.yourInformation')}
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t('publicBooking.fullName')} *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={t('publicBooking.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('publicBooking.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder={t('publicBooking.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('publicBooking.phone')} *</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span className="font-medium">{country.code}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => {
                          // Solo permitir números
                          const value = e.target.value.replace(/\D/g, '');
                          setClientPhone(value);
                        }}
                        placeholder={t('publicBooking.phonePlaceholder')}
                        className="flex-1"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('publicBooking.phoneFormat') || `Formato: ${countryCode}${clientPhone || '1234567890'}`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('publicBooking.notes')}</Label>
                    <Input
                      id="notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('publicBooking.notesPlaceholder')}
                    />
                  </div>

                  {/* SMS Consent */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="smsConsent"
                        checked={smsConsent}
                        onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                        disabled={submitting}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="smsConsent"
                          className="text-sm font-normal leading-relaxed cursor-pointer"
                        >
                          {t('publicBooking.smsConsent')}{' '}
                          <a 
                            href="https://www.drapsystems.com/drap-privacy-policy/politica-de-privacidad" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {t('publicBooking.privacyPolicy')}
                          </a>
                          {' '}{t('publicBooking.and')}{' '}
                          <a 
                            href="https://www.drapsystems.com/drap-privacy-policy/terminos-y-condiciones" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {t('publicBooking.termsAndConditions')}
                          </a>
                          .
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('publicBooking.smsConsentNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting || !selectedService || !selectedDate || !selectedTime || !clientName || !clientEmail || !clientPhone}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('publicBooking.booking')}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {t('publicBooking.bookAppointment')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



























































