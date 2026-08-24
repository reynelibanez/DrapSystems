import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, ArrowLeft, CheckCircle2, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { baseUrl } from '../lib/base-url';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el correo');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>¡Contraseña Temporal Enviada!</CardTitle>
          <CardDescription>
            Revisa tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Hemos enviado una contraseña temporal a <strong>{email}</strong>
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Próximos pasos:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Revisa tu correo electrónico</li>
                <li>Copia la contraseña temporal</li>
                <li>Inicia sesión con tu email y la contraseña temporal</li>
                <li>Cambia tu contraseña desde tu perfil</li>
              </ol>
            </div>
            
            <div className="text-center pt-2">
              <p className="font-medium mb-2">¿No recibiste el correo?</p>
              <ul className="list-disc list-inside text-left space-y-1">
                <li>Revisa tu carpeta de spam</li>
                <li>Verifica que el email sea correcto</li>
                <li>Espera unos minutos</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
            >
              Enviar de Nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>¿Olvidaste tu Contraseña?</CardTitle>
        <CardDescription>
          Ingresa tu email y te enviaremos una contraseña temporal
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>ℹ️ Nota:</strong> Recibirás una contraseña temporal por correo. Podrás cambiarla después de iniciar sesión.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enviando...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Enviar Contraseña
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

