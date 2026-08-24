import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle2, Upload, X, Clock } from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';
import { generateBookingLink } from '../../lib/encryption';

interface CreateBusinessProps {
  onSuccess?: () => void;
}

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function CreateBusiness({ onSuccess }: CreateBusinessProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    DAYS.map(day => ({
      day,
      open: '09:00',
      close: '18:00',
      closed: day === 'Domingo'
    }))
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes.');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    const newHours = [...businessHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setBusinessHours(newHours);
  };

  const uploadLogo = async (businessId: string): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${businessId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, logoFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      return null;
    }
  };

  const handlePlanSelect = (planId: string, billing: 'month' | 'year') => {
    setSelectedPlan(planId);
    // No guardamos billing ya que no existe la columna en la BD
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la empresa es requerido');
      }

      // Verificar usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Preparar settings con business_hours
      const settings = {
        business_hours: businessHours,
        billing_period: 'month' // Por defecto mensual
      };

      // Calcular fechas para plan básico (trial de 30 días)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      // Crear la empresa primero sin logo
      const { data: newBusiness, error: createError } = await supabase
        .from('businesses')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          email: email.trim() || null,
          owner_id: user.id,
          settings: settings,
          logo_url: null,
          subscription_plan: selectedPlan,
          subscription_status: selectedPlan === 'basic' ? 'trial' : 'inactive',
          trial_ends_at: selectedPlan === 'basic' ? trialEndsAt.toISOString() : null,
          subscription_end_date: selectedPlan === 'basic' ? trialEndsAt.toISOString() : null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating business:', createError);
        throw new Error(createError.message || 'Error al crear la empresa');
      }

      // Generar y guardar el enlace público de reservas
      if (newBusiness) {
        try {
          const publicBookingLink = generateBookingLink(newBusiness.id);
          
          const { error: linkError } = await supabase
            .from('businesses')
            .update({ public_booking_link: publicBookingLink })
            .eq('id', newBusiness.id);

          if (linkError) {
            console.error('Error saving public booking link:', linkError);
            // No lanzar error, solo registrar - el negocio ya fue creado
          } else {
            console.log('✅ Public booking link saved:', publicBookingLink);
          }
        } catch (err) {
          console.error('Error generating public booking link:', err);
          // No lanzar error, solo registrar
        }
      }

      // Si hay logo, subirlo y actualizar la empresa
      let finalLogoUrl = null;
      if (logoFile && newBusiness) {
        finalLogoUrl = await uploadLogo(newBusiness.id);
        
        if (finalLogoUrl) {
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ logo_url: finalLogoUrl })
            .eq('id', newBusiness.id);

          if (updateError) {
            console.error('Error updating logo:', updateError);
          }
        }
      }

      // Asignar automáticamente el módulo de citas al propietario
      try {
        // Obtener el ID del módulo de citas
        const { data: appointmentsModule, error: moduleError } = await supabase
          .from('system_modules')
          .select('id')
          .eq('slug', 'appointments')
          .single();

        if (!moduleError && appointmentsModule) {
          // Verificar si ya tiene el permiso
          const { data: existingPermission } = await supabase
            .from('user_module_permissions')
            .select('id')
            .eq('user_id', user.id)
            .eq('module_id', appointmentsModule.id)
            .single();

          // Si no existe, crear el permiso
          if (!existingPermission) {
            const { error: permissionError } = await supabase
              .from('user_module_permissions')
              .insert({
                user_id: user.id,
                module_id: appointmentsModule.id
              });

            if (permissionError) {
              console.error('Error assigning appointments module:', permissionError);
            }
          }
        }
      } catch (err) {
        console.error('Error assigning module permission:', err);
        // No lanzar error, solo registrar - la empresa ya fue creada
      }

      setSuccess(true);
      
      // Limpiar formulario
      setName('');
      setDescription('');
      setEmail('');
      setLogoUrl(null);
      setLogoFile(null);
      setSelectedPlan('basic');
      setBusinessHours(DAYS.map(day => ({
        day,
        open: '09:00',
        close: '18:00',
        closed: day === 'Domingo'
      })));

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err: any) {
      console.error('Error creating business:', err);
      setError(err.message || 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información básica */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Información Básica</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Nombre de la Empresa *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Salón de Belleza María"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email de Contacto</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Logo de la Empresa</h3>
            
            {logoUrl ? (
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover rounded-lg border-2 border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={removeLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Subir
                </Button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Selección de Plan - Usando el componente correcto */}
        <div className="space-y-3">
          <SubscriptionPlans
            selectedPlan={selectedPlan}
            onSelectPlan={handlePlanSelect}
            isAdmin={false}
          />
        </div>

        {/* Horarios */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Horarios de Atención</h3>
            </div>
            
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 border rounded-lg p-2">
              {businessHours.map((hours, index) => (
                <div key={hours.day} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                  <div className="w-16 font-medium text-xs">{hours.day.substring(0, 3)}</div>
                  
                  <div className="flex items-center gap-1 flex-1">
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateBusinessHours(index, 'open', e.target.value)}
                        disabled={hours.closed}
                        className="h-8 w-24 text-xs pl-7"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">-</span>
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                        disabled={hours.closed}
                        className="h-8 w-24 text-xs pl-7"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant={hours.closed ? "outline" : "secondary"}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => updateBusinessHours(index, 'closed', !hours.closed)}
                  >
                    {hours.closed ? 'Cerrado' : 'Abierto'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes de feedback */}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                ¡Empresa creada exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-background pb-2">
            <Button type="submit" disabled={loading} className="flex-1 h-9">
              {loading ? 'Creando...' : 'Crear Empresa'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}





