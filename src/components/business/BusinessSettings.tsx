import { useState, useEffect } from 'react';
import { supabase, PLAN_FEATURES } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Settings, Save, CreditCard, Building2, Clock, MapPin, Phone, Mail, Upload, X, Image as ImageIcon, Copy, ExternalLink, Link as LinkIcon, Calendar as CalendarIcon } from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';
import type { Database } from '../../lib/database.types';
import { generateBookingLink } from '../../lib/encryption';
import { getClientBaseUrl } from '../../lib/base-url';
import { Calendar } from '../ui/calendar';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessSettingsProps {
  business: Business | null;
  onUpdate: () => void;
  initialTab?: string;
  hideBusinessHours?: boolean;
}

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
  hasLunch?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
}

export function BusinessSettings({ business, onUpdate, initialTab = 'info', hideBusinessHours = false }: BusinessSettingsProps) {
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  
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
  const [selectedPlan, setSelectedPlan] = useState(business.subscription_plan);
  const [selectedBilling, setSelectedBilling] = useState<'month' | 'year'>(business.settings?.billing_period || 'month');
  const [saving, setSaving] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(business.logo_url || '');
  const [languageKey, setLanguageKey] = useState(0); // Key to force re-render

  // Actualizar estados cuando cambie el business prop
  useEffect(() => {
    if (business) {
      // USAR SIEMPRE el billing_period guardado en settings
      // NO detectar automáticamente basado en días restantes
      const savedBilling = (business.settings as any)?.billing_period || 'month';
      
      console.log('📊 Billing cargado desde settings:', savedBilling);
      
      setSelectedPlan(business.subscription_plan);
      setSelectedBilling(savedBilling);
      setLogoPreview(business.logo_url || '');
      setFormData({
        name: business.name || '',
        description: business.description || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business, business.subscription_plan, business.settings]);

  // Force re-render when language changes
  useEffect(() => {
    setLanguageKey(prev => prev + 1);
  }, [i18n.language]);

  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(() => {
    const settings = business.settings as any;
    if (settings?.business_hours) {
      return settings.business_hours;
    }
    // Inicializar con días en inglés (se traducirán en el render)
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return dayKeys.map(dayKey => ({
      day: dayKey,
      open: '09:00',
      close: '18:00',
      closed: dayKey === 'sunday',
      hasLunch: false,
      lunchStart: '12:00',
      lunchEnd: '13:00'
    }));
  });

  // Días cerrados específicos state
  const [closedDates, setClosedDates] = useState<Date[]>(() => {
    const settings = business.settings as any;
    if (settings?.closed_dates && Array.isArray(settings.closed_dates)) {
      return settings.closed_dates.map((dateStr: string) => {
        // Parsear la fecha como YYYY-MM-DD y crear Date sin conversión UTC
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
    }
    return [];
  });

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

  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    const newHours = [...businessHours];
    
    // Si se está habilitando hasLunch, asegurar que existan valores por defecto
    if (field === 'hasLunch' && value === true) {
      newHours[index] = { 
        ...newHours[index], 
        [field]: value,
        lunchStart: newHours[index].lunchStart || '12:00',
        lunchEnd: newHours[index].lunchEnd || '13:00'
      };
    } else {
      newHours[index] = { ...newHours[index], [field]: value };
    }
    
    console.log('📝 Horarios actualizados:', newHours[index]);
    setBusinessHours(newHours);
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
      
      // Solo validar business_id si NO es admin
      if (profile.role !== 'admin' && profile.business_id !== business.id) {
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

      // Preparar settings con business_hours - asegurar que sea un objeto válido
      const currentSettings = (business.settings as any) || {};
      
      // Limpiar los horarios de almuerzo: si hasLunch es false, eliminar lunchStart y lunchEnd
      const cleanedBusinessHours = businessHours.map(hours => {
        if (!hours.hasLunch) {
          // Si no tiene almuerzo, eliminar los campos de almuerzo
          const { lunchStart, lunchEnd, ...rest } = hours;
          return rest;
        }
        // Si tiene almuerzo, asegurar que ambos campos existan
        return {
          ...hours,
          lunchStart: hours.lunchStart || '12:00',
          lunchEnd: hours.lunchEnd || '13:00'
        };
      });
      
      console.log('🍽️ Horarios de negocio a guardar:', JSON.stringify(cleanedBusinessHours, null, 2));
      
      const newSettings = {
        ...currentSettings,
        business_hours: cleanedBusinessHours,
        closed_dates: closedDates.map(date => {
          // Construir string YYYY-MM-DD usando fecha local, no UTC
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }),
        billing_period: currentSettings.billing_period || 'month'
      };

      const updateData = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        logo_url: logoUrl,
        settings: newSettings,
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Datos a actualizar:', updateData);
      console.log('🎯 Actualizando business con ID:', business.id);

      const { data, error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business.id)
        .select('*, public_booking_link')
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
      
      // Verificar y generar enlace público si no existe
      if (data) {
        console.log('🔍 Verificando enlace público...');
        console.log('Enlace actual:', data.public_booking_link);
        
        if (!data.public_booking_link) {
          console.log('⚠️ No hay enlace público, generando...');
          try {
            const publicBookingLink = generateBookingLink(business.id);
            console.log('📝 Enlace generado:', publicBookingLink);
            
            const { error: linkError } = await supabase
              .from('businesses')
              .update({ public_booking_link: publicBookingLink })
              .eq('id', business.id);

            if (linkError) {
              console.error('❌ Error saving public booking link:', linkError);
              console.error('Detalles del error:', {
                message: linkError.message,
                details: linkError.details,
                hint: linkError.hint,
                code: linkError.code
              });
              // No lanzar error, solo registrar
            } else {
              console.log('✅ Public booking link saved:', publicBookingLink);
            }
          } catch (err) {
            console.error('❌ Error generating public booking link:', err);
            // No lanzar error, solo registrar
          }
        } else {
          console.log('✅ El negocio ya tiene enlace público:', data.public_booking_link);
        }
      }
      
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

  const handleSelectPlan = (planId: string, billing: 'month' | 'year') => {
    console.log('Plan seleccionado:', planId, 'Billing:', billing);
    setSelectedPlan(planId);
    setSelectedBilling(billing);
    
    // Ejecutar el cambio de plan automáticamente
    handleChangePlanWithParams(planId, billing);
  };

  const handleChangePlanWithParams = async (planId: string, billing: 'month' | 'year') => {
    console.log('🔄 handleChangePlanWithParams llamado con:', { planId, billing });
    
    setChangingPlan(true);
    setSelectedPlan(planId);
    setSelectedBilling(billing);

    try {
      const isAdmin = profile?.role === 'admin';
      
      console.log('👤 Usuario:', { role: profile?.role, isAdmin });
      console.log('🏢 Business:', { id: business.id, currentPlan: business.subscription_plan });
      
      if (isAdmin) {
        // Admin puede cambiar directamente sin pago
        console.log('Admin cambiando plan directamente:', { planId, billing });
        
        const updatedSettings = {
          ...(business.settings as any || {}),
          billing_period: billing
        };

        // Calcular fechas de suscripción
        let subscriptionEndDate = null;
        let trialEndsAt = null;
        
        // Solo calcular fechas si NO es plan básico
        if (planId !== 'basic') {
          const now = new Date();
          
          // Si el estado actual es 'trial', establecer trial de 14 días
          if (business.subscription_status === 'trial') {
            trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
            // La suscripción termina después del trial
            subscriptionEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            // Calcular fecha de fin según el período de facturación
            if (billing === 'year') {
              // Suscripción anual: 365 días
              subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
            } else {
              // Suscripción mensual: 30 días
              subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }
          }
        }

        const { data: updatedBusiness, error } = await supabase
          .from('businesses')
          .update({
            subscription_plan: planId,
            subscription_end_date: subscriptionEndDate,
            trial_ends_at: trialEndsAt,
            settings: updatedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', business.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error actualizando plan (Admin):', error);
          throw error;
        }

        console.log('✅ Plan actualizado exitosamente:', { planId, billing, subscriptionEndDate, trialEndsAt, updatedBusiness });
        toast.success(`${t('planUpdatedSuccessfully')}. ${subscriptionEndDate ? `Vence: ${new Date(subscriptionEndDate).toLocaleDateString()}` : 'Sin fecha de vencimiento'}`);
        
        // Actualizar el estado local inmediatamente
        setSelectedPlan(planId);
        setSelectedBilling(billing);
        
        if (onUpdate) {
          onUpdate();
        }
      } else {
        // Para otros usuarios, redirigir a Stripe
        console.log('👤 Usuario no-admin, procesando con Stripe...');
        
        if (planId === 'basic') {
          console.log('📝 Activando plan básico (trial)...');
          // Activar trial
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 30);

          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_plan: 'basic',
              subscription_status: 'trial',
              trial_ends_at: trialEndsAt.toISOString(),
              settings: {
                ...(business.settings as any || {}),
                billing_period: billing
              }
            })
            .eq('id', business.id);

          if (!error) {
            console.log('✅ Trial activado exitosamente');
            onUpdate();
            toast.success(t('trialActivated30Days'));
          } else {
            console.error('❌ Error activando trial:', error);
            throw error;
          }
        } else {
          console.log('💳 Creando sesión de Stripe...');
          // Crear sesión de Stripe
          const clientBaseUrl = getClientBaseUrl();
          const apiUrl = `${clientBaseUrl}/api/stripe/create-checkout`;
          
          const isSamePlan = planId === business.subscription_plan;
          const actionMessage = isSamePlan 
            ? `Cambiando a facturación ${billing === 'month' ? 'mensual' : 'anual'}...`
            : 'Cambiando de plan...';
          
          console.log('=== STRIPE CHECKOUT DEBUG (BusinessSettings) ===');
          console.log(actionMessage);
          console.log('clientBaseUrl:', clientBaseUrl);
          console.log('Full API URL:', apiUrl);
          console.log('Window location:', window.location.href);
          console.log('Creando sesión de Stripe con:', {
            businessId: business.id,
            planId: planId,
            billing: billing,
            customerEmail: profile?.email,
            isSamePlan,
          });

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: business.id,
              planId: planId,
              billing: billing,
              customerId: business.stripe_customer_id,
              customerEmail: profile?.email,
            }),
          });

          console.log('📡 Respuesta de Stripe:', { status: response.status, ok: response.ok });

          if (response.ok) {
            const { url } = await response.json();
            console.log('✅ Sesión creada, redirigiendo a Stripe:', url);
            window.location.href = url;
          } else {
            const errorData = await response.json();
            console.error('❌ Error response de Stripe:', errorData);
            throw new Error(errorData.error || t('errorCreatingPaymentSession'));
          }
        }
      }
    } catch (error) {
      console.error('💥 Error changing plan:', error);
      const errorMessage = error instanceof Error ? error.message : t('unknownError');
      console.error('Mensaje de error:', errorMessage);
      toast.error(`${t('errorChangingPlan')}: ${errorMessage}`);
    } finally {
      setChangingPlan(false);
    }
  };

  const handleChangePlan = async () => {
    await handleChangePlanWithParams(selectedPlan, selectedBilling);
  };

  const planFeatures = PLAN_FEATURES[business.subscription_plan];

  // Escuchar mensajes de la ventana de Stripe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar que el mensaje viene del mismo origen
      if (event.origin !== window.location.origin) return;
      
      // Si es un mensaje de éxito de suscripción, recargar los datos
      if (event.data?.type === 'subscription-success') {
        console.log('=== SUBSCRIPTION SUCCESS MESSAGE RECEIVED ===');
        console.log('Waiting 5 seconds for webhook to process...');
        // Esperar 5 segundos para que el webhook procese
        setTimeout(() => {
          console.log('Reloading business data...');
          onUpdate();
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onUpdate]);

  const copyBookingLink = async () => {
    try {
      const bookingLink = generateBookingLink(business.id);
      console.log('📋 Intentando copiar enlace:', bookingLink);
      
      // Intentar usar la API moderna de Clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bookingLink);
        console.log('✅ Enlace copiado con navigator.clipboard');
        toast.success('Enlace copiado al portapapeles');
      } else {
        // Fallback para navegadores antiguos o contextos no seguros
        console.log('⚠️ Usando fallback para copiar');
        const textArea = document.createElement('textarea');
        textArea.value = bookingLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            console.log('✅ Enlace copiado con execCommand');
            toast.success('Enlace copiado al portapapeles');
          } else {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('❌ Error al copiar enlace:', error);
      toast.error('Error al copiar el enlace. Por favor, cópialo manualmente.');
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

              {/* Horarios de Atención */}
              {!hideBusinessHours && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('businessHours')}</h3>
                  </div>
                  
                  <div className="space-y-2" key={languageKey}>
                    {businessHours.map((hours, index) => (
                      <div key={`${hours.day}-${languageKey}`} className="p-3 bg-muted/30 rounded-lg border space-y-2">
                        {/* Fila principal: Día, horarios y botón cerrado */}
                        <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
                          <div className="font-medium text-sm capitalize">{t(hours.day)}</div>
                          
                          {!hours.closed ? (
                            <div className="flex items-center gap-1 text-sm">
                              <div className="relative flex-1 max-w-[110px]">
                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => updateBusinessHours(index, 'open', e.target.value)}
                                  className="h-8 w-full text-xs pl-7"
                                />
                              </div>
                              <span className="text-muted-foreground px-1">-</span>
                              <div className="relative flex-1 max-w-[110px]">
                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                                  className="h-8 w-full text-xs pl-7"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              {t('closed')}
                            </div>
                          )}
                          
                          <Button
                            type="button"
                            variant={hours.closed ? "outline" : "secondary"}
                            size="sm"
                            className="h-7 text-xs px-2 whitespace-nowrap"
                            onClick={() => updateBusinessHours(index, 'closed', !hours.closed)}
                          >
                            {hours.closed ? t('open') : t('close')}
                          </Button>
                        </div>

                        {/* Fila de horario de almuerzo - solo si el día está abierto */}
                        {!hours.closed && (
                          <div className="pl-[80px] space-y-2">
                            {/* Checkbox para habilitar horario de almuerzo */}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`lunch-${index}`}
                                checked={hours.hasLunch || false}
                                onChange={(e) => updateBusinessHours(index, 'hasLunch', e.target.checked)}
                                className="h-4 w-4 rounded border-input"
                              />
                              <Label htmlFor={`lunch-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                                {t('hasLunchBreak') || 'Horario de almuerzo'}
                              </Label>
                            </div>

                            {/* Campos de horario de almuerzo - solo si está habilitado */}
                            {hours.hasLunch && (
                              <div className="flex items-center gap-1 text-sm pl-6">
                                <span className="text-xs text-muted-foreground">{t('lunchBreak') || 'Almuerzo'}:</span>
                                <div className="relative flex-1 max-w-[110px]">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                  <Input
                                    type="time"
                                    value={hours.lunchStart || '12:00'}
                                    onChange={(e) => updateBusinessHours(index, 'lunchStart', e.target.value)}
                                    className="h-8 w-full text-xs pl-7"
                                  />
                                </div>
                                <span className="text-muted-foreground px-1">-</span>
                                <div className="relative flex-1 max-w-[110px]">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                  <Input
                                    type="time"
                                    value={hours.lunchEnd || '13:00'}
                                    onChange={(e) => updateBusinessHours(index, 'lunchEnd', e.target.value)}
                                    className="h-8 w-full text-xs pl-7"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('configureBusinessHours')}
                  </p>
                </div>
              )}

              {/* Días Cerrados Específicos */}
              {!hideBusinessHours && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('specificClosedDays') || 'Días Cerrados Específicos'}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {t('selectSpecificClosedDaysDescription') || 'Selecciona días específicos en los que tu negocio estará cerrado (vacaciones, días festivos, etc.)'}
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Calendario para seleccionar fechas */}
                    <div className="space-y-2">
                      <Label>{t('selectDates') || 'Seleccionar Fechas'}</Label>
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <Calendar
                          mode="multiple"
                          selected={closedDates}
                          onSelect={(dates) => setClosedDates(dates || [])}
                          disabled={(date) => {
                            // No permitir seleccionar fechas pasadas
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          className="rounded-md"
                        />
                      </div>
                    </div>

                    {/* Lista de fechas seleccionadas */}
                    <div className="space-y-2">
                      <Label>{t('selectedClosedDays') || 'Días Cerrados Seleccionados'} ({closedDates.length})</Label>
                      <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                        {closedDates.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            {t('noClosedDaysSelected') || 'No hay días cerrados seleccionados'}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {closedDates
                              .sort((a, b) => a.getTime() - b.getTime())
                              .map((date, index) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const formattedDate = new Intl.DateTimeFormat(i18n.language, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }).format(date);
                                
                                return (
                                  <div
                                    key={`${dateStr}-${index}`}
                                    className="flex items-center justify-between p-2 bg-background rounded-md border hover:border-primary/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium capitalize">{formattedDate}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setClosedDates(closedDates.filter((_, i) => i !== index));
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                      
                      {closedDates.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setClosedDates([])}
                          className="w-full mt-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('clearAllClosedDays') || 'Limpiar Todos'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? t('saving') : t('saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enlace Público de Reservas */}
        {!hideBusinessHours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              {t('publicBookingLink')}
            </CardTitle>
            <CardDescription>
              {t('shareThisLinkWithClients')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">
                {generateBookingLink(business.id)}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyBookingLink}
                className="shrink-0"
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('copyLink')}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(generateBookingLink(business.id), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('preview')}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>💡 <strong>{t('howToUseThisLink')}</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('shareOnSocialMedia')}</li>
                <li>{t('addToWebsite')}</li>
                <li>{t('sendViaWhatsAppOrEmail')}</li>
                <li>{t('includeInEmailSignature')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        )}
      </TabsContent>

      <TabsContent value="subscription" className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('changePlan')}</h3>
          {changingPlan && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                {t('processingPlanChange')}
              </p>
            </div>
          )}
          <SubscriptionPlans
            selectedPlan={selectedPlan}
            onSelectPlan={handleSelectPlan}
            isAdmin={profile?.role === 'admin'}
            currentPlan={business.subscription_plan}
            currentBilling={business.settings?.billing_period || 'month'}
            businessId={business.id}
            stripeCustomerId={business.stripe_customer_id}
            customerEmail={profile?.email}
            subscriptionEndDate={business.subscription_end_date}
            trialEndsAt={business.trial_ends_at}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}









































































































