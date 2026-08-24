




/**
 * Plan Limits and Validation
 * Define los límites de cada plan y funciones para validarlos
 */

export interface PlanLimits {
  users: number | 'unlimited';
  clients: number | 'unlimited';
  notifications: {
    email: boolean;
    sms: boolean;
    reminders: boolean;
  };
  features: string[];
}

/**
 * Límites por plan según la estructura corregida
 */
export const PLAN_LIMITS = {
  free: {
    maxStaff: 1,
    maxClients: 10,
    maxAppointments: 50,
    features: ['basic_calendar', 'client_management'],
    smsLimit: 0,
    smsCostPerExcess: 0,
  },
  basic: {
    maxStaff: 3,
    maxClients: 100,
    maxAppointments: 500,
    features: ['basic_calendar', 'client_management', 'reports'],
    smsLimit: 0,
    smsCostPerExcess: 0,
  },
  professional: {
    maxStaff: 5,
    maxClients: 500,
    maxAppointments: -1, // unlimited
    features: ['basic_calendar', 'client_management', 'reports', 'advanced_reports'],
    smsLimit: 0,
    smsCostPerExcess: 0,
  },
  business: {
    maxStaff: 10,
    maxClients: 1000,
    maxAppointments: -1, // unlimited
    features: ['basic_calendar', 'client_management', 'reports', 'sms_notifications', 'advanced_reports', 'api_access'],
    smsLimit: 1500,
    smsCostPerExcess: 0.05,
  },
  enterprise: {
    maxStaff: -1, // unlimited
    maxClients: -1, // unlimited
    maxAppointments: -1, // unlimited
    features: ['basic_calendar', 'client_management', 'reports', 'sms_notifications', 'advanced_reports', 'api_access', 'priority_support', 'custom_branding'],
    smsLimit: 4500,
    smsCostPerExcess: 0.035,
  },
} as const;

/**
 * Convierte los límites internos al formato PlanLimits
 */
function convertToPlanLimits(plan: typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS]): PlanLimits {
  return {
    users: plan.maxStaff === -1 ? 'unlimited' : plan.maxStaff,
    clients: plan.maxClients === -1 ? 'unlimited' : plan.maxClients,
    notifications: {
      email: true, // Todos los planes tienen email
      sms: plan.smsLimit > 0, // Solo planes con límite SMS > 0
      reminders: true, // Todos los planes tienen recordatorios
    },
    features: plan.features,
  };
}

/**
 * Obtiene los límites de un plan
 */
export function getPlanLimits(plan: string): PlanLimits {
  const normalizedPlan = plan?.toLowerCase() || 'basic';
  const planData = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS];
  
  if (!planData) {
    // Si el plan no existe, devolver límites del plan básico
    return convertToPlanLimits(PLAN_LIMITS.basic);
  }
  
  return convertToPlanLimits(planData);
}

/**
 * Verifica si se puede agregar un usuario
 */
export function canAddUser(plan: string, currentUserCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (!limits || limits.users === 'unlimited') return true;
  return currentUserCount < limits.users;
}

/**
 * Verifica si se puede agregar un cliente
 */
export function canAddClient(plan: string, currentClientCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (!limits || limits.clients === 'unlimited') return true;
  return currentClientCount < limits.clients;
}

/**
 * Verifica si se puede enviar email
 */
export function canSendEmail(plan: string): boolean {
  const limits = getPlanLimits(plan);
  return limits?.notifications?.email ?? true;
}

/**
 * Verifica si se puede enviar SMS
 */
export function canSendSMS(plan: string): boolean {
  const limits = getPlanLimits(plan);
  return limits?.notifications?.sms ?? false;
}

/**
 * Verifica si se puede enviar recordatorios
 */
export function canSendReminders(plan: string): boolean {
  const limits = getPlanLimits(plan);
  return limits?.notifications?.reminders ?? true;
}

/**
 * Verifica si tiene acceso a una funcionalidad
 */
export function hasFeature(plan: string, feature: string): boolean {
  const limits = getPlanLimits(plan);
  return limits?.features?.includes(feature) ?? false;
}

/**
 * Obtiene el mensaje de límite alcanzado
 */
export function getLimitMessage(plan: string, type: 'users' | 'clients'): string {
  const limits = getPlanLimits(plan);
  if (!limits) return '';
  
  const limit = type === 'users' ? limits.users : limits.clients;
  
  if (limit === 'unlimited') {
    return '';
  }
  
  const entityName = type === 'users' ? 'usuarios' : 'clientes';
  return `Has alcanzado el límite de ${limit} ${entityName} para el plan ${plan}. Actualiza tu plan para agregar más.`;
}

/**
 * Obtiene información de upgrade sugerido
 */
export function getSuggestedUpgrade(currentPlan: string, reason: 'users' | 'clients' | 'sms' | 'reminders'): {
  plan: string;
  reason: string;
} | null {
  switch (currentPlan) {
    case 'basic':
      if (reason === 'users') {
        return {
          plan: 'business',
          reason: 'El plan Business permite hasta 5 usuarios'
        };
      }
      if (reason === 'clients') {
        return {
          plan: 'professional',
          reason: 'El plan Professional permite hasta 500 clientes'
        };
      }
      if (reason === 'sms') {
        return {
          plan: 'business',
          reason: 'El plan Business incluye mensajería SMS ilimitada'
        };
      }
      if (reason === 'reminders') {
        return {
          plan: 'professional',
          reason: 'El plan Professional incluye recordatorios automáticos'
        };
      }
      break;
      
    case 'professional':
      if (reason === 'users') {
        return {
          plan: 'business',
          reason: 'El plan Business permite hasta 5 usuarios'
        };
      }
      if (reason === 'clients') {
        return {
          plan: 'business',
          reason: 'El plan Business permite hasta 1,000 clientes'
        };
      }
      if (reason === 'sms') {
        return {
          plan: 'business',
          reason: 'El plan Business incluye mensajería SMS ilimitada'
        };
      }
      break;
      
    case 'business':
      if (reason === 'users' || reason === 'clients') {
        return {
          plan: 'enterprise',
          reason: 'El plan Enterprise ofrece usuarios y clientes ilimitados'
        };
      }
      break;
  }
  
  return null;
}

/**
 * Formatea el límite para mostrar en UI
 */
export function formatLimit(limit: number | 'unlimited' | undefined | null): string {
  if (limit === undefined || limit === null) return 'N/A';
  return limit === 'unlimited' ? 'Ilimitado' : limit.toString();
}

/**
 * Obtiene el porcentaje de uso
 */
export function getUsagePercentage(current: number, limit: number | 'unlimited' | undefined | null): number {
  if (!limit || limit === 'unlimited') return 0;
  return Math.round((current / limit) * 100);
}

/**
 * Verifica si está cerca del límite (>80%)
 */
export function isNearLimit(current: number, limit: number | 'unlimited' | undefined | null): boolean {
  if (!limit || limit === 'unlimited') return false;
  return getUsagePercentage(current, limit) >= 80;
}

/**
 * Verifica si alcanzó el límite
 */
export function hasReachedLimit(current: number, limit: number | 'unlimited' | undefined | null): boolean {
  if (!limit || limit === 'unlimited') return false;
  return current >= limit;
}







