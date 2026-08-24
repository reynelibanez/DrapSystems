import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from './constants';

/**
 * Common validation schemas
 */

export const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
  .email(ERROR_MESSAGES.INVALID_EMAIL);

export const phoneSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
  .regex(/^\+?[\d\s\-()]+$/, ERROR_MESSAGES.INVALID_PHONE)
  .refine(
    (val) => val.replace(/\D/g, '').length >= 10,
    ERROR_MESSAGES.INVALID_PHONE
  );

export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT);

export const nameSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
  .max(VALIDATION.MAX_NAME_LENGTH, `Máximo ${VALIDATION.MAX_NAME_LENGTH} caracteres`);

export const descriptionSchema = z
  .string()
  .max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Máximo ${VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres`)
  .optional();

/**
 * User schemas
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ['confirmPassword'],
});

/**
 * Business schemas
 */

export const businessSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  city: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  state: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  zipCode: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  country: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const businessHoursSchema = z.object({
  monday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  tuesday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  wednesday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  thursday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  friday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  saturday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
  sunday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  }),
});

/**
 * Service schemas
 */

export const serviceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  duration: z
    .number()
    .min(VALIDATION.MIN_SERVICE_DURATION, `Mínimo ${VALIDATION.MIN_SERVICE_DURATION} minutos`)
    .max(VALIDATION.MAX_SERVICE_DURATION, `Máximo ${VALIDATION.MAX_SERVICE_DURATION} minutos`),
  price: z
    .number()
    .min(VALIDATION.MIN_SERVICE_PRICE, 'El precio debe ser mayor o igual a 0')
    .max(VALIDATION.MAX_SERVICE_PRICE, `Máximo ${VALIDATION.MAX_SERVICE_PRICE}`),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Staff schemas
 */

export const staffSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  businessId: z.string().uuid('ID de negocio inválido'),
  specialization: z.string().optional(),
  bio: descriptionSchema,
  isActive: z.boolean().default(true),
});

/**
 * Appointment schemas
 */

export const appointmentSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  staffId: z.string().uuid('ID de personal inválido'),
  serviceId: z.string().uuid('ID de servicio inválido'),
  startTime: z.string().datetime('Fecha y hora inválida'),
  endTime: z.string().datetime('Fecha y hora inválida'),
  notes: descriptionSchema,
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).default('pending'),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: descriptionSchema,
});

/**
 * Notification schemas
 */

export const notificationSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  businessId: z.string().uuid('ID de negocio inválido'),
  type: z.enum(['email', 'sms', 'whatsapp']),
  message: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  appointmentId: z.string().uuid('ID de cita inválido').optional(),
});

/**
 * Search and filter schemas
 */

export const searchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show', '']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

/**
 * Validation helper functions
 */

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePhone(phone: string): boolean {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function validateTimeRange(startTime: string, endTime: string): boolean {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return end > start && !isNaN(start.getTime()) && !isNaN(end.getTime());
}

export function validateBusinessHours(hours: any): boolean {
  try {
    businessHoursSchema.parse(hours);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type exports
 */

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
