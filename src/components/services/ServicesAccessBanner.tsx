import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, Crown, Sparkles, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServicesAccess } from '../../lib/hooks/useServicesAccess';

interface ServicesAccessBannerProps {
  businessId: string;
  onUpgrade?: () => void;
}

export function ServicesAccessBanner({ businessId, onUpgrade }: ServicesAccessBannerProps) {
  const { t } = useTranslation();
  const { hasAccess, plan, status, isTrialing, daysRemaining } = useServicesAccess(businessId);

  // No mostrar nada si está cargando o tiene acceso completo sin restricciones
  if (status === 'active' && !isTrialing && plan !== 'free') {
    return null;
  }

  // Banner para plan gratuito
  if (plan === 'free') {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          {t('servicesAccess.free.title', 'Plan Gratuito')}
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>
              {t('servicesAccess.free.description', 'Estás usando el plan gratuito con funcionalidades limitadas.')}
            </span>
            {onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="ml-4"
              >
                <Crown className="mr-2 h-4 w-4" />
                {t('servicesAccess.upgrade', 'Mejorar Plan')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Banner para período de prueba
  if (isTrialing && daysRemaining !== null) {
    return (
      <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900">
        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertTitle className="text-purple-900 dark:text-purple-100">
          {t('servicesAccess.trial.title', 'Período de Prueba')}
        </AlertTitle>
        <AlertDescription className="text-purple-800 dark:text-purple-200">
          <div className="flex items-center justify-between">
            <span>
              {t('servicesAccess.trial.description', 'Te quedan {{days}} días de prueba gratuita.', { days: daysRemaining })}
            </span>
            {onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                variant="outline"
                className="ml-4"
              >
                {t('servicesAccess.trial.subscribe', 'Suscribirse Ahora')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Banner para suscripción próxima a vencer
  if (hasAccess && daysRemaining !== null && daysRemaining <= 7) {
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="text-orange-900 dark:text-orange-100">
          {t('servicesAccess.expiring.title', 'Suscripción Próxima a Vencer')}
        </AlertTitle>
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center justify-between">
            <span>
              {t('servicesAccess.expiring.description', 'Tu suscripción vence en {{days}} días.', { days: daysRemaining })}
            </span>
            {onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                variant="outline"
                className="ml-4"
              >
                {t('servicesAccess.expiring.renew', 'Renovar')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Banner para suscripción vencida o sin acceso
  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {t('servicesAccess.expired.title', 'Acceso Restringido')}
        </AlertTitle>
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {t('servicesAccess.expired.description', 'Tu suscripción ha vencido. Actualiza tu plan para continuar usando el módulo de servicios.')}
            </span>
            {onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="ml-4"
              >
                <Crown className="mr-2 h-4 w-4" />
                {t('servicesAccess.expired.reactivate', 'Reactivar')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
