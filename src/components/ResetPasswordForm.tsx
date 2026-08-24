import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { baseUrl } from '../lib/base-url';

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token: initialToken }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  
  const [token, setToken] = useState<string>(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Extraer token de la URL si no llegó vía props
  useEffect(() => {
    let activeToken = initialToken;
    if (!activeToken && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      activeToken = params.get('token') || '';
    }

    setToken(activeToken || '');

    if (activeToken) {
      validateToken(activeToken);
    } else {
      setError(t('invalidToken') || 'Token no proporcionado');
      setTokenValid(false);
      setValidatingToken(false);
    }
  }, [initialToken]);

  const validateToken = async (currentToken: string) => {
    try {
      const apiBaseUrl = baseUrl || '';
      const response = await fetch(`${apiBaseUrl}/api/auth/validate-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: currentToken }),
      });

      const data = await response.json();
      setTokenValid(data.valid);
      
      if (!data.valid) {
        setError(data.error || t('tokenExpiredOrInvalid') || 'Token inválido o expirado');
      }
    } catch (err) {
      setError(t('errorValidatingToken') || 'Error al validar el token');
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push(t('passwordMinLength') || 'Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push(t('passwordUppercase') || 'Al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push(t('passwordLowercase') || 'Al menos una letra minúscula');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push(t('passwordNumber') || 'Al menos un número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push(t('passwordSpecialChar') || 'Al menos un carácter especial (!@#$%^&*)');
    }
    
    return errors;
  };

  const safeRedirect = (path: string) => {
    const targetUrl = `${baseUrl || ''}${path}`;
    if (typeof window !== 'undefined') {
      if (window.top && window.top !== window.self) {
        window.top.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseña
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = baseUrl || '';
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorResettingPassword') || 'Error al restablecer la contraseña');
      }

      setSuccess(true);
      
      // Redirigir fuera de iframe tras 3 segundos
      setTimeout(() => {
        safeRedirect('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('errorProcessingRequest') || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('validatingToken') || 'Validando token...'}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>{t('invalidToken') || 'Enlace inválido'}</CardTitle>
          <CardDescription>
            {t('tokenExpiredOrInvalid') || 'El enlace de recuperación ha expirado o no es válido.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => safeRedirect('/')}
          >
            {t('backToLogin') || 'Volver al inicio de sesión'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>{t('passwordChanged') || '¡Contraseña actualizada!'}</CardTitle>
          <CardDescription>
            {t('passwordChangedSuccessfully') || 'Tu contraseña ha sido restablecida correctamente.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              {t('redirectingToLogin') || 'Redirigiendo al inicio de sesión en unos segundos...'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{t('resetPassword') || 'Restablecer contraseña'}</CardTitle>
        <CardDescription>
          {t('enterNewPassword') || 'Ingresa tu nueva contraseña para acceder a tu cuenta.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{t('newPassword') || 'Nueva contraseña'}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('passwordRequirements') || 'Debe incluir 8+ caracteres, mayúscula, minúscula, número y símbolo.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword') || 'Confirmar contraseña'}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('resetting') || 'Guardando...'}
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {t('resetPassword') || 'Restablecer contraseña'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ResetPasswordForm;