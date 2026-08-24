import { supabase } from '../supabase';
import type { Appointment, AppointmentStatus } from '../database.types';

export interface CreateAppointmentData {
  business_id: string;
  client_id: string;
  staff_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  notes?: string;
}

export const appointmentsApi = {
  // Obtener todas las citas de un negocio
  async getByBusiness(businessId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey(id, full_name, email),
        staff:profiles!appointments_staff_id_fkey(id, full_name, email),
        service:services(id, name, duration_minutes, price)
      `)
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener citas de un cliente
  async getByClient(clientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        business:businesses(id, name),
        staff:profiles!appointments_staff_id_fkey(id, full_name),
        service:services(id, name, duration_minutes, price)
      `)
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener citas de un staff
  async getByStaff(staffId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey(id, full_name, email, phone),
        service:services(id, name, duration_minutes, price)
      `)
      .eq('staff_id', staffId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear una cita
  async create(data: CreateAppointmentData): Promise<Appointment> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return appointment;
  },

  // Actualizar una cita
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return appointment;
  },

  // Cancelar una cita
  async cancel(id: string): Promise<Appointment> {
    return this.update(id, { status: 'cancelled' });
  },

  // Confirmar una cita
  async confirm(id: string): Promise<Appointment> {
    return this.update(id, { status: 'confirmed' });
  },

  // Completar una cita
  async complete(id: string): Promise<Appointment> {
    return this.update(id, { status: 'completed' });
  },

  // Eliminar una cita
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Obtener citas por rango de fechas
  async getByDateRange(
    businessId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey(id, full_name),
        staff:profiles!appointments_staff_id_fkey(id, full_name),
        service:services(id, name, duration_minutes, price)
      `)
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Verificar disponibilidad
  async checkAvailability(
    staffId: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('staff_id', staffId)
      .neq('status', 'cancelled')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return !data || data.length === 0;
  },
};
