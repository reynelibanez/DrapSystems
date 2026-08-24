import React from 'react';
import { useCurrencyContext } from './CurrencyContext';

interface CurrencyDisplayProps {
  amount: number;
  sourceCurrency?: string;
  className?: string;
  showSymbol?: boolean;
}

export function CurrencyDisplay({ 
  amount, 
  sourceCurrency = 'CLP', 
  className = '',
  showSymbol = true 
}: CurrencyDisplayProps) {
  const { convertirMonto, formatearMonto, moneda } = useCurrencyContext();
  
  const convertedAmount = convertirMonto(amount, sourceCurrency);
  const formattedAmount = formatearMonto(convertedAmount);
  
  return (
    <span className={className}>
      {showSymbol ? formattedAmount : formattedAmount.replace(moneda?.simbolo || '', '')}
    </span>
  );
}

interface CurrencyBadgeProps {
  amount: number;
  sourceCurrency?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function CurrencyBadge({ 
  amount, 
  sourceCurrency = 'CLP',
  variant = 'default',
  className = ''
}: CurrencyBadgeProps) {
  const { convertirMonto, formatearMonto } = useCurrencyContext();
  
  const convertedAmount = convertirMonto(amount, sourceCurrency);
  const formattedAmount = formatearMonto(convertedAmount);
  
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {formattedAmount}
    </span>
  );
}
