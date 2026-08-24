import { toast } from 'sonner';

// Tipos de notificaciones
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notificaciones de éxito
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(options?.title || 'Éxito', {
    description: message,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

// Notificaciones de error
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(options?.title || 'Error', {
    description: message,
    duration: options?.duration || 5000,
    action: options?.action,
  });
};

// Notificaciones de información
export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(options?.title || 'Información', {
    description: message,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

// Notificaciones de advertencia
export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(options?.title || 'Advertencia', {
    description: message,
    duration: options?.duration || 4500,
    action: options?.action,
  });
};

// Notificación de carga
export const showLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(options?.title || 'Cargando...', {
    description: message,
  });
};

// Cerrar notificación específica
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

// Cerrar todas las notificaciones
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Notificaciones específicas del sistema de citas

export const appointmentNotifications = {
  created: (clientName: string, date: string, time: string) => {
    showSuccess(`Cita creada para ${clientName}`, {
      title: '✅ Cita Confirmada',
      description: `${date} a las ${time}`,
      duration: 5000,
    });
  },

  updated: (clientName: string) => {
    showSuccess(`Cita de ${clientName} actualizada correctamente`, {
      title: '✏️ Cita Actualizada',
    });
  },

  cancelled: (clientName: string) => {
    showInfo(`Cita de ${clientName} cancelada`, {
      title: '🚫 Cita Cancelada',
    });
  },

  deleted: () => {
    showSuccess('Cita eliminada correctamente', {
      title: '🗑️ Cita Eliminada',
    });
  },

  reminder24h: (clientName: string, date: string, time: string) => {
    showInfo(`Recordatorio enviado a ${clientName}`, {
      title: '📧 Recordatorio 24h',
      description: `Cita: ${date} a las ${time}`,
    });
  },

  reminder2h: (clientName: string, time: string) => {
    showInfo(`Recordatorio enviado a ${clientName}`, {
      title: '⏰ Recordatorio 2h',
      description: `Cita a las ${time}`,
    });
  },

  expired: (clientName: string) => {
    showWarning(`Cita de ${clientName} expirada y cancelada automáticamente`, {
      title: '⏱️ Cita Expirada',
    });
  },

  error: (message: string) => {
    showError(message, {
      title: '❌ Error en Cita',
    });
  },
};

export const clientNotifications = {
  created: (clientName: string) => {
    showSuccess(`Cliente ${clientName} creado correctamente`, {
      title: '👤 Cliente Creado',
    });
  },

  updated: (clientName: string) => {
    showSuccess(`Cliente ${clientName} actualizado correctamente`, {
      title: '✏️ Cliente Actualizado',
    });
  },

  deleted: (clientName: string) => {
    showSuccess(`Cliente ${clientName} eliminado correctamente`, {
      title: '🗑️ Cliente Eliminado',
    });
  },

  error: (message: string) => {
    showError(message, {
      title: '❌ Error en Cliente',
    });
  },
};

export const businessNotifications = {
  created: (businessName: string) => {
    showSuccess(`Negocio ${businessName} creado correctamente`, {
      title: '🏢 Negocio Creado',
    });
  },

  updated: (businessName: string) => {
    showSuccess(`Negocio ${businessName} actualizado correctamente`, {
      title: '✏️ Negocio Actualizado',
    });
  },

  deleted: (businessName: string) => {
    showSuccess(`Negocio ${businessName} eliminado correctamente`, {
      title: '🗑️ Negocio Eliminado',
    });
  },

  error: (message: string) => {
    showError(message, {
      title: '❌ Error en Negocio',
    });
  },
};

export const serviceNotifications = {
  created: (serviceName: string) => {
    showSuccess(`Servicio ${serviceName} creado correctamente`, {
      title: '⚙️ Servicio Creado',
    });
  },

  updated: (serviceName: string) => {
    showSuccess(`Servicio ${serviceName} actualizado correctamente`, {
      title: '✏️ Servicio Actualizado',
    });
  },

  deleted: (serviceName: string) => {
    showSuccess(`Servicio ${serviceName} eliminado correctamente`, {
      title: '🗑️ Servicio Eliminado',
    });
  },

  error: (message: string) => {
    showError(message, {
      title: '❌ Error en Servicio',
    });
  },
};

export const staffNotifications = {
  created: (staffName: string) => {
    showSuccess(`Personal ${staffName} agregado correctamente`, {
      title: '👨‍💼 Personal Agregado',
    });
  },

  updated: (staffName: string) => {
    showSuccess(`Personal ${staffName} actualizado correctamente`, {
      title: '✏️ Personal Actualizado',
    });
  },

  deleted: (staffName: string) => {
    showSuccess(`Personal ${staffName} eliminado correctamente`, {
      title: '🗑️ Personal Eliminado',
    });
  },

  error: (message: string) => {
    showError(message, {
      title: '❌ Error en Personal',
    });
  },
};

export const authNotifications = {
  loginSuccess: (userName: string) => {
    showSuccess(`Bienvenido, ${userName}`, {
      title: '👋 Inicio de Sesión Exitoso',
    });
  },

  loginError: (message: string) => {
    showError(message, {
      title: '🔒 Error de Inicio de Sesión',
    });
  },

  logoutSuccess: () => {
    showInfo('Sesión cerrada correctamente', {
      title: '👋 Hasta Pronto',
    });
  },

  sessionExpired: () => {
    showWarning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
      title: '⏱️ Sesión Expirada',
      duration: 6000,
    });
  },
};

export const subscriptionNotifications = {
  upgraded: (planName: string) => {
    showSuccess(`Plan actualizado a ${planName}`, {
      title: '🎉 Plan Mejorado',
    });
  },

  downgraded: (planName: string) => {
    showInfo(`Plan cambiado a ${planName}`, {
      title: '📊 Plan Actualizado',
    });
  },

  cancelled: () => {
    showWarning('Suscripción cancelada', {
      title: '🚫 Suscripción Cancelada',
    });
  },

  paymentSuccess: () => {
    showSuccess('Pago procesado correctamente', {
      title: '💳 Pago Exitoso',
    });
  },

  paymentError: (message: string) => {
    showError(message, {
      title: '❌ Error de Pago',
    });
  },

  trialEnding: (daysLeft: number) => {
    showWarning(`Tu período de prueba termina en ${daysLeft} días`, {
      title: '⏰ Período de Prueba',
      duration: 7000,
    });
  },
};

export const systemNotifications = {
  saved: () => {
    showSuccess('Cambios guardados correctamente', {
      title: '💾 Guardado',
    });
  },

  deleted: () => {
    showSuccess('Elemento eliminado correctamente', {
      title: '🗑️ Eliminado',
    });
  },

  copied: () => {
    showSuccess('Copiado al portapapeles', {
      title: '📋 Copiado',
      duration: 2000,
    });
  },

  exported: (format: string) => {
    showSuccess(`Datos exportados en formato ${format}`, {
      title: '📤 Exportado',
    });
  },

  imported: (count: number) => {
    showSuccess(`${count} elementos importados correctamente`, {
      title: '📥 Importado',
    });
  },

  networkError: () => {
    showError('Error de conexión. Por favor, verifica tu internet.', {
      title: '🌐 Error de Red',
    });
  },

  permissionDenied: () => {
    showError('No tienes permisos para realizar esta acción', {
      title: '🔒 Permiso Denegado',
    });
  },

  validationError: (message: string) => {
    showWarning(message, {
      title: '⚠️ Error de Validación',
    });
  },
};
