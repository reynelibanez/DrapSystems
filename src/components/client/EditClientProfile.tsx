import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageUpload } from '../shared/ImageUpload';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Save, X, CreditCard } from 'lucide-react';
import { Separator } from '../ui/separator';

interface EditClientProfileProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface ClientData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  notes: string | null;
  avatar_url: string | null;
  business_id: string;
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  routing_number?: string | null;
  payment_method?: string | null;
  payment_notes?: string | null;
}

export function EditClientProfile({ clientId, open, onOpenChange, onSaved }: EditClientProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientData>>({});
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (open && clientId) {
      loadClientData();
    }
  }, [open, clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      setFormData(data);
      setAvatarUrl(data.avatar_url || '');
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          notes: formData.notes,
          avatar_url: avatarUrl || null,
          bank_name: formData.bank_name,
          account_holder: formData.account_holder,
          account_number: formData.account_number,
          routing_number: formData.routing_number,
          payment_method: formData.payment_method,
          payment_notes: formData.payment_notes,
        })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Perfil actualizado exitosamente');
      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving client data:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ClientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Editar Perfil del Cliente
          </DialogTitle>
          <DialogDescription>
            Actualiza la información personal del cliente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Foto de Perfil */}
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <ImageUpload
                currentImageUrl={avatarUrl}
                onImageUploaded={setAvatarUrl}
                bucket="avatars"
                path={`clients/${formData.business_id}`}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Calle, número, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Personales</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Información de Pago */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Información de Pago</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago Preferido</Label>
                  <Select
                    value={formData.payment_method || ''}
                    onValueChange={(value) => handleChange('payment_method', value)}
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="Nombre del banco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_holder">Titular de la Cuenta</Label>
                  <Input
                    id="account_holder"
                    value={formData.account_holder || ''}
                    onChange={(e) => handleChange('account_holder', e.target.value)}
                    placeholder="Nombre del titular"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Número de Cuenta</Label>
                  <Input
                    id="account_number"
                    type="password"
                    value={formData.account_number || ''}
                    onChange={(e) => handleChange('account_number', e.target.value)}
                    placeholder="****1234"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta información se guarda de forma segura
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routing_number">Código de Ruta / SWIFT</Label>
                  <Input
                    id="routing_number"
                    value={formData.routing_number || ''}
                    onChange={(e) => handleChange('routing_number', e.target.value)}
                    placeholder="Código de ruta o SWIFT"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_notes">Notas de Pago</Label>
                <Textarea
                  id="payment_notes"
                  value={formData.payment_notes || ''}
                  onChange={(e) => handleChange('payment_notes', e.target.value)}
                  placeholder="Información adicional sobre pagos..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


