import { supabase } from '../supabase';
import type { Business, SubscriptionPlan, SubscriptionStatus } from '../database.types';

export interface CreateBusinessData {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  subscription_plan: SubscriptionPlan;
}

export interface UpdateBusinessData {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  settings?: Record<string, any>;
}

export const businessesApi = {
  // Obtener todos los negocios (solo admin)
  async getAll(): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        owner:profiles!businesses_owner_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener un negocio por ID
  async getById(id: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        owner:profiles!businesses_owner_id_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Obtener negocios del usuario actual
  async getMyBusinesses(): Promise<Business[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Crear un negocio
  async create(data: CreateBusinessData): Promise<Business> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: business, error } = await supabase
      .from('businesses')
      .insert([{
        ...data,
        owner_id: user.id,
        subscription_status: 'trial',
      }])
      .select()
      .single();

    if (error) throw error;
    return business;
  },

  // Actualizar un negocio
  async update(id: string, data: UpdateBusinessData): Promise<Business> {
    const { data: business, error } = await supabase
      .from('businesses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return business;
  },

  // Eliminar un negocio
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Obtener estadísticas de un negocio
  async getStats(businessId: string) {
    const [
      { count: totalAppointments },
      { count: totalServices },
      { count: totalStaff },
      { count: totalClients },
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId),
      supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('role', 'staff'),
      supabase
        .from('appointments')
        .select('client_id', { count: 'exact', head: true })
        .eq('business_id', businessId),
    ]);

    return {
      totalAppointments: totalAppointments || 0,
      totalServices: totalServices || 0,
      totalStaff: totalStaff || 0,
      totalClients: totalClients || 0,
    };
  },

  // Cambiar plan de suscripción
  async changePlan(businessId: string, plan: SubscriptionPlan): Promise<Business> {
    return this.update(businessId, { subscription_plan: plan });
  },

  // Cancelar suscripción
  async cancelSubscription(businessId: string): Promise<Business> {
    return this.update(businessId, { subscription_status: 'cancelled' });
  },
};
