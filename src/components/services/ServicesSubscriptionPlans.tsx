import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Check, X, Wrench, Crown, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { baseUrl } from '../../lib/base-url';
import { toast } from 'sonner';

interface ServicesSubscriptionPlansProps {
  businessId: string;
  currentPlan?: string;
  currentStatus?: string;
  isAdmin?: boolean;
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
  
  const [billing, setBilling] = useState<'month' | 'year'>(
    currentPlan === plan.id ? currentBilling : 'month'
  );
  
  const price = billing === 'month' ? plan.priceMonth : plan.priceYear;
  const isCurrentPlanAndBilling = currentPlan === plan.id && currentBilling === billing;
  
  const getButtonText = () => {
    if (currentPlan === plan.id) {
      if (currentBilling === billing) {
        return t('servicesPlans.current');
      } else {
        return `${t('servicesPlans.changeTo')} ${billing === 'month' ? t('servicesPlans.monthly') : t('servicesPlans.annual')}`;
      }
    }
    return t('servicesPlans.subscribe');
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80',
        currentPlan === plan.id && 'ring-2 ring-primary border-transparent shadow-md',
        plan.popular && 'border-primary shadow-sm'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground shadow-sm">
            {t('servicesPlans.recommended')}
          </Badge>
        </div>
      )}

      {currentPlan === plan.id && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge variant="outline" className="bg-background shadow-sm border-emerald-500 text-emerald-600">
            {t('servicesPlans.current')}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pt-6 pb-4 border-b border-border/40 bg-muted/20 rounded-t-xl">
        <div className="mx-auto mb-3 p-2.5 bg-background border border-border rounded-lg w-fit shadow-sm text-primary">
          {plan.icon}
        </div>
        <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-sm px-2 line-clamp-2 min-h-[40px]">
          {plan.description}
        </CardDescription>
        
        {plan.id !== 'free' && (
          <div className="pt-3 pb-2">
            <Tabs 
              value={billing} 
              onValueChange={(v) => setBilling(v as 'month' | 'year')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="month" className="text-xs">{t('servicesPlans.monthly')}</TabsTrigger>
                <TabsTrigger value="year" className="text-xs gap-1">
                  {t('servicesPlans.annual')}
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
              /{billing === 'month' ? t('servicesPlans.month') : t('servicesPlans.year')}
            </span>
          </div>
          {billing === 'year' && plan.id !== 'free' && (
            <p className="text-[11px] text-green-600 font-medium mt-1">
              {t('servicesPlans.savePerYear', { amount: `$${Math.round(plan.priceMonth * 12 * 0.1)}` })}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6 pb-6 px-6 flex-1">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('servicesPlans.usageLimits')}
          </div>
          <div className="space-y-1.5 text-sm text-foreground/90">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {plan.limits.users === 'unlimited' 
                  ? t('servicesPlans.unlimitedUsers')
                  : `${plan.limits.users} ${plan.limits.users > 1 ? t('servicesPlans.users') : t('servicesPlans.user')}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {plan.limits.clients === 'unlimited' 
                  ? t('servicesPlans.unlimitedClients')
                  : `${plan.limits.clients} ${t('servicesPlans.maxClients')}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="break-words">
                {plan.limits.invoices === 'unlimited' 
                  ? t('servicesPlans.unlimitedInvoices')
                  : `${plan.limits.invoices} ${t('servicesPlans.invoicesPerMonth')}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('servicesPlans.alsoIncludes')}
          </div>
          <ul className="space-y-1.5">
            {plan.features().map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground/90">
                {feature.included ? (
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                )}
                <span className={cn("break-words", !feature.included && 'text-muted-foreground/60 line-through')}>
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

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

export function ServicesSubscriptionPlans({ 
  businessId, 
  currentPlan = 'free',
  currentStatus = 'active',
  isAdmin = false
}: ServicesSubscriptionPlansProps) {
  const { t } = useTranslation();
  const [internalSelectedPlan, setInternalSelectedPlan] = useState(currentPlan);
  const [changingPlan, setChangingPlan] = useState(false);

  const plansConfig = [
    {
      id: 'free',
      name: 'Free Trial',
      priceMonth: 0,
      priceYear: 0,
      description: '30-day trial with basic features',
      icon: <Sparkles className="w-5 h-5" />,
      limits: { users: 1, clients: 100, invoices: 50 },
      features: () => [
        { key: 'validFor30Days', label: t('servicesPlans.validFor30Days'), included: true },
        { key: 'clientManagement', label: t('servicesPlans.clientInvoiceManagement'), included: true },
        { key: 'emailNotifications', label: t('servicesPlans.emailNotifications'), included: true },
        { key: 'basicReports', label: t('servicesPlans.basicReports'), included: true },
        { key: 'basicSupport', label: t('servicesPlans.basicSupport'), included: true },
        { key: 'advancedReports', label: t('servicesPlans.advancedReports'), included: false },
        { key: 'inventory', label: t('servicesPlans.inventoryManagement'), included: false },
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      priceMonth: 29,
      priceYear: Math.round(29 * 12 * 0.9), // $313 (10% descuento)
      description: 'Perfect for independent professionals',
      icon: <Wrench className="w-5 h-5" />,
      popular: true,
      limits: { users: 3, clients: 500, invoices: 'unlimited' },
      features: () => [
        { key: 'allFree', label: t('servicesPlans.everythingInFreePlan'), included: true },
        { key: 'unlimitedInvoices', label: t('servicesPlans.unlimitedInvoices'), included: true },
        { key: 'emailNotifications', label: t('servicesPlans.emailNotifications'), included: true },
        { key: 'advancedReports', label: t('servicesPlans.advancedReports'), included: true },
        { key: 'inventory', label: t('servicesPlans.inventoryManagement'), included: true },
        { key: 'prioritySupport', label: t('servicesPlans.prioritySupport'), included: true },
        { key: 'apiIntegration', label: t('servicesPlans.apiIntegration'), included: false },
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceMonth: 99,
      priceYear: Math.round(99 * 12 * 0.9), // $1069 (10% descuento)
      description: 'For growing businesses',
      icon: <Crown className="w-5 h-5" />,
      limits: { users: 'unlimited', clients: 'unlimited', invoices: 'unlimited' },
      features: () => [
        { key: 'allProfessional', label: t('servicesPlans.everythingInProfessionalPlan'), included: true },
        { key: 'unlimitedUsers', label: t('servicesPlans.unlimitedUsers'), included: true },
        { key: 'unlimitedClients', label: t('servicesPlans.unlimitedClients'), included: true },
        { key: 'apiIntegration', label: t('servicesPlans.apiIntegration'), included: true },
        { key: 'customization', label: t('servicesPlans.fullCustomization'), included: true },
        { key: 'dedicatedSupport', label: t('servicesPlans.dedicatedSupport'), included: true },
        { key: 'sla', label: t('servicesPlans.guaranteedSLA'), included: true },
      ]
    }
  ];

  const handleSelectPlan = async (planId: string, billing: 'month' | 'year') => {
    console.log('Plan seleccionado:', planId, 'Billing:', billing);
    
    setInternalSelectedPlan(planId);
    
    if (planId === currentPlan) {
      toast.info(t('servicesPlans.alreadySubscribed'));
      return;
    }

    setChangingPlan(true);

    try {
      if (planId === 'free') {
        toast.info(t('servicesPlans.contactSupport'));
        setChangingPlan(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/stripe/create-services-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          planId,
          billing,
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
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error(`Error al cambiar el plan: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setChangingPlan(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('servicesPlans.chooseYourPlan')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('servicesPlans.selectPlanDescription')}
          </p>
        </div>

        {isAdmin && (
          <Badge variant="secondary" className="mt-2 animate-pulse">
            {t('servicesPlans.adminMode')}
          </Badge>
        )}
        
        {changingPlan && (
          <Badge variant="secondary" className="mt-2 animate-pulse">
            {t('servicesPlans.processing')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
        {plansConfig.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={internalSelectedPlan === plan.id}
            onSelectPlan={handleSelectPlan}
            currentPlan={currentPlan}
            currentBilling="month"
          />
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p className="bg-muted/50 p-3 rounded-lg max-w-2xl mx-auto border border-border/60">
          {t('servicesPlans.info.cancel')} {t('servicesPlans.info.secure')}
        </p>
      </div>
    </div>
  );
}

















