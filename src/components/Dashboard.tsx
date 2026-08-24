import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';
import { validateSubscription, validateUserAccess } from '../lib/subscription-validator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Calendar, 
  Users, 
  Building2, 
  Settings, 
  UserCog, 
  Clock,
  BarChart3,
  UserPlus,
  Briefcase,
  List,
  CalendarPlus,
  User as UserIcon,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  CreditCard,
  LogOut
} from 'lucide-react';
import { BusinessManagement } from './admin/BusinessManagement';
import { BusinessList } from './admin/BusinessList';
import { UserManagement } from './admin/UserManagement';
import { SystemStats } from './admin/SystemStats';
import { TwilioNumbersManagement } from './admin/TwilioNumbersManagement';
import { AppointmentCalendar } from './shared/AppointmentCalendar';
import { StaffManagement } from './business/StaffManagement';
import { ServiceManagement } from './business/ServiceManagement';
import { ClientManagement } from './business/ClientManagement';
import { BusinessSettings } from './business/BusinessSettings';
import { StaffAppointments } from './staff/StaffAppointments';
import { StaffClients } from './staff/StaffClients';
import { ClientAppointments } from './client/ClientAppointments';
import { ClientProfile } from './client/ClientProfile';
import { BookAppointment } from './client/BookAppointment';
import { GlobalClientManagement } from './admin/GlobalClientManagement';
import { GlobalServiceManagement } from './admin/GlobalServiceManagement';
import { ReportsPage } from './reports/ReportsPage';
import { NextAppointmentCard } from './shared/NextAppointmentCard';
import { CompactNextAppointmentCard } from './shared/CompactNextAppointmentCard';
import { CompactStatsCard } from './shared/CompactStatsCard';
import { UserProfile } from './shared/UserProfile';
import { NotificationCenter } from './shared/NotificationCenter';
import { LanguageSelector } from './shared/LanguageSelector';
import { getPlanLimits, formatLimit } from '../lib/plan-limits';
import { baseUrl } from '@/lib/base-url';
import { PaymentBlockedBanner } from './shared/PaymentBlockedBanner';
import { PushNotificationPrompt } from './shared/PushNotificationPrompt';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
}

interface DashboardProps {
  user: any;
  theme?: 'light' | 'dark';
}

interface DayStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  occupancyRate: number;
  uniqueClients: number;
}

