import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, Clock, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from './StatusBadge';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
}

interface CompactNextAppointmentCardProps {
  appointment: AppointmentWithDetails | null;
  visible: boolean;
}

export function CompactNextAppointmentCard({ appointment, visible }: CompactNextAppointmentCardProps) {
  const { t } = useTranslation();

  console.log('🎴 CompactNextAppointmentCard - visible:', visible, 'hasAppointment:', !!appointment);
  
  if (appointment) {
    console.log('🎴 CompactNextAppointmentCard - appointment data:', {
      id: appointment.id,
      client_name: appointment.client_name,
      service_name: appointment.service_name,
      hasClientRelation: !!appointment.client,
      hasServiceRelation: !!appointment.service,
      clientFullName: appointment.client?.full_name,
      serviceName: appointment.service?.name
    });
  }

  if (!visible || !appointment) return null;

  const appointmentDate = new Date(appointment.start_time);
  const clientName = appointment.client?.full_name || appointment.client?.email || appointment.client_name || t('clientWithoutName');
  const serviceName = appointment.service?.name || appointment.service_name || t('serviceWithoutName');

  return (
    <Card className="border-2 border-primary/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 bg-gradient-to-br from-primary/10 to-primary/5 relative z-10">
      <CardHeader className="pb-1 p-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-primary" />
          {t('nextAppointment')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 space-y-1">
        {/* Cliente */}
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium truncate">{clientName}</span>
        </div>

        {/* Servicio */}
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{serviceName}</span>
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            {format(appointmentDate, 'MMM d, yyyy')} • {format(appointmentDate, 'h:mm a')}
          </span>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <StatusBadge status={appointment.status} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}






