import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { UserForm } from './UserForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { PushNotificationSettings } from './PushNotificationPrompt';
import { useTranslation } from 'react-i18next';

export function UserProfile() {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { t } = useTranslation();

  const handleProfileUpdateSuccess = () => {
    setMessage({ type: 'success', text: t('profileUpdatedSuccessfully') });
    // Recargar la página para actualizar el perfil en el AuthProvider
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (!profile) {
    return <div className="text-center py-8">{t('profileNotFound')}</div>;
  }

  // Determinar si el usuario es admin
  const isAdmin = profile.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('myProfile')}</h1>
        <p className="text-muted-foreground">{t('viewPersonalInfo')}</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            {t('security')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            {t('notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('personalInformation')}</CardTitle>
              <CardDescription>
                {t('updateProfileInfo')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserForm
                user={profile}
                onSuccess={handleProfileUpdateSuccess}
                isAdmin={isAdmin}
                businessId={profile.business_id || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationSettings')}</CardTitle>
              <CardDescription>
                {t('manageNotificationPreferences')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PushNotificationSettings />
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">{t('aboutPushNotifications')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('pushNotificationBenefit1', 'Recibe notificaciones instantáneas sobre tus citas')}</li>
                  <li>{t('pushNotificationBenefit2', 'Recordatorios automáticos antes de tus citas')}</li>
                  <li>{t('pushNotificationBenefit3', 'Alertas de cambios o cancelaciones')}</li>
                  <li>{t('pushNotificationBenefit4', 'Funciona incluso cuando la app está cerrada')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}








