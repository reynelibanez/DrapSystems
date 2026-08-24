import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Calendar, User, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getClients, deleteClient, type ClientWithStats } from '../../lib/api/clients';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientListProps {
  businessId: string;
  onAddClient: () => void;
  onEditClient: (client: ClientWithStats) => void;
  onViewClient: (client: ClientWithStats) => void;
}

export function ClientList({ businessId, onAddClient, onEditClient, onViewClient }: ClientListProps) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithStats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadClients();
  }, [businessId]);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients(businessId);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error(t('errorLoadingClients'));
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  };

  const handleDeleteClick = (client: ClientWithStats) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient(clientToDelete.id);
      toast.success(t('clientDeletedSuccessfully'));
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(t('errorDeletingClient'));
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('clients')}</h2>
          <p className="text-muted-foreground">
            {t('manageClientBase')}
          </p>
        </div>
        <Button onClick={onAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newClient')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchByNameEmailPhone')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalClients')}</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('active')}</p>
                <p className="text-2xl font-bold">
                  {clients.filter((c) => c.is_active).length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('new30Days')}</p>
                <p className="text-2xl font-bold">
                  {
                    clients.filter((c) => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return new Date(c.created_at) > thirtyDaysAgo;
                    }).length
                  }
                </p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={User}
          title={t('noClients')}
          description={
            searchQuery
              ? t('noClientsMatchSearch')
              : t('startAddingFirstClient')
          }
          action={
            !searchQuery ? (
              <Button onClick={onAddClient}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addClient')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={client.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(client.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{client.full_name}</CardTitle>
                      {!client.is_active && (
                        <Badge variant="secondary" className="mt-1">
                          {t('inactive')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewClient(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('viewProfile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditClient(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(client)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(client.date_of_birth), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                )}
                
                {/* Tags */}
                {client.tags && client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {client.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {client.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{client.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="pt-3 border-t grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('totalAppointments')}</p>
                    <p className="text-lg font-semibold">{client.total_appointments || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('upcoming')}</p>
                    <p className="text-lg font-semibold">{client.upcoming_appointments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={t('deleteClient')}
        description={t('confirmDeleteClient', { name: clientToDelete?.full_name })}
        confirmText={t('delete')}
        variant="destructive"
      />
    </div>
  );
}





