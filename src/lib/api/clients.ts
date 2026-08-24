import { supabase } from '../supabase';
import type { Database } from '../database.types';
import { getPlanLimits, canAddClient } from '../plan-limits';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];
type AppointmentNote = Database['public']['Tables']['appointment_notes']['Row'];
type AppointmentNoteInsert = Database['public']['Tables']['appointment_notes']['Insert'];

export interface ClientWithStats extends Client {
  total_appointments?: number;
  upcoming_appointments?: number;
  last_appointment_date?: string;
}

// Obtener todos los clientes de un negocio
export async function getClients(businessId: string): Promise<ClientWithStats[]> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      appointments:appointments(count)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener un cliente por ID con estadísticas
export async function getClientById(clientId: string): Promise<ClientWithStats | null> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *
    `)
    .eq('id', clientId)
    .single();

  if (error) throw error;

  // Obtener estadísticas de citas
  const { data: appointmentsData } = await supabase
    .from('appointments')
    .select('id, start_time, status')
    .eq('client_id', clientId);

  const now = new Date().toISOString();
  const total_appointments = appointmentsData?.length || 0;
  const upcoming_appointments = appointmentsData?.filter(
    (apt) => apt.start_time > now && apt.status !== 'cancelled'
  ).length || 0;
  
  const completedAppointments = appointmentsData?.filter(
    (apt) => apt.status === 'completed'
  ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  
  const last_appointment_date = completedAppointments?.[0]?.start_time;

  return {
    ...data,
    total_appointments,
    upcoming_appointments,
    last_appointment_date,
  };
}

// Crear un nuevo cliente
export async function createClient(client: ClientInsert): Promise<Client> {
  console.log('=== API createClient ===');
  console.log('Datos recibidos:', JSON.stringify(client, null, 2));
  console.log('Campos con valor:', Object.keys(client).filter(k => client[k as keyof ClientInsert] !== null && client[k as keyof ClientInsert] !== undefined));
  
  // Validar límites del plan antes de crear
  if (client.business_id) {
    // Obtener el plan del negocio
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('subscription_plan')
      .eq('id', client.business_id)
      .single();

    if (businessError) {
      console.error('Error fetching business:', businessError);
      throw new Error('Error al verificar el plan del negocio');
    }

    const currentPlan = businessData?.subscription_plan || 'basic';

    // Contar clientes actuales del negocio
    const { count: clientCount, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', client.business_id);

    if (countError) {
      console.error('Error counting clients:', countError);
      throw new Error('Error al contar clientes');
    }

    const currentClientCount = clientCount || 0;

    // Verificar si se puede agregar un cliente más
    if (!canAddClient(currentPlan, currentClientCount)) {
      const limits = getPlanLimits(currentPlan);
      const limitText = limits.clients === 'unlimited' ? 'ilimitados' : limits.clients.toLocaleString();
      
      throw new Error(`Has alcanzado el límite de ${limitText} clientes para el plan ${currentPlan}. Actualiza tu plan para agregar más clientes.`);
    }
  }
  
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
  
  console.log('Cliente creado exitosamente:', data);
  console.log('Campos guardados:', Object.keys(data).filter(k => data[k as keyof Client] !== null));
  return data;
}

// Actualizar un cliente
export async function updateClient(clientId: string, updates: ClientUpdate): Promise<Client> {
  console.log('=== API updateClient ===');
  console.log('ID del cliente:', clientId);
  console.log('Actualizaciones recibidas:', JSON.stringify(updates, null, 2));
  console.log('Campos a actualizar:', Object.keys(updates).filter(k => updates[k as keyof ClientUpdate] !== null && updates[k as keyof ClientUpdate] !== undefined));
  
  // Primero verificar si el cliente existe y tenemos acceso
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle();

  if (checkError) {
    console.error('Error al verificar cliente:', checkError);
    throw new Error(`Error al verificar cliente: ${checkError.message}`);
  }

  if (!existingClient) {
    console.error('Cliente no encontrado');
    throw new Error('Cliente no encontrado o sin permisos para actualizarlo');
  }

  console.log('Cliente existente encontrado:', existingClient.full_name);

  // Intentar actualizar sin select
  const { error: updateError } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (updateError) {
    console.error('Error al actualizar cliente:', updateError);
    throw new Error(`Error al actualizar: ${updateError.message}`);
  }

  console.log('Actualización ejecutada sin errores');

  // Obtener los datos actualizados en una consulta separada
  const { data: updatedClient, error: selectError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (selectError || !updatedClient) {
    console.error('Error al obtener cliente actualizado:', selectError);
    // Si no podemos obtener los datos actualizados, devolver los datos existentes con las actualizaciones aplicadas
    return { ...existingClient, ...updates } as Client;
  }

  console.log('Cliente actualizado obtenido:', updatedClient);
  console.log('Campos actualizados con valor:', Object.keys(updatedClient).filter(k => updatedClient[k as keyof Client] !== null));
  
  return updatedClient;
}

// Eliminar un cliente
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
}

// Buscar clientes
export async function searchClients(businessId: string, query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// ============ NOTAS DE CITAS ============

// Obtener notas de una cita
export async function getAppointmentNotes(appointmentId: string): Promise<AppointmentNote[]> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .select(`
      *,
      staff:profiles!appointment_notes_staff_id_fkey(full_name, avatar_url)
    `)
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener todas las notas de un cliente
export async function getClientNotes(clientId: string): Promise<AppointmentNote[]> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .select(`
      *,
      appointment:appointments(start_time, end_time, status, service:services(name)),
      staff:profiles!appointment_notes_staff_id_fkey(full_name, avatar_url)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Crear una nota de cita
export async function createAppointmentNote(note: AppointmentNoteInsert): Promise<AppointmentNote> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar una nota de cita
export async function updateAppointmentNote(
  noteId: string,
  updates: { note?: string; is_private?: boolean }
): Promise<AppointmentNote> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar una nota de cita
export async function deleteAppointmentNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('appointment_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

// Obtener historial completo de un cliente (citas + notas)
export async function getClientHistory(clientId: string) {
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:services(name, duration_minutes, price),
      staff:profiles!appointments_staff_id_fkey(full_name, avatar_url),
      notes:appointment_notes(*)
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: false });

  if (aptError) throw aptError;

  return appointments || [];
}




