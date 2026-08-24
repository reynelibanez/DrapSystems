import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Tipos de roles
export type UserRole = 'admin' | 'business_owner' | 'staff' | 'client';

// Tipos de planes de suscripción
export type SubscriptionPlan = 'basic' | 'professional' | 'business' | 'enterprise';

// Características por plan
export const PLAN_FEATURES = {
  basic: {
    name: 'Básico',
    maxStaff: 2,
    maxAppointmentsPerMonth: 50,
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
    customBranding: false,
    analytics: false,
    price: 29,
  },
  professional: {
    name: 'Profesional',
    maxStaff: 5,
    maxAppointmentsPerMonth: 200,
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: false,
    customBranding: true,
    analytics: true,
    price: 79,
  },
  business: {
    name: 'Negocios',
    maxStaff: 15,
    maxAppointmentsPerMonth: 1000,
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    customBranding: true,
    analytics: true,
    price: 149,
  },
  enterprise: {
    name: 'Empresarial',
    maxStaff: -1, // ilimitado
    maxAppointmentsPerMonth: -1, // ilimitado
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    customBranding: true,
    analytics: true,
    price: 299,
  },
};
