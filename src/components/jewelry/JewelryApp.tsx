import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { JewelryDashboard } from './JewelryDashboard';
import { CurrencyProvider } from './CurrencyContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function JewelryApp() {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('🔍 JewelryApp: Estado de autenticación:', {
      authLoading,
      profileExists: !!profile,
      profileId: profile?.id,
      profileRole: profile?.role,
      businessId: profile?.business_id,
      profileKeys: profile ? Object.keys(profile) : [],
      profileComplete: JSON.stringify(profile, null, 2)
    });

    // Log adicional para ver el tipo de business_id
    if (profile) {
      console.log('🔍 JewelryApp: Análisis detallado del perfil:');
      console.log('  - business_id existe?', 'business_id' in profile);
      console.log('  - business_id valor:', profile.business_id);
      console.log('  - business_id tipo:', typeof profile.business_id);
      console.log('  - business_id es null?', profile.business_id === null);
      console.log('  - business_id es undefined?', profile.business_id === undefined);
      console.log('  - business_id es string vacío?', profile.business_id === '');
      console.log('  - Todas las propiedades:', Object.entries(profile));
    }

    // Esperar a que authLoading sea false Y que el perfil esté cargado
    if (!authLoading) {
      if (!profile) {
        console.error('❌ JewelryApp: Usuario no autenticado');
        setError(t('errors.notAuthenticated'));
        setIsReady(true);
      } else if (!profile.business_id) {
        console.error('❌ JewelryApp: business_id no encontrado en perfil');
        console.error('Perfil completo:', JSON.stringify(profile, null, 2));
        setError(t('jewelry.common.error'));
        setIsReady(true);
      } else {
        console.log('✅ JewelryApp: business_id encontrado:', profile.business_id);
        setIsReady(true);
      }
    }
  }, [authLoading, profile, t]);

  // Mostrar loading mientras authLoading es true O mientras no estamos listos
  if (authLoading || !isReady) {
    console.log('⏳ JewelryApp: Esperando...', { authLoading, isReady });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile?.business_id) {
    console.error('❌ JewelryApp: Error o businessId no disponible:', { 
      error, 
      businessId: profile?.business_id 
    });
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || t('jewelry.common.error')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('✅ JewelryApp: Renderizando con businessId:', profile.business_id);
  return (
    <CurrencyProvider businessId={profile.business_id}>
      <JewelryDashboard businessId={profile.business_id} />
    </CurrencyProvider>
  );
}









