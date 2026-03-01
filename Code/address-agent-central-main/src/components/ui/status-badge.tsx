import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'gold' | 'blue' | 'gray' | 'green' | 'red' | 'orange';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        {
          'bg-status-gold/10 text-status-gold border border-status-gold/20': variant === 'gold',
          'bg-accent/10 text-accent border border-accent/20': variant === 'blue',
          'bg-muted text-muted-foreground border border-border': variant === 'gray',
          'bg-success/10 text-success border border-success/20': variant === 'green',
          'bg-destructive/10 text-destructive border border-destructive/20': variant === 'red',
          'bg-status-orange/10 text-status-orange border border-status-orange/20': variant === 'orange',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
