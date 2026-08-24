/**
 * Componente: Tarjeta de Uso de SMS
 * 
 * Muestra el uso actual de SMS, límites, y cargos estimados
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MessageSquare, AlertTriangle, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { baseUrl } from '../../lib/base-url';

interface SMSStats {
  currentUsage: number;
  limit: number;
  excess: number;
  usagePercentage: number;
  estimatedCharge: number;
  totalHistoricalCharges: number;
  chargesCount: number;
  currentPeriodStart: string;
  daysRemaining: number;
  pricePerSMS: number;
  plan: string;
  isUnlimited: boolean;
}

interface SMSCharge {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  sms_excess: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface SMSUsageCardProps {
  businessId: string;
  onUpgrade?: () => void;
}

export function SMSUsageCard({ businessId, onUpgrade }: SMSUsageCardProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [charges, setCharges] = useState<SMSCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSMSStats();
  }, [businessId]);

  const loadSMSStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('supabase_token');
      const response = await fetch(
        `${baseUrl}/api/business/sms-stats?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load SMS stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setCharges(data.charges || []);
    } catch (err) {
      console.error('Error loading SMS stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('sms.usage.title', 'SMS Usage')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('sms.usage.title', 'SMS Usage')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            {t('sms.usage.error', 'Error loading SMS usage')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (stats.isUnlimited) return 'text-green-600';
    if (stats.excess > 0) return 'text-red-600';
    if (stats.usagePercentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (stats.isUnlimited) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (stats.excess > 0) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (stats.usagePercentage >= 80) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusMessage = () => {
    if (stats.isUnlimited) {
      return t('sms.usage.unlimited', 'Unlimited SMS');
    }
    if (stats.excess > 0) {
      return t('sms.usage.exceeded', 'Limit exceeded - Additional charges apply');
    }
    if (stats.usagePercentage >= 80) {
      return t('sms.usage.nearLimit', 'Near limit');
    }
    return t('sms.usage.normal', 'Normal usage');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('sms.usage.title', 'SMS Usage')}
        </CardTitle>
        <CardDescription>
          {t('sms.usage.description', 'Track your SMS usage and charges')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          </div>
          {!stats.isUnlimited && stats.limit === 0 && (
            <Button size="sm" onClick={onUpgrade}>
              {t('sms.usage.upgrade', 'Upgrade Plan')}
            </Button>
          )}
        </div>

        {/* Uso actual */}
        {!stats.isUnlimited && stats.limit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('sms.usage.current', 'Current Usage')}
              </span>
              <span className="font-medium">
                {stats.currentUsage} / {stats.limit} SMS
              </span>
            </div>
            <Progress value={Math.min(stats.usagePercentage, 100)} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.usagePercentage.toFixed(1)}% {t('sms.usage.used', 'used')}</span>
              <span>
                {stats.daysRemaining} {t('sms.usage.daysRemaining', 'days remaining')}
              </span>
            </div>
          </div>
        )}

        {/* Plan ilimitado */}
        {stats.isUnlimited && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {t('sms.usage.unlimitedTitle', 'Unlimited SMS')}
                </p>
                <p className="text-sm">
                  {t('sms.usage.unlimitedDesc', 'Your plan includes unlimited SMS messages')}
                </p>
                <p className="text-xs mt-1">
                  {t('sms.usage.currentMonth', 'This month')}: {stats.currentUsage} SMS {t('sms.usage.sent', 'sent')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Exceso y cargo estimado */}
        {!stats.isUnlimited && stats.excess > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {t('sms.usage.excessTitle', 'SMS Overage')}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{t('sms.usage.excessSMS', 'Excess SMS')}:</span>
                <span className="font-medium">{stats.excess} SMS</span>
              </div>
              <div className="flex justify-between">
                <span>{t('sms.usage.pricePerSMS', 'Price per SMS')}:</span>
                <span className="font-medium">${stats.pricePerSMS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-red-200 dark:border-red-800 pt-1 mt-1">
                <span className="font-medium">{t('sms.usage.estimatedCharge', 'Estimated Charge')}:</span>
                <span className="font-bold">${stats.estimatedCharge.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-red-600 dark:text-red-400">
              {t('sms.usage.chargeNote', 'This amount will be charged at the end of the billing period')}
            </p>
          </div>
        )}

        {/* Plan sin SMS */}
        {!stats.isUnlimited && stats.limit === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {t('sms.usage.notIncluded', 'SMS Not Included')}
                </p>
                <p className="text-sm">
                  {t('sms.usage.upgradeMessage', 'Upgrade to Business or Enterprise plan to send SMS')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historial de cargos */}
        {stats.chargesCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('sms.usage.chargeHistory', 'Charge History')}
              </h4>
              <Badge variant="secondary">
                {stats.chargesCount} {t('sms.usage.charges', 'charges')}
              </Badge>
            </div>
            <div className="text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('sms.usage.totalCharged', 'Total Charged')}:</span>
                <span className="font-medium text-foreground">
                  ${stats.totalHistoricalCharges.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Últimos cargos */}
            {charges.length > 0 && (
              <div className="space-y-2 mt-4">
                <h5 className="text-xs font-medium text-muted-foreground">
                  {t('sms.usage.recentCharges', 'Recent Charges')}
                </h5>
                <div className="space-y-2">
                  {charges.slice(0, 3).map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {new Date(charge.billing_period_start).toLocaleDateString()}
                        </span>
                        <Badge
                          variant={
                            charge.status === 'paid'
                              ? 'default'
                              : charge.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {charge.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${charge.total_amount.toFixed(2)}</div>
                        <div className="text-muted-foreground">
                          {charge.sms_excess} SMS
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
