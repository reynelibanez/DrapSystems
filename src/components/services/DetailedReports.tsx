import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Receipt, 
  Percent,
  FileText,
  Users,
  BarChart3,
  Download,
  Search
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface DetailedReportData {
  // Resumen General
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  cancelledInvoices: number;
  
  // Ingresos
  grossRevenue: number;        // Subtotal de todas las facturas pagadas
  taxAmount: number;            // Total de impuestos cobrados
  discountAmount: number;       // Total de descuentos aplicados
  netRevenue: number;           // Total final cobrado (gross + tax - discount)
  
  // Gastos
  totalCommissions: number;     // Total de comisiones a trabajadores
  
  // Ganancias
  profitBeforeTax: number;      // Ganancia antes de impuestos
  profitAfterTax: number;       // Ganancia después de impuestos
  profitMargin: number;         // Margen de ganancia %
  
  // Por Servicio
  serviceBreakdown: Array<{
    service_name: string;
    quantity_sold: number;
    gross_sales: number;
    commission_paid: number;
    net_profit: number;
  }>;
  
  // Por Trabajador
  staffBreakdown: Array<{
    staffId: string;
    staff_name: string;
    invoices_count: number;
    total_sales: number;
    total_commission: number;
    average_commission_rate: number;
  }>;
  
  // Por Factura
  invoiceDetails: Array<{
    invoice_number: string;
    invoice_date: string;
    client_name: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    commission_total: number;
    net_profit: number;
    status: string;
  }>;
}

