import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModulePermissionsManagement } from './ModulePermissionsManagement';
import { BusinessCards } from './BusinessCards';
import { UserManagement } from './UserManagement';
import { SystemStats } from './SystemStats';
import { TwilioNumbersManagement } from './TwilioNumbersManagement';
import { AdminOverviewDashboard } from './AdminOverviewDashboard';
import { Shield, Users, BarChart3, MessageSquare, Building2, Sparkles } from 'lucide-react';

export function AdminModuleDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, permisos y configuración del sistema
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
            <span className="sm:hidden">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permisos</span>
            <span className="sm:hidden">Permisos</span>
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresas</span>
            <span className="sm:hidden">Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
            <span className="sm:hidden">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">SMS</span>
            <span className="sm:hidden">SMS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminOverviewDashboard />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <ModulePermissionsManagement />
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6">
          <BusinessCards />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement isAdmin={true} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <SystemStats />
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <TwilioNumbersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}






