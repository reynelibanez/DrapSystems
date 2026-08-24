import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogIn, Mail, Lock, Sparkles, AlertCircle, Moon, Sun, Languages, Eye, EyeOff } from 'lucide-react';
import { showError, showSuccess } from '../lib/toast-notifications';
import { Alert, AlertDescription } from './ui/alert';
import { baseUrl } from '../lib/base-url';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function LoginForm() {
  const { signIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getErrorMessage = (error: any): string => {
    const message = error?.message || '';
    
    // Email no confirmado
    if (message.includes('Email not confirmed')) {
      return t('login.error.emailNotConfirmed');
    }
    
    // Credenciales inválidas
    if (message.includes('Invalid login credentials')) {
      return t('login.error.invalidCredentials');
    }
    
    // Usuario ya existe
    if (message.includes('User already registered')) {
      return t('login.error.userExists');
    }
    
    // Email inválido
    if (message.includes('Invalid email')) {
      return t('login.error.invalidEmail');
    }
    
    // Contraseña muy corta
    if (message.includes('Password should be at least')) {
      return t('login.error.passwordTooShort');
    }
    
    return message || t('login.error.generic');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(''); // Limpiar error anterior

    try {
      await signIn(loginEmail, loginPassword);
      showSuccess(t('login.success'));
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = getErrorMessage(err);
      setErrorMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir que se propague al formulario padre
    setResetLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar reseteo de contraseña');
      }

      showSuccess('Si el correo existe, recibirás un enlace para restablecer tu contraseña');
      setResetDialogOpen(false);
      setResetEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      showError(err.message || 'Error al solicitar reseteo de contraseña');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Main card */}
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Theme toggle and language selector */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 border border-border/50 transition-all"
                >
                  <Languages className="h-5 w-5 text-foreground" />
                  <span className="sr-only">{t('login.changeLanguage')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                  🇪🇸 Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 border border-border/50 transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
              <span className="sr-only">{t('login.changeTheme')}</span>
            </Button>
          </div>

          {/* Gradient header */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            
            <div className="relative">
              {/* Logo/Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                    <Sparkles className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('login.title')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground/80">
                {t('login.subtitle')}
              </p>
            </div>
          </div>

          {/* Form section */}
          <div className="p-6 sm:p-8">
            {/* Error Alert */}
            {errorMessage && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  {t('login.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setErrorMessage(''); // Limpiar error al escribir
                    }}
                    required
                    className={`h-12 pl-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all ${
                      errorMessage ? 'border-destructive/50' : ''
                    }`}
                  />
                </div>
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setErrorMessage(''); // Limpiar error al escribir
                    }}
                    required
                    className={`h-12 pl-11 pr-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all ${
                      errorMessage ? 'border-destructive/50' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    </span>
                  </Button>
                </div>
                <div className="text-right">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                      <DialogHeader>
                        <DialogTitle>Restablecer contraseña</DialogTitle>
                        <DialogDescription>
                          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <form 
                        onSubmit={handlePasswordReset} 
                        className="space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Correo electrónico</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="tu@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              className="pl-11"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setResetDialogOpen(false);
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={resetLoading}
                            className="flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>{t('login.signingIn')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>{t('login.button')}</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {t('login.noAccount')}
              </p>
              <a 
                href={`${baseUrl}/register`}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                {t('login.createAccount')}
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 text-center">
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('login.needHelp')}
              </p>
              <a
                href="https://wa.me/13059227437"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>+1 (305) 922-7437</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  );
}

















