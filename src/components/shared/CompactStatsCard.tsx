import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, TrendingUp, Clock, XCircle, CheckCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DayStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  occupancyRate: number;
  uniqueClients: number;
}

interface CompactStatsCardProps {
  stats: DayStats;
  visible: boolean;
}

export function CompactStatsCard({ stats, visible }: CompactStatsCardProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Card className="border-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative z-0">
      <CardHeader className="pb-1 p-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-primary" />
          {t('todayStats')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 space-y-1">
        {/* Total de citas */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{t('total')}</span>
          </div>
          <span className="font-semibold">{stats.total}</span>
        </div>

        {/* Confirmadas */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-muted-foreground">{t('confirmed')}</span>
          </div>
          <span className="font-semibold text-emerald-600">{stats.confirmed}</span>
        </div>

        {/* Completadas */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-blue-500" />
            <span className="text-muted-foreground">{t('completed')}</span>
          </div>
          <span className="font-semibold text-blue-600">{stats.completed}</span>
        </div>

        {/* Pendientes */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-muted-foreground">{t('pending')}</span>
          </div>
          <span className="font-semibold text-amber-600">{stats.pending}</span>
        </div>

        {/* Canceladas */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-muted-foreground">{t('cancelled')}</span>
          </div>
          <span className="font-semibold text-red-600">{stats.cancelled}</span>
        </div>

        <div className="border-t border-border my-1"></div>

        {/* Ingresos */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">{t('revenue')}</span>
          </div>
          <span className="font-semibold text-green-600">{stats.revenue.toFixed(0)} US$</span>
        </div>

        {/* Clientes únicos */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-500" />
            <span className="text-muted-foreground">{t('clients')}</span>
          </div>
          <span className="font-semibold text-purple-600">{stats.uniqueClients}</span>
        </div>
      </CardContent>
    </Card>
  );
}



