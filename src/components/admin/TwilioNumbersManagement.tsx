import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Phone,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { toast } from 'sonner';
import { SMSUsageReport } from '../reports/SMSUsageReport';

interface TwilioNumber {
  id: string;
  phone_number: string;
  display_name: string | null;
  sms_sent_count: number;
  sms_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export function TwilioNumbersManagement() {
  const { t } = useTranslation();
  const [numbers, setNumbers] = useState<TwilioNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [numberToDelete, setNumberToDelete] = useState<TwilioNumber | null>(null);
  const [newNumber, setNewNumber] = useState({ phone: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('twilio_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNumbers(data || []);
    } catch (err: any) {
      console.error('Error loading Twilio numbers:', err);
      setError(err.message || t('errorLoadingNumbers'));
      toast.error(t('errorLoadingNumbers'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNumber = async () => {
    if (!newNumber.phone.trim()) {
      toast.error(t('pleaseEnterPhoneNumber'));
      return;
    }

    if (!newNumber.phone.startsWith('+')) {
      toast.error(t('phoneNumberMustStartWithPlus'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('twilio_numbers')
        .insert({
          phone_number: newNumber.phone.trim(),
          display_name: newNumber.name.trim() || null,
          sms_sent_count: 0,
          sms_limit: 75,
          is_active: true
        });

      if (insertError) throw insertError;

      toast.success(t('numberAddedSuccessfully'));
      setShowAddDialog(false);
      setNewNumber({ phone: '', name: '' });
      loadNumbers();
    } catch (err: any) {
      console.error('Error adding number:', err);
      setError(err.message || t('errorAddingNumber'));
      toast.error(err.message || t('errorAddingNumber'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNumber = async () => {
    if (!numberToDelete) return;

    try {
      setSaving(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('twilio_numbers')
        .delete()
        .eq('id', numberToDelete.id);

      if (deleteError) throw deleteError;

      toast.success(t('numberDeletedSuccessfully'));
      setShowDeleteDialog(false);
      setNumberToDelete(null);
      loadNumbers();
    } catch (err: any) {
      console.error('Error deleting number:', err);
      setError(err.message || t('errorDeletingNumber'));
      toast.error(err.message || t('errorDeletingNumber'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (number: TwilioNumber) => {
    try {
      const { error: updateError } = await supabase
        .from('twilio_numbers')
        .update({ is_active: !number.is_active })
        .eq('id', number.id);

      if (updateError) throw updateError;

      toast.success(
        number.is_active ? t('numberDeactivated') : t('numberActivated')
      );
      loadNumbers();
    } catch (err: any) {
      console.error('Error toggling number status:', err);
      toast.error(t('errorUpdatingNumber'));
    }
  };

  const handleResetCounters = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('twilio_numbers')
        .update({ sms_sent_count: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (updateError) throw updateError;

      toast.success(t('countersResetSuccessfully'));
      loadNumbers();
    } catch (err: any) {
      console.error('Error resetting counters:', err);
      setError(err.message || t('errorResettingCounters'));
      toast.error(err.message || t('errorResettingCounters'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (number: TwilioNumber) => {
    const percentage = (number.sms_sent_count / number.sms_limit) * 100;

    if (!number.is_active) {
      return <Badge variant="secondary">{t('inactive')}</Badge>;
    }

    if (percentage >= 100) {
      return <Badge variant="destructive">{t('limitReached')}</Badge>;
    }

    if (percentage >= 90) {
      return <Badge className="bg-orange-500">{t('warning')}</Badge>;
    }

    if (percentage >= 70) {
      return <Badge className="bg-yellow-500">{t('caution')}</Badge>;
    }

    return <Badge variant="default">{t('ok')}</Badge>;
  };

  const getTotalStats = () => {
    const activeNumbers = numbers.filter(n => n.is_active);
    const totalSent = numbers.reduce((sum, n) => sum + n.sms_sent_count, 0);
    const totalCapacity = numbers.reduce((sum, n) => sum + n.sms_limit, 0);
    const availableCapacity = totalCapacity - totalSent;

    return {
      total: numbers.length,
      active: activeNumbers.length,
      totalSent,
      totalCapacity,
      availableCapacity,
      usagePercentage: totalCapacity > 0 ? (totalSent / totalCapacity) * 100 : 0
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de SMS</h2>
          <p className="text-muted-foreground">
            Administra números de Twilio y monitorea el uso de SMS
          </p>
        </div>
      </div>

      {/* Tabs para Números y Reportes */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('twilioNumbers.tabs.reports')}
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('twilioNumbers.tabs.management')}
          </TabsTrigger>
        </TabsList>

        {/* Tab de Reportes Mensuales */}
        <TabsContent value="reports" className="mt-6">
          <SMSUsageReport />
        </TabsContent>

        {/* Tab de Gestión de Números SMS */}
        <TabsContent value="management" className="mt-6">
          <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('totalNumbers')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.active} {t('active')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('smsSent')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.totalSent}</div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('of')} {stats.totalCapacity}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('availableCapacity')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.availableCapacity}</div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.usagePercentage.toFixed(1)}% {t('used')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('systemStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {stats.usagePercentage < 90 ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-orange-500" />
                      )}
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.usagePercentage < 90 ? t('healthy') : t('needsAttention')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gestión de Números */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('twilioNumbersManagement')}</CardTitle>
                    <CardDescription>
                      {t('manageYourTwilioNumbers')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetCounters}
                      disabled={saving || numbers.length === 0}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('resetCounters')}
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('addNumber')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <div className="space-y-1">
                      <p className="font-medium">{t('automaticDailyReset')}</p>
                      <p className="text-sm">
                        {t('automaticDailyResetDescription', 'Los contadores de SMS se resetean automáticamente todos los días a las 00:00 UTC. Cada número puede enviar hasta 75 SMS por día.')}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {numbers.length === 0 ? (
                  <EmptyState
                    icon={Phone}
                    title={t('noNumbersRegistered')}
                    description={t('addYourFirstTwilioNumber')}
                  />
                ) : (
                  <div className="space-y-3">
                    {numbers.map((number) => (
                      <div
                        key={number.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {number.display_name || number.phone_number}
                              </h4>
                              {getStatusBadge(number)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{number.phone_number}</span>
                              <span>•</span>
                              <span>
                                {number.sms_sent_count} / {number.sms_limit} SMS
                              </span>
                              <span>•</span>
                              <span>
                                {((number.sms_sent_count / number.sms_limit) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(number)}
                          >
                            {number.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('deactivate')}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('activate')}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setNumberToDelete(number);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para Agregar Número */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addNumber')}</DialogTitle>
            <DialogDescription>
              {t('enterTwilioNumberDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={newNumber.phone}
                onChange={(e) => setNewNumber({ ...newNumber, phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t('phoneNumberHelpText', 'Debe incluir el código de país (ej. +1...)')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('friendlyName')} ({t('optional', 'Opcional')})</Label>
              <Input
                id="name"
                placeholder={t('friendlyNamePlaceholder', 'Ej. Servidor Principal')}
                value={newNumber.name}
                onChange={(e) => setNewNumber({ ...newNumber, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewNumber({ phone: '', name: '' });
              }}
              disabled={saving}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleAddNumber} disabled={saving}>
              {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para Confirmar Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteNumberWarning', '¿Estás seguro de que deseas eliminar este número? Esta acción no se puede deshacer.')}
              {numberToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  {numberToDelete.display_name || numberToDelete.phone_number}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteNumber();
              }}
              disabled={saving}
            >
              {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




























