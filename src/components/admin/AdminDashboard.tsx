import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BusinessCards } from './BusinessCards';
import { UserManagement } from './UserManagement';
import { SystemStats } from './SystemStats';
import { GlobalClientManagement } from './GlobalClientManagement';
import { GlobalServiceManagement } from './GlobalServiceManagement';
import { TwilioNumbersManagement } from './TwilioNumbersManagement';
import { Building2, Users, BarChart3, UserPlus, Briefcase, MessageSquare } from 'lucide-react';

export function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.stats')}</span>
        </TabsTrigger>
        <TabsTrigger value="businesses" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.businesses')}</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.users')}</span>
        </TabsTrigger>
        <TabsTrigger value="clients" className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.clients')}</span>
        </TabsTrigger>
        <TabsTrigger value="services" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.services')}</span>
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.admin.smsUsage')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="mt-6">
        <SystemStats />
      </TabsContent>

      <TabsContent value="businesses" className="mt-6">
        <BusinessCards />
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="clients" className="mt-6">
        <GlobalClientManagement />
      </TabsContent>

      <TabsContent value="services" className="mt-6">
        <GlobalServiceManagement />
      </TabsContent>

      <TabsContent value="sms" className="mt-6">
        <TwilioNumbersManagement />
      </TabsContent>
    </Tabs>
  );
}





