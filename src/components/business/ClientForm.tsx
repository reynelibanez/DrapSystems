import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2, CreditCard, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { ImageUpload } from '../shared/ImageUpload';
import { createClient, updateClient, type ClientWithStats } from '../../lib/api/clients';
import { toast } from 'sonner';

// Validación de contraseña segura
const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

// Lista de prefijos de países más comunes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+1-809', country: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
  { code: '+1-787', country: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
];

const clientSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  preferred_language: z.enum(['es', 'en']).default('es'),
  date_of_birth: z.string().optional().refine((date) => {
    if (!date) return true; // Opcional, si no hay fecha es válido
    
    const birthDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    // Verificar que sea una fecha válida
    if (isNaN(birthDate.getTime())) {
      return false;
    }
    
    // No puede ser fecha futura
    if (birthDate > today) {
      return false;
    }
    
    // Debe tener al menos 1 año
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (birthDate > oneYearAgo) {
      return false;
    }
    
    // No puede ser más de 150 años atrás (fecha razonable)
    const maxYearsAgo = new Date();
    maxYearsAgo.setFullYear(today.getFullYear() - 150);
    
    if (birthDate < maxYearsAgo) {
      return false;
    }
    
    return true;
  }, (date) => {
    if (!date) return { message: '' };
    
    const birthDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar que sea una fecha válida
    if (isNaN(birthDate.getTime())) {
      return { message: 'Fecha de nacimiento inválida' };
    }
    
    // No puede ser fecha futura
    if (birthDate > today) {
      return { message: 'La fecha de nacimiento no puede ser futura' };
    }
    
    // Debe tener al menos 1 año
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (birthDate > oneYearAgo) {
      return { message: 'El cliente debe tener al menos 1 año de edad' };
    }
    
    // No puede ser más de 150 años atrás
    const maxYearsAgo = new Date();
    maxYearsAgo.setFullYear(today.getFullYear() - 150);
    
    if (birthDate < maxYearsAgo) {
      return { message: 'La fecha de nacimiento no puede ser anterior a 150 años' };
    }
    
    return { message: 'Fecha de nacimiento inválida' };
  }),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  is_active: z.boolean().default(true),
  avatar_url: z.string().optional(),
  password: z.string().optional(),
  // Campos de pago
  bank_name: z.string().optional(),
  account_holder: z.string().optional(),
  account_number: z.string().optional(),
  routing_number: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'other', '']).optional(),
  payment_notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  client?: ClientWithStats | null;
  onSuccess: () => void;
}

