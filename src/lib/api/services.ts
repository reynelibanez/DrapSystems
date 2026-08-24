import { supabase } from '../supabase';
import type { Service } from '../database.types';

export interface CreateServiceData {
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_active?: boolean;
}

export const servicesApi = {
  // Obtener todos los servicios de un negocio
  async getByBusiness(businessId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener servicios activos de un negocio
  async getActiveByBusiness(businessId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener un servicio por ID
  async getById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Crear un servicio
  async create(data: CreateServiceData): Promise<Service> {
    const { data: service, error } = await supabase
      .from('services')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return service;
  },

  // Actualizar un servicio
  async update(id: string, data: UpdateServiceData): Promise<Service> {
    const { data: service, error } = await supabase
      .from('services')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return service;
  },

  // Eliminar un servicio
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Activar/Desactivar un servicio
  async toggleActive(id: string, isActive: boolean): Promise<Service> {
    return this.update(id, { is_active: isActive });
  },

  // Asignar servicio a staff
  async assignToStaff(serviceId: string, staffId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_services')
      .insert([{ staff_id: staffId, service_id: serviceId }]);

    if (error) throw error;
  },

  // Desasignar servicio de staff
  async unassignFromStaff(serviceId: string, staffId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_services')
      .delete()
      .eq('service_id', serviceId)
      .eq('staff_id', staffId);

    if (error) throw error;
  },

  // Obtener servicios de un staff
  async getByStaff(staffId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('staff_services')
      .select('service:services(*)')
      .eq('staff_id', staffId);

    if (error) throw error;
    return data?.map((item: any) => item.service) || [];
  },

  // Obtener staff que ofrece un servicio
  async getStaffByService(serviceId: string) {
    const { data, error } = await supabase
      .from('staff_services')
      .select('staff:profiles(*)')
      .eq('service_id', serviceId);

    if (error) throw error;
    return data?.map((item: any) => item.staff) || [];
  },
};
