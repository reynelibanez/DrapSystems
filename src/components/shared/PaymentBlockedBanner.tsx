









/**
 * BANNER DE BLOQUEO POR PAGO PENDIENTE
 * 
 * Este componente muestra un banner cuando el negocio está bloqueado
 * por tener pagos pendientes de SMS excedentes.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, Lock, LogOut } from 'lucide-react';
import { baseUrl } from '@/lib/base-url';
import { supabase } from '@/lib/supabase';

interface BlockStatus {
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  daysBlocked?: number;
  pendingChargeId?: string;
  pendingAmount?: number;
  smsExcess?: number;
  stripeInvoiceId?: string;
  canPay?: boolean;
}

interface PaymentBlockedBannerProps {
  businessId: string;
  onPaymentComplete?: () => void;
}

export function PaymentBlockedBanner({ businessId }: PaymentBlockedBannerProps) {
  const { t } = useTranslation();
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const checkBlockStatus = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/business/block-status?businessId=${businessId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check block status');
      }

      const data = await response.json();
      
      // Solo actualizar el estado si realmente cambió
      setBlockStatus(prevStatus => {
        if (JSON.stringify(prevStatus) !== JSON.stringify(data)) {
          return data;
        }
        return prevStatus;
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking block status:', error);
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    checkBlockStatus();
    
    // Solo hacer polling si la cuenta está bloqueada
    if (!blockStatus?.isBlocked) {
      return;
    }
    
    // Verificar el estado cada 10 segundos para detectar cuando el webhook desbloquee la cuenta
    const interval = setInterval(() => {
      checkBlockStatus();
    }, 10000); // Aumentado a 10 segundos para reducir la carga

    return () => clearInterval(interval);
  }, [businessId, blockStatus?.isBlocked]);

  const handlePayNow = async () => {
    if (!blockStatus?.smsExcess) return;

    try {
      setPaying(true);

      const response = await fetch(`${baseUrl}/api/stripe/create-sms-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          smsCount: blockStatus.smsExcess,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const data = await response.json();

      if (data.success && data.url) {
        // Redirigir a Stripe Checkout en la misma pestaña
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert('Failed to create payment session. Please try again.');
      setPaying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = baseUrl || '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (!blockStatus?.isBlocked) {
    return null;
  }

  const pricePerSms = blockStatus.pendingAmount && blockStatus.smsExcess 
    ? blockStatus.pendingAmount / blockStatus.smsExcess 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Account Blocked
          </CardTitle>
          <CardDescription className="text-base">
            Your account has been temporarily blocked due to pending payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Required</AlertTitle>
            <AlertDescription>
              {blockStatus.blockedReason || 'You have a pending payment that must be completed to continue using the system.'}
            </AlertDescription>
          </Alert>

          {blockStatus.pendingAmount && blockStatus.smsExcess && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-lg">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Excess SMS Messages</p>
                  <p className="font-semibold text-lg">{blockStatus.smsExcess.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Due</p>
                  <p className="font-semibold text-lg text-destructive">
                    ${blockStatus.pendingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Price per SMS: ${pricePerSms.toFixed(4)}
                </p>
                {blockStatus.daysBlocked && blockStatus.daysBlocked > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Blocked for {blockStatus.daysBlocked} {blockStatus.daysBlocked === 1 ? 'day' : 'days'}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To restore access to your account, please complete the payment.
            </p>

            {blockStatus.canPay && (
              <Button
                onClick={handlePayNow}
                disabled={paying}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {paying ? 'Processing...' : `Pay Now - $${blockStatus.pendingAmount?.toFixed(2)}`}
              </Button>
            )}

            {!blockStatus.canPay && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment is being processed. Please wait a moment and refresh the page.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              {t('signOut')}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Contact support at support@bookingsuite.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}












