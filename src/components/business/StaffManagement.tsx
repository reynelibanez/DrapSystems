import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Users, UserPlus, Trash2, Edit, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { staffNotifications, showError, showLoading, dismissToast } from '../../lib/toast-notifications';
import { UserForm } from '../shared/UserForm';
import { baseUrl } from '../../lib/base-url';
import { getPlanLimits, formatLimit, isNearLimit } from '../../lib/plan-limits';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];

interface StaffManagementProps {
  businessId: string;
  planFeatures: any;
}

export function StaffManagement({ businessId, planFeatures }: StaffManagementProps) {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    checkUserRole();
    loadStaff();
  }, [businessId]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', businessId)
        .in('role', ['staff', 'business_owner'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      showError('Error al cargar el personal');
    } finally {
      setLoading(false);
    }
  };

  const canAddMoreStaff = () => {
    if (planFeatures.maxStaff === -1) return true;
    
    // Verificar el total de usuarios contra el límite del plan
    // El límite incluye al owner, así que si el plan permite 5 usuarios
    // y ya hay 5 (1 owner + 4 staff), no se puede agregar más
    return staff.length < planFeatures.maxStaff;
  };

  const handleSuccess = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedStaff(null);
    loadStaff();
  };

  const handleDeleteStaff = async (staffMember: Profile) => {
    if (!confirm(`${t('confirmDeleteStaff')} ${staffMember.full_name}?`)) {
      return;
    }

    const toastId = showLoading(t('deletingStaff'));

    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar al endpoint API para eliminar el usuario
      const response = await fetch(`${baseUrl}/api/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: staffMember.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el personal');
      }

      dismissToast(toastId);
      staffNotifications.deleted(staffMember.full_name || 'Personal');
      loadStaff();
    } catch (error: any) {
      dismissToast(toastId);
      console.error('Error deleting staff:', error);
      staffNotifications.error(error.message || 'Error al eliminar personal');
    }
  };

  const openAddDialog = () => {
    setSelectedStaff(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (staffMember: Profile) => {
    setSelectedStaff(staffMember);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Cargando personal...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('staffManagement')}
                <Badge variant={isNearLimit(staff.length, planFeatures.maxStaff === -1 ? 'unlimited' : planFeatures.maxStaff) ? "destructive" : "secondary"}>
                  {staff.length}/{planFeatures.maxStaff === -1 ? t('unlimited') : planFeatures.maxStaff}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('manageStaffMembers')}
              </CardDescription>
            </div>
            <Button 
              onClick={openAddDialog}
              disabled={!canAddMoreStaff()}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('addStaff')}
            </Button>
          </div>

          {!canAddMoreStaff() && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('reachedStaffLimit')} {planFeatures.maxStaff} {t('staffForPlan')} {t('upgradeSubscription')}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay personal registrado</p>
              <p className="text-sm">Agrega tu primer miembro del equipo para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('phone')}</TableHead>
                    {isAdmin && <TableHead className="hidden md:table-cell">{t('company')}</TableHead>}
                    <TableHead className="hidden lg:table-cell">{t('registrationDate')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{member.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{member.phone || '-'}</TableCell>
                      {isAdmin && (
                        <TableCell className="hidden md:table-cell">
                          {member.business_name || '-'}
                        </TableCell>
                      )}
                      <TableCell className="hidden lg:table-cell">
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteStaff(member)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar staff */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addNewStaff')}</DialogTitle>
            <DialogDescription>
              {t('completeDataNewStaff')}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={null}
            onSuccess={handleSuccess}
            onCancel={() => setShowAddDialog(false)}
            isAdmin={isAdmin}
            businessId={businessId}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar personal */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editStaff')}</DialogTitle>
            <DialogDescription>
              {t('modifyStaffInfo')}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={selectedStaff}
            onSuccess={handleSuccess}
            onCancel={() => setShowEditDialog(false)}
            isAdmin={isAdmin}
            businessId={businessId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
















