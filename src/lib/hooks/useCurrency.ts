import { useState, useEffect, useCallback } from 'react';
import { getMonedas, getMonedaNegocio, convertirMoneda, formatearMoneda } from '../api/jewelry';
import type { JwlMoneda } from '../types/jewelry.types';

export function useCurrency(businessId: string) {
  const [moneda, setMoneda] = useState<JwlMoneda | null>(null);
  const [monedas, setMonedas] = useState<JwlMoneda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      console.log('✅ useCurrency: Cargando datos con businessId:', businessId);
      loadCurrencyData();
    } else {
      console.error('❌ useCurrency: businessId no está disponible');
      setLoading(false);
    }
  }, [businessId]);

  const loadCurrencyData = async () => {
    if (!businessId) {
      console.error('❌ useCurrency loadCurrencyData: businessId no está disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 useCurrency: Obteniendo monedas y configuración...');
      const [monedasData, monedaNegocio] = await Promise.all([
        getMonedas(),
        getMonedaNegocio(businessId)
      ]);
      
      console.log('✅ useCurrency: Datos cargados:', { 
        monedasCount: monedasData.length, 
        monedaNegocio: monedaNegocio?.codigo 
      });
      
      setMonedas(monedasData);
      setMoneda(monedaNegocio);
    } catch (error) {
      console.error('❌ useCurrency: Error loading currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = useCallback((monto: number): string => {
    if (!moneda) return `$${monto.toFixed(2)}`;
    return formatearMoneda(monto, moneda);
  }, [moneda]);

  const convertirMonto = useCallback((
    monto: number,
    monedaOrigenCodigo: string,
    monedaDestinoCodigo: string
  ): number => {
    const monedaOrigen = monedas.find(m => m.codigo === monedaOrigenCodigo);
    const monedaDestino = monedas.find(m => m.codigo === monedaDestinoCodigo);
    
    if (!monedaOrigen || !monedaDestino) return monto;
    
    return convertirMoneda(monto, monedaOrigen.tasa_cambio, monedaDestino.tasa_cambio);
  }, [monedas]);

  const convertirMontoActual = useCallback((monto: number, monedaOrigenCodigo: string = 'CLP'): number => {
    if (!moneda) return monto;
    return convertirMonto(monto, monedaOrigenCodigo, moneda.codigo);
  }, [moneda, convertirMonto]);

  const formatearMontoConvertido = useCallback((monto: number, monedaOrigenCodigo: string = 'CLP'): string => {
    const montoConvertido = convertirMontoActual(monto, monedaOrigenCodigo);
    return formatearMonto(montoConvertido);
  }, [convertirMontoActual, formatearMonto]);

  return {
    moneda,
    monedas,
    loading,
    formatearMonto,
    convertirMonto,
    convertirMontoActual,
    formatearMontoConvertido,
    reloadCurrency: loadCurrencyData
  };
}


