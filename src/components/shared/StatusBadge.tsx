import { Badge } from '@/components/ui/badge';
import { AppointmentStatus, SubscriptionStatus } from '@/lib/database.types';

interface StatusBadgeProps {
  status: AppointmentStatus | SubscriptionStatus;
  type: 'appointment' | 'subscription';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, type, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1',
    lg: 'text-sm sm:text-base px-3 py-1 sm:py-1.5'
  };

  if (type === 'appointment') {
    const appointmentConfig: Record<AppointmentStatus, { label: string; variant: any }> = {
      pending: { label: 'Pendiente', variant: 'secondary' },
      confirmed: { label: 'Confirmada', variant: 'default' },
      cancelled: { label: 'Cancelada', variant: 'destructive' },
      completed: { label: 'Completada', variant: 'outline' },
      no_show: { label: 'No asistió', variant: 'destructive' },
    };

    const config = appointmentConfig[status as AppointmentStatus];
    return <Badge variant={config.variant} className={sizeClasses[size]}>{config.label}</Badge>;
  }

  if (type === 'subscription') {
    const subscriptionConfig: Record<SubscriptionStatus, { label: string; variant: any }> = {
      active: { label: 'Activa', variant: 'default' },
      cancelled: { label: 'Cancelada', variant: 'destructive' },
      past_due: { label: 'Vencida', variant: 'destructive' },
      trial: { label: 'Prueba', variant: 'secondary' },
    };

    const config = subscriptionConfig[status as SubscriptionStatus];
    return <Badge variant={config.variant} className={sizeClasses[size]}>{config.label}</Badge>;
  }

  return null;
}

