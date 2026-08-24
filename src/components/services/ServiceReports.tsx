import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface ReportData {
  totalRevenue: number;
  totalCommissions: number;
  netProfit: number;
  invoiceCount: number;
  paidInvoices: number;
  pendingInvoices: number;
  topServices: Array<{
    service_name: string;
    total_sales: number;
    quantity_sold: number;
  }>;
  staffCommissions: Array<{
    staff_name: string;
    total_sales: number;
    total_commission: number;
  }>;
}

export function ServiceReports() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalCommissions: 0,
    netProfit: 0,
    invoiceCount: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    topServices: [],
    staffCommissions: [],
  });

  useEffect(() => {
    loadReportData();
  }, [profile]);

  const loadReportData = async () => {
    if (!profile?.business_id) return;

    try {
      setLoading(true);

      // 1. Obtener facturas del período
      const { data: invoices, error: invoicesError } = await supabase
        .from('service_invoices')
        .select('*')
        .eq('business_id', profile.business_id)
        .gte('invoice_date', dateRange.start)
        .lte('invoice_date', dateRange.end);

      if (invoicesError) throw invoicesError;

      // 2. Obtener items de todas las facturas
      const invoiceIds = invoices?.map(inv => inv.id) || [];
      let invoiceItems: any[] = [];
      
      if (invoiceIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('service_invoice_items')
          .select('*')
          .in('invoice_id', invoiceIds);

        if (itemsError) throw itemsError;
        invoiceItems = itemsData || [];
      }

      // 3. Obtener nombres de servicios únicos
      const serviceIds = [...new Set(invoiceItems.map(item => item.service_id).filter(Boolean))];
      let servicesMap = new Map<string, string>();
      
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        if (servicesError) throw servicesError;
        servicesMap = new Map(servicesData?.map(s => [s.id, s.name]) || []);
      }

      // 4. Combinar datos - agregar items a cada factura
      const invoicesWithItems = invoices?.map(invoice => ({
        ...invoice,
        service_invoice_items: invoiceItems
          .filter(item => item.invoice_id === invoice.id)
          .map(item => ({
            ...item,
            services: item.service_id ? { name: servicesMap.get(item.service_id) } : null
          }))
      })) || [];

      // Calcular totales
      const totalRevenue = invoicesWithItems.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.total : 0), 0);
      const totalCommissions = invoicesWithItems.reduce((sum, inv) => {
        if (inv.status !== 'paid') return sum;
        return sum + (inv.service_invoice_items?.reduce((itemSum: number, item: any) => 
          itemSum + (item.commission_amount || 0), 0) || 0);
      }, 0);
      const netProfit = totalRevenue - totalCommissions;

      const invoiceCount = invoicesWithItems.length;
      const paidInvoices = invoicesWithItems.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoicesWithItems.filter(inv => inv.status === 'pending').length;

      // Top servicios
      const serviceMap = new Map<string, { total_sales: number; quantity_sold: number }>();
      invoicesWithItems.forEach(inv => {
        if (inv.status !== 'paid') return;
        inv.service_invoice_items?.forEach((item: any) => {
          const serviceName = item.services?.name || item.description || 'Sin nombre';
          const existing = serviceMap.get(serviceName) || { total_sales: 0, quantity_sold: 0 };
          serviceMap.set(serviceName, {
            total_sales: existing.total_sales + item.subtotal,
            quantity_sold: existing.quantity_sold + item.quantity,
          });
        });
      });

      const topServices = Array.from(serviceMap.entries())
        .map(([service_name, data]) => ({ service_name, ...data }))
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5);

      // Comisiones por staff
      const staffMap = new Map<string, { total_sales: number; total_commission: number }>();
      
      // Obtener nombres de staff
      const staffIds = new Set<string>();
      invoicesWithItems.forEach(inv => {
        if (inv.status !== 'paid') return;
        inv.service_invoice_items?.forEach((item: any) => {
          if (item.staff_id) staffIds.add(item.staff_id);
        });
      });

      if (staffIds.size > 0) {
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(staffIds));

        const staffNameMap = new Map(staffProfiles?.map(p => [p.id, p.full_name]) || []);

        invoicesWithItems.forEach(inv => {
          if (inv.status !== 'paid') return;
          inv.service_invoice_items?.forEach((item: any) => {
            if (!item.staff_id) return;
            const staffName = staffNameMap.get(item.staff_id) || 'Sin nombre';
            const existing = staffMap.get(staffName) || { total_sales: 0, total_commission: 0 };
            staffMap.set(staffName, {
              total_sales: existing.total_sales + item.subtotal,
              total_commission: existing.total_commission + (item.commission_amount || 0),
            });
          });
        });
      }

      const staffCommissions = Array.from(staffMap.entries())
        .map(([staff_name, data]) => ({ staff_name, ...data }))
        .sort((a, b) => b.total_commission - a.total_commission);

      setReportData({
        totalRevenue,
        totalCommissions,
        netProfit,
        invoiceCount,
        paidInvoices,
        pendingInvoices,
        topServices,
        staffCommissions,
      });
    } catch (error: any) {
      console.error('Error loading report data:', error);
      toast.error(t('servicesModule.serviceReports.errorLoadingReports'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle>{t('servicesModule.serviceReports.reportFilters')}</CardTitle>
          <CardDescription>{t('servicesModule.serviceReports.selectPeriod')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start_date">{t('servicesModule.serviceReports.startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="end_date">{t('servicesModule.serviceReports.endDate')}</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <Button onClick={loadReportData} disabled={loading}>
              {loading ? t('servicesModule.serviceReports.loading') : t('servicesModule.serviceReports.generateReport')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('servicesModule.serviceReports.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.paidInvoices} {t('servicesModule.serviceReports.paid')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('servicesModule.serviceReports.commissions')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${reportData.totalCommissions.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('servicesModule.serviceReports.paymentsToWorkers')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('servicesModule.serviceReports.netProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${reportData.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reportData.netProfit / reportData.totalRevenue) * 100 || 0).toFixed(1)}% {t('servicesModule.serviceReports.margin')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('servicesModule.serviceReports.invoices')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.invoiceCount}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.pendingInvoices} {t('servicesModule.serviceReports.pending')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top servicios */}
      <Card>
        <CardHeader>
          <CardTitle>{t('servicesModule.serviceReports.topServices')}</CardTitle>
          <CardDescription>{t('servicesModule.serviceReports.top5Services')}</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.topServices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('servicesModule.serviceReports.noDataAvailable')}
            </p>
          ) : (
            <div className="space-y-4">
              {reportData.topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{service.service_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.quantity_sold} {t('servicesModule.serviceReports.unitsSold')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${service.total_sales.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comisiones por trabajador */}
      <Card>
        <CardHeader>
          <CardTitle>{t('servicesModule.serviceReports.commissionsByStaff')}</CardTitle>
          <CardDescription>{t('servicesModule.serviceReports.salesAndCommissionsSummary')}</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.staffCommissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('servicesModule.serviceReports.noDataAvailable')}
            </p>
          ) : (
            <div className="space-y-4">
              {reportData.staffCommissions.map((staff, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4">
                  <div className="flex-1">
                    <p className="font-medium">{staff.staff_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('servicesModule.serviceReports.sales')}: ${staff.total_sales.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      ${staff.total_commission.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((staff.total_commission / staff.total_sales) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}