export function ClientForm({ open, onOpenChange, businessId, client, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const isEditing = !!client;
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      preferred_language: 'es',
      date_of_birth: '',
      address: '',
      city: '',
      postal_code: '',
      notes: '',
      tags: '',
      is_active: true,
      avatar_url: '',
      password: '',
      bank_name: '',
      account_holder: '',
      account_number: '',
      routing_number: '',
      payment_method: '',
      payment_notes: '',
    },
  });

  const isActive = watch('is_active');
  const paymentMethod = watch('payment_method');
  const password = watch('password');
  const dateOfBirth = watch('date_of_birth');
  const preferredLanguage = watch('preferred_language');

  // Validar requisitos de contraseña en tiempo real
  const passwordRequirements = {
    minLength: password ? password.length >= 8 : false,
    hasUpperCase: password ? /[A-Z]/.test(password) : false,
    hasLowerCase: password ? /[a-z]/.test(password) : false,
    hasNumber: password ? /[0-9]/.test(password) : false,
    hasSpecialChar: password ? /[^A-Za-z0-9]/.test(password) : false,
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  // Validar fecha de nacimiento en tiempo real
  const validateDateOfBirth = (date: string | undefined) => {
    if (!date) return { isValid: true, message: '' };
    
    const birthDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar que sea una fecha válida
    if (isNaN(birthDate.getTime())) {
      return { isValid: false, message: t('invalidDate') || 'Fecha inválida' };
    }
    
    // No puede ser fecha futura
    if (birthDate > today) {
      return { isValid: false, message: t('dateCannotBeFuture') || 'La fecha no puede ser futura' };
    }
    
    // Debe tener al menos 1 año
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (birthDate > oneYearAgo) {
      return { isValid: false, message: t('clientMustBeAtLeast1Year') || 'El cliente debe tener al menos 1 año' };
    }
    
    // No puede ser más de 150 años atrás
    const maxYearsAgo = new Date();
    maxYearsAgo.setFullYear(today.getFullYear() - 150);
    
    if (birthDate < maxYearsAgo) {
      return { isValid: false, message: t('dateCannotBeBefore150Years') || 'La fecha no puede ser anterior a 150 años' };
    }
    
    return { isValid: true, message: '' };
  };

  const dateValidation = validateDateOfBirth(dateOfBirth);

  useEffect(() => {
    console.log('ClientForm useEffect - cliente recibido:', client);
    console.log('ClientForm useEffect - open:', open);
    
    if (open && client) {
      console.log('Cargando datos del cliente en el formulario...');
      console.log('Avatar URL del cliente:', client.avatar_url);
      console.log('Fecha de nacimiento del cliente:', client.date_of_birth);
      console.log('Banco:', client.bank_name);
      console.log('Método de pago:', client.payment_method);
      console.log('Teléfono completo:', client.phone);
      
      // Formatear la fecha para el input type="date" (YYYY-MM-DD)
      let formattedDate = '';
      if (client.date_of_birth) {
        try {
          const date = new Date(client.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formateando fecha:', e);
        }
      }
      
      console.log('Fecha formateada:', formattedDate);
      
      // Extraer prefijo de país del teléfono
      let extractedCountryCode = '+1';
      let phoneNumber = client.phone || '';
      
      if (client.phone) {
        // Buscar el prefijo más largo que coincida
        const matchingCode = COUNTRY_CODES.find(cc => client.phone?.startsWith(cc.code));
        if (matchingCode) {
          extractedCountryCode = matchingCode.code;
          phoneNumber = client.phone.substring(matchingCode.code.length).trim();
          console.log('Prefijo extraído:', extractedCountryCode);
          console.log('Número sin prefijo:', phoneNumber);
        }
      }
      
      setCountryCode(extractedCountryCode);
      
      console.log('🔍 DEBUG - Cliente completo:', client);
      
      const formData = {
        full_name: client.full_name || '',
        email: client.email || '',
        phone: phoneNumber,
        preferred_language: (client.preferred_language || 'es') as 'es' | 'en',
        date_of_birth: formattedDate,
        address: client.address || '',
        city: client.city || '',
        postal_code: client.postal_code || '',
        notes: client.notes || '',
        tags: client.tags?.join(', ') || '',
        is_active: client.is_active ?? true,
        avatar_url: client.avatar_url || '',
        password: '',
        bank_name: client.bank_name || '',
        account_holder: client.account_holder || '',
        account_number: client.account_number || '',
        routing_number: client.routing_number || '',
        payment_method: client.payment_method || '',
        payment_notes: client.payment_notes || '',
      };
      
      console.log('Datos a cargar en el formulario:', formData);
      console.log('Idioma preferido del cliente:', formData.preferred_language);
      
      // Usar reset para cargar todos los datos inmediatamente
      reset(formData);
      
      // Establecer el avatar
      const avatarToSet = client.avatar_url || '';
      console.log('Estableciendo avatar URL:', avatarToSet);
      setAvatarUrl(avatarToSet);
    } else if (open && !client) {
      console.log('Formulario abierto sin cliente (modo crear), reseteando...');
      reset({
        full_name: '',
        email: '',
        phone: '',
        preferred_language: 'es',
        date_of_birth: '',
        address: '',
        city: '',
        postal_code: '',
        notes: '',
        tags: '',
        is_active: true,
        avatar_url: '',
        password: '',
        bank_name: '',
        account_holder: '',
        account_number: '',
        routing_number: '',
        payment_method: '',
        payment_notes: '',
      });
      setAvatarUrl('');
      setCountryCode('+1'); // Reset al código por defecto
    }
  }, [client, open, reset, setValue]);

  const handleImageUploaded = (url: string) => {
    setAvatarUrl(url);
    setValue('avatar_url', url);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true);

      // Validar contraseña solo cuando sea necesario
      if (!isEditing || (isEditing && showPasswordChange)) {
        if (!data.password) {
          toast.error(t('passwordRequired') || 'La contraseña es requerida');
          setLoading(false);
          return;
        }
        
        // Validar que cumpla con los requisitos de seguridad
        try {
          passwordSchema.parse(data.password);
        } catch (error: any) {
          const errorMessage = error.errors?.[0]?.message || 'La contraseña no cumple con los requisitos de seguridad';
          toast.error(errorMessage);
          setLoading(false);
          return;
        }
      }

      // Procesar tags
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const clientData: any = {
        business_id: businessId,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone ? `${countryCode}${data.phone}` : null,
        preferred_language: data.preferred_language || 'es',
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        notes: data.notes || null,
        tags: tags.length > 0 ? tags : null,
        is_active: data.is_active,
        avatar_url: avatarUrl || null,
        bank_name: data.bank_name || null,
        account_holder: data.account_holder || null,
        account_number: data.account_number || null,
        routing_number: data.routing_number || null,
        payment_method: data.payment_method || null,
        payment_notes: data.payment_notes || null,
      };
      
      console.log('🔍 DEBUG SUBMIT - preferred_language del form:', data.preferred_language);
      console.log('🔍 DEBUG SUBMIT - preferred_language en clientData:', clientData.preferred_language);
      console.log('🔍 DEBUG SUBMIT - Tipo de preferred_language:', typeof clientData.preferred_language);
      console.log('🔍 DEBUG SUBMIT - Valor exacto:', JSON.stringify(clientData.preferred_language));

      // Hashear contraseña con bcrypt si se proporciona
      if (!isEditing && data.password) {
        // Nuevo cliente: hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        clientData.password_hash = hashedPassword;
        console.log('Contraseña hasheada para nuevo cliente');
      } else if (isEditing && showPasswordChange && data.password) {
        // Cliente existente: solo actualizar si el switch está activado y hay nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        clientData.password_hash = hashedPassword;
        console.log('Contraseña hasheada para actualización de cliente');
      }

      let result;

      console.log('=== DATOS DEL FORMULARIO ===');
      console.log('Datos raw del formulario:', data);
      console.log('Avatar URL actual:', avatarUrl);
      console.log('=== DATOS A ENVIAR ===');
      console.log('Cliente completo:', JSON.stringify({...clientData, password_hash: clientData.password_hash ? '[HASH]' : undefined}, null, 2));
      console.log('Campos con valor:');
      Object.entries(clientData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const displayValue = key === 'password_hash' ? '[HASH]' : (typeof value === 'object' ? JSON.stringify(value) : value);
          console.log(`  ${key}: ${displayValue}`);
        }
      });
      console.log('Campos vacíos/null:');
      Object.entries(clientData).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          console.log(`  ${key}: ${value}`);
        }
      });

      if (isEditing) {
        console.log('=== ACTUALIZANDO CLIENTE ===');
        console.log('ID del cliente:', client.id);
        const result = await updateClient(client.id, clientData);
        console.log('Cliente actualizado exitosamente:', result);
        toast.success(t('clientUpdatedSuccessfully'));
      } else {
        console.log('=== CREANDO NUEVO CLIENTE ===');
        const result = await createClient(clientData);
        console.log('Cliente creado exitosamente:', result);
        toast.success(t('clientCreatedSuccessfully'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('=== ERROR AL GUARDAR CLIENTE ===');
      console.error('Error completo:', error);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);
      console.error('Code:', error.code);
      toast.error(`${t('error')}: ${error.message || t('unknownErrorSavingClient')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editClient') : t('newClient')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('profilePhoto')}</h3>
            <ImageUpload
              currentImageUrl={avatarUrl}
              onImageUploaded={handleImageUploaded}
              bucket="avatars"
              folder={`clients/${businessId}`}
            />
          </div>

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('personalInformation')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {t('fullName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder={t('fullNamePlaceholder')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder={t('emailPlaceholder')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Campo de contraseña para nuevo cliente */}
              {!isEditing && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">
                    {t('password')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder={t('passwordPlaceholder') || 'Mínimo 8 caracteres'}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Requisitos de contraseña */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('passwordRequirements') || 'Requisitos de contraseña:'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        {passwordRequirements.minLength ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {t('minLength8') || 'Mínimo 8 caracteres'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasUpperCase ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {t('oneUpperCase') || 'Una letra mayúscula'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasLowerCase ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {t('oneLowerCase') || 'Una letra minúscula'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasNumber ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {t('oneNumber') || 'Un número'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        {passwordRequirements.hasSpecialChar ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {t('oneSpecialChar') || 'Un carácter especial (!@#$%^&*)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('passwordForClientAccess') || 'Contraseña para que el cliente pueda acceder al sistema'}
                  </p>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              )}

              {/* Opción para cambiar contraseña al editar */}
              {isEditing && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="change-password" className="text-base">
                        {t('changePassword') || 'Cambiar contraseña'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('changePasswordDescription') || 'Actualizar la contraseña de acceso del cliente'}
                      </p>
                    </div>
                    <Switch
                      id="change-password"
                      checked={showPasswordChange}
                      onCheckedChange={setShowPasswordChange}
                    />
                  </div>
                  
                  {showPasswordChange && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="password">
                        {t('newPassword') || 'Nueva contraseña'} <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          placeholder={t('passwordPlaceholder') || 'Mínimo 8 caracteres'}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Requisitos de contraseña */}
                      <div className="space-y-2 p-3 bg-background rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('passwordRequirements') || 'Requisitos de contraseña:'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            {passwordRequirements.minLength ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {t('minLength8') || 'Mínimo 8 caracteres'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasUpperCase ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-xs ${passwordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {t('oneUpperCase') || 'Una letra mayúscula'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasLowerCase ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-xs ${passwordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {t('oneLowerCase') || 'Una letra minúscula'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasNumber ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {t('oneNumber') || 'Un número'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            {passwordRequirements.hasSpecialChar ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {t('oneSpecialChar') || 'Un carácter especial (!@#$%^&*)'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {t('leaveEmptyToKeep') || 'La contraseña actual se mantendrá si no ingresas una nueva'}
                      </p>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={countryCode}
                    onValueChange={setCountryCode}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRY_CODES.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          <div className="flex items-center gap-2">
                            <span>{cc.flag}</span>
                            <span className="font-mono text-sm">{cc.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder={t('phonePlaceholder') || '1234567890'}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('phoneWillBeSaved') || `Se guardará como: ${countryCode}${watch('phone') || ''}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">{t('preferredLanguage')}</Label>
                <Select
                  key={`lang-${preferredLanguage}`}
                  value={preferredLanguage}
                  onValueChange={(value) => setValue('preferred_language', value as 'es' | 'en')}
                >
                  <SelectTrigger id="preferred_language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <span>🇪🇸</span>
                        <span>{t('spanish')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>{t('english')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('preferredLanguageDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">{t('dateOfBirth')}</Label>
                <div className="relative">
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register('date_of_birth')}
                    className={dateOfBirth && !dateValidation.isValid ? 'border-destructive' : dateOfBirth && dateValidation.isValid ? 'border-green-500' : ''}
                  />
                  {dateOfBirth && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {dateValidation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {dateOfBirth && !dateValidation.isValid && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {dateValidation.message}
                  </p>
                )}
                {dateOfBirth && dateValidation.isValid && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('validDate') || 'Fecha válida'}
                  </p>
                )}
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('address')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder={t('addressPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('city')}</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder={t('cityPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">{t('postalCode')}</Label>
                <Input
                  id="postal_code"
                  {...register('postal_code')}
                  placeholder={t('postalCodePlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Notas y Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('additionalInformation')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder={t('notesPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{t('tags')}</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder={t('tagsPlaceholder')}
              />
              <p className="text-sm text-muted-foreground">
                {t('separateTagsWithCommas')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">{t('activeClient')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('inactiveClientsNotInSearch')}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>
          </div>

          {/* Información de Pago */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-lg font-semibold">{t('paymentInformation')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">{t('preferredPaymentMethod')}</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setValue('payment_method', value as any)}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder={t('selectMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('cash')}</SelectItem>
                    <SelectItem value="card">{t('card')}</SelectItem>
                    <SelectItem value="transfer">{t('transfer')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos para Tarjeta */}
              {paymentMethod === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_holder">{t('cardholderName')}</Label>
                    <Input
                      id="account_holder"
                      {...register('account_holder')}
                      placeholder={t('cardholderNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">{t('lastFourDigits')}</Label>
                    <Input
                      id="account_number"
                      {...register('account_number')}
                      placeholder="****1234"
                      maxLength={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('onlyLastFourDigits')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_name">{t('cardType')}</Label>
                    <Input
                      id="bank_name"
                      {...register('bank_name')}
                      placeholder={t('cardTypePlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Campos para Transferencia Bancaria */}
              {paymentMethod === 'transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">{t('bank')}</Label>
                    <Input
                      id="bank_name"
                      {...register('bank_name')}
                      placeholder={t('bankNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_holder">{t('accountHolder')}</Label>
                    <Input
                      id="account_holder"
                      {...register('account_holder')}
                      placeholder={t('accountHolderPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">{t('accountNumber')}</Label>
                    <Input
                      id="account_number"
                      {...register('account_number')}
                      placeholder="****1234"
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('secureInformation')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routing_number">{t('routingCodeSwift')}</Label>
                    <Input
                      id="routing_number"
                      {...register('routing_number')}
                      placeholder={t('routingCodePlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Notas de pago (para todos los métodos) */}
              {paymentMethod && (
                <div className="space-y-2">
                  <Label htmlFor="payment_notes">{t('paymentNotes')}</Label>
                  <Textarea
                    id="payment_notes"
                    {...register('payment_notes')}
                    placeholder={t('paymentNotesPlaceholder')}
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('saving')}...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? t('update') : t('create')} {t('client')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}




























































