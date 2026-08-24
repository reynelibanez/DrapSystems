/**
 * Push Notifications Service
 * Maneja notificaciones push nativas para Windows, Android, iOS y navegadores
 */

export type PushNotificationType = 
  | 'appointment_created' 
  | 'appointment_reminder_24h' 
  | 'appointment_reminder_2h' 
  | 'appointment_cancelled' 
  | 'appointment_expired'
  | 'appointment_updated';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

/**
 * Verifica si el navegador soporta notificaciones push
 */
export function isPushNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Obtiene el estado actual del permiso de notificaciones
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Solicita permiso para mostrar notificaciones
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Muestra una notificación push nativa
 */
export async function showPushNotification(
  data: PushNotificationData
): Promise<boolean> {
  // Verificar soporte
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return false;
  }

  // Verificar permiso
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted:', permission);
    return false;
  }

  try {
    // Si hay un service worker registrado, usar showNotification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || 'drap-notification',
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        actions: data.actions || [],
      });

      console.log('✅ Push notification shown via Service Worker');
      return true;
    } else {
      // Fallback: usar Notification API directamente
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || 'drap-notification',
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
      });

      // Manejar click en la notificación
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Si hay una URL en los datos, navegar a ella
        if (data.data?.url) {
          window.location.href = data.data.url;
        }
      };

      console.log('✅ Push notification shown via Notification API');
      return true;
    }
  } catch (error) {
    console.error('Error showing push notification:', error);
    return false;
  }
}

/**
 * Genera los datos de notificación según el tipo
 */
export function generatePushNotificationData(
  type: PushNotificationType,
  data: {
    clientName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    businessName: string;
    language?: 'en' | 'es';
  }
): PushNotificationData {
  const lang = data.language || 'es';
  const isEnglish = lang === 'en';

  const templates: Record<PushNotificationType, PushNotificationData> = {
    appointment_created: {
      title: isEnglish 
        ? `✅ Appointment Confirmed - ${data.businessName}`
        : `✅ Cita Confirmada - ${data.businessName}`,
      body: isEnglish
        ? `${data.serviceName} on ${data.appointmentDate} at ${data.appointmentTime}`
        : `${data.serviceName} el ${data.appointmentDate} a las ${data.appointmentTime}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-created',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        type: 'appointment_created',
        url: '/dashboard',
      },
    },
    appointment_reminder_24h: {
      title: isEnglish
        ? `🔔 Reminder: Appointment Tomorrow`
        : `🔔 Recordatorio: Cita Mañana`,
      body: isEnglish
        ? `${data.serviceName} at ${data.businessName} - ${data.appointmentTime}`
        : `${data.serviceName} en ${data.businessName} - ${data.appointmentTime}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-reminder-24h',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        type: 'appointment_reminder_24h',
        url: '/dashboard',
      },
    },
    appointment_reminder_2h: {
      title: isEnglish
        ? `⏰ Your appointment is in 2 hours!`
        : `⏰ ¡Tu cita es en 2 horas!`,
      body: isEnglish
        ? `${data.serviceName} at ${data.businessName} - ${data.appointmentTime}`
        : `${data.serviceName} en ${data.businessName} - ${data.appointmentTime}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-reminder-2h',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: {
        type: 'appointment_reminder_2h',
        url: '/dashboard',
      },
    },
    appointment_cancelled: {
      title: isEnglish
        ? `❌ Appointment Cancelled`
        : `❌ Cita Cancelada`,
      body: isEnglish
        ? `${data.serviceName} on ${data.appointmentDate} at ${data.businessName}`
        : `${data.serviceName} el ${data.appointmentDate} en ${data.businessName}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-cancelled',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        type: 'appointment_cancelled',
        url: '/dashboard',
      },
    },
    appointment_expired: {
      title: isEnglish
        ? `⏱️ Appointment Expired`
        : `⏱️ Cita Expirada`,
      body: isEnglish
        ? `${data.serviceName} on ${data.appointmentDate} has expired`
        : `${data.serviceName} el ${data.appointmentDate} ha expirado`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-expired',
      requireInteraction: false,
      vibrate: [200],
      data: {
        type: 'appointment_expired',
        url: '/dashboard',
      },
    },
    appointment_updated: {
      title: isEnglish
        ? `📝 Appointment Updated`
        : `📝 Cita Actualizada`,
      body: isEnglish
        ? `${data.serviceName} on ${data.appointmentDate} at ${data.appointmentTime}`
        : `${data.serviceName} el ${data.appointmentDate} a las ${data.appointmentTime}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'appointment-updated',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        type: 'appointment_updated',
        url: '/dashboard',
      },
    },
  };

  return templates[type];
}

/**
 * Envía una notificación push completa
 */
export async function sendPushNotification(
  type: PushNotificationType,
  data: {
    clientName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    businessName: string;
    language?: 'en' | 'es';
  }
): Promise<boolean> {
  // Generar datos de la notificación
  const notificationData = generatePushNotificationData(type, data);

  // Mostrar la notificación
  return await showPushNotification(notificationData);
}

/**
 * Inicializa el sistema de notificaciones push
 * Debe llamarse al cargar la aplicación
 */
export async function initializePushNotifications(): Promise<void> {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported in this browser');
    return;
  }

  // Verificar si ya tenemos permiso
  const permission = getNotificationPermission();
  
  if (permission === 'default') {
    console.log('Push notifications permission not requested yet');
    // No solicitar automáticamente, esperar a que el usuario lo haga
  } else if (permission === 'granted') {
    console.log('✅ Push notifications enabled');
  } else {
    console.log('❌ Push notifications denied');
  }
}

/**
 * Muestra un diálogo para solicitar permiso de notificaciones
 */
export async function promptForNotificationPermission(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  return permission === 'granted';
}
