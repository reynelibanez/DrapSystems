import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  isPushNotificationSupported, 
  getNotificationPermission,
  promptForNotificationPermission 
} from '../../lib/push-notifications';
import { useTranslation } from 'react-i18next';

interface PushNotificationPromptProps {
  onClose?: () => void;
  autoShow?: boolean; // Mostrar automáticamente si no se ha solicitado permiso
}

export function PushNotificationPrompt({ onClose, autoShow = true }: PushNotificationPromptProps) {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar soporte y permiso actual
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      // Mostrar prompt si está en default y autoShow está habilitado
      if (autoShow && currentPermission === 'default') {
        // Esperar 3 segundos antes de mostrar el prompt
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [autoShow]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await promptForNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        // Cerrar el prompt después de 2 segundos
        setTimeout(() => {
          setShowPrompt(false);
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onClose?.();
  };

  // No mostrar si no está soportado o si ya se concedió/denegó permiso
  if (!isSupported || permission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                {t('pushNotifications.title', '🔔 Activar Notificaciones')}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {t('pushNotifications.description', 
              'Recibe notificaciones instantáneas sobre tus citas, recordatorios y actualizaciones importantes.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="mr-2 h-4 w-4" />
              {isLoading 
                ? t('pushNotifications.enabling', 'Activando...')
                : t('pushNotifications.enable', 'Activar Notificaciones')
              }
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="w-full"
            >
              {t('pushNotifications.later', 'Más Tarde')}
            </Button>
          </div>
          
          {permission === 'granted' && (
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('pushNotifications.enabled', '✅ Notificaciones activadas')}
            </div>
          )}
          
          {permission === 'denied' && (
            <div className="text-sm text-destructive flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              {t('pushNotifications.denied', 
                'Notificaciones bloqueadas. Puedes activarlas en la configuración de tu navegador.'
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Componente compacto para mostrar en la configuración
 */
export function PushNotificationSettings() {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (permission === 'granted') {
      // No se puede revocar desde código, mostrar instrucciones
      alert(t('pushNotifications.revokeInstructions', 
        'Para desactivar las notificaciones, ve a la configuración de tu navegador.'
      ));
      return;
    }

    setIsLoading(true);
    try {
      const granted = await promptForNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">
              {t('pushNotifications.notSupported', 'Notificaciones Push')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('pushNotifications.notSupportedDescription', 
                'No disponibles en este navegador'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {permission === 'granted' ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-sm">
            {t('pushNotifications.title', 'Notificaciones Push')}
          </p>
          <p className="text-xs text-muted-foreground">
            {permission === 'granted' 
              ? t('pushNotifications.statusEnabled', 'Activadas')
              : permission === 'denied'
              ? t('pushNotifications.statusDenied', 'Bloqueadas')
              : t('pushNotifications.statusDefault', 'No configuradas')
            }
          </p>
        </div>
      </div>
      <Button
        variant={permission === 'granted' ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggleNotifications}
        disabled={isLoading || permission === 'denied'}
      >
        {isLoading 
          ? t('common.loading', 'Cargando...')
          : permission === 'granted'
          ? t('pushNotifications.manage', 'Gestionar')
          : t('pushNotifications.enable', 'Activar')
        }
      </Button>
    </div>
  );
}