export function DetailedReports() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [allStaff, setAllStaff] = useState<Array<{ id: string; full_name: string }>>([]);
  const [searchTermInvoices, setSearchTermInvoices] = useState('');
  const [reportData, setReportData] = useState<DetailedReportData>({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    cancelledInvoices: 0,
    grossRevenue: 0,
    taxAmount: 0,
    discountAmount: 0,
    netRevenue: 0,
    totalCommissions: 0,
    profitBeforeTax: 0,
    profitAfterTax: 0,
    profitMargin: 0,
    serviceBreakdown: [],
    staffBreakdown: [],
    invoiceDetails: [],
  });

  useEffect(() => {
    loadStaff();
  }, [profile?.business_id]);

  const loadStaff = async () => {
    if (!profile?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('business_id', profile.business_id)
        .order('full_name');

      if (error) throw error;
      setAllStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  useEffect(() => {
    if (profile?.business_id) {
      loadReport();
    }
  }, [dateRange, profile?.business_id, selectedStaffId]);

  const loadReport = async () => {
    if (!profile?.business_id) return;

    try {
      setLoading(true);

      // Cargar facturas del período
      const { data: invoices, error: invoicesError } = await supabase
        .from('service_invoices')
        .select('*')
        .eq('business_id', profile.business_id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');

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

      // 3. Obtener información de servicios
      const serviceIds = [...new Set(invoiceItems.map(item => item.service_id).filter(Boolean))];
      let servicesMap = new Map<string, string>();
      
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        servicesMap = new Map(servicesData?.map(s => [s.id, s.name]) || []);
      }

      // 4. Obtener información de clientes
      const clientIds = [...new Set(invoices?.map(inv => inv.client_id).filter(Boolean))];
      let clientsMap = new Map<string, string>();
      
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, full_name')
          .in('id', clientIds);

        clientsMap = new Map(clientsData?.map(c => [c.id, c.full_name]) || []);
      }

      // 5. Obtener información de staff
      const staffIds = [...new Set(invoiceItems.map(item => item.staff_id).filter(Boolean))];
      let staffMap = new Map<string, string>();
      
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', staffIds);

        staffMap = new Map(staffData?.map(s => [s.id, s.full_name]) || []);
      }

      // 6. Procesar datos
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending') || [];
      const cancelledInvoices = invoices?.filter(inv => inv.status === 'cancelled') || [];

      // Calcular totales de ingresos (solo facturas pagadas)
      const grossRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
      const taxAmount = paidInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
      const discountAmount = paidInvoices.reduce((sum, inv) => sum + (inv.discount_amount || 0), 0);
      const netRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calcular comisiones totales (solo facturas pagadas)
      const totalCommissions = invoiceItems
        .filter(item => {
          const invoice = paidInvoices.find(inv => inv.id === item.invoice_id);
          return invoice !== undefined;
        })
        .reduce((sum, item) => sum + (item.commission_amount || 0), 0);

      // Calcular ganancias
      const profitBeforeTax = grossRevenue - totalCommissions - discountAmount;
      const profitAfterTax = netRevenue - totalCommissions;
      const profitMargin = netRevenue > 0 ? (profitAfterTax / netRevenue) * 100 : 0;

      // Desglose por servicio
      const serviceMap = new Map<string, {
        quantity_sold: number;
        gross_sales: number;
        commission_paid: number;
      }>();

      invoiceItems.forEach(item => {
        const invoice = paidInvoices.find(inv => inv.id === item.invoice_id);
        if (!invoice) return;

        const serviceName = servicesMap.get(item.service_id) || item.description || 'Sin nombre';
        const existing = serviceMap.get(serviceName) || {
          quantity_sold: 0,
          gross_sales: 0,
          commission_paid: 0,
        };

        serviceMap.set(serviceName, {
          quantity_sold: existing.quantity_sold + (item.quantity || 0),
          gross_sales: existing.gross_sales + (item.subtotal || 0),
          commission_paid: existing.commission_paid + (item.commission_amount || 0),
        });
      });

      const serviceBreakdown = Array.from(serviceMap.entries())
        .map(([service_name, data]) => ({
          service_name,
          ...data,
          net_profit: data.gross_sales - data.commission_paid,
        }))
        .sort((a, b) => b.gross_sales - a.gross_sales);

      // Desglose por trabajador
      const staffBreakdownMap = new Map<string, {
        invoices_count: number;
        total_sales: number;
        total_commission: number;
        commission_items: number;
      }>();

      invoiceItems.forEach(item => {
        const invoice = paidInvoices.find(inv => inv.id === item.invoice_id);
        if (!invoice || !item.staff_id) return;

        const staffName = staffMap.get(item.staff_id) || 'Sin nombre';
        const existing = staffBreakdownMap.get(staffName) || {
          invoices_count: 0,
          total_sales: 0,
          total_commission: 0,
          commission_items: 0,
        };

        staffBreakdownMap.set(staffName, {
          invoices_count: existing.invoices_count + 1,
          total_sales: existing.total_sales + (item.subtotal || 0),
          total_commission: existing.total_commission + (item.commission_amount || 0),
          commission_items: existing.commission_items + 1,
        });
      });

      const staffBreakdown = Array.from(staffBreakdownMap.entries())
        .map(([staff_name, data]) => {
          // Encontrar el ID del staff por su nombre
          const staffEntry = Array.from(staffMap.entries()).find(([id, name]) => name === staff_name);
          const staffId = staffEntry ? staffEntry[0] : '';
          
          return {
            staffId,
            staff_name,
            invoices_count: data.invoices_count,
            total_sales: data.total_sales,
            total_commission: data.total_commission,
            average_commission_rate: data.total_sales > 0 
              ? (data.total_commission / data.total_sales) * 100 
              : 0,
          };
        })
        .sort((a, b) => b.total_commission - a.total_commission);

      // Desglose por factura
      const invoiceDetails = invoices?.map(invoice => {
        const items = invoiceItems.filter(item => item.invoice_id === invoice.id);
        const commission_total = items.reduce((sum, item) => sum + (item.commission_amount || 0), 0);
        const net_profit = invoice.status === 'paid' 
          ? (invoice.total || 0) - commission_total 
          : 0;

        return {
          invoice_number: invoice.invoice_number || 'N/A',
          invoice_date: invoice.invoice_date,
          client_name: clientsMap.get(invoice.client_id) || 'Sin nombre',
          subtotal: invoice.subtotal || 0,
          tax_amount: invoice.tax_amount || 0,
          discount_amount: invoice.discount_amount || 0,
          total: invoice.total || 0,
          commission_total,
          net_profit,
          status: invoice.status,
        };
      }) || [];

      setReportData({
        totalInvoices: invoices?.length || 0,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        cancelledInvoices: cancelledInvoices.length,
        grossRevenue,
        taxAmount,
        discountAmount,
        netRevenue,
        totalCommissions,
        profitBeforeTax,
        profitAfterTax,
        profitMargin,
        serviceBreakdown,
        staffBreakdown,
        invoiceDetails,
      });
    } catch (error: any) {
      console.error('Error loading detailed report:', error);
      toast.error(t('servicesModule.detailedReports.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar facturas según el término de búsqueda
  const filteredInvoiceDetails = reportData.invoiceDetails.filter((invoice) => {
    if (!searchTermInvoices) return true;
    
    const search = searchTermInvoices.toLowerCase();
    const invoiceNumber = invoice.invoice_number.toLowerCase();
    const clientName = invoice.client_name.toLowerCase();
    const status = invoice.status.toLowerCase();
    
    return (
      invoiceNumber.includes(search) ||
      clientName.includes(search) ||
      status.includes(search)
    );
  });

  const exportToCSV = () => {
    // Crear CSV con los datos del reporte
    const csvData = [
      [t('servicesModule.detailedReports.csv.title')],
      [`${t('servicesModule.detailedReports.csv.period')}: ${dateRange.start} ${t('servicesModule.detailedReports.csv.to')} ${dateRange.end}`],
      [''],
      [t('servicesModule.detailedReports.csv.generalSummary')],
      [t('servicesModule.detailedReports.csv.totalInvoices'), reportData.totalInvoices],
      [t('servicesModule.detailedReports.csv.paidInvoices'), reportData.paidInvoices],
      [t('servicesModule.detailedReports.csv.pendingInvoices'), reportData.pendingInvoices],
      [t('servicesModule.detailedReports.csv.cancelledInvoices'), reportData.cancelledInvoices],
      [''],
      [t('servicesModule.detailedReports.csv.income')],
      [t('servicesModule.detailedReports.csv.grossIncome'), `$${reportData.grossRevenue.toFixed(2)}`],
      [t('servicesModule.detailedReports.csv.taxesCollected'), `$${reportData.taxAmount.toFixed(2)}`],
      [t('servicesModule.detailedReports.csv.discountsApplied'), `$${reportData.discountAmount.toFixed(2)}`],
      [t('servicesModule.detailedReports.csv.netIncome'), `$${reportData.netRevenue.toFixed(2)}`],
      [''],
      [t('servicesModule.detailedReports.csv.expenses')],
      [t('servicesModule.detailedReports.csv.workerCommissions'), `$${reportData.totalCommissions.toFixed(2)}`],
      [''],
      [t('servicesModule.detailedReports.csv.profits')],
      [t('servicesModule.detailedReports.csv.profitBeforeTax'), `$${reportData.profitBeforeTax.toFixed(2)}`],
      [t('servicesModule.detailedReports.csv.profitAfterTax'), `$${reportData.profitAfterTax.toFixed(2)}`],
      [t('servicesModule.detailedReports.csv.profitMargin'), `${reportData.profitMargin.toFixed(2)}%`],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    
    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-detallado-${dateRange.start}-${dateRange.end}.csv`;
    
    // Agregar al DOM, hacer click y remover
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar el URL después de un pequeño delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success(t('servicesModule.detailedReports.reportExported'));
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>{t('servicesModule.detailedReports.title')}</CardTitle>
          <CardDescription>{t('servicesModule.detailedReports.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start_date">{t('servicesModule.detailedReports.startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="end_date">{t('servicesModule.detailedReports.endDate')}</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <Button onClick={loadReport} disabled={loading}>
              {loading ? t('servicesModule.detailedReports.loading') : t('servicesModule.detailedReports.generateReport')}
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              {t('servicesModule.detailedReports.exportCSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">{t('servicesModule.detailedReports.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="services">{t('servicesModule.detailedReports.tabs.services')}</TabsTrigger>
          <TabsTrigger value="staff">{t('servicesModule.detailedReports.tabs.staff')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('servicesModule.detailedReports.tabs.invoices')}</TabsTrigger>
        </TabsList>

        {/* TAB: Resumen General */}
        <TabsContent value="summary" className="space-y-4">
          {/* Gráficas principales */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfica de Ingresos vs Gastos vs Ganancias */}
            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.financialSummary')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.financialComparison')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: t('servicesModule.detailedReports.summary.financial'),
                        [t('servicesModule.detailedReports.summary.netIncome')]: reportData.netRevenue,
                        [t('servicesModule.detailedReports.summary.commissions')]: reportData.totalCommissions,
                        [t('servicesModule.detailedReports.summary.netProfit')]: reportData.profitAfterTax,
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey={t('servicesModule.detailedReports.summary.netIncome')} fill="#22c55e" />
                    <Bar dataKey={t('servicesModule.detailedReports.summary.commissions')} fill="#ef4444" />
                    <Bar dataKey={t('servicesModule.detailedReports.summary.netProfit')} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de Estado de Facturas */}
            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.invoiceStatus')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.statusDistribution')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('servicesModule.detailedReports.summary.paid'), value: reportData.paidInvoices, color: '#22c55e' },
                        { name: t('servicesModule.detailedReports.summary.pending'), value: reportData.pendingInvoices, color: '#f59e0b' },
                        { name: t('servicesModule.detailedReports.summary.cancelled'), value: reportData.cancelledInvoices, color: '#ef4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: t('servicesModule.detailedReports.summary.paid'), value: reportData.paidInvoices, color: '#22c55e' },
                        { name: t('servicesModule.detailedReports.summary.pending'), value: reportData.pendingInvoices, color: '#f59e0b' },
                        { name: t('servicesModule.detailedReports.summary.cancelled'), value: reportData.cancelledInvoices, color: '#ef4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de Desglose de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.incomeBreakdown')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.incomeComponents')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: t('servicesModule.detailedReports.summary.subtotal'), value: reportData.grossRevenue },
                      { name: t('servicesModule.detailedReports.summary.taxes'), value: reportData.taxAmount },
                      { name: t('servicesModule.detailedReports.summary.discounts'), value: -reportData.discountAmount },
                      { name: t('servicesModule.detailedReports.summary.netTotal'), value: reportData.netRevenue },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number) => `$${Math.abs(value).toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" fill="#5AC1FF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de Margen de Ganancia */}
            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.profitabilityAnalysis')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.profitMarginDistribution')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {reportData.profitMargin.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">{t('servicesModule.detailedReports.summary.profitMargin')}</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('servicesModule.detailedReports.summary.profit'), value: reportData.profitAfterTax, color: '#22c55e' },
                          { name: t('servicesModule.detailedReports.summary.commissions'), value: reportData.totalCommissions, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: t('servicesModule.detailedReports.summary.profit'), value: reportData.profitAfterTax, color: '#22c55e' },
                          { name: t('servicesModule.detailedReports.summary.commissions'), value: reportData.totalCommissions, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle>{t('servicesModule.detailedReports.summary.incomeBreakdownDetail')}</CardTitle>
              <CardDescription>{t('servicesModule.detailedReports.summary.incomeAnalysis')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">{t('servicesModule.detailedReports.summary.grossIncome')}</span>
                  <span className="text-lg font-bold">${reportData.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    {t('servicesModule.detailedReports.summary.taxesCollected')}
                  </span>
                  <span className="font-semibold">+${reportData.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    {t('servicesModule.detailedReports.summary.discountsApplied')}
                  </span>
                  <span className="font-semibold">-${reportData.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold">{t('servicesModule.detailedReports.summary.totalNetIncome')}</span>
                  <span className="text-xl font-bold text-green-600">
                    ${reportData.netRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desglose de Gastos y Ganancias */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.expenses')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.expensesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>{t('servicesModule.detailedReports.summary.workerCommissions')}</span>
                    <span className="font-bold text-destructive">
                      ${reportData.totalCommissions.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">{t('servicesModule.detailedReports.summary.totalExpenses')}</span>
                    <span className="text-lg font-bold text-destructive">
                      ${reportData.totalCommissions.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('servicesModule.detailedReports.summary.profits')}</CardTitle>
                <CardDescription>{t('servicesModule.detailedReports.summary.profitsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>{t('servicesModule.detailedReports.summary.profitBeforeTax')}</span>
                    <span className="font-semibold">
                      ${reportData.profitBeforeTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('servicesModule.detailedReports.summary.profitAfterTax')}</span>
                    <span className="font-semibold">
                      ${reportData.profitAfterTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">{t('servicesModule.detailedReports.summary.profitMargin')}</span>
                    <span className="text-lg font-bold text-green-600">
                      {reportData.profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Por Servicio */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>{t('servicesModule.detailedReports.services.title')}</CardTitle>
              <CardDescription>{t('servicesModule.detailedReports.services.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.serviceBreakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('servicesModule.detailedReports.services.noData')}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm">
                    <div>{t('servicesModule.detailedReports.services.service')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.services.quantity')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.services.sales')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.services.commissions')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.services.profit')}</div>
                  </div>
                  {reportData.serviceBreakdown.map((service, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium">{service.service_name}</div>
                      <div className="text-right text-muted-foreground">
                        {service.quantity_sold}
                      </div>
                      <div className="text-right font-semibold">
                        ${service.gross_sales.toFixed(2)}
                      </div>
                      <div className="text-right text-destructive">
                        ${service.commission_paid.toFixed(2)}
                      </div>
                      <div className="text-right font-bold text-green-600">
                        ${service.net_profit.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-5 gap-4 pt-4 border-t font-bold">
                    <div>{t('servicesModule.detailedReports.services.total')}</div>
                    <div className="text-right">
                      {reportData.serviceBreakdown.reduce((sum, s) => sum + s.quantity_sold, 0)}
                    </div>
                    <div className="text-right">
                      ${reportData.serviceBreakdown.reduce((sum, s) => sum + s.gross_sales, 0).toFixed(2)}
                    </div>
                    <div className="text-right text-destructive">
                      ${reportData.serviceBreakdown.reduce((sum, s) => sum + s.commission_paid, 0).toFixed(2)}
                    </div>
                    <div className="text-right text-green-600">
                      ${reportData.serviceBreakdown.reduce((sum, s) => sum + s.net_profit, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Por Trabajador */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>{t('servicesModule.detailedReports.staff.title')}</CardTitle>
              <CardDescription>{t('servicesModule.detailedReports.staff.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="staff-filter-worker">{t('servicesModule.detailedReports.staff.filterByWorker')}</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger id="staff-filter-worker" className="mt-2">
                    <SelectValue placeholder={t('servicesModule.detailedReports.staff.allWorkers')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('servicesModule.detailedReports.staff.allWorkers')}</SelectItem>
                    {allStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportData.staffBreakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('servicesModule.detailedReports.staff.noData')}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm">
                    <div>{t('servicesModule.detailedReports.staff.worker')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.staff.services')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.staff.sales')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.staff.commission')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.staff.averagePercent')}</div>
                  </div>
                  {reportData.staffBreakdown
                    .filter(staff => selectedStaffId === 'all' || staff.staffId === selectedStaffId)
                    .map((staff, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium">{staff.staff_name}</div>
                      <div className="text-right text-muted-foreground">
                        {staff.invoices_count}
                      </div>
                      <div className="text-right font-semibold">
                        ${staff.total_sales.toFixed(2)}
                      </div>
                      <div className="text-right font-bold text-destructive">
                        ${staff.total_commission.toFixed(2)}
                      </div>
                      <div className="text-right text-muted-foreground">
                        {staff.average_commission_rate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-5 gap-4 pt-4 border-t font-bold">
                    <div>{t('servicesModule.detailedReports.staff.total')}</div>
                    <div className="text-right">
                      {reportData.staffBreakdown
                        .filter(staff => selectedStaffId === 'all' || staff.staffId === selectedStaffId)
                        .reduce((sum, s) => sum + s.invoices_count, 0)}
                    </div>
                    <div className="text-right">
                      ${reportData.staffBreakdown
                        .filter(staff => selectedStaffId === 'all' || staff.staffId === selectedStaffId)
                        .reduce((sum, s) => sum + s.total_sales, 0).toFixed(2)}
                    </div>
                    <div className="text-right text-destructive">
                      ${reportData.staffBreakdown
                        .filter(staff => selectedStaffId === 'all' || staff.staffId === selectedStaffId)
                        .reduce((sum, s) => sum + s.total_commission, 0).toFixed(2)}
                    </div>
                    <div className="text-right">
                      {(() => {
                        const filteredStaff = reportData.staffBreakdown
                          .filter(staff => selectedStaffId === 'all' || staff.staffId === selectedStaffId);
                        return filteredStaff.length > 0
                          ? (filteredStaff.reduce((sum, s) => sum + s.average_commission_rate, 0) / filteredStaff.length).toFixed(1)
                          : '0.0';
                      })()}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Por Factura */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>{t('servicesModule.detailedReports.invoices.title')}</CardTitle>
              <CardDescription>{t('servicesModule.detailedReports.invoices.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Campo de búsqueda */}
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('servicesModule.invoiceManagement.searchPlaceholder')}
                    value={searchTermInvoices}
                    onChange={(e) => setSearchTermInvoices(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredInvoiceDetails.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchTermInvoices 
                    ? t('servicesModule.invoiceManagement.noResultsFound')
                    : t('servicesModule.detailedReports.invoices.noData')
                  }
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2 pb-2 border-b font-semibold text-xs sticky top-0 bg-background">
                    <div>{t('servicesModule.detailedReports.invoices.invoice')}</div>
                    <div>{t('servicesModule.detailedReports.invoices.date')}</div>
                    <div>{t('servicesModule.detailedReports.invoices.client')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.invoices.subtotal')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.invoices.tax')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.invoices.discount')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.invoices.total')}</div>
                    <div className="text-right">{t('servicesModule.detailedReports.invoices.profit')}</div>
                  </div>
                  {filteredInvoiceDetails.map((invoice, index) => (
                    <div 
                      key={index} 
                      className={`grid grid-cols-8 gap-2 items-center text-sm py-2 border-b ${
                        invoice.status === 'cancelled' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="truncate text-xs">{invoice.client_name}</div>
                      <div className="text-right">${invoice.subtotal.toFixed(2)}</div>
                      <div className="text-right text-green-600 text-xs">
                        +${invoice.tax_amount.toFixed(2)}
                      </div>
                      <div className="text-right text-destructive text-xs">
                        -${invoice.discount_amount.toFixed(2)}
                      </div>
                      <div className="text-right font-semibold">
                        ${invoice.total.toFixed(2)}
                      </div>
                      <div className="text-right font-bold text-green-600">
                        ${invoice.net_profit.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

