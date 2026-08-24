import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Settings, Save, CreditCard, Building2, MapPin, Phone, Mail, Upload, X, Image as ImageIcon } from 'lucide-react';
import { ServicesSubscriptionPlans } from './ServicesSubscriptionPlans';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface ServicesBusinessSettingsProps {
  business: Business | null;
  onUpdate: () => void;
  initialTab?: string;
}

export function ServicesBusinessSettings({ business, onUpdate, initialTab = 'info' }: ServicesBusinessSettingsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [moduleSubscription, setModuleSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Validar que business existe
  if (!business) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{t('loadingBusinessInfo')}</p>
        </CardContent>
      </Card>
    );
  }

  const [formData, setFormData] = useState({
    name: business.name || '',
    description: business.description || '',
    email: business.email || '',
    phone: business.phone || '',
    address: business.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(business.logo_url || '');

  // Cargar suscripción del módulo de servicios
  useEffect(() => {
    const loadModuleSubscription = async () => {
      if (!business?.id) return;
      
      setLoadingSubscription(true);
      try {
        const { data, error } = await supabase
          .from('module_subscriptions')
          .select('*')
          .eq('business_id', business.id)
          .eq('module_name', 'services')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading module subscription:', error);
        } else if (data) {
          setModuleSubscription(data);
          console.log('📦 Suscripción del módulo de servicios cargada:', data);
        } else {
          console.log('📦 No hay suscripción del módulo de servicios, usando plan gratuito');
          setModuleSubscription(null);
        }
      } catch (error) {
        console.error('Error loading module subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadModuleSubscription();
  }, [business?.id]);

  // Actualizar estados cuando cambie el business prop
  useEffect(() => {
    if (business) {
      setLogoPreview(business.logo_url || '');
      setFormData({
        name: business.name || '',
        description: business.description || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert(t('selectValidImageFile'));
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('fileTooLarge'));
      return;
    }

    setLogoFile(file);
    
    // Crear vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser();
      console.log('=== DIAGNÓSTICO DE ACTUALIZACIÓN ===');
      console.log('Usuario autenticado:', user?.id);
      console.log('Business ID:', business.id);
      
      // Verificar perfil del usuario ANTES de intentar actualizar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, business_id, email')
        .eq('id', user?.id)
        .single();
      
      console.log('Perfil del usuario:', profile);
      console.log('Error al obtener perfil:', profileError);
      
      if (!profile) {
        toast.error('❌ No se encontró el perfil del usuario');
        throw new Error('Perfil no encontrado');
      }
      
      if (profile.business_id !== business.id) {
        toast.error('❌ El usuario no pertenece a esta empresa');
        console.error('Business ID del perfil:', profile.business_id);
        console.error('Business ID a actualizar:', business.id);
        throw new Error('Usuario no pertenece a esta empresa');
      }
      
      if (!['owner', 'admin', 'staff', 'business_owner'].includes(profile.role)) {
        toast.error('❌ El usuario no tiene permisos para actualizar (rol: ' + profile.role + ')');
        throw new Error('Rol insuficiente');
      }
      
      console.log('✅ Verificaciones pasadas - Rol:', profile.role);

      let logoUrl = business.logo_url;

      // Si hay un nuevo archivo de logo, subirlo primero
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${business.id}-${Date.now()}.${fileExt}`;
        const filePath = `business-logos/${fileName}`;

        // Subir archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error al subir logo:', uploadError);
          toast.error(t('errorUploadingLogo'));
          throw new Error(t('errorUploadingLogo'));
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('business-assets')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      // Preparar settings - mantener configuración existente
      const currentSettings = (business.settings as any) || {};

      const updateData = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        logo_url: logoUrl,
        settings: currentSettings,
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Datos a actualizar:', updateData);
      console.log('🎯 Actualizando business con ID:', business.id);

      const { data, error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business.id)
        .select()
        .single();

      if (error) {
        console.error('❌ ERROR AL ACTUALIZAR EMPRESA:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        console.error('Detalles:', error.details);
        console.error('Hint:', error.hint);
        
        // Mostrar error más específico
        if (error.code === 'PGRST116') {
          toast.error('❌ Error de permisos RLS. Ejecuta FIX_RLS_COMPLETO.sql en Supabase');
          console.error('🔧 SOLUCIÓN: Ejecuta el archivo FIX_RLS_COMPLETO.sql en el SQL Editor de Supabase');
          console.error('📍 El archivo está en la raíz del proyecto');
        } else if (error.code === '42501') {
          toast.error('❌ Permisos insuficientes en la base de datos');
        } else {
          toast.error(error.message || t('errorUpdatingSettings'));
        }
        throw error;
      }

      console.log('✅ Empresa actualizada exitosamente:', data);
      toast.success(t('settingsUpdatedSuccessfully'));
      onUpdate();
    } catch (error: any) {
      console.error('💥 Error updating business:', error);
      // No mostrar alert adicional si ya mostramos toast
      if (!error.message?.includes('permisos') && !error.code) {
        toast.error(error.message || t('errorUpdatingSettings'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">
          <Building2 className="w-4 h-4 mr-2" />
          {t('information')}
        </TabsTrigger>
        <TabsTrigger value="subscription">
          <CreditCard className="w-4 h-4 mr-2" />
          {t('subscription')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('businessInformation')}
            </CardTitle>
            <CardDescription>
              {t('updateBusinessInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label>{t('businessLogo')}</Label>
                <div className="flex items-start gap-4">
                  {/* Vista previa del logo */}
                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-border overflow-hidden">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Botones de carga */}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('uploadBusinessLogo')}
                    </p>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                          <Upload className="w-4 h-4" />
                          {t('uploadImage')}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('businessName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('businessEmail')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="empresa@ejemplo.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('businessPhone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('businessAddress')}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-10"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle Principal 123"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('businessDescription')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder={t('describeYourBusiness')}
                />
              </div>

              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? t('saving') : t('saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subscription" className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('changePlan')}</h3>
          {loadingSubscription ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">{t('loading')}...</p>
              </CardContent>
            </Card>
          ) : (
            <ServicesSubscriptionPlans
              businessId={business.id}
              currentPlan={moduleSubscription?.plan_type || 'free'}
              currentStatus={moduleSubscription?.status || 'inactive'}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}





