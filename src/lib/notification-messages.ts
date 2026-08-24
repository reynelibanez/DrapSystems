/**
 * MENSAJES DE NOTIFICACIÓN MULTIIDIOMA
 * ====================================
 * Este archivo contiene todos los mensajes de notificación
 * en español e inglés para SMS y Email
 */

export type NotificationLanguage = 'es' | 'en';
export type Language = NotificationLanguage; // Alias para compatibilidad

export interface NotificationMessage {
  subject?: string; // Para emails
  body: string;
}

export interface AppointmentNotificationData {
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  staffName?: string;
  location?: string;
  notes?: string;
  confirmationLink?: string;
  cancelLink?: string;
}

export interface InvoiceNotificationData {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: string;
  items: Array<{
    description: string;
    amount: string;
  }>;
  paymentLink?: string;
}

export interface ReminderNotificationData {
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  location?: string;
  hoursUntil: number;
}

/**
 * MENSAJES DE CONFIRMACIÓN DE CITA
 */
export function getAppointmentConfirmationMessage(
  data: AppointmentNotificationData,
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Confirmación de Cita - ${data.businessName}`,
      body: `Hola ${data.clientName},

Tu cita ha sido confirmada:

📅 Fecha: ${data.date}
🕐 Hora: ${data.time}
💼 Servicio: ${data.serviceName}
${data.staffName ? `👤 Con: ${data.staffName}` : ''}
${data.location ? `📍 Ubicación: ${data.location}` : ''}

${data.notes ? `📝 Notas: ${data.notes}\n` : ''}
Gracias por confiar en ${data.businessName}.

${data.confirmationLink ? `\n🔗 Ver detalles: ${data.confirmationLink}` : ''}
${data.cancelLink ? `\n❌ Cancelar cita: ${data.cancelLink}` : ''}`
    },
    en: {
      subject: `Appointment Confirmation - ${data.businessName}`,
      body: `Hello ${data.clientName},

Your appointment has been confirmed:

📅 Date: ${data.date}
🕐 Time: ${data.time}
💼 Service: ${data.serviceName}
${data.staffName ? `👤 With: ${data.staffName}` : ''}
${data.location ? `📍 Location: ${data.location}` : ''}

${data.notes ? `📝 Notes: ${data.notes}\n` : ''}
Thank you for trusting ${data.businessName}.

${data.confirmationLink ? `\n🔗 View details: ${data.confirmationLink}` : ''}
${data.cancelLink ? `\n❌ Cancel appointment: ${data.cancelLink}` : ''}`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE RECORDATORIO DE CITA
 */
export function getAppointmentReminderMessage(
  data: ReminderNotificationData,
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Recordatorio de Cita - ${data.businessName}`,
      body: `Hola ${data.clientName},

Te recordamos tu cita en ${data.hoursUntil} horas:

📅 Fecha: ${data.date}
🕐 Hora: ${data.time}
💼 Servicio: ${data.serviceName}
${data.location ? `📍 Ubicación: ${data.location}` : ''}

Nos vemos pronto en ${data.businessName}!`
    },
    en: {
      subject: `Appointment Reminder - ${data.businessName}`,
      body: `Hello ${data.clientName},

This is a reminder of your appointment in ${data.hoursUntil} hours:

📅 Date: ${data.date}
🕐 Time: ${data.time}
💼 Service: ${data.serviceName}
${data.location ? `📍 Location: ${data.location}` : ''}

See you soon at ${data.businessName}!`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE CANCELACIÓN DE CITA
 */
export function getAppointmentCancellationMessage(
  data: AppointmentNotificationData,
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Cita Cancelada - ${data.businessName}`,
      body: `Hola ${data.clientName},

Tu cita ha sido cancelada:

📅 Fecha: ${data.date}
🕐 Hora: ${data.time}
💼 Servicio: ${data.serviceName}

Si deseas reagendar, por favor contáctanos.

Gracias,
${data.businessName}`
    },
    en: {
      subject: `Appointment Cancelled - ${data.businessName}`,
      body: `Hello ${data.clientName},

Your appointment has been cancelled:

📅 Date: ${data.date}
🕐 Time: ${data.time}
💼 Service: ${data.serviceName}

If you wish to reschedule, please contact us.

Thank you,
${data.businessName}`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE REPROGRAMACIÓN DE CITA
 */
export function getAppointmentRescheduledMessage(
  data: AppointmentNotificationData & { oldDate: string; oldTime: string },
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Cita Reprogramada - ${data.businessName}`,
      body: `Hola ${data.clientName},

Tu cita ha sido reprogramada:

❌ Fecha anterior: ${data.oldDate} a las ${data.oldTime}
✅ Nueva fecha: ${data.date} a las ${data.time}

💼 Servicio: ${data.serviceName}
${data.staffName ? `👤 Con: ${data.staffName}` : ''}
${data.location ? `📍 Ubicación: ${data.location}` : ''}

Gracias por tu comprensión,
${data.businessName}`
    },
    en: {
      subject: `Appointment Rescheduled - ${data.businessName}`,
      body: `Hello ${data.clientName},

Your appointment has been rescheduled:

❌ Previous date: ${data.oldDate} at ${data.oldTime}
✅ New date: ${data.date} at ${data.time}

💼 Service: ${data.serviceName}
${data.staffName ? `👤 With: ${data.staffName}` : ''}
${data.location ? `📍 Location: ${data.location}` : ''}

Thank you for your understanding,
${data.businessName}`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE FACTURA
 */
export function getInvoiceMessage(
  data: InvoiceNotificationData,
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const itemsList = data.items
    .map(item => `  • ${item.description}: ${item.amount}`)
    .join('\n');

  const messages = {
    es: {
      subject: `Nueva Factura #${data.invoiceNumber} - ${data.businessName}`,
      body: `Hola ${data.clientName},

Se ha generado una nueva factura:

🧾 Factura: #${data.invoiceNumber}
💰 Total: ${data.amount}
${data.dueDate ? `📅 Vencimiento: ${data.dueDate}` : ''}

Detalle:
${itemsList}

${data.paymentLink ? `\n💳 Pagar ahora: ${data.paymentLink}\n` : ''}
Gracias por tu preferencia,
${data.businessName}`
    },
    en: {
      subject: `New Invoice #${data.invoiceNumber} - ${data.businessName}`,
      body: `Hello ${data.clientName},

A new invoice has been generated:

🧾 Invoice: #${data.invoiceNumber}
💰 Total: ${data.amount}
${data.dueDate ? `📅 Due date: ${data.dueDate}` : ''}

Details:
${itemsList}

${data.paymentLink ? `\n💳 Pay now: ${data.paymentLink}\n` : ''}
Thank you for your business,
${data.businessName}`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE PAGO RECIBIDO
 */
export function getPaymentReceivedMessage(
  data: {
    clientName: string;
    businessName: string;
    amount: string;
    invoiceNumber?: string;
    paymentMethod: string;
    date: string;
  },
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Pago Recibido - ${data.businessName}`,
      body: `Hola ${data.clientName},

Hemos recibido tu pago:

💰 Monto: ${data.amount}
${data.invoiceNumber ? `🧾 Factura: #${data.invoiceNumber}` : ''}
💳 Método: ${data.paymentMethod}
📅 Fecha: ${data.date}

Gracias por tu pago,
${data.businessName}`
    },
    en: {
      subject: `Payment Received - ${data.businessName}`,
      body: `Hello ${data.clientName},

We have received your payment:

💰 Amount: ${data.amount}
${data.invoiceNumber ? `🧾 Invoice: #${data.invoiceNumber}` : ''}
💳 Method: ${data.paymentMethod}
📅 Date: ${data.date}

Thank you for your payment,
${data.businessName}`
    }
  };

  return messages[language];
}

/**
 * MENSAJES DE BIENVENIDA
 */
export function getWelcomeMessage(
  data: {
    clientName: string;
    businessName: string;
    loginLink?: string;
  },
  language: NotificationLanguage = 'es'
): NotificationMessage {
  const messages = {
    es: {
      subject: `Bienvenido a ${data.businessName}`,
      body: `Hola ${data.clientName},

¡Bienvenido a ${data.businessName}!

Estamos encantados de tenerte como cliente. Ahora puedes:

✅ Agendar citas en línea
✅ Ver tu historial de servicios
✅ Recibir recordatorios automáticos
✅ Gestionar tus datos de pago

${data.loginLink ? `\n🔗 Accede a tu cuenta: ${data.loginLink}\n` : ''}
Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
${data.businessName}`
    },
    en: {
      subject: `Welcome to ${data.businessName}`,
      body: `Hello ${data.clientName},

Welcome to ${data.businessName}!

We're delighted to have you as a client. You can now:

✅ Book appointments online
✅ View your service history
✅ Receive automatic reminders
✅ Manage your payment information

${data.loginLink ? `\n🔗 Access your account: ${data.loginLink}\n` : ''}
If you have any questions, don't hesitate to contact us.

Best regards,
${data.businessName}`
    }
  };

  return messages[language];
}

/**
 * TRADUCCIONES PARA EMAILS
 */
export function getEmailTranslations(language: NotificationLanguage = 'es') {
  const translations = {
    es: {
      appointmentConfirmed: 'Cita Confirmada',
      hello: 'Hola',
      appointmentDetails: 'Detalles de la Cita',
      service: 'Servicio',
      date: 'Fecha',
      time: 'Hora',
      location: 'Ubicación',
      notes: 'Notas',
      addToCalendar: 'Agregar al Calendario',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      thankYou: 'Gracias por tu confianza.',
    },
    en: {
      appointmentConfirmed: 'Appointment Confirmed',
      hello: 'Hello',
      appointmentDetails: 'Appointment Details',
      service: 'Service',
      date: 'Date',
      time: 'Time',
      location: 'Location',
      notes: 'Notes',
      addToCalendar: 'Add to Calendar',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      thankYou: 'Thank you for your trust.',
    }
  };

  return translations[language];
}

/**
 * FUNCIÓN HELPER PARA FORMATEAR FECHAS SEGÚN EL IDIOMA
 */
export function formatDateForLanguage(date: Date, language: NotificationLanguage): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleDateString(locale, options);
}

/**
 * FUNCIÓN HELPER PARA FORMATEAR HORAS SEGÚN EL IDIOMA
 */
export function formatTimeForLanguage(date: Date, language: NotificationLanguage): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language === 'en'
  };

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleTimeString(locale, options);
}

