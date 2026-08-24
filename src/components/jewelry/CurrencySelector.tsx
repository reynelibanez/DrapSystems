import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
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
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { DollarSign, Settings, Plus } from 'lucide-react';
import { getMonedas, getMonedaNegocio, setMonedaNegocio, updateTasaCambio } from '../../lib/api/jewelry';
import type { JwlMoneda } from '../../lib/types/jewelry.types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface CurrencySelectorProps {
  businessId: string;
  onCurrencyChange?: () => void | Promise<void>;
}

export function CurrencySelector({ businessId, onCurrencyChange }: CurrencySelectorProps) {
  console.log('🔍 CurrencySelector: Recibido businessId como prop:', businessId, 'tipo:', typeof businessId);
  
  const { t } = useTranslation();
  const [monedas, setMonedas] = useState<JwlMoneda[]>([]);
  const [monedaActual, setMonedaActual] = useState<JwlMoneda | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  
  // Estado para nueva moneda
  const [newCurrency, setNewCurrency] = useState({
    codigo: '',
    nombre: '',
    simbolo: '',
    tasa_cambio: 1
  });

  useEffect(() => {
    if (businessId) {
      console.log('✅ CurrencySelector: Cargando datos con businessId:', businessId);
      loadData();
    } else {
      console.error('❌ CurrencySelector: businessId no está disponible');
      setLoading(false);
    }
  }, [businessId]);

  const loadData = async () => {
    // Validar que businessId esté disponible
    if (!businessId) {
      console.error('❌ loadData: businessId no está disponible para cargar datos');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [monedasData, monedaNegocio] = await Promise.all([
        getMonedas(),
        getMonedaNegocio(businessId)
      ]);
      
      setMonedas(monedasData);
      setMonedaActual(monedaNegocio);
      
      // Inicializar tasas para edición
      const rates: Record<string, number> = {};
      monedasData.forEach(m => {
        rates[m.id] = m.tasa_cambio;
      });
      setEditingRates(rates);
    } catch (error) {
      console.error('Error loading currency data:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCurrency = async (monedaId: string) => {
    // Validar que businessId esté disponible
    if (!businessId) {
      console.error('Error: businessId no está disponible');
      toast.error(t('jewelry.common.error'));
      return;
    }

    try {
      await setMonedaNegocio(businessId, monedaId);
      const nuevaMoneda = monedas.find(m => m.id === monedaId);
      if (nuevaMoneda) {
        setMonedaActual(nuevaMoneda);
        toast.success(`${t('jewelry.currency.change')} ${nuevaMoneda.nombre}`);
        
        // Notificar al componente padre que la moneda cambió
        if (onCurrencyChange) {
          await onCurrencyChange();
        }
      }
    } catch (error) {
      console.error('Error changing currency:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleUpdateRates = async () => {
    try {
      const updates = monedas.map(moneda => {
        const newRate = editingRates[moneda.id];
        if (newRate !== moneda.tasa_cambio) {
          return updateTasaCambio(moneda.id, newRate);
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
      await loadData();
      setShowConfig(false);
      toast.success(t('jewelry.common.saveSuccess'));
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  const handleAddCurrency = async () => {
    if (!newCurrency.codigo || !newCurrency.nombre || !newCurrency.simbolo) {
      toast.error(t('jewelry.common.error'));
      return;
    }

    try {
      const { error } = await supabase
        .from('jwl_monedas')
        .insert({
          codigo: newCurrency.codigo.toUpperCase(),
          nombre: newCurrency.nombre,
          simbolo: newCurrency.simbolo,
          tasa_cambio: newCurrency.tasa_cambio,
          es_moneda_base: false,
          activo: true
        });

      if (error) throw error;

      toast.success(t('jewelry.common.saveSuccess'));
      setShowAddCurrency(false);
      setNewCurrency({
        codigo: '',
        nombre: '',
        simbolo: '',
        tasa_cambio: 1
      });
      await loadData();
    } catch (error) {
      console.error('Error adding currency:', error);
      toast.error(t('jewelry.common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4 animate-pulse" />
        <span>{t('jewelry.common.loading')}</span>
      </div>
    );
  }

  // Validar que businessId esté disponible
  if (!businessId) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <DollarSign className="h-4 w-4" />
        <span>{t('jewelry.common.error')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={monedaActual?.id || ''}
          onValueChange={handleChangeCurrency}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <SelectValue placeholder={t('jewelry.currency.selector')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {monedas.map(moneda => (
              <SelectItem key={moneda.id} value={moneda.id}>
                {moneda.codigo} - {moneda.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowConfig(true)}
          title={t('jewelry.currency.selector')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Dialog de configuración de tasas */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('jewelry.currency.selector')}</DialogTitle>
            <DialogDescription>
              {t('jewelry.currency.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {monedas.map(moneda => (
              <div key={moneda.id} className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label className="font-semibold">
                    {moneda.codigo} - {moneda.nombre}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('jewelry.currency.current')}: {moneda.simbolo}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">{t('jewelry.currency.change')}</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={editingRates[moneda.id] || 0}
                    onChange={(e) => setEditingRates({
                      ...editingRates,
                      [moneda.id]: parseFloat(e.target.value) || 0
                    })}
                    disabled={moneda.es_moneda_base}
                  />
                  {moneda.es_moneda_base && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('jewelry.currency.current')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setShowAddCurrency(true)}
              className="mr-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('jewelry.currency.add')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                {t('jewelry.common.cancel')}
              </Button>
              <Button onClick={handleUpdateRates}>
                {t('jewelry.common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar nueva moneda */}
      <Dialog open={showAddCurrency} onOpenChange={setShowAddCurrency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('jewelry.currency.add')}</DialogTitle>
            <DialogDescription>
              {t('jewelry.currency.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="codigo">{t('jewelry.currency.code')}</Label>
              <Input
                id="codigo"
                placeholder="USD"
                value={newCurrency.codigo}
                onChange={(e) => setNewCurrency({ ...newCurrency, codigo: e.target.value })}
                maxLength={3}
              />
            </div>

            <div>
              <Label htmlFor="nombre">{t('jewelry.currency.name')}</Label>
              <Input
                id="nombre"
                placeholder="Dólar Estadounidense"
                value={newCurrency.nombre}
                onChange={(e) => setNewCurrency({ ...newCurrency, nombre: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="simbolo">{t('jewelry.currency.symbol')}</Label>
              <Input
                id="simbolo"
                placeholder="$"
                value={newCurrency.simbolo}
                onChange={(e) => setNewCurrency({ ...newCurrency, simbolo: e.target.value })}
                maxLength={3}
              />
            </div>

            <div>
              <Label htmlFor="tasa">{t('jewelry.currency.exchangeRate')}</Label>
              <Input
                id="tasa"
                type="number"
                step="0.000001"
                placeholder="1.0"
                value={newCurrency.tasa_cambio}
                onChange={(e) => setNewCurrency({ ...newCurrency, tasa_cambio: parseFloat(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('jewelry.currency.exchangeRateHelp')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCurrency(false)}>
              {t('jewelry.common.cancel')}
            </Button>
            <Button onClick={handleAddCurrency}>
              {t('jewelry.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}












