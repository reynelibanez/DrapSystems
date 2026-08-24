




export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'admin' | 'business_owner' | 'staff' | 'client'
          business_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'business_owner' | 'staff' | 'client'
          business_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'business_owner' | 'staff' | 'client'
          business_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          owner_id: string
          phone: string | null
          email: string | null
          address: string | null
          subscription_plan: 'basic' | 'professional' | 'business' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_end_date: string | null
          trial_ends_at: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          owner_id: string
          phone?: string | null
          email?: string | null
          address?: string | null
          subscription_plan?: 'basic' | 'professional' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_end_date?: string | null
          trial_ends_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          owner_id?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          subscription_plan?: 'basic' | 'professional' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_end_date?: string | null
          trial_ends_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: 'basic' | 'professional' | 'business' | 'enterprise'
          status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          trial_start: string | null
          trial_end: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan: 'basic' | 'professional' | 'business' | 'enterprise'
          status?: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'basic' | 'professional' | 'business' | 'enterprise'
          status?: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_staff: {
        Row: {
          id: string
          service_id: string
          staff_id: string
          business_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          staff_id: string
          business_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          staff_id?: string
          business_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          client_id: string
          staff_id: string
          service_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id: string
          staff_id: string
          service_id: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string
          staff_id?: string
          service_id?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          business_id: string
          user_id: string
          appointment_id: string | null
          type: 'email' | 'sms' | 'whatsapp'
          message: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          appointment_id?: string | null
          type: 'email' | 'sms' | 'whatsapp'
          message: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          appointment_id?: string | null
          type?: 'email' | 'sms' | 'whatsapp'
          message?: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          notes: string | null
          tags: string[] | null
          avatar_url: string | null
          is_active: boolean
          preferred_language: string | null
          bank_name: string | null
          account_holder: string | null
          account_number: string | null
          routing_number: string | null
          payment_method: string | null
          payment_notes: string | null
          password_hash: string | null
          password: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          notes?: string | null
          tags?: string[] | null
          avatar_url?: string | null
          is_active?: boolean
          preferred_language?: string | null
          bank_name?: string | null
          account_holder?: string | null
          account_number?: string | null
          routing_number?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          password_hash?: string | null
          password?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          full_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          notes?: string | null
          tags?: string[] | null
          avatar_url?: string | null
          is_active?: boolean
          preferred_language?: string | null
          bank_name?: string | null
          account_holder?: string | null
          account_number?: string | null
          routing_number?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          password_hash?: string | null
          password?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointment_notes: {
        Row: {
          id: string
          appointment_id: string
          client_id: string
          business_id: string
          staff_id: string | null
          note: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          client_id: string
          business_id: string
          staff_id?: string | null
          note: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          client_id?: string
          business_id?: string
          staff_id?: string | null
          note?: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  owner_id: string;
  subscription_plan: 'basic' | 'professional' | 'business' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial';
  subscription_end_date?: string;
  trial_ends_at?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}










