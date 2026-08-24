import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { baseUrl } from '../../lib/base-url';

interface SendSMSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientPhone: string;
  businessId: string;
  onSuccess?: () => void;
}

export function SendSMSDialog({
  open,
  onOpenChange,
  clientName,
  clientPhone,
  businessId,
  onSuccess
}: SendSMSDialogProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 160;
  const remainingChars = maxLength - message.length;

  const handleSend = async () => {
    if (!message.trim()) {
      setError(t('pleaseEnterMessage'));
      return;
    }

    if (message.length > maxLength) {
      setError(t('messageTooLong'));
      return;
    }

    try {
      setSending(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/notifications/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: clientPhone,
          message: message.trim(),
          businessId,
          clientName,
          type: 'custom'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorSendingSMS'));
      }

      toast.success(t('smsSentSuccessfully'));
      setMessage('');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error sending SMS:', err);
      setError(err.message || t('errorSendingSMS'));
      toast.error(err.message || t('errorSendingSMS'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setMessage('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('sendSMS')}
          </DialogTitle>
          <DialogDescription>
            {t('sendSMSTo', { name: clientName, phone: clientPhone })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">{t('message')}</Label>
            <Textarea
              id="message"
              placeholder={t('enterYourMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={maxLength}
              disabled={sending}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('maxCharacters', { max: maxLength })}</span>
              <span className={remainingChars < 20 ? 'text-destructive' : ''}>
                {remainingChars} {t('remaining')}
              </span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('smsWillBeSentImmediately')}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={sending}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim() || message.length > maxLength}
          >
            {sending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t('sending')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('send')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

