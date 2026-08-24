



/**
 * Application constants
 */

export const APP_NAME = 'DRAP Appointment';
export const APP_VERSION = '1.0.0';

/**
 * User roles
 */
export const ROLES = {
  ADMIN: 'admin',
  BUSINESS_OWNER: 'business_owner',
  STAFF: 'staff',
  CLIENT: 'client',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Subscription plans
 */
export const PLANS = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionPlan = typeof PLANS[keyof typeof PLANS];

/**
 * Plan details
 */
export const PLAN_DETAILS = {
  [PLANS.BASIC]: {
    name: 'Prueba Gratis',
    price: 0,
    maxStaff: 1,
    maxClients: 100,
    maxAppointments: null, // sin límite de citas
    notifications: ['email'],
    features: [
      '1 Usuario',
      'Hasta 100 clientes',
      'Gestión de citas y clientes',
      'Notificaciones por email',
      'Soporte básico',
      'Válido por 30 días',
    ],
  },
  [PLANS.PROFESSIONAL]: {
    name: 'Profesional',
    price: 29,
    maxStaff: 1,
    maxClients: 500,
    maxAppointments: null,
    notifications: ['email', 'reminders'],
    features: [
      '1 Usuario',
      'Hasta 500 clientes',
      'Notificaciones por email',
      'Recordatorios automáticos',
      'Reportes básicos',
      'Soporte prioritario',
    ],
  },
  [PLANS.BUSINESS]: {
    name: 'Empresarial',
    price: 79,
    maxStaff: 5,
    maxClients: 1000,
    maxAppointments: null,
    notifications: ['email', 'sms', 'reminders'],
    features: [
      'Hasta 5 usuarios',
      'Hasta 1,000 clientes',
      'Notificaciones por email',
      'Mensajes SMS ilimitados',
      'Recordatorios 24h y 2h antes',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
  [PLANS.ENTERPRISE]: {
    name: 'Enterprise',
    price: 199,
    maxStaff: null, // unlimited
    maxClients: null, // unlimited
    maxAppointments: null, // unlimited
    notifications: ['email', 'sms', 'reminders'],
    features: [
      'Usuarios ilimitados',
      'Clientes ilimitados',
      'Todas las notificaciones y canales',
      'SMS y recordatorios ilimitados',
      'Soporte 24/7 dedicado',
      'Acceso a API personalizada',
      'Personalización avanzada',
      'Gerente de cuenta dedicado',
    ],
  },
};

/**
 * Appointment statuses
 */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

/**
 * Status colors for UI
 */
export const STATUS_COLORS = {
  [APPOINTMENT_STATUS.PENDING]: 'yellow',
  [APPOINTMENT_STATUS.CONFIRMED]: 'green',
  [APPOINTMENT_STATUS.COMPLETED]: 'blue',
  [APPOINTMENT_STATUS.CANCELLED]: 'red',
  [APPOINTMENT_STATUS.NO_SHOW]: 'gray',
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * Notification statuses
 */
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

/**
 * Business hours
 */
export const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '14:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
};

/**
 * Time slots (in minutes)
 */
export const TIME_SLOTS = [15, 30, 45, 60, 90, 120];

/**
 * Default service duration (in minutes)
 */
export const DEFAULT_SERVICE_DURATION = 60;

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Date formats
 */
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  FULL: 'EEEE, dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
};

/**
 * Validation rules
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_PHONE_LENGTH: 20,
  MIN_SERVICE_DURATION: 15,
  MAX_SERVICE_DURATION: 480, // 8 hours
  MIN_SERVICE_PRICE: 0,
  MAX_SERVICE_PRICE: 999999,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`,
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  INVALID_DATE: 'Fecha inválida',
  INVALID_TIME: 'Hora inválida',
  GENERIC_ERROR: 'Ocurrió un error. Por favor intenta de nuevo.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  NOT_FOUND: 'No se encontró el recurso solicitado',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  APPOINTMENT_CREATED: 'Cita creada exitosamente',
  APPOINTMENT_UPDATED: 'Cita actualizada exitosamente',
  APPOINTMENT_CANCELLED: 'Cita cancelada exitosamente',
  SERVICE_CREATED: 'Servicio creado exitosamente',
  SERVICE_UPDATED: 'Servicio actualizado exitosamente',
  SERVICE_DELETED: 'Servicio eliminado exitosamente',
  STAFF_CREATED: 'Personal agregado exitosamente',
  STAFF_UPDATED: 'Personal actualizado exitosamente',
  STAFF_DELETED: 'Personal eliminado exitosamente',
  BUSINESS_UPDATED: 'Negocio actualizado exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  SETTINGS_SAVED: 'Configuración guardada exitosamente',
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
};

/**
 * API endpoints (relative to base URL)
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    RESET_PASSWORD: '/auth/reset-password',
  },
  APPOINTMENTS: '/api/appointments',
  SERVICES: '/api/services',
  STAFF: '/api/staff',
  CLIENTS: '/api/clients',
  BUSINESSES: '/api/businesses',
  NOTIFICATIONS: '/api/notifications',
  STATS: '/api/stats',
};

/**
 * Query keys for React Query (if used)
 */
export const QUERY_KEYS = {
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  STAFF: 'staff',
  CLIENTS: 'clients',
  BUSINESSES: 'businesses',
  NOTIFICATIONS: 'notifications',
  STATS: 'stats',
  USER: 'user',
};

/**
 * Feature flags
 */
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_PAYMENTS: false, // Future feature
  ENABLE_REVIEWS: false, // Future feature
  ENABLE_ANALYTICS: true,
  ENABLE_EXPORT: true,
};

/**
 * Available modules
 */
export const MODULES = {
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  JEWELRY: 'jewelry',
  ADMIN: 'admin',
} as const;

export type ModuleName = typeof MODULES[keyof typeof MODULES];

/**
 * Module details
 */
export const MODULE_DETAILS = {
  [MODULES.APPOINTMENTS]: {
    name: 'Citas',
    slug: 'appointments',
    description: 'Gestión de citas y calendario',
    icon: 'Calendar',
    display_order: 1,
    requires_subscription: false,
  },
  [MODULES.SERVICES]: {
    name: 'Servicios Personales',
    slug: 'services',
    description: 'Facturación y servicios profesionales',
    icon: 'ShoppingBag',
    display_order: 2,
    requires_subscription: true,
  },
  [MODULES.JEWELRY]: {
    name: 'Joyería',
    slug: 'jewelry',
    description: 'Control operativo y financiero de taller de joyería',
    icon: 'Gem',
    display_order: 3,
    requires_subscription: true,
  },
  [MODULES.ADMIN]: {
    name: 'Administración',
    slug: 'admin',
    description: 'Panel de administración del sistema',
    icon: 'Settings',
    display_order: 99,
    requires_subscription: false,
  },
} as const;

/**
 * Social media links (example)
 */
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com',
  TWITTER: 'https://twitter.com',
  INSTAGRAM: 'https://instagram.com',
  LINKEDIN: 'https://linkedin.com',
};

/**
 * Support contact
 */
export const SUPPORT = {
  EMAIL: 'support@bookingsuite.com',
  PHONE: '+1 (555) 123-4567',
  HOURS: 'Lunes a Viernes, 9:00 AM - 6:00 PM',
};




