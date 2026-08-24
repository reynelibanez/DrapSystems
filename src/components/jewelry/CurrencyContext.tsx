import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMonedas, getMonedaNegocio } from '../../lib/api/jewelry';
import type { JwlMoneda } from '../../lib/types/jewelry.types';

interface CurrencyContextType {
  moneda: JwlMoneda | null;
  monedas: JwlMoneda[];
  loading: boolean;
  formatearMonto: (monto: number) => string;
  convertirMonto: (monto: number, monedaOrigenCodigo?: string) => number;
  reloadCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  businessId: string;
  children: ReactNode;
}

export function CurrencyProvider({ children, businessId }: CurrencyProviderProps) {
  console.log('🔍 CurrencyProvider: Recibido businessId como prop:', businessId, 'tipo:', typeof businessId);
  
  const [moneda, setMoneda] = useState<JwlMoneda | null>(null);
  const [monedas, setMonedas] = useState<JwlMoneda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      console.log('✅ CurrencyProvider: Cargando datos con businessId:', businessId);
      loadCurrencyData();
    } else {
      console.error('❌ CurrencyProvider: businessId no está disponible');
      setLoading(false);
    }
  }, [businessId]);

  const loadCurrencyData = async () => {
    if (!businessId) {
      console.error('❌ loadCurrencyData: businessId no está disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 CurrencyProvider: Obteniendo monedas y configuración...');
      const [monedasData, monedaNegocio] = await Promise.all([
        getMonedas(),
        getMonedaNegocio(businessId)
      ]);
      
      console.log('✅ CurrencyProvider: Datos cargados:', { 
        monedasCount: monedasData.length, 
        monedaNegocio: monedaNegocio?.codigo 
      });
      
      setMonedas(monedasData);
      setMoneda(monedaNegocio);
    } catch (error) {
      console.error('❌ CurrencyProvider: Error loading currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number): string => {
    if (!moneda) return `$${monto.toFixed(2)}`;
    
    const montoFormateado = new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(monto);

    return `${moneda.simbolo}${montoFormateado}`;
  };

  const convertirMonto = (monto: number, monedaOrigenCodigo: string = 'CLP'): number => {
    if (!moneda) return monto;
    
    const monedaOrigen = monedas.find(m => m.codigo === monedaOrigenCodigo);
    if (!monedaOrigen) return monto;
    
    // Convertir a moneda base (CLP)
    const montoBase = monto / monedaOrigen.tasa_cambio;
    // Convertir a moneda actual
    return montoBase * moneda.tasa_cambio;
  };

  const value: CurrencyContextType = {
    moneda,
    monedas,
    loading,
    formatearMonto,
    convertirMonto,
    reloadCurrency: loadCurrencyData
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
}


