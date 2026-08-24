/**
 * Límites de Planes para el Módulo de Servicios
 * 
 * Este archivo define los límites específicos para cada plan del módulo de servicios.
 * NO incluye límites de SMS, ya que esos son exclusivos del módulo de citas.
 */

export interface ServicesPlanLimits {
  invoices: number | 'unlimited';
  clients: number | 'unlimited';
  users: number | 'unlimited';
  storage: string;
  features: {
    partialPayments: boolean;
    tips: boolean;
    emailInvoices: boolean;
    advancedReports: boolean;
    inventory: boolean;
    api: boolean;
    customization: boolean;
    dedicatedSupport: boolean;
  };
}

export const SERVICES_PLAN_LIMITS: Record<string, ServicesPlanLimits> = {
  free: {
    invoices: 10,
    clients: 10,
    users: 1,
    storage: '100MB',
    features: {
      partialPayments: false,
      tips: false,
      emailInvoices: false,
      advancedReports: false,
      inventory: false,
      api: false,
      customization: false,
      dedicatedSupport: false,
    },
  },
  basic: {
    invoices: 100,
    clients: 100,
    users: 1,
    storage: '1GB',
    features: {
      partialPayments: true,
      tips: true,
      emailInvoices: true,
      advancedReports: false,
      inventory: false,
      api: false,
      customization: false,
      dedicatedSupport: false,
    },
  },
  professional: {
    invoices: 'unlimited',
    clients: 500,
    users: 5,
    storage: '10GB',
    features: {
      partialPayments: true,
      tips: true,
      emailInvoices: true,
      advancedReports: true,
      inventory: true,
      api: true,
      customization: false,
      dedicatedSupport: false,
    },
  },
  enterprise: {
    invoices: 'unlimited',
    clients: 'unlimited',
    users: 'unlimited',
    storage: 'Unlimited',
    features: {
      partialPayments: true,
      tips: true,
      emailInvoices: true,
      advancedReports: true,
      inventory: true,
      api: true,
      customization: true,
      dedicatedSupport: true,
    },
  },
};

/**
 * Verifica si un plan tiene acceso a una característica específica
 */
export function hasServiceFeature(
  planType: string,
  feature: keyof ServicesPlanLimits['features']
): boolean {
  const limits = SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
  return limits.features[feature];
}

/**
 * Obtiene el límite de facturas para un plan
 */
export function getInvoiceLimit(planType: string): number | 'unlimited' {
  const limits = SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
  return limits.invoices;
}

/**
 * Obtiene el límite de clientes para un plan
 */
export function getClientLimit(planType: string): number | 'unlimited' {
  const limits = SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
  return limits.clients;
}

/**
 * Obtiene el límite de usuarios para un plan
 */
export function getUserLimit(planType: string): number | 'unlimited' {
  const limits = SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
  return limits.users;
}

/**
 * Verifica si se puede crear una nueva factura según el plan
 */
export function canCreateInvoice(
  planType: string,
  currentInvoiceCount: number
): boolean {
  const limit = getInvoiceLimit(planType);
  if (limit === 'unlimited') return true;
  return currentInvoiceCount < limit;
}

/**
 * Verifica si se puede agregar un nuevo cliente según el plan
 */
export function canAddClient(
  planType: string,
  currentClientCount: number
): boolean {
  const limit = getClientLimit(planType);
  if (limit === 'unlimited') return true;
  return currentClientCount < limit;
}

/**
 * Verifica si se puede agregar un nuevo usuario según el plan
 */
export function canAddUser(
  planType: string,
  currentUserCount: number
): boolean {
  const limit = getUserLimit(planType);
  if (limit === 'unlimited') return true;
  return currentUserCount < limit;
}

/**
 * Obtiene un mensaje descriptivo del límite alcanzado
 */
export function getLimitMessage(
  planType: string,
  limitType: 'invoices' | 'clients' | 'users',
  language: 'es' | 'en' = 'es'
): string {
  const limits = SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
  const limit = limits[limitType];

  const messages = {
    es: {
      invoices: `Has alcanzado el límite de ${limit} facturas para el plan ${planType}. Actualiza tu plan para crear más facturas.`,
      clients: `Has alcanzado el límite de ${limit} clientes para el plan ${planType}. Actualiza tu plan para agregar más clientes.`,
      users: `Has alcanzado el límite de ${limit} usuarios para el plan ${planType}. Actualiza tu plan para agregar más usuarios.`,
    },
    en: {
      invoices: `You have reached the limit of ${limit} invoices for the ${planType} plan. Upgrade your plan to create more invoices.`,
      clients: `You have reached the limit of ${limit} clients for the ${planType} plan. Upgrade your plan to add more clients.`,
      users: `You have reached the limit of ${limit} users for the ${planType} plan. Upgrade your plan to add more users.`,
    },
  };

  return messages[language][limitType];
}

/**
 * Obtiene todos los límites para un plan
 */
export function getServicesPlanLimits(planType: string): ServicesPlanLimits {
  return SERVICES_PLAN_LIMITS[planType] || SERVICES_PLAN_LIMITS.free;
}

/**
 * Compara dos planes y retorna las diferencias
 */
export function comparePlans(
  currentPlan: string,
  targetPlan: string
): {
  isUpgrade: boolean;
  differences: {
    invoices: { current: number | 'unlimited'; target: number | 'unlimited' };
    clients: { current: number | 'unlimited'; target: number | 'unlimited' };
    users: { current: number | 'unlimited'; target: number | 'unlimited' };
    newFeatures: string[];
  };
} {
  const current = SERVICES_PLAN_LIMITS[currentPlan] || SERVICES_PLAN_LIMITS.free;
  const target = SERVICES_PLAN_LIMITS[targetPlan] || SERVICES_PLAN_LIMITS.free;

  const planOrder = ['free', 'basic', 'professional', 'enterprise'];
  const isUpgrade = planOrder.indexOf(targetPlan) > planOrder.indexOf(currentPlan);

  const newFeatures: string[] = [];
  Object.keys(target.features).forEach((feature) => {
    const key = feature as keyof ServicesPlanLimits['features'];
    if (target.features[key] && !current.features[key]) {
      newFeatures.push(feature);
    }
  });

  return {
    isUpgrade,
    differences: {
      invoices: { current: current.invoices, target: target.invoices },
      clients: { current: current.clients, target: target.clients },
      users: { current: current.users, target: target.users },
      newFeatures,
    },
  };
}
