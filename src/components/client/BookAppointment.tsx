import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { useTranslation } from 'react-i18next';

type Business = Database['public']['Tables']['businesses']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface BookAppointmentProps {
  clientId: string;
  onBooked: () => void;
}

export function BookAppointment({ clientId, onBooked }: BookAppointmentProps) {
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadServices(selectedBusiness);
      loadStaff(selectedBusiness);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    setSelectedTime('');
    if (selectedBusiness && selectedService && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSlotsMessage('');
    }
  }, [selectedBusiness, selectedService, selectedStaff, selectedDate]);

  const loadBusinesses = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('subscription_status', 'active')
      .order('name');

    if (data) setBusinesses(data);
  };

  const loadServices = async (businessId: string) => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');

    if (data) setServices(data);
  };

  const loadStaff = async (businessId: string) => {
    // Primero intentar cargar staff
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', businessId)
      .eq('role', 'staff')
      .order('full_name');

    // Si no hay staff, buscar business_owner
    if (!data || data.length === 0) {
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', businessId)
        .eq('role', 'business_owner')
        .order('full_name');
      
      data = ownerData;
    }

    if (data && data.length > 0) {
      setStaff(data);
      // Auto-seleccionar el primer staff disponible
      setSelectedStaff(data[0].id);
    } else {
      setStaff([]);
      setSelectedStaff('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(t('errorFetchingClientInfo'));
        setLoading(false);
        return;
      }

      const service = services.find(s => s.id === selectedService);
      if (!service) return;

      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      if (startTime.getTime() < Date.now()) {
        alert(t('cannotBookPastTime'));
        await loadAvailableSlots();
        return;
      }

      const { data: conflictingAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('staff_id', selectedStaff)
        .neq('status', 'cancelled')
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lte('start_time', `${selectedDate}T23:59:59`);

      const hasConflict = conflictingAppointments?.some(apt => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        return startTime < aptEnd && endTime > aptStart;
      });

      if (hasConflict) {
        alert(t('slotNoLongerAvailable'));
        await loadAvailableSlots();
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert([{
          business_id: selectedBusiness,
          client_id: clientData.id, // Usar el client_id obtenido
          staff_id: selectedStaff,
          service_id: selectedService,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
        }]);

      if (error) throw error;

      alert(t('appointmentBookedSuccessMsg'));
      resetForm();
      onBooked();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(t('errorBookingAppointmentMsg'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBusiness('');
    setSelectedService('');
    setSelectedStaff('');
    setSelectedDate('');
    setSelectedTime('');
  };

  const loadAvailableSlots = async () => {
    if (!selectedBusiness || !selectedService || !selectedDate) return;

    setLoadingSlots(true);
    setSlotsMessage('');
    setAvailableSlots([]);

    try {
      const business = businesses.find(b => b.id === selectedBusiness);
      const service = services.find(s => s.id === selectedService);
      if (!business || !service) {
        setLoadingSlots(false);
        return;
      }

      const settings: any = (business as any).settings || {};

      const closedDates: string[] = settings.closed_dates || [];
      if (closedDates.includes(selectedDate)) {
        setSlotsMessage(t('businessClosedThisDayMsg'));
        setLoadingSlots(false);
        return;
      }

      const spanishToEnglish: Record<string, string> = {
        'domingo': 'sunday',
        'lunes': 'monday',
        'martes': 'tuesday',
        'miércoles': 'wednesday',
        'miercoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday',
        'sabado': 'saturday',
      };

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dateObj = new Date(`${selectedDate}T00:00:00`);
      const dayOfWeek = dayNames[dateObj.getDay()];

      let dayConfig: any = null;

      if (Array.isArray(settings.business_hours)) {
        dayConfig = settings.business_hours.find((h: any) => {
          const hDay = (h.day || '').toLowerCase();
          const normalized = spanishToEnglish[hDay] || hDay;
          return normalized === dayOfWeek;
        });
      } else if (settings.businessHours && typeof settings.businessHours === 'object') {
        dayConfig = settings.businessHours[dayOfWeek];
      }

      if (!dayConfig || dayConfig.closed) {
        setSlotsMessage(t('businessClosedThisDayMsg'));
        setLoadingSlots(false);
        return;
      }

      const openTime = dayConfig.open || '09:00';
      const closeTime = dayConfig.close || '18:00';
      const hasLunch = !!dayConfig.hasLunch;
      const lunchStart = dayConfig.lunchStart || '';
      const lunchEnd = dayConfig.lunchEnd || '';

      const staffIds = selectedStaff ? [selectedStaff] : staff.map(s => s.id);
      if (staffIds.length === 0) {
        setSlotsMessage(t('noStaffForBusiness'));
        setLoadingSlots(false);
        return;
      }

      const dayStart = `${selectedDate}T00:00:00`;
      const dayEnd = `${selectedDate}T23:59:59`;

      const { data: appointments } = await supabase
        .from('appointments')
        .select('staff_id, start_time, end_time')
        .in('staff_id', staffIds)
        .neq('status', 'cancelled')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd);

      const [openHour, openMinute] = openTime.split(':').map(Number);
      const [closeHour, closeMinute] = closeTime.split(':').map(Number);

      const dayBase = new Date(`${selectedDate}T00:00:00`);
      const rangeStart = new Date(dayBase);
      rangeStart.setHours(openHour, openMinute, 0, 0);
      const rangeEnd = new Date(dayBase);
      rangeEnd.setHours(closeHour, closeMinute, 0, 0);

      let lunchStartTime: Date | null = null;
      let lunchEndTime: Date | null = null;
      if (hasLunch && lunchStart && lunchEnd) {
        const [lsH, lsM] = lunchStart.split(':').map(Number);
        const [leH, leM] = lunchEnd.split(':').map(Number);
        lunchStartTime = new Date(dayBase);
        lunchStartTime.setHours(lsH, lsM, 0, 0);
        lunchEndTime = new Date(dayBase);
        lunchEndTime.setHours(leH, leM, 0, 0);
      }

      const slots: string[] = [];
      const durationMs = service.duration_minutes * 60000;
      const now = new Date();

      let currentSlot = new Date(rangeStart);

      while (currentSlot.getTime() + durationMs <= rangeEnd.getTime()) {
        const slotEnd = new Date(currentSlot.getTime() + durationMs);

            const overlapsLunch = !!(lunchStartTime && lunchEndTime &&
          currentSlot < lunchEndTime && slotEnd > lunchStartTime);

        const isPast = currentSlot.getTime() < now.getTime();

        if (!overlapsLunch && !isPast) {
          const hasAvailableStaff = staffIds.some(staffId => {
            const hasConflict = appointments?.some(apt => {
              if (apt.staff_id !== staffId) return false;
              const aptStart = new Date(apt.start_time);
              const aptEnd = new Date(apt.end_time);
              return currentSlot < aptEnd && slotEnd > aptStart;
            });
            return !hasConflict;
          });

          if (hasAvailableStaff) {
            const hh = currentSlot.getHours().toString().padStart(2, '0');
            const mm = currentSlot.getMinutes().toString().padStart(2, '0');
            slots.push(`${hh}:${mm}`);
          }
        }

        currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
      }

      setAvailableSlots(slots);
      if (slots.length === 0) {
        setSlotsMessage(t('noSlotsForThisDay'));
      }
    } catch (err) {
      console.error('Error cargando horarios disponibles:', err);
      setSlotsMessage(t('errorLoadingAvailableSlots'));
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {t('bookNewAppointmentTitle')}
        </CardTitle>
        <CardDescription>
          {t('bookAppointmentPageDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business">{t('company')}</Label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger id="business">
                <SelectValue placeholder={t('selectBusinessPlaceholder2')} />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBusiness && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service">{t('service')}</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder={t('selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price} ({service.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff">{t('staff')}</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger id="staff">
                    <SelectValue placeholder={t('selectStaffOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('date')}</Label>
                  <input
                    id="date"
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">{t('time')}</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} disabled={loadingSlots || availableSlots.length === 0}>
                    <SelectTrigger id="time">
                      <SelectValue placeholder={loadingSlots ? t('loadingTimesText') : t('selectTimeOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {slotsMessage && (
                    <p className="text-sm text-muted-foreground">{slotsMessage}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || loadingSlots || !selectedService || !selectedStaff || !selectedDate || !selectedTime || availableSlots.length === 0}
              >
                {loading ? t('bookingInProgressText') : t('bookAppointmentSubmitButton')}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}


