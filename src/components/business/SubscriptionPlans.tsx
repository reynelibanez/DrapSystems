


import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Check, X, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getClientBaseUrl } from '../../lib/base-url';

export interface SubscriptionPlan {
  id: 'basic' | 'professional' | 'business' | 'enterprise';
  name: string;
  priceMonth: number;
  priceYear: number;
  description: string;
  features: (billing: 'month' | 'year') => { label: string; included: boolean }[];
  limits: {
    users: number | 'unlimited';
    clients: number | 'unlimited';
  };
  notifications: {
    professional: { email: boolean; sms: boolean; reminders: boolean };
    business: { email: boolean; sms: boolean; reminders: boolean };
    [key: string]: { email: boolean; sms: boolean; reminders: boolean };
  };
  popular?: boolean;
  icon: React.ReactNode;
}

const plansConfig = [
  {
    id: 'basic',
    name: 'Prueba Gratis',
    priceMonth: 0,
    priceYear: 0,
    description: '30 días de prueba con funciones básicas',
    icon: <Sparkles className="w-5 h-5" />,
    limits: { users: 3, clients: 100 },
    notifications: { email: true, sms: false, reminders: true },
    features: () => [
      { key: 'appointmentManagement', label: 'Gestión de citas y clientes', included: true },
      { key: 'emailNotifications', label: 'Notificaciones por Email', included: true },
      { key: 'basicReports', label: 'Reportes básicos', included: true },
      { key: 'smsMessages', label: 'Mensajes SMS', included: false },
      { key: 'automaticReminders', label: 'Recordatorios automáticos', included: false },
      { key: 'basicSupport', label: 'Soporte básico', included: true },
    ]
  },
  {
    id: 'professional',
    name: 'Profesional',
    priceMonth: 29,
    priceYear: Math.round(29 * 12 * 0.9), // 10% Descuento anual
    description: 'Perfecto para profesionales independientes',
    icon: <Zap className="w-5 h-5" />,
    popular: true,
    limits: { users: 3, clients: 500 },
    notifications: { email: true, sms: false, reminders: true },
    features: () => [
      { key: 'allFree', label: 'Todo lo del plan Gratis', included: true },
      { key: 'emailNotifications', label: 'Notificaciones por Email', included: true },
      { key: 'automaticReminders', label: 'Recordatorios automáticos', included: true },
      { key: 'smsMessages', label: 'Mensajes SMS', included: false },
      { key: 'support', label: 'Soporte prioritario', included: true },
    ]
  },
  {
    id: 'business',
    name: 'Empresarial',
    priceMonth: 79,
    priceYear: Math.round(79 * 12 * 0.9), // 10% Descuento anual
    description: 'Para equipos y pequeñas empresas',
    icon: <Building2 className="w-5 h-5" />,
    limits: { users: 10, clients: 1000 },
    notifications: { email: true, sms: true, reminders: true },
    features: () => [
      { key: 'allProfessional', label: 'Todo lo del plan Profesional', included: true },
      { key: 'emailNotifications', label: 'Notificaciones por Email', included: true },
      { key: 'smsNotifications', label: 'Notificaciones SMS', included: true },
      { key: 'reminders24h2h', label: 'Recordatorios automáticos', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonth: 199,
    priceYear: Math.round(199 * 12 * 0.9), // 10% Descuento anual
    description: 'Solución completa para grandes empresas',
    icon: <Crown className="w-5 h-5" />,
    limits: { users: 'unlimited', clients: 'unlimited' },
    notifications: { email: true, sms: true, reminders: true },
    features: () => [
      { key: 'unlimitedUsersClients', label: 'Usuarios y clientes ilimitados', included: true },
      { key: 'allNotifications', label: 'Todas las notificaciones y canales', included: true },
      { key: 'support24_7', label: 'Soporte 24/7 dedicado', included: true },
      { key: 'advancedCustomization', label: 'Personalización avanzada', included: true },
    ]
  }
];

interface SubscriptionPlansProps {
  selectedPlan?: string;
  onSelectPlan?: (planId: string, billing: 'month' | 'year') => void;
  isAdmin?: boolean;
  currentPlan?: string;
  currentBilling?: 'month' | 'year';
  businessId?: string; // Para cuando se usa desde Dashboard
  stripeCustomerId?: string; // ID del customer en Stripe
  customerEmail?: string; // Email del usuario
  subscriptionEndDate?: string | null; // Fecha de vencimiento de la suscripción
  trialEndsAt?: string | null; // Fecha de fin del trial
}

interface PlanCardProps {
  plan: typeof plansConfig[0];
  isSelected: boolean;
  onSelectPlan: (planId: string, billing: 'month' | 'year') => void;
  currentPlan?: string;
  currentBilling?: 'month' | 'year';
}

function PlanCard({ plan, isSelected, onSelectPlan, currentPlan, currentBilling = 'month' }: PlanCardProps) {
  const { t } = useTranslation();
  
  // Usar el billing guardado en settings para el plan actual
  // Permitir cambiar el billing para otros planes
  const [billing, setBilling] = useState<'month' | 'year'>(
    currentPlan === plan.id ? currentBilling : 'month'
  );
  const price = billing === 'month' ? plan.priceMonth : plan.priceYear;
  const discount = billing === 'year' ? 10 : 0;

  // Actualizar billing cuando cambie el currentBilling (desde settings)
  React.useEffect(() => {
    if (currentPlan === plan.id) {
      // Si es el plan actual, usar el billing guardado en settings
      console.log(`🔄 Plan ${plan.id}: Usando billing guardado: ${currentBilling}`);
      setBilling(currentBilling);
    }
  }, [currentPlan, currentBilling, plan.id]);

  // Determinar si es el plan actual con el mismo billing
  const isCurrentPlanAndBilling = currentPlan === plan.id && currentBilling === billing;
  
  // Determinar el texto del botón
  const getButtonText = () => {
    if (currentPlan === plan.id) {
      if (currentBilling === billing) {
        return t('subscriptionPlans.currentPlan');
      } else {
        return `${t('subscriptionPlans.changeTo')} ${billing === 'month' ? t('subscriptionPlans.monthly') : t('subscriptionPlans.annual')}`;
      }
    }
    return t('subscriptionPlans.selectPlan');
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80',
        currentPlan === plan.id && 'ring-2 ring-primary border-transparent shadow-md',
        plan.popular && 'border-primary shadow-sm'
      )}
    >
      {/* Badges de Estado */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground shadow-sm">
            {t('subscriptionPlans.mostPopular')}
          </Badge>
        </div>
      )}

      {currentPlan === plan.id && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge variant="outline" className="bg-background shadow-sm border-emerald-500 text-emerald-600">
            {t('subscriptionPlans.currentPlan')}
          </Badge>
        </div>
      )}

      {/* Cabecera del Plan */}
      <CardHeader className="text-center pt-6 pb-4 border-b border-border/40 bg-muted/20 rounded-t-xl">
        <div className="mx-auto mb-3 p-2.5 bg-background border border-border rounded-lg w-fit shadow-sm text-primary">
          {plan.icon}
        </div>
        <CardTitle className="text-lg font-bold">{t(`subscriptionPlans.plans.${plan.id}.name`)}</CardTitle>
        <CardDescription className="text-sm px-2 line-clamp-2 min-h-[40px]">
          {t(`subscriptionPlans.plans.${plan.id}.description`)}
        </CardDescription>
        
        {/* Selector de Billing dentro de cada tarjeta */}
        {plan.id !== 'basic' && (
          <div className="pt-3 pb-2">
            <Tabs 
              value={billing} 
              onValueChange={(v) => setBilling(v as 'month' | 'year')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="month" className="text-xs">{t('subscriptionPlans.monthly')}</TabsTrigger>
                <TabsTrigger value="year" className="text-xs gap-1">
                  {t('subscriptionPlans.annual')}
                  <Badge variant="secondary" className="px-1 py-0 text-[9px] bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    -10%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="pt-3">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-extrabold tracking-tight">${price}</span>
            <span className="text-muted-foreground text-xs ml-1 font-medium">
              /{billing === 'month' ? t('subscriptionPlans.month') : t('subscriptionPlans.year')}
            </span>
          </div>
          {plan.id === 'basic' && (
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {t('subscriptionPlans.validFor30Days')}
            </p>
          )}
          {billing === 'year' && plan.id !== 'basic' && (
            <p className="text-[11px] text-green-600 font-medium mt-1">
              {t('subscriptionPlans.savePerYear', { amount: `$${Math.round(plan.priceMonth * 12 * 0.1)}` })}
            </p>
          )}
        </div>
      </CardHeader>

      {/* Cuerpo / Características */}
      <CardContent className="space-y-4 pt-6 pb-6 px-6 flex-1">
        {/* Sección Límites */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('subscriptionPlans.usageLimits')}</div>
          <div className="space-y-1.5 text-sm text-foreground/90">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {plan.limits.users === 'unlimited' 
                  ? t('subscriptionPlans.unlimitedUsers')
                  : `${plan.limits.users} ${plan.limits.users > 1 ? t('subscriptionPlans.users') : t('subscriptionPlans.user')}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {plan.limits.clients === 'unlimited' 
                  ? t('subscriptionPlans.unlimitedClients')
                  : `${plan.limits.clients.toLocaleString()} ${t('subscriptionPlans.maxClients')}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Sección Notificaciones */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('subscriptionPlans.availableChannels')}</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              {plan.notifications.email ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              <span className={cn("break-words", !plan.notifications.email && 'text-muted-foreground/60 line-through')}>
                {t('subscriptionPlans.emailNotifications')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.notifications.sms ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              <span className={cn("break-words", !plan.notifications.sms && 'text-muted-foreground/60 line-through')}>
                {t('subscriptionPlans.directSMSMessaging')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.notifications.reminders ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              <span className={cn("break-words", !plan.notifications.reminders && 'text-muted-foreground/60 line-through')}>
                {t('subscriptionPlans.automaticReminders')}
              </span>
            </div>
          </div>
        </div>

        {/* Características Detalladas */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('subscriptionPlans.alsoIncludes')}</div>
          <ul className="space-y-1.5">
            {plan.features().map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground/90">
                {feature.included ? (
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                )}
                <span className={cn("break-words", !feature.included && 'text-muted-foreground/60 line-through')}>
                  {t(`subscriptionPlans.plans.${plan.id}.features.${feature.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      {/* Botón de Selección */}
      <CardFooter className="pt-4 pb-6 px-6">
        <Button
          className="w-full shadow-sm"
          variant={isCurrentPlanAndBilling ? 'default' : 'outline'}
          disabled={isCurrentPlanAndBilling}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlan(plan.id, billing);
          }}
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPlans({ 
  selectedPlan: externalSelectedPlan, 
  onSelectPlan, 
  isAdmin = false,
  currentPlan,
  currentBilling = 'month',
  businessId,
  stripeCustomerId,
  customerEmail,
  subscriptionEndDate,
  trialEndsAt
}: SubscriptionPlansProps) {
  const { t } = useTranslation();
  const [internalSelectedPlan, setInternalSelectedPlan] = useState(currentPlan);
  const [changingPlan, setChangingPlan] = useState(false);
  
  const selectedPlan = externalSelectedPlan || internalSelectedPlan;

  // Calcular días restantes del plan gratuito
  const calculateRemainingDays = () => {
    if (currentPlan !== 'basic') return null;
    
    const endDate = trialEndsAt || subscriptionEndDate;
    console.log('🔍 Calculando días restantes:', {
      currentPlan,
      trialEndsAt,
      subscriptionEndDate,
      endDate
    });
    
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('📅 Días calculados:', {
      now: now.toISOString(),
      end: end.toISOString(),
      diffTime,
      diffDays
    });
    
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = calculateRemainingDays();
  
  console.log('✅ Días restantes finales:', remainingDays);

  // Filtrar planes según el rol del usuario
  const visiblePlans = isAdmin 
    ? plansConfig // Admin ve todos los planes incluyendo basic
    : plansConfig.filter(plan => plan.id !== 'basic'); // Usuarios normales no ven basic

  const handleSelectPlan = async (planId: string, billing: 'month' | 'year') => {
    console.log('Plan seleccionado:', planId, 'Billing:', billing);
    
    // Si hay un callback externo, usarlo
    if (onSelectPlan) {
      onSelectPlan(planId, billing);
      return;
    }
    
    // Si no hay callback pero hay businessId, manejar el cambio aquí
    if (businessId) {
      setInternalSelectedPlan(planId);
      
      // Solo bloquear si es EXACTAMENTE el mismo plan Y el mismo billing
      if (planId === currentPlan && billing === currentBilling) {
        alert('Ya tienes este plan con esta modalidad de facturación');
        return;
      }

      setChangingPlan(true);

      try {
        if (planId === 'basic') {
          // Activar trial
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 30);

          const { supabase } = await import('../../lib/supabase');
          
          // Obtener settings actuales para preservarlos
          const { data: currentBusiness } = await supabase
            .from('businesses')
            .select('settings')
            .eq('id', businessId)
            .single();

          const currentSettings = (currentBusiness?.settings as any) || {};

          const { error } = await supabase
            .from('businesses')
            .update({
              subscription_plan: 'basic',
              subscription_status: 'trial',
              trial_ends_at: trialEndsAt.toISOString(),
              subscription_end_date: trialEndsAt.toISOString(),
              settings: {
                ...currentSettings,
                billing_period: 'month'
              }
            })
            .eq('id', businessId);

          if (!error) {
            alert('Plan de prueba activado por 30 días');
            window.location.reload();
          } else {
            throw error;
          }
        } else {
          // Crear sesión de Stripe
          const clientBaseUrl = getClientBaseUrl();
          const apiUrl = `${clientBaseUrl}/api/stripe/create-checkout`;
          
          const isSamePlan = planId === currentPlan;
          const actionMessage = isSamePlan 
            ? `Cambiando a facturación ${billing === 'month' ? 'mensual' : 'anual'}...`
            : 'Cambiando de plan...';
          
          console.log('=== STRIPE CHECKOUT DEBUG ===');
          console.log(actionMessage);
          console.log('clientBaseUrl:', clientBaseUrl);
          console.log('Full API URL:', apiUrl);
          console.log('Window location:', window.location.href);
          console.log('Window hostname:', window.location.hostname);
          console.log('Creando sesión de Stripe con:', {
            businessId,
            planId,
            billing,
            customerId: stripeCustomerId,
            customerEmail: customerEmail,
            isSamePlan,
          });

          // Guardar el businessId en sessionStorage para verificar después
          sessionStorage.setItem('pendingBusinessId', businessId);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId,
              planId,
              billing,
              customerId: stripeCustomerId, // Enviar el customer ID si existe
              customerEmail: customerEmail, // Enviar el email del usuario
            }),
          });

          if (response.ok) {
            const { url } = await response.json();
            console.log('Redirigiendo a Stripe:', url);
            window.location.href = url;
          } else {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Error al crear sesión de pago');
          }
        }
      } catch (error) {
        console.error('Error changing plan:', error);
        alert(`Error al cambiar el plan: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setChangingPlan(false);
      }
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Encabezado */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('subscriptionPlans.chooseYourPlan')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('subscriptionPlans.selectPlanDescription')}
          </p>
        </div>

        {isAdmin && (
          <Badge variant="secondary" className="mt-2 animate-pulse">
            {t('subscriptionPlans.adminMode')}
          </Badge>
        )}
        
        {changingPlan && (
          <Badge variant="secondary" className="mt-2 animate-pulse">
            {t('subscriptionPlans.processingPlanChange')}
          </Badge>
        )}
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelectPlan={handleSelectPlan}
            currentPlan={currentPlan}
            currentBilling={currentBilling}
          />
        ))}
      </div>

      {/* Leyenda Inferior */}
      {selectedPlan && (
        <div className="text-center text-sm text-muted-foreground animate-fade-in">
          <p className="bg-muted/50 p-3 rounded-lg max-w-2xl mx-auto border border-border/60">
            {isAdmin 
              ? t('subscriptionPlans.adminNote')
              : selectedPlan === 'basic'
              ? remainingDays !== null && remainingDays > 0
                ? t('subscriptionPlans.daysRemaining', { 
                    days: remainingDays, 
                    plural: remainingDays !== 1 ? t('subscriptionPlans.daysRemainingPlural') : t('subscriptionPlans.daysRemainingSingular')
                  })
                : t('subscriptionPlans.trialStartsImmediately')
              : t('subscriptionPlans.stripeRedirect')
            }
          </p>
        </div>
      )}
    </div>
  );
}



















































