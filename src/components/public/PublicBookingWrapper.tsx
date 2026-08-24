import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { PublicBooking } from './PublicBooking';

interface PublicBookingWrapperProps {
  businessId: string;
}

export function PublicBookingWrapper({ businessId }: PublicBookingWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar problemas de hidratación
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      storageKey="public-booking-theme"
    >
      <PublicBooking businessId={businessId} />
    </ThemeProvider>
  );
}



