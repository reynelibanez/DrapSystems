import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { baseUrl } from '@/lib/base-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface ChangePasswordFormProps {
  token?: string; // Si viene de email reset
  onSuccess?: () => void;
  title?: string;
  description?: string;
  showNote?: boolean;
}

export function ChangePasswordForm({ 
  token, 
  onSuccess,
  title,
  description,
  showNote = true
}: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const defaultTitle = t('changePassword');
  const defaultDescription = t('changePasswordDescription');

  // Update password strength in real-time
  useEffect(() => {
    if (newPassword) {
      setPasswordStrength({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
      });
    } else {
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
    }
  }, [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: t('completeRequiredFields') });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') });
      setLoading(false);
      return;
    }

    // Validar requisitos de contraseña segura
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: t('passwordMinLength8') });
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setMessage({ type: 'error', text: t('passwordNeedsUppercase') });
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setMessage({ type: 'error', text: t('passwordNeedsLowercase') });
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setMessage({ type: 'error', text: t('passwordNeedsNumber') });
      setLoading(false);
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setMessage({ type: 'error', text: t('passwordNeedsSpecial') });
      setLoading(false);
      return;
    }

    try {
      // Si viene de email reset, usar el token
      if (token) {
        // Validar el token primero
        const validateResponse = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!validateResponse.ok) {
          const error = await validateResponse.json();
          throw new Error(error.error || t('invalidOrExpiredToken'));
        }

        // Resetear la contraseña
        const resetResponse = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });

        if (!resetResponse.ok) {
          const error = await resetResponse.json();
          throw new Error(error.error || t('errorChangingPassword'));
        }

        setMessage({ 
          type: 'success', 
          text: t('passwordUpdatedRedirecting')
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          window.location.href = `${baseUrl}/`;
        }, 2000);
      } else {
        // Cambio de contraseña desde perfil (usuario autenticado)
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        setMessage({ 
          type: 'success', 
          text: t('passwordUpdatedSuccessfully')
        });
        setNewPassword('');
        setConfirmPassword('');

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `${t('errorChangingPassword')}: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const allRequirementsMet = Object.values(passwordStrength).every(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || defaultTitle}</CardTitle>
        <CardDescription>{description || defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')} *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('minCharacters', { count: 8 })}
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showNewPassword ? t('hidePassword') : t('showPassword')}
                </span>
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('passwordRequirements')}:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordStrength.length ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {passwordStrength.length && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordStrength.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                      {t('atLeast8Characters')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordStrength.uppercase ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {passwordStrength.uppercase && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordStrength.uppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                      {t('oneUppercaseLetter')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordStrength.lowercase ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {passwordStrength.lowercase && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordStrength.lowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                      {t('oneLowercaseLetter')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordStrength.number ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {passwordStrength.number && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordStrength.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                      {t('oneNumber')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordStrength.special ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {passwordStrength.special && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordStrength.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                      {t('oneSpecialCharacter')}
                    </span>
                  </div>
                </div>
                
                {/* Overall strength bar */}
                <div className="pt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
                      const isActive = level <= strengthCount;
                      let bgColor = 'bg-muted';
                      
                      if (isActive) {
                        if (strengthCount <= 2) bgColor = 'bg-red-500';
                        else if (strengthCount <= 3) bgColor = 'bg-orange-500';
                        else if (strengthCount <= 4) bgColor = 'bg-yellow-500';
                        else bgColor = 'bg-green-500';
                      }
                      
                      return (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${bgColor}`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allRequirementsMet
                      ? `✓ ${t('securePassword')}`
                      : `${Object.values(passwordStrength).filter(Boolean).length}/5 ${t('requirementsMet')}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmNewPassword')} *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('repeatNewPassword')}
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? t('hidePassword') : t('showPassword')}
                </span>
              </Button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">
                {t('passwordsDoNotMatch')}
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && allRequirementsMet && (
              <p className="text-xs text-green-600">
                ✓ {t('passwordsMatch')}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !allRequirementsMet}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{t('changingPassword')}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t('changePassword')}
                </>
              )}
            </Button>
          </div>

          {showNote && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t('note')}:</strong> {token 
                  ? t('passwordChangeNoteWithToken')
                  : t('passwordChangeNoteWithoutToken')
                }
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}