export function Dashboard({ user, theme }: DashboardProps) {
  const { t } = useTranslation();
  const { profile: authProfile } = useAuth(); // Obtener profile del AuthContext
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [settingsTab, setSettingsTab] = useState('info');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isExpired: boolean;
    canAccess: boolean;
    daysRemaining: number;
  } | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessBlockedPlan, setAccessBlockedPlan] = useState('');
  const [planFeatures, setPlanFeatures] = useState({
    maxStaff: -1,
    maxServices: -1,
    maxClients: -1,
    hasAdvancedReports: true,
    hasCustomBranding: true,
    hasApiAccess: true,
  });
  const [calendarStats, setCalendarStats] = useState<DayStats>({
    total: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
    occupancyRate: 0,
    uniqueClients: 0
  });
  const [showCompactStats, setShowCompactStats] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showCompactNextAppointment, setShowCompactNextAppointment] = useState(false);

  console.log('📊 Dashboard mounted - user:', user?.id, 'authProfile:', authProfile?.id, 'loading:', loading);

  useEffect(() => {
    if (user?.id) {
      console.log('👤 Loading profile for user:', user.id);
      loadProfile();
    } else if (authProfile) {
      // Si no hay user pero sí hay authProfile (cliente), usar ese profile directamente
      console.log('👤 Using authProfile for client:', authProfile.id);
      setProfile(authProfile);
      setLoading(false);
      
      // Cargar el negocio si existe
      if (authProfile.business_id) {
        loadBusiness(authProfile.business_id);
      }
    } else {
      console.log('⚠️ No user.id or authProfile, Dashboard cannot load profile');
      setLoading(false);
    }
  }, [user, authProfile]);

  // Hook para detectar cuando las tarjetas de estadísticas están ocultas
  useEffect(() => {
    // Solo ejecutar si estamos en la pestaña del calendario
    if (activeTab !== 'calendar') {
      setShowCompactStats(false);
      setShowCompactNextAppointment(false);
      return;
    }

    const handleScroll = () => {
      const statsCards = document.getElementById('calendar-stats-cards');
      const nextAppointmentCard = document.getElementById('next-appointment-card');
      
      if (statsCards) {
        const rect = statsCards.getBoundingClientRect();
        // Si las tarjetas están completamente fuera de la vista (arriba)
        const isHidden = rect.bottom < 0;
        setShowCompactStats(isHidden);
      }

      if (nextAppointmentCard) {
        const rect = nextAppointmentCard.getBoundingClientRect();
        // Si la tarjeta está completamente fuera de la vista (arriba)
        const isHidden = rect.bottom < 0;
        console.log('📍 Next Appointment Card - bottom:', rect.bottom, 'isHidden:', isHidden, 'showCompact:', isHidden);
        setShowCompactNextAppointment(isHidden);
      } else {
        console.log('⚠️ Next Appointment Card element not found');
      }
    };

    // Agregar listener de scroll
    window.addEventListener('scroll', handleScroll);
    // Verificar estado inicial
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  // Escuchar mensajes de la ventana de Stripe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar que el mensaje viene del mismo origen
      if (event.origin !== window.location.origin) return;
      
      // Si es un mensaje de éxito de suscripción, recargar los datos
      if (event.data?.type === 'subscription-success') {
        console.log('=== SUBSCRIPTION SUCCESS MESSAGE RECEIVED IN DASHBOARD ===');
        console.log('Waiting 5 seconds for webhook to process...');
        // Esperar 5 segundos para que el webhook procese
        setTimeout(() => {
          console.log('Reloading profile data...');
          loadProfile();
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user]);

  // Detectar retorno de pago de SMS exitoso
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const paymentType = urlParams.get('type');
    
    if (paymentStatus === 'success' && paymentType === 'sms') {
      console.log('✅ Pago de SMS completado detectado en Dashboard, recargando datos...');
      
      // Limpiar los parámetros de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Esperar un momento para que el webhook procese y recargar
      setTimeout(() => {
        if (business?.id) {
          loadBusiness(business.id);
        }
        loadProfile();
      }, 2000);
    }
  }, [business?.id]);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.business_id) {
        await loadBusiness(profileData.business_id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusiness = async (businessId: string) => {
    try {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (!businessError && businessData) {
        setBusiness(businessData);
        loadPlanFeatures(businessData.subscription_plan);
        
        // Validar suscripción
        const status = validateSubscription(businessData);
        setSubscriptionStatus(status);
        
        // Si la suscripción expiró, bloquear acceso completo
        if (!status.canAccess && status.isExpired) {
          setAccessBlocked(true);
          setAccessBlockedPlan(businessData.subscription_plan);
          return;
        }
        
        // Validar acceso del usuario
        if (user?.id) {
          const accessValidation = await validateUserAccess(user.id, businessId, businessData);
          
          if (!accessValidation.canAccess) {
            // Bloquear acceso y guardar el nombre del plan
            const planName = businessData.subscription_plan;
            setAccessBlocked(true);
            setAccessBlockedPlan(planName);
            return;
          }
        }
        
        console.log('📊 Subscription Status:', {
          business: businessData.name,
          plan: businessData.subscription_plan,
          status: businessData.subscription_status,
          endDate: businessData.subscription_end_date,
          trialEndsAt: businessData.trial_ends_at,
          canAccess: status.canAccess,
          isExpired: status.isExpired,
          daysRemaining: status.daysRemaining,
          message: status.message
        });
      }
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  const loadPlanFeatures = (plan: string) => {
    const limits = getPlanLimits(plan);
    
    setPlanFeatures({
      maxStaff: limits.users === 'unlimited' ? -1 : limits.users,
      maxServices: -1, // No hay límite de servicios definido en plan-limits
      maxClients: limits.clients === 'unlimited' ? -1 : limits.clients,
      hasAdvancedReports: limits.features.includes('reports_advanced'),
      hasCustomBranding: limits.features.includes('custom_branding'),
      hasApiAccess: limits.features.includes('api_access'),
    });
  };

  const getSubscriptionMessage = (status: { isExpired: boolean; canAccess: boolean; daysRemaining: number }) => {
    if (status.isExpired) {
      return t('subscriptionExpired', 'Your subscription has expired.');
    }
    
    if (status.daysRemaining > 0 && status.daysRemaining <= 7) {
      return t('subscriptionExpiringSoon', {
        defaultValue: 'Your subscription will expire in {{days}} days.',
        days: status.daysRemaining
      });
    }
    
    return '';
  };

  const handleAppointmentCreated = () => {
    // Ya no es necesario forzar un refresh - el calendario se actualiza automáticamente
    // con las suscripciones en tiempo real
  };

  const handleStatsChange = (stats: DayStats) => {
    setCalendarStats(stats);
  };

  const handleNextAppointmentChange = useCallback((appointment: AppointmentWithDetails | null) => {
    console.log('📅 Dashboard - Next appointment changed:', {
      hasAppointment: !!appointment,
      appointmentId: appointment?.id,
      appointmentBusinessId: appointment?.business_id,
      currentBusinessId: business?.id,
      profileRole: profile?.role,
      match: appointment ? appointment.business_id === business?.id : 'N/A'
    });
    setNextAppointment(appointment);
  }, [business?.id, profile?.role]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = `${baseUrl}/`;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de acceso bloqueado
  if (accessBlocked) {
    // Determinar si es por suscripción expirada o por límite de usuarios
    const isSubscriptionExpired = subscriptionStatus?.isExpired && !subscriptionStatus?.canAccess;
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full border-2 border-destructive">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-destructive">
              {isSubscriptionExpired ? t('subscriptionExpired') : t('accessRestricted')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubscriptionExpired ? (
              <>
                <p className="text-center text-muted-foreground">
                  {t('subscriptionExpiredMessage')}
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">{t('whatCanYouDo')}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{t('contactBusinessOwnerToRenew')}</li>
                    <li>{t('upgradeYourPlan')}</li>
                    <li>{t('renewYourSubscription')}</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  {/* Botón para ver planes - solo si es el owner */}
                  {profile?.role === 'business_owner' && (
                    <Button 
                      onClick={() => {
                        setAccessBlocked(false);
                        setActiveTab('settings');
                        setSettingsTab('subscription');
                      }}
                      variant="default"
                      className="w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('viewPlansAndUpgrade')}
                    </Button>
                  )}
                  <Button 
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = `${baseUrl}/`;
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    {t('signOut')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  {t('accessBlockedMessage', { plan: accessBlockedPlan })}
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">{t('whatCanYouDo')}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{t('contactBusinessOwner')}</li>
                    <li>{t('askOwnerToRemoveUsers')}</li>
                    <li>{t('waitForOwnerToResolve')}</li>
                  </ul>
                </div>
                <Button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = `${baseUrl}/`;
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  {t('signOut')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  const role = profile.role;
  const isAdmin = role === 'admin';
  const isBusinessOwner = role === 'business_owner';
  const isStaff = role === 'staff';
  const isClient = role === 'client';

  return (
    <>
      {/* Banner de bloqueo por pago pendiente - se muestra sobre todo */}
      {business && (
        <PaymentBlockedBanner 
          businessId={business.id}
          onPaymentComplete={() => {
            // Recargar datos del negocio después del pago
            loadBusiness(business.id);
          }}
        />
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          if (value !== 'settings') {
            setSettingsTab('info');
          }
        }} 
        className="w-full" 
        activationMode="manual"
      >
        <div className="flex gap-3 sm:gap-4 p-1 sm:p-2 mt-4 relative min-h-screen">
          {/* Columna Izquierda - Perfil */}
          <aside className="hidden lg:block w-48 lg:w-56 flex-shrink-0">
            <div className="fixed top-[105px] w-48 lg:w-56 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="relative">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name || 'Usuario'} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <span className="text-2xl font-bold text-primary">
                            {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-full">
                      <h3 className="text-sm font-semibold mb-1 truncate">
                        {profile.full_name || profile.email}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {isAdmin && t('admin')}
                        {isBusinessOwner && t('business_owner')}
                        {isStaff && t('staff')}
                        {isClient && t('client')}
                      </span>
                      {profile.email && (
                        <p className="text-xs text-muted-foreground mt-1.5 break-all line-clamp-2">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjetas compactas - solo visibles cuando las principales están ocultas */}
              <CompactNextAppointmentCard appointment={nextAppointment} visible={showCompactNextAppointment} />
              <CompactStatsCard stats={calendarStats} visible={showCompactStats} />
            </div>
          </aside>

          {/* Columna central - Contenido principal */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 pb-28 lg:pb-0">
            <div className="pb-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {isAdmin && t('adminPanel')}
                {isBusinessOwner && t('businessPanel')}
                {isStaff && t('staffPanel')}
                {isClient && t('clientPanel')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAdmin && t('adminPanelDesc')}
                {isBusinessOwner && t('businessPanelDesc')}
                {isStaff && t('staffPanelDesc')}
                {isClient && t('clientPanelDesc')}
              </p>
            </div>

            {/* Alerta de suscripción vencida o próxima a vencer */}
            {subscriptionStatus && !subscriptionStatus.canAccess && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-bold">Subscription Expired</AlertTitle>
                <AlertDescription>
                  {getSubscriptionMessage(subscriptionStatus)}
                  <br />
                  <span className="text-sm">Please contact support or renew your subscription to continue using premium features.</span>
                </AlertDescription>
              </Alert>
            )}

            {subscriptionStatus && subscriptionStatus.canAccess && subscriptionStatus.daysRemaining > 0 && subscriptionStatus.daysRemaining <= 7 && (
              <Alert className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-200">Subscription Expiring Soon</AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                  {getSubscriptionMessage(subscriptionStatus)}
                  <br />
                  <span className="text-sm">Please renew your subscription to avoid service interruption.</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Tarjeta de información del usuario (solo móvil) */}
            <Card className="border-2 shadow-sm lg:hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'Usuario'} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <span className="text-2xl sm:text-3xl font-bold text-primary">
                          {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold truncate">
                      {profile.full_name || profile.email}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {isAdmin && t('admin')}
                        {isBusinessOwner && t('business_owner')}
                        {isStaff && t('staff')}
                        {isClient && t('client')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs fijos en la parte inferior para móvil */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 mobile-tabs-fixed overflow-x-auto">
              <TabsList className="flex h-auto gap-1 bg-transparent p-2 pb-safe mobile-tabs-scroll w-full min-w-full">
                <TabsTrigger value="calendar" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs">{t('calendar')}</span>
                </TabsTrigger>

                {isAdmin && (
                  <>
                    <TabsTrigger value="businesses-list" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <List className="w-5 h-5" />
                      <span className="text-xs">{t('businessesList')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="businesses" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Building2 className="w-5 h-5" />
                      <span className="text-xs">{t('management')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">{t('users')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserPlus className="w-5 h-5" />
                      <span className="text-xs">{t('clients')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="services" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-xs">{t('services')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">{t('statistics')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="twilio-numbers" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Phone className="w-5 h-5" />
                      <span className="text-xs">{t('twilioNumbers')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">{t('reports')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-xs">{t('profile')}</span>
                    </TabsTrigger>
                  </>
                )}

                {isBusinessOwner && business && (
                  <>
                    <TabsTrigger value="staff" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserCog className="w-5 h-5" />
                      <span className="text-xs">{t('staff')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="services" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-xs">{t('services')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">{t('clients')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">{t('reports')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Settings className="w-5 h-5" />
                      <span className="text-xs">{t('settings')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-xs">{t('profile')}</span>
                    </TabsTrigger>
                  </>
                )}

                {isStaff && business && (
                  <>
                    <TabsTrigger value="staff" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserCog className="w-5 h-5" />
                      <span className="text-xs">{t('staff')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="services" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-xs">{t('services')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">{t('clients')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="my-appointments" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Clock className="w-5 h-5" />
                      <span className="text-xs">{t('myAppointments')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="my-clients" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">{t('myClients')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">{t('reports')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-xs">{t('profile')}</span>
                    </TabsTrigger>
                  </>
                )}

                {isClient && (
                  <>
                    <TabsTrigger value="profile" className="flex-shrink-0 flex-col gap-1 px-4 py-2 h-auto min-w-[80px]">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-xs">{t('profile')}</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            {/* VISTA DEL CALENDARIO MEJORADA CON BORDES DEFINIDOS */}
            <TabsContent value="calendar" className="mt-0">
              <Card className="border-2 border-border shadow-lg bg-card overflow-hidden rounded-xl">
                <CardContent className="p-2 sm:p-4 bg-gradient-to-b from-card to-background/30">
                  <div className="calendar-with-borders">
                    {/* Calendario */}
                    <Card className="shadow-lg border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <CardHeader className="pb-2 sm:pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          {t('calendar')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-4 bg-gradient-to-b from-card to-background/30">
                        {/* Tarjeta de próxima cita */}
                        <div id="next-appointment-card" className="mb-3">
                          <NextAppointmentCard 
                            userId={profile.id}
                            role={profile.role}
                            businessId={business?.id}
                            onAppointmentChange={handleNextAppointmentChange}
                            appointment={nextAppointment}
                          />
                        </div>

                        {/* Calendario */}
                        <AppointmentCalendar 
                          isAdmin={isAdmin}
                          businessId={business?.id}
                          clientId={isClient ? profile.id : undefined}
                          onAppointmentCreated={handleAppointmentCreated}
                          onStatsChange={handleStatsChange}
                          onNextAppointmentChange={handleNextAppointmentChange}
                          subscriptionStatus={subscriptionStatus}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contenidos de los Tabs */}
            {isAdmin && (
              <>
                <TabsContent value="businesses-list" className="mt-0"><BusinessList /></TabsContent>
                <TabsContent value="businesses" className="mt-0"><BusinessManagement /></TabsContent>
                <TabsContent value="users" className="mt-0"><UserManagement isAdmin={true} /></TabsContent>
                <TabsContent value="clients" className="mt-0"><GlobalClientManagement /></TabsContent>
                <TabsContent value="services" className="mt-0"><GlobalServiceManagement /></TabsContent>
                <TabsContent value="stats" className="mt-0"><SystemStats /></TabsContent>
                <TabsContent value="twilio-numbers" className="mt-0"><TwilioNumbersManagement /></TabsContent>
                <TabsContent value="reports" className="mt-0"><ReportsPage /></TabsContent>
                <TabsContent value="profile" className="mt-0"><UserProfile /></TabsContent>
              </>
            )}

            {isBusinessOwner && business && (
              <>
                {/* Si la suscripción está vencida, solo mostrar configuración */}
                {subscriptionStatus && !subscriptionStatus.canAccess ? (
                  <>
                    <TabsContent value="calendar" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            Your subscription has expired. Please renew to continue using the calendar and other features.
                          </p>
                          <Button onClick={() => setActiveTab('settings')} variant="default">
                            Go to Settings to Renew
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="staff" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            Your subscription has expired. Please renew to continue managing staff.
                          </p>
                          <Button onClick={() => setActiveTab('settings')} variant="default">
                            Go to Settings to Renew
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="services" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            Your subscription has expired. Please renew to continue managing services.
                          </p>
                          <Button onClick={() => setActiveTab('settings')} variant="default">
                            Go to Settings to Renew
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="clients" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            Your subscription has expired. Please renew to continue managing clients.
                          </p>
                          <Button onClick={() => setActiveTab('settings')} variant="default">
                            Go to Settings to Renew
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="reports" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            Your subscription has expired. Please renew to continue viewing reports.
                          </p>
                          <Button onClick={() => setActiveTab('settings')} variant="default">
                            Go to Settings to Renew
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0"><BusinessSettings business={business} onUpdate={loadProfile} initialTab={settingsTab} /></TabsContent>
                    <TabsContent value="profile" className="mt-0"><UserProfile /></TabsContent>
                  </>
                ) : (
                  <>
                    <TabsContent value="staff" className="mt-0"><StaffManagement businessId={business.id} planFeatures={planFeatures} /></TabsContent>
                    <TabsContent value="services" className="mt-0"><ServiceManagement businessId={business.id} planFeatures={planFeatures} /></TabsContent>
                    <TabsContent value="clients" className="mt-0"><ClientManagement businessId={business.id} /></TabsContent>
                    <TabsContent value="settings" className="mt-0"><BusinessSettings business={business} onUpdate={loadProfile} initialTab={settingsTab} /></TabsContent>
                    <TabsContent value="reports" className="mt-0"><ReportsPage /></TabsContent>
                    <TabsContent value="profile" className="mt-0"><UserProfile /></TabsContent>
                  </>
                )}
              </>
            )}

            {isStaff && business && (
              <>
                {/* Si la suscripción está vencida, mostrar mensaje */}
                {subscriptionStatus && !subscriptionStatus.canAccess ? (
                  <>
                    <TabsContent value="calendar" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="staff" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="services" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="clients" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="my-appointments" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="my-clients" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="reports" className="mt-0">
                      <Card className="border-2">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Business Subscription Expired</h3>
                          <p className="text-muted-foreground mb-4">
                            The business subscription has expired. Please contact the business owner to renew.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="profile" className="mt-0"><UserProfile /></TabsContent>
                  </>
                ) : (
                  <>
                    <TabsContent value="staff" className="mt-0"><StaffManagement businessId={business.id} planFeatures={planFeatures} /></TabsContent>
                    <TabsContent value="services" className="mt-0"><ServiceManagement businessId={business.id} planFeatures={planFeatures} /></TabsContent>
                    <TabsContent value="clients" className="mt-0"><ClientManagement businessId={business.id} /></TabsContent>
                    <TabsContent value="my-appointments" className="mt-0"><StaffAppointments staffId={profile.id} businessId={business.id} /></TabsContent>
                    <TabsContent value="my-clients" className="mt-0"><StaffClients staffId={profile.id} businessId={business.id} /></TabsContent>
                    <TabsContent value="reports" className="mt-0"><ReportsPage /></TabsContent>
                    <TabsContent value="profile" className="mt-0"><UserProfile /></TabsContent>
                  </>
                )}
              </>
            )}

            {isClient && (
              <>
                <TabsContent value="my-appointments" className="mt-0"><ClientAppointments clientId={profile.id} /></TabsContent>
                <TabsContent value="book" className="mt-0"><BookAppointment clientId={profile.id} /></TabsContent>
                <TabsContent value="profile" className="mt-0"><ClientProfile clientId={profile.id} /></TabsContent>
              </>
            )}
          </div>

          {/* Columna derecha - Tabs de navegación (fixed) - Solo visible en desktop */}
          <aside className="hidden lg:block w-48 xl:w-56 flex-shrink-0">
            <div className="fixed top-[105px] w-48 xl:w-56 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pl-2">
              {/* Tabs verticales */}
              <Card className="border-2 shadow-sm">
                <CardContent className="p-2 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
                  <TabsList className="flex flex-col w-full h-auto bg-transparent gap-1">
                    <TabsTrigger value="calendar" className="w-full justify-start gap-2 px-2 py-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs xl:text-sm truncate">{t('calendar')}</span>
                    </TabsTrigger>

                    {isAdmin && (
                      <>
                        <TabsTrigger value="businesses-list" className="w-full justify-start gap-2 px-2 py-2">
                          <List className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('businessesList')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="businesses" className="w-full justify-start gap-2 px-2 py-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('management')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="users" className="w-full justify-start gap-2 px-2 py-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('users')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="w-full justify-start gap-2 px-2 py-2">
                          <UserPlus className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('clients')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="w-full justify-start gap-2 px-2 py-2">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('services')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="w-full justify-start gap-2 px-2 py-2">
                          <BarChart3 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('statistics')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="twilio-numbers" className="w-full justify-start gap-2 px-2 py-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('twilioNumbers')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="w-full justify-start gap-2 px-2 py-2">
                          <BarChart3 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('reports')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="w-full justify-start gap-2 px-2 py-2">
                          <UserIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('profile')}</span>
                        </TabsTrigger>
                      </>
                    )}

                    {isBusinessOwner && business && (
                      <>
                        <TabsTrigger value="staff" className="w-full justify-start gap-2 px-2 py-2">
                          <UserCog className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('staff')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="w-full justify-start gap-2 px-2 py-2">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('services')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="w-full justify-start gap-2 px-2 py-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('clients')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="w-full justify-start gap-2 px-2 py-2">
                          <BarChart3 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('reports')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="w-full justify-start gap-2 px-2 py-2">
                          <Settings className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('settings')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="w-full justify-start gap-2 px-2 py-2">
                          <UserIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('profile')}</span>
                        </TabsTrigger>
                      </>
                    )}

                    {isStaff && business && (
                      <>
                        <TabsTrigger value="staff" className="w-full justify-start gap-2 px-2 py-2">
                          <UserCog className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('staff')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="w-full justify-start gap-2 px-2 py-2">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('services')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="w-full justify-start gap-2 px-2 py-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('clients')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="my-appointments" className="w-full justify-start gap-2 px-2 py-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('myAppointments')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="my-clients" className="w-full justify-start gap-2 px-2 py-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('myClients')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="w-full justify-start gap-2 px-2 py-2">
                          <BarChart3 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('reports')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="w-full justify-start gap-2 px-2 py-2">
                          <UserIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('profile')}</span>
                        </TabsTrigger>
                      </>
                    )}

                    {isClient && (
                      <>
                        <TabsTrigger value="profile" className="w-full justify-start gap-2 px-2 py-2">
                          <UserIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs xl:text-sm truncate">{t('profile')}</span>
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </Tabs>

      {/* Prompt de notificaciones push - solo para usuarios no admin */}
      {!isAdmin && <PushNotificationPrompt autoShow={true} />}
    </>
  );
}








































































































































































































