import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface ServicesSubscription {
  id: string;
  business_id: string;
  module_name: string;
  plan_type: string;
  status: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

interface ServicesAccessResult {
  hasAccess: boolean;
  plan: string;
  status: string;
  isLoading: boolean;
  subscription: ServicesSubscription | null;
  daysRemaining: number | null;
  isTrialing: boolean;
}

export function useServicesAccess(businessId: string | undefined): ServicesAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [plan, setPlan] = useState('free');
  const [status, setStatus] = useState('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<ServicesSubscription | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        setIsLoading(true);

        // Obtener la suscripción del módulo de servicios
        const { data, error } = await supabase
          .from('module_subscriptions')
          .select('*')
          .eq('business_id', businessId)
          .eq('module_name', 'services')
          .single();

        if (error) {
          // Si no hay suscripción, el usuario tiene acceso al plan gratuito
          if (error.code === 'PGRST116') {
            setHasAccess(true);
            setPlan('free');
            setStatus('active');
            setSubscription(null);
            setDaysRemaining(null);
            setIsTrialing(false);
          } else {
            console.error('Error checking services access:', error);
            setHasAccess(false);
            setPlan('free');
            setStatus('error');
          }
          setIsLoading(false);
          return;
        }

        if (data) {
          setSubscription(data);
          setPlan(data.plan_type);
          setStatus(data.status);

          // Verificar si tiene acceso activo
          const now = new Date();
          const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
          const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;

          const isActive = data.status === 'active' || data.status === 'trialing';
          const isNotExpired = !periodEnd || periodEnd > now;

          setHasAccess(isActive && isNotExpired);

          // Calcular días restantes
          if (periodEnd) {
            const diffTime = periodEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays > 0 ? diffDays : 0);
          }

          // Verificar si está en período de prueba
          if (data.status === 'trialing' && trialEnd && trialEnd > now) {
            setIsTrialing(true);
          } else {
            setIsTrialing(false);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking services access:', error);
        setHasAccess(false);
        setPlan('free');
        setStatus('error');
        setIsLoading(false);
      }
    };

    checkAccess();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('services-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'module_subscriptions',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  return {
    hasAccess,
    plan,
    status,
    isLoading,
    subscription,
    daysRemaining,
    isTrialing,
  };
}
