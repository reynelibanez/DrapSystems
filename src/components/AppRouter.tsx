import { useMemo } from 'react';
import { App } from './App';
import { PublicBooking } from './public/PublicBooking';
import { AuthProvider } from './AuthProvider';

export function AppRouter() {
  // Detectar el business ID de forma síncrona
  const encryptedBusinessId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    const businessParam = params.get('business');
    
    if (businessParam) {
      console.log('✅ Encrypted business ID detected:', businessParam);
    }
    
    return businessParam;
  }, []);

  // Si hay un businessId encriptado válido, mostrar la página de reserva pública
  if (encryptedBusinessId) {
    return (
      <AuthProvider>
        <PublicBooking businessId={encryptedBusinessId} />
      </AuthProvider>
    );
  }

  // Si no, mostrar la aplicación normal
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}


