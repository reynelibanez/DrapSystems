import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { baseUrl } from '../../lib/base-url';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Check } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserFormProps {
  user?: Profile | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isAdmin?: boolean;
  businessId?: string;
}

interface UserFormData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  business_id?: string;
  address?: string;
  password?: string;
  avatar_url?: string;
}

export function UserForm({ user, onSuccess, onCancel, isAdmin = false, businessId }: UserFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  
  const [formData, setFormData] = useState<UserFormData>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || (isAdmin ? 'staff' : 'staff'), // Siempre staff por defecto
    business_id: user?.business_id || businessId || '',
    address: user?.address || '',
    password: '',
    avatar_url: user?.avatar_url || ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadBusinesses();
    }
  }, [isAdmin]);

  // Update password strength in real-time
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength({
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password),
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
  }, [formData.password]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (user) {
        // Editar usuario existente usando el endpoint API
        const updateData: any = {
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          business_id: formData.business_id || null,
          address: formData.address || null,
          avatar_url: formData.avatar_url || null
        };

        console.log('Updating user via API:', user.id, 'with data:', updateData);

        // Obtener el token de sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error(t('errors.notAuthenticated'));
        }

        const response = await fetch(`${baseUrl}/api/admin/update-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Update error:', result);
          throw new Error(result.error || t('errors.updateUser'));
        }

        console.log('User updated successfully via API:', result);
        setSuccess(true);
        
        // Esperar un momento para mostrar el mensaje de éxito
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1000);
      } else {
        // Crear nuevo usuario usando el endpoint de admin
        if (!formData.password || formData.password.length < 8) {
          throw new Error(t('register.passwordMinLength8'));
        }

        // Validar complejidad de contraseña
        if (!passwordStrength.uppercase) {
          throw new Error(t('register.passwordNeedsUppercase'));
        }
        if (!passwordStrength.lowercase) {
          throw new Error(t('register.passwordNeedsLowercase'));
        }
        if (!passwordStrength.number) {
          throw new Error(t('register.passwordNeedsNumber'));
        }
        if (!passwordStrength.special) {
          throw new Error(t('register.passwordNeedsSpecial'));
        }

        // Obtener el token de sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error(t('errors.notAuthenticated'));
        }

        const response = await fetch(`${baseUrl}/api/admin/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: formData.role,
            business_id: businessId || formData.business_id || null,
            address: formData.address || null,
            avatar_url: formData.avatar_url || null
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || t('errors.createUser'));
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || t('errors.saveUser'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">{t('users.fullName')} *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder={t('users.fullNamePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t('users.profilePhoto')}</Label>
        <ImageUpload
          currentImageUrl={formData.avatar_url}
          onImageUploaded={(url) => setFormData({ ...formData, avatar_url: url })}
          bucket="avatars"
          folder="users"
          maxSizeMB={2}
        />
        <p className="text-xs text-muted-foreground">
          {t('users.profilePhotoHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('users.email')} *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder={t('users.emailPlaceholder')}
          required
          disabled={!!user}
        />
        {user && (
          <p className="text-xs text-muted-foreground">
            {t('users.emailCannotBeModified')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('users.phone')}</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder={t('users.phonePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t('users.address')}</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder={t('users.addressPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t('users.role')} *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          disabled={!!user}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {isAdmin && <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>}
            {isAdmin && <SelectItem value="business_owner">{t('users.roles.business_owner')}</SelectItem>}
            <SelectItem value="staff">{t('users.roles.staff')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {user 
            ? t('users.roleCannotBeModified')
            : isAdmin 
              ? t('users.clientsCreatedSeparately')
              : 'Solo puedes crear usuarios con rol "Staff" para tu empresa'
          }
        </p>
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="business_id">{t('users.business')}</Label>
          <Select
            value={formData.business_id || "none"}
            onValueChange={(value) => setFormData({ ...formData, business_id: value === "none" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('users.selectBusinessOptional')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('users.noBusiness')}</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">{t('users.password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('users.passwordPlaceholder')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('minCharacters', { count: 8 })}
          </p>
          
          {formData.password && (
            <div className="space-y-2 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      passwordStrength.length ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    {passwordStrength.length && (
                      <Check className="h-1.5 w-1.5 text-white" />
                    )}
                  </div>
                  <span className={passwordStrength.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {t('register.atLeast8Characters')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      passwordStrength.uppercase ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    {passwordStrength.uppercase && (
                      <Check className="h-1.5 w-1.5 text-white" />
                    )}
                  </div>
                  <span className={passwordStrength.uppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {t('register.oneUppercaseLetter')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      passwordStrength.lowercase ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    {passwordStrength.lowercase && (
                      <Check className="h-1.5 w-1.5 text-white" />
                    )}
                  </div>
                  <span className={passwordStrength.lowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {t('register.oneLowercaseLetter')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      passwordStrength.number ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    {passwordStrength.number && (
                      <Check className="h-1.5 w-1.5 text-white" />
                    )}
                  </div>
                  <span className={passwordStrength.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {t('register.oneNumber')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      passwordStrength.special ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    {passwordStrength.special && (
                      <Check className="h-1.5 w-1.5 text-white" />
                    )}
                  </div>
                  <span className={passwordStrength.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {t('register.oneSpecialCharacter')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {user ? t('users.userUpdatedSuccess') : t('users.userCreatedSuccess')}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? t('common.saving') : user ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}









