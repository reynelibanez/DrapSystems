import { ChangePasswordForm } from './shared/ChangePasswordForm';

interface ResetPasswordWrapperProps {
  token: string;
}

export function ResetPasswordWrapper({ token }: ResetPasswordWrapperProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Restablecer Contraseña</h1>
        <p className="text-white/80">Ingresa tu nueva contraseña</p>
      </div>
      
      <ChangePasswordForm
        token={token}
        title="Nueva Contraseña"
        description="Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres."
        showNote={true}
      />
    </div>
  );
}
