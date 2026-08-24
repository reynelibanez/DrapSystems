import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 sm:p-6 mb-3 sm:mb-4">
        <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md px-2">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="h-10 sm:h-11 px-6 sm:px-8">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

