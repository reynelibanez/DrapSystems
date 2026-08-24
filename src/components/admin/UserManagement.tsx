import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getPlanLimits, canAddUser, formatLimit } from '../../lib/plan-limits';
import { baseUrl } from '../../lib/base-url';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Users, Edit, UserPlus, AlertCircle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { UserForm } from '../shared/UserForm';
import { Alert, AlertDescription } from '../ui/alert';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserWithBusiness extends Profile {
  business_name?: string;
}

interface UserManagementProps {
  isAdmin?: boolean;
  businessId?: string;
  currentPlan?: string;
}

export function UserManagement({ isAdmin = false, businessId, currentPlan = 'free' }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { t } = useTranslation();

  const isBusinessOwner = currentUserRole === 'business_owner';

  // Límites según el plan - USAR LOS LÍMITES CORRECTOS DE plan-limits.ts
  const planLimits = getPlanLimits(currentPlan);
  const maxUsers = planLimits.users;
  
  // Si es admin, SIEMPRE puede agregar usuarios
  // Si el plan tiene usuarios ilimitados, también puede
  const canAddMoreUsers = isAdmin || 
                         maxUsers === 'unlimited' || 
                         (typeof maxUsers === 'number' && users.length < maxUsers);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, [businessId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Cargar el rol del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUserRole(profile.role);
      }
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          businesses:business_id (
            name
          )
        `);

      // Si no es admin, filtrar solo usuarios de su empresa
      if (!isAdmin && businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        const usersWithBusinessName = data.map(user => ({
          ...user,
          business_name: user.businesses?.name || null
        }));
        setUsers(usersWithBusinessName);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (!error) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const openCreateDialog = () => {
    // Si es admin, siempre puede crear usuarios
    if (!isAdmin && !canAddMoreUsers) {
      alert(`${t('reachedUserLimit')} ${maxUsers} ${t('usersForPlan')} ${t('upgradeSubscription')}`);
      return;
    }
    setEditingUser(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: Profile) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingUser(null);
    // Recargar la lista de usuarios
    loadUsers();
  };

  const handleFormCancel = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const deleteUser = async (userId: string, userName: string) => {
    setDeleteLoading(true);
    try {
      console.log('=== INICIANDO ELIMINACIÓN DE USUARIO ===');
      console.log('User ID:', userId);
      
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar al endpoint API
      const response = await fetch(`${baseUrl}/api/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errorDeletingUser'));
      }

      console.log('Respuesta del servidor:', result);
      console.log('=== ELIMINACIÓN COMPLETADA ===');

      // Recargar la lista
      await loadUsers();
      
      // Mostrar mensaje de éxito
      alert(`${t('userDeletedSuccessfully')}: ${userName}`);
    } catch (error: any) {
      console.error('Error completo:', error);
      alert(`${t('errorDeletingUser')}: ${error.message || t('unknownError')}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'business_owner':
        return 'default';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t('administrator');
      case 'business_owner':
        return t('owner');
      case 'staff':
        return t('staff');
      default:
        return t('client');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loadingUsers')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isAdmin ? t('userManagement') : t('myCompanyUsers')}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? t('manageAllUsers')
                : `${t('manageCompanyUsers')} (${users.length}${maxUsers !== -1 ? `/${maxUsers}` : ''})`
              }
            </CardDescription>
          </div>
          <Button 
            onClick={openCreateDialog}
            disabled={!isAdmin && !canAddMoreUsers}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('createUser')}
          </Button>
        </div>

        {!isAdmin && !canAddMoreUsers && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite de {formatLimit(maxUsers)} usuarios para el plan {currentPlan}. Actualiza tu plan para agregar más usuarios.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('phone')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                {isAdmin && <TableHead className="hidden md:table-cell">{t('company')}</TableHead>}
                <TableHead className="hidden lg:table-cell">{t('registrationDate')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    {t('noUsersRegistered')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.full_name || t('noName')}
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="ml-2 text-xs">{t('you')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{user.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">{user.phone || '-'}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('administrator')}</SelectItem>
                            <SelectItem value="business_owner">{t('owner')}</SelectItem>
                            <SelectItem value="staff">{t('staff')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="hidden md:table-cell">
                        {user.business_name || '-'}
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Solo mostrar botón de eliminar si:
                            - Es admin (puede eliminar a cualquiera excepto a sí mismo)
                            - Es business owner y el usuario es staff (no puede eliminar a otros owners)
                            - No puede eliminar a sí mismo
                        */}
                        {user.id !== currentUserId && (
                          <>
                            {(isAdmin || (isBusinessOwner && user.role === 'staff')) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deleteLoading}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('confirmDeleteUser')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('confirmDeleteUserDescription')}
                                    </AlertDialogDescription>
                                    <div className="text-sm text-muted-foreground">
                                      <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>{t('userLabel')}: {user.full_name || user.email}</li>
                                        <li>{t('email')}: {user.email}</li>
                                        <li>{t('allAssociatedAppointments')}</li>
                                        <li>{t('allClientsCreatedByUser')}</li>
                                      </ul>
                                    </div>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.id, user.full_name || user.email)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {t('delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              isBusinessOwner && user.role === 'business_owner' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled
                                  title={t('onlyAdminsCanDeleteOwners') || 'Only administrators can delete business owners'}
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('editUser') : t('createNewUser')}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? t('modifyUserInfo')
                : t('completeDataNewUser')}
            </DialogDescription>
          </DialogHeader>

          <UserForm
            user={editingUser}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            isAdmin={isAdmin}
            businessId={!isAdmin ? businessId : undefined}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
























