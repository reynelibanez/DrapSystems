import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Save, X, UserCog, Shield, Calendar, ShoppingBag, Settings, Gem } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  business_id: string | null;
}

interface UserPermission {
  user_id: string;
  module_id: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  ShoppingBag,
  Settings,
  Shield,
  Gem,
};

export function ModulePermissionsManagement() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar módulos activos
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Cargar usuarios (excluir admins ya que tienen acceso a todo)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Cargar permisos existentes
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select('user_id, module_id');

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const getUserPermissions = (userId: string): string[] => {
    return permissions
      .filter((p) => p.user_id === userId)
      .map((p) => p.module_id);
  };

  const getUserModuleCount = (userId: string): number => {
    return getUserPermissions(userId).length;
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedModules(getUserPermissions(user.id));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setSelectedModules([]);
    setDialogOpen(false);
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      // Eliminar permisos existentes del usuario
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', selectedUser.id);

      if (deleteError) throw deleteError;

      // Insertar nuevos permisos
      if (selectedModules.length > 0) {
        const newPermissions = selectedModules.map((moduleId) => ({
          user_id: selectedUser.id,
          module_id: moduleId,
        }));

        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(newPermissions);

        if (insertError) throw insertError;
      }

      // Actualizar estado local
      setPermissions((prev) => [
        ...prev.filter((p) => p.user_id !== selectedUser.id),
        ...selectedModules.map((moduleId) => ({
          user_id: selectedUser.id,
          module_id: moduleId,
        })),
      ]);

      toast.success('Permisos actualizados correctamente');
      closeDialog();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'staff':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'client':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Dueño';
      case 'staff':
        return 'Personal';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Permisos de Módulos</h2>
        <p className="text-muted-foreground mt-2">
          Asigna permisos de acceso a módulos para cada usuario
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios activos (excl. admins)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Disponibles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">
              Módulos activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos Asignados</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de permisos configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuario</CardTitle>
          <CardDescription>
            Busca por nombre o email para gestionar permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios y Permisos</CardTitle>
          <CardDescription>
            Click en un usuario para editar sus permisos de módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const moduleCount = getUserModuleCount(user.id);
                    const userModules = getUserPermissions(user.id);

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {moduleCount} {moduleCount === 1 ? 'módulo' : 'módulos'}
                            </Badge>
                            {userModules.length > 0 && (
                              <div className="flex gap-1">
                                {userModules.slice(0, 3).map((moduleId) => {
                                  const module = modules.find((m) => m.id === moduleId);
                                  if (!module) return null;
                                  const IconComponent = iconMap[module.icon] || Shield;
                                  return (
                                    <div
                                      key={moduleId}
                                      className="p-1 bg-primary/10 rounded"
                                      title={module.name}
                                    >
                                      <IconComponent className="h-3 w-3 text-primary" />
                                    </div>
                                  );
                                })}
                                {userModules.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{userModules.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Editar Permisos
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Permisos de Módulos</DialogTitle>
            <DialogDescription>
              Selecciona los módulos a los que {selectedUser?.full_name} tendrá acceso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selectedUser?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
              <Badge variant="outline" className={getRoleBadgeColor(selectedUser?.role || '')}>
                {getRoleLabel(selectedUser?.role || '')}
              </Badge>
            </div>

            {/* Modules Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Módulos Disponibles</Label>
              <div className="grid gap-3">
                {modules.map((module) => {
                  const IconComponent = iconMap[module.icon] || Shield;
                  const isSelected = selectedModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <div className="p-2 bg-primary/10 rounded">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{module.name}</p>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Resumen de Permisos</p>
              <p className="text-sm text-muted-foreground">
                {selectedModules.length === 0 ? (
                  <span className="text-destructive">
                    ⚠️ El usuario no tendrá acceso a ningún módulo
                  </span>
                ) : (
                  <>
                    El usuario tendrá acceso a{' '}
                    <span className="font-semibold text-foreground">
                      {selectedModules.length} {selectedModules.length === 1 ? 'módulo' : 'módulos'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Permisos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






