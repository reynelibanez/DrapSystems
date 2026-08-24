import { ThemeProvider } from 'next-themes';
import { LoginForm } from './LoginForm';
import { Toaster } from './ui/sonner';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function LoginApp() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="booking-suite-theme">
        <LoginForm />
        <Toaster />
      </ThemeProvider>
    </I18nextProvider>
  );
}

