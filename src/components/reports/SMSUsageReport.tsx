import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MessageSquare, TrendingUp, DollarSign, Calendar, AlertCircle, Building2, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../AuthProvider';
import { baseUrl } from '../../lib/base-url';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SMSUsageData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  includedLimit: number;
  exceeded: number;
  costPerExceeded: number;
  totalCost: number;
  currentPlan: string;
  businessName?: string;
}

interface SMSHistoryItem {
  id: string;
  status: string;
  recipient: string;
  message: string;
  sent_at: string;
  created_at: string;
  clients?: {
    full_name: string;
    email: string;
  } | null;
}

interface Business {
  id: string;
  name: string;
  subscription_plan: string;
}

interface SMSUsageReportProps {
  businessId?: string;
}

export function SMSUsageReport({ businessId: propBusinessId }: SMSUsageReportProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<SMSUsageData | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(propBusinessId || '');
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Array de nombres de meses para traducción
  const monthNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
  ];

  useEffect(() => {
    if (isAdmin) {
      loadBusinesses();
    } else if (profile?.business_id) {
      setSelectedBusinessId(profile.business_id);
    }
  }, [isAdmin, profile]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadSMSUsage(selectedBusinessId, selectedYear, selectedMonth);
    }
  }, [selectedBusinessId, selectedYear, selectedMonth]);

  const loadBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, subscription_plan')
        .order('name');

      if (error) throw error;

      setBusinesses(data || []);
      
      if (!selectedBusinessId && data && data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError(t('smsUsageReport.errorLoading'));
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const loadSMSUsage = async (businessId: string, year: number, month: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${baseUrl}/api/reports/sms-usage?businessId=${businessId}&year=${year}&month=${month}`
      );

      if (!response.ok) {
        throw new Error(t('smsUsageReport.errorLoading'));
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || t('smsUsageReport.errorLoading'));
      }

      setUsageData({
        totalSent: data.usage.total_sent || 0,
        totalDelivered: data.usage.total_delivered || 0,
        totalFailed: data.usage.total_failed || 0,
        includedLimit: data.overage.included_sms || 0,
        exceeded: data.overage.exceeded || 0,
        costPerExceeded: data.overage.cost_per_sms || 0,
        totalCost: data.overage.total_cost || 0,
        currentPlan: data.business.plan || 'basic',
        businessName: data.business.name
      });

      setSmsHistory(data.history || []);
    } catch (err) {
      console.error('Error loading SMS usage:', err);
      setError(err instanceof Error ? err.message : t('smsUsageReport.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleFullPayment = async () => {
    if (!selectedBusinessId || !usageData) return;

    try {
      setProcessingPayment(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/stripe/create-partial-sms-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          smsCount: usageData.exceeded,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('smsUsageReport.paymentError'));
      }

      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      }
    } catch (err) {
      console.error('Error creating full payment:', err);
      setError(err instanceof Error ? err.message : t('smsUsageReport.paymentError'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> {t('smsUsageReport.statusDelivered')}</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {t('smsUsageReport.statusFailed')}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {t('smsUsageReport.statusPending')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const availableYears = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  
  const monthOptions = monthNames.map((name, index) => ({
    value: index + 1,
    label: t(`smsUsageReport.months.${name}`)
  }));

  // Obtener el nombre del mes actual traducido
  const getCurrentMonthText = () => {
    const monthName = monthNames[selectedMonth - 1];
    return `${t(`smsUsageReport.months.${monthName}`)} ${selectedYear}`;
  };

  // Obtener el nombre del plan traducido - usar namespace translation
  const { t: tRoot } = useTranslation();
  const getPlanName = (plan: string) => {
    return tRoot(`subscriptionPlans.plans.${plan}.name`);
  };

  if (isAdmin && loadingBusinesses) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSpinner />
          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('smsUsageReport.loadingBusinesses')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isAdmin && businesses.length === 0 && !loadingBusinesses) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('smsUsageReport.noBusinesses')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('smsUsageReport.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('smsUsageReport.description')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {isAdmin && (
            <Card className="flex-1">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Select
                      value={selectedBusinessId}
                      onValueChange={setSelectedBusinessId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('smsUsageReport.selectBusinessPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            <div className="flex items-center gap-2">
                              <span>{business.name}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {getPlanName(business.subscription_plan)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex gap-2 flex-1">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && usageData?.businessName && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            {t('smsUsageReport.showingDataFor')} <strong>{usageData.businessName}</strong>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !usageData ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('smsUsageReport.selectBusinessPrompt')}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('smsUsageReport.smsSent')}
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.totalSent}</div>
                <p className="text-xs text-muted-foreground">
                  {t('smsUsageReport.smsLimit')}: {usageData.includedLimit === 999999 ? t('smsUsageReport.unlimited') : usageData.includedLimit}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('smsUsageReport.planUsage')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData.includedLimit > 0 
                    ? Math.round((usageData.totalSent / usageData.includedLimit) * 100)
                    : 0}%
                </div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      usageData.includedLimit > 0 && (usageData.totalSent / usageData.includedLimit) * 100 > 100 ? 'bg-destructive' : 
                      usageData.includedLimit > 0 && (usageData.totalSent / usageData.includedLimit) * 100 > 80 ? 'bg-amber-500' : 
                      'bg-primary'
                    }`}
                    style={{ 
                      width: `${usageData.includedLimit > 0 
                        ? Math.min((usageData.totalSent / usageData.includedLimit) * 100, 100)
                        : 0}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('smsUsageReport.smsExceeded')}
                </CardTitle>
                <AlertCircle className={`h-4 w-4 ${usageData.exceeded > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${usageData.exceeded > 0 ? 'text-destructive' : ''}`}>
                  {usageData.exceeded}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('smsUsageReport.overLimit')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('smsUsageReport.additionalCost')}
                </CardTitle>
                <DollarSign className={`h-4 w-4 ${usageData.exceeded > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${usageData.exceeded > 0 ? 'text-destructive' : ''}`}>
                  ${usageData.totalCost.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('smsUsageReport.costPerSMS')}: ${usageData.costPerExceeded.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('smsUsageReport.periodDetails')}
              </CardTitle>
              <CardDescription>
                {t('smsUsageReport.detailedInfo', { month: getCurrentMonthText() })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.currentPlan')}:
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {getPlanName(usageData.currentPlan)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.includedSMS')}:
                    </span>
                    <span className="text-sm">
                      {usageData.includedLimit === 999999 
                        ? t('smsUsageReport.unlimited') 
                        : usageData.includedLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.smsSent')}:
                    </span>
                    <span className="text-sm font-bold">{usageData.totalSent.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.exceededSMS')}:
                    </span>
                    <span className={`text-sm font-bold ${usageData.exceeded > 0 ? 'text-destructive' : ''}`}>
                      {usageData.exceeded}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.costPerExcess')}:
                    </span>
                    <span className="text-sm">${usageData.costPerExceeded.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('smsUsageReport.totalToPay')}:
                    </span>
                    <span className={`text-sm font-bold ${usageData.exceeded > 0 ? 'text-destructive' : ''}`}>
                      ${usageData.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {usageData.exceeded > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('smsUsageReport.exceededAlert', { 
                      exceeded: usageData.exceeded.toLocaleString(),
                      cost: usageData.totalCost.toFixed(2)
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {usageData.exceeded > 0 && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('smsUsageReport.paymentOptions')}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('smsUsageReport.paymentOptionsDescription')}
                      </p>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto">
                    {/* Pago Total */}
                    <div className="space-y-3 p-4 border rounded-lg bg-background border-primary/50">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{t('smsUsageReport.fullPayment')}</h5>
                        <Badge>{t('smsUsageReport.recommended')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('smsUsageReport.fullPaymentDescription')}
                      </p>
                      
                      <div className="space-y-2 py-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t('smsUsageReport.totalExceeded')}:</span>
                          <span className="font-medium">{usageData.exceeded.toLocaleString()} SMS</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t('smsUsageReport.costPerSMS')}:</span>
                          <span className="font-medium">${usageData.costPerExceeded.toFixed(3)}</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{t('smsUsageReport.totalAmount')}:</span>
                          <span className="text-2xl font-bold text-primary">
                            ${usageData.totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleFullPayment}
                        disabled={processingPayment}
                        className="w-full"
                      >
                        {processingPayment ? (
                          <>
                            <LoadingSpinner />
                            {t('smsUsageReport.processing')}
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            {t('smsUsageReport.payFull')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {t('smsUsageReport.paymentNote')}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {usageData.exceeded === 0 && usageData.includedLimit > 0 && (usageData.totalSent / usageData.includedLimit) * 100 > 80 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('smsUsageReport.highUsageWarning', { 
                      percentage: Math.round((usageData.totalSent / usageData.includedLimit) * 100),
                      remaining: (usageData.includedLimit - usageData.totalSent).toLocaleString()
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {usageData.exceeded === 0 && usageData.includedLimit > 0 && (usageData.totalSent / usageData.includedLimit) * 100 <= 80 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('smsUsageReport.normalUsage', { 
                      remaining: (usageData.includedLimit - usageData.totalSent).toLocaleString()
                    })}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {smsHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('smsUsageReport.smsHistory')}</CardTitle>
                <CardDescription>
                  {t('smsUsageReport.smsHistoryDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('smsUsageReport.date')}</TableHead>
                        <TableHead>{t('smsUsageReport.recipient')}</TableHead>
                        <TableHead>{t('smsUsageReport.client')}</TableHead>
                        <TableHead className="max-w-md">{t('smsUsageReport.message')}</TableHead>
                        <TableHead>{t('smsUsageReport.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smsHistory.map((sms) => (
                        <TableRow key={sms.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(sms.sent_at || sms.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{sms.recipient}</TableCell>
                          <TableCell>
                            {sms.clients ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{sms.clients.full_name}</span>
                                {sms.clients.email && (
                                  <span className="text-xs text-muted-foreground">{sms.clients.email}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t('smsUsageReport.noClient')}</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md truncate">{sms.message}</TableCell>
                          <TableCell>{getStatusBadge(sms.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : usageData && usageData.totalSent > 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('smsUsageReport.noSMSHistory')}
              </AlertDescription>
            </Alert>
          ) : usageData ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                {t('smsUsageReport.noSMSThisMonth', { month: getCurrentMonthText() })}
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      )}
    </div>
  );
}






