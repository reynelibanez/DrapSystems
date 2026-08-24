import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle2, Upload, Camera, X, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { generateBookingLink } from '../../lib/encryption';
import type { Database } from '../../lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface EditBusinessProps {
  business: Business;
  onSuccess?: () => void;
  isAdmin?: boolean;
}

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function EditBusiness({ business, onSuccess, isAdmin = false }: EditBusinessProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description || '');
  const [email, setEmail] = useState(business.email || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo_url);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(() => {
    const settings = business.settings as any;
    if (settings?.business_hours) {
      return settings.business_hours;
    }
    return DAYS.map(day => ({
      day,
      open: '09:00',
      close: '18:00',
      closed: day === 'Domingo'
    }));
  });

  // Debug logging
  useEffect(() => {
    console.log('=== EditBusiness Component Mounted ===');
    console.log('Business ID:', business.id);
    console.log('Business Owner ID:', business.owner_id);
    console.log('Business Name:', business.name);
    console.log('Is Admin:', isAdmin);
    console.log('Business Hours:', businessHours);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== handleSubmit INICIADO ===');
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Validando nombre...');
      if (!name.trim()) {
        throw new Error('El nombre de la empresa es requerido');
      }

      // Verificar usuario actual
      console.log('Obteniendo usuario actual...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('Usuario actual:', user.id);
      console.log('Owner de la empresa:', business.owner_id);
      console.log('¿Es el owner?:', user.id === business.owner_id);

      // Verificar si el usuario es el owner
      if (user.id !== business.owner_id && !isAdmin) {
        throw new Error('No tienes permisos para actualizar esta empresa');
      }

      let finalLogoUrl = logoUrl;

      // Manejar la subida del logo si existe
      if (logoFile) {
        const logoPublicUrl = await uploadLogo(business.id);
        if (logoPublicUrl) {
          finalLogoUrl = logoPublicUrl;
        }
      }

      // Preparar settings con business_hours
      const newSettings = {
        ...(business.settings as any || {}),
        business_hours: businessHours
      };

      // Preparar datos para actualizar
      const updateData = {
        name: name.trim(),
        description: description.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        logo_url: finalLogoUrl,
        settings: newSettings,
        updated_at: new Date().toISOString()
      };

      console.log('Actualizando empresa con datos:', updateData);

      // Actualizar la empresa - SELECT explícito para asegurar que traiga public_booking_link
      const { data, error: updateError } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business.id)
        .select('*, public_booking_link');

      if (updateError) {
        console.error('ERROR GUARDANDO CAMBIOS EN EMPRESA', updateError);
        console.error('Detalles del error:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(updateError.message || 'Error al actualizar la empresa');
      }

      console.log('Empresa actualizada exitosamente:', data);

      // Verificar y generar enlace público si no existe
      if (data && data[0]) {
        const updatedBusiness = data[0];
        console.log('🔍 Verificando enlace público...');
        console.log('Enlace actual:', updatedBusiness.public_booking_link);
        
        if (!updatedBusiness.public_booking_link) {
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
          console.log('✅ El negocio ya tiene enlace público:', updatedBusiness.public_booking_link);
        }
      } else {
        console.warn('⚠️ No se pudo obtener el negocio actualizado');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err: any) {
      console.error('Error updating business:', err);
      setError(err.message || 'Error al actualizar la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información básica */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Información Básica
          </h3>
            
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email de Contacto</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="h-9 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="h-9 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm">Dirección</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle Principal 123"
                className="h-9 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu negocio..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Logo de la Empresa
          </h3>
          
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
                Subir Logo
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

        {/* Horarios de Atención */}
        <div className="space-y-4 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Horarios de Atención</h3>
          </div>
          
          <div className="space-y-3">
            {businessHours.map((hours, index) => (
              <div key={hours.day} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="w-24 font-medium text-sm shrink-0">{hours.day}</div>
                
                {!hours.closed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateBusinessHours(index, 'open', e.target.value)}
                        className="h-9 w-28 text-sm pl-7"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">a</span>
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                        className="h-9 w-28 text-sm pl-7"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-muted-foreground italic">
                    Cerrado
                  </div>
                )}
                
                <Button
                  type="button"
                  variant={hours.closed ? "outline" : "secondary"}
                  size="sm"
                  className="h-8 text-xs px-3 shrink-0"
                  onClick={() => updateBusinessHours(index, 'closed', !hours.closed)}
                >
                  {hours.closed ? 'Abrir' : 'Cerrar'}
                </Button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Configura los horarios de atención de tu negocio para cada día de la semana
          </p>
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
              ¡Empresa actualizada exitosamente!
            </AlertDescription>
          </Alert>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" disabled={loading} className="flex-1 h-10">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}



















