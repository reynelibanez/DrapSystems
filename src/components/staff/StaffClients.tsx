import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Users, Eye, Search } from 'lucide-react';
import { ViewClientProfile } from '../shared/ViewClientProfile';
import type { Database } from '../../lib/database.types';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

type Client = Database['public']['Tables']['clients']['Row'];

interface StaffClientsProps {
  staffId: string;
}

export function StaffClients({ staffId }: StaffClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadClients();
  }, [staffId]);

  const loadClients = async () => {
    setLoading(true);
    try {
      // Obtener todas las citas del staff con información del cliente
      const { data: appointments } = await supabase
        .from('appointments')
        .select('client_id, client:clients(*)')
        .eq('staff_id', staffId);

      if (appointments) {
        // Contar citas por cliente
        const clientCounts = appointments.reduce((acc: any, apt) => {
          acc[apt.client_id] = (acc[apt.client_id] || 0) + 1;
          return acc;
        }, {});

        // Obtener clientes únicos con su conteo
        const uniqueClients = new Map<string, Client>();
        appointments.forEach(apt => {
          if (apt.client && !uniqueClients.has(apt.client_id)) {
            uniqueClients.set(apt.client_id, apt.client as any);
          }
        });

        const clientsWithCount = Array.from(uniqueClients.values()).map(client => ({
          ...client,
          appointmentCount: clientCounts[client.id] || 0,
        }));

        setClients(clientsWithCount);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowProfile(true);
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('myClients')}
          </CardTitle>
          <CardDescription>
            {t('viewClientsWithAppointments')}
          </CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchByName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('loadingClients')}</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? t('noClientsMatchSearch') : t('noClientsYet')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('phone')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('totalAppointments')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.full_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{client.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{client.phone || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{client.appointmentCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de perfil del cliente */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil del Cliente</DialogTitle>
            <DialogDescription>
              Información completa del cliente
            </DialogDescription>
          </DialogHeader>

          {selectedClientId && (
            <ViewClientProfile 
              clientId={selectedClientId} 
              allowEdit={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}





