import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Edit2, CreditCard } from 'lucide-react';
import { Separator } from '../ui/separator';
import { EditClientProfile } from '../client/EditClientProfile';
import { AppointmentNotes } from './AppointmentNotes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ViewClientProfileProps {
  clientId: string;
  allowEdit?: boolean;
  preselectedAppointmentId?: string;
  showAppointmentNotes?: boolean; // Nueva prop para controlar si se muestran las notas de citas
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
  tags: string[] | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  routing_number?: string | null;
  payment_method?: string | null;
  payment_notes?: string | null;
}

export function ViewClientProfile({ 
  clientId, 
  allowEdit = false, 
  preselectedAppointmentId,
  showAppointmentNotes = true 
}: ViewClientProfileProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      setClientData(data);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar si el usuario actual puede editar
  const canEdit = allowEdit || 
    profile?.role === 'business_owner' || 
    profile?.role === 'staff' ||
    profile?.id === clientId;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No se encontró el perfil del cliente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Perfil del Cliente
              </CardTitle>
              <CardDescription>
                Información personal y de contacto
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => setShowEditDialog(true)} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {clientData.avatar_url ? (
                  <img 
                    src={clientData.avatar_url} 
                    alt={clientData.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{clientData.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={clientData.is_active ? 'default' : 'secondary'}>
                    {clientData.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {clientData.tags && clientData.tags.length > 0 && (
                    <>
                      {clientData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de contacto */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contacto</h4>
            
            {clientData.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{clientData.email}</p>
                </div>
              </div>
            )}

            {clientData.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{clientData.phone}</p>
                </div>
              </div>
            )}

            {clientData.date_of_birth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fecha de Nacimiento</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(clientData.date_of_birth), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dirección */}
          {(clientData.address || clientData.city || clientData.postal_code) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Dirección</h4>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    {clientData.address && (
                      <p className="text-sm">{clientData.address}</p>
                    )}
                    {(clientData.city || clientData.postal_code) && (
                      <p className="text-sm text-muted-foreground">
                        {clientData.city}{clientData.city && clientData.postal_code && ', '}
                        {clientData.postal_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notas */}
          {clientData.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Notas</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                  {clientData.notes}
                </p>
              </div>
            </>
          )}

          {/* Información de Pago */}
          {(clientData.payment_method || clientData.bank_name || clientData.account_holder || clientData.payment_notes) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Información de Pago
                </h4>
                
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  {clientData.payment_method && (
                    <div className="flex items-center gap-3">
                      <div className="w-full">
                        <p className="text-sm font-medium">Método de Pago Preferido</p>
                        <Badge variant="outline" className="mt-1">
                          {clientData.payment_method === 'cash' && 'Efectivo'}
                          {clientData.payment_method === 'card' && 'Tarjeta'}
                          {clientData.payment_method === 'transfer' && 'Transferencia'}
                          {clientData.payment_method === 'other' && 'Otro'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {clientData.bank_name && (
                    <div>
                      <p className="text-sm font-medium">Banco</p>
                      <p className="text-sm text-muted-foreground">{clientData.bank_name}</p>
                    </div>
                  )}

                  {clientData.account_holder && (
                    <div>
                      <p className="text-sm font-medium">Titular de la Cuenta</p>
                      <p className="text-sm text-muted-foreground">{clientData.account_holder}</p>
                    </div>
                  )}

                  {clientData.account_number && (
                    <div>
                      <p className="text-sm font-medium">Número de Cuenta</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        ****{clientData.account_number.slice(-4)}
                      </p>
                    </div>
                  )}

                  {clientData.routing_number && (
                    <div>
                      <p className="text-sm font-medium">Código de Ruta / SWIFT</p>
                      <p className="text-sm text-muted-foreground font-mono">{clientData.routing_number}</p>
                    </div>
                  )}

                  {clientData.payment_notes && (
                    <div>
                      <p className="text-sm font-medium">Notas de Pago</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-2 rounded mt-1">
                        {clientData.payment_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Información adicional */}
          <Separator />
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Información Adicional</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cliente desde</p>
                <p className="font-medium">
                  {format(new Date(clientData.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <p className="font-medium">
                  {clientData.is_active ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas de Citas */}
      {showAppointmentNotes && profile?.business_id && (
        <div className="mt-6">
          <AppointmentNotes 
            clientId={clientId} 
            businessId={profile.business_id}
            preselectedAppointmentId={preselectedAppointmentId}
          />
        </div>
      )}

      {/* Dialog de edición */}
      {canEdit && (
        <EditClientProfile
          clientId={clientId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSaved={loadClientData}
        />
      )}
    </>
  );
}








