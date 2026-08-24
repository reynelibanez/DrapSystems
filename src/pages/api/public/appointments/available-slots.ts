


import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/database.types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId: encryptedBusinessId, serviceId, date } = body;

    if (!encryptedBusinessId || !serviceId || !date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Desencriptar el ID del negocio
    const { decryptBusinessId } = await import('../../../../lib/encryption');
    const businessId = decryptBusinessId(encryptedBusinessId);

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Invalid business ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id, settings')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener duración del servicio
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return new Response(JSON.stringify({ error: 'Service not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📅 Calculando slots para:', {
      date,
      duration: service.duration_minutes
    });

    // ===== OBTENER TRABAJADORES ASOCIADOS AL SERVICIO =====
    const { data: serviceStaff, error: serviceStaffError } = await supabase
      .from('service_staff')
      .select('staff_id')
      .eq('service_id', serviceId)
      .eq('business_id', businessId);

    let staffIds: string[] = [];

    if (serviceStaffError) {
      console.warn('⚠️ Error al obtener service_staff:', serviceStaffError);
    }

    if (serviceStaff && serviceStaff.length > 0) {
      // Si hay trabajadores asociados, usar esos
      staffIds = serviceStaff.map(ss => ss.staff_id);
      console.log('✅ Trabajadores asociados al servicio:', staffIds.length);
    } else {
      // Fallback: Si no hay asociaciones, usar todos los staff del negocio
      console.log('⚠️ No hay trabajadores asociados al servicio, usando todos los staff');
      
      const { data: allStaff } = await supabase
        .from('profiles')
        .select('id')
        .eq('business_id', businessId)
        .in('role', ['staff', 'business_owner']);

      if (allStaff && allStaff.length > 0) {
        staffIds = allStaff.map(s => s.id);
      } else {
        // Último fallback: usar el owner
        staffIds = [business.owner_id];
      }
    }

    console.log('👥 Total de trabajadores a considerar:', staffIds.length, staffIds);

    // Obtener horarios de trabajo de la empresa
    const settings = business.settings as any;
    
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
        return new Response(JSON.stringify({ slots: [], closed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Si el día está cerrado, no hay slots disponibles
    if (daySchedule?.closed) {
      console.log('🚫 Día cerrado (día de la semana)');
      return new Response(JSON.stringify({ slots: [], closed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parsear horarios de apertura y cierre
    const [openHour, openMinute] = (daySchedule?.open || '09:00').split(':').map(Number);
    const [closeHour, closeMinute] = (daySchedule?.close || '18:00').split(':').map(Number);

    // Cargar citas existentes para esa fecha Y para los trabajadores del servicio
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    console.log('🔍 Buscando citas entre:', {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString(),
      staffIds: staffIds
    });

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status, staff_id')
      .eq('business_id', businessId)
      .in('staff_id', staffIds) // ✅ SOLO citas de los trabajadores que pueden hacer este servicio
      .neq('status', 'cancelled')
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString());
    
    if (appointmentsError) {
      console.error('❌ Error cargando citas:', appointmentsError);
    }

    console.log('📋 Citas existentes:', appointments?.length || 0);
    if (appointments && appointments.length > 0) {
      const timezoneOffset = -240; // UTC-4
      
      appointments.forEach(apt => {
        // Convertir UTC a hora local (UTC-4)
        const startUTC = new Date(apt.start_time);
        const endUTC = new Date(apt.end_time);
        
        const startLocal = new Date(startUTC.getTime() + timezoneOffset * 60000);
        const endLocal = new Date(endUTC.getTime() + timezoneOffset * 60000);
        
        console.log('  📌 Cita:', {
          id: apt.id,
          start_utc: apt.start_time,
          start_local: `${startLocal.getHours().toString().padStart(2, '0')}:${startLocal.getMinutes().toString().padStart(2, '0')}`,
          end_local: `${endLocal.getHours().toString().padStart(2, '0')}:${endLocal.getMinutes().toString().padStart(2, '0')}`,
          staff: apt.staff_id
        });
      });
    }

    // Generar slots
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

    while (currentSlot < workEnd) {
      slotCount++;
      
      // Calcular el fin del slot usando la duración COMPLETA del servicio
      const slotEnd = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
      
      const timeStr = `${currentSlot.getHours().toString().padStart(2, '0')}:${currentSlot.getMinutes().toString().padStart(2, '0')}`;
      const endTimeStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`🔍 Evaluando slot #${slotCount}: ${timeStr} - ${endTimeStr}`);
      
      // Si es hoy, filtrar horarios que ya pasaron
      if (isToday && currentSlot <= now) {
        console.log(`  ⏭️  Ya pasó`);
        currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
        continue;
      }

      // El servicio debe TERMINAR antes o exactamente a la hora de cierre
      if (slotEnd > workEnd) {
        console.log(`  ❌ RECHAZADO: Terminaría después del cierre`);
        break;
      }

      // Verificar si el slot cae durante el horario de almuerzo
      let isDuringLunch = false;
      if (daySchedule?.hasLunch && daySchedule?.lunchStart && daySchedule?.lunchEnd) {
        const [lunchStartHour, lunchStartMinute] = daySchedule.lunchStart.split(':').map(Number);
        const [lunchEndHour, lunchEndMinute] = daySchedule.lunchEnd.split(':').map(Number);
        
        const lunchStart = new Date(year, month - 1, day, lunchStartHour, lunchStartMinute, 0, 0);
        const lunchEnd = new Date(year, month - 1, day, lunchEndHour, lunchEndMinute, 0, 0);
        
        isDuringLunch = (
          (currentSlot >= lunchStart && currentSlot < lunchEnd) ||
          (slotEnd > lunchStart && slotEnd <= lunchEnd) ||
          (currentSlot < lunchStart && slotEnd > lunchEnd) ||
          (currentSlot >= lunchStart && slotEnd <= lunchEnd)
        );
        
        if (isDuringLunch) {
          console.log(`  🍽️ RECHAZADO: Horario de almuerzo`);
          currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
          continue;
        }
      }

      // ===== LÓGICA CLAVE: Verificar si AL MENOS UN trabajador está disponible =====
      let hasAvailableStaff = false;
      
      for (const staffId of staffIds) {
        // Verificar si ESTE trabajador específico tiene conflictos
        const hasConflict = appointments?.some(apt => {
          // Solo verificar citas de ESTE trabajador
          if (apt.staff_id !== staffId) return false;
          
          // ⚠️ IMPORTANTE: Las citas están en UTC, necesitamos convertirlas a hora local (UTC-4)
          // Ejemplo: 13:00 UTC → 09:00 local (UTC-4)
          const aptStartUTC = new Date(apt.start_time);
          const aptEndUTC = new Date(apt.end_time);
          
          // Obtener el offset de zona horaria del negocio (en minutos)
          // Para UTC-4, el offset es -240 minutos (4 horas atrás)
          const timezoneOffset = -240; // UTC-4 (Venezuela, Puerto Rico, etc.)
          
          // Convertir UTC a hora local restando el offset
          const aptStart = new Date(aptStartUTC.getTime() + timezoneOffset * 60000);
          const aptEnd = new Date(aptEndUTC.getTime() + timezoneOffset * 60000);

          // Solapamiento
          const overlaps = currentSlot < aptEnd && slotEnd > aptStart;
          
          if (overlaps) {
            console.log(`    ⚠️ Staff ${staffId}: OCUPADO (cita ${apt.id} de ${aptStart.getHours()}:${aptStart.getMinutes().toString().padStart(2, '0')} a ${aptEnd.getHours()}:${aptEnd.getMinutes().toString().padStart(2, '0')})`);
          }

          return overlaps;
        });

        if (!hasConflict) {
          // Este trabajador está DISPONIBLE
          hasAvailableStaff = true;
          console.log(`    ✅ Staff ${staffId}: DISPONIBLE`);
          break; // Con que UNO esté disponible, el slot es válido
        }
      }

      if (hasAvailableStaff) {
        slots.push(timeStr);
        console.log(`  ✅ Slot ${timeStr} - ${endTimeStr}: DISPONIBLE`);
      } else {
        console.log(`  ❌ Slot ${timeStr} - ${endTimeStr}: TODOS los trabajadores ocupados`);
      }

      // Avanzar según la duración del servicio
      currentSlot = new Date(currentSlot.getTime() + service.duration_minutes * 60000);
    }

    console.log('📊 Resumen:', {
      slotsEvaluados: slotCount,
      slotsDisponibles: slots.length,
      trabajadores: staffIds.length
    });

    console.log('✅ Slots finales:', slots);

    return new Response(JSON.stringify({ slots, closed: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};




