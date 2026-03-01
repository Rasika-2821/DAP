import { useState, useEffect } from 'react';
import { Clock, MapPin, Shield, Ban, Pencil, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccessConsent } from '@/data/mock-data';
import { differenceInMinutes, differenceInHours, differenceInDays, isPast } from 'date-fns';
import { EditValidityModal } from './EditValidityModal';
import { cn } from '@/lib/utils';

interface AccessConsentCardProps {
  consent: AccessConsent;
  onRevoke?: (id: string) => void;
  onUpdateValidity?: (id: string, newExpiry: Date) => void;
}

export function AccessConsentCard({ consent, onRevoke, onUpdateValidity }: AccessConsentCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!consent.expiresAt) {
        setTimeLeft('Permanent');
        setIsExpired(false);
        return;
      }

      // Check if expired
      if (isPast(consent.expiresAt)) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const now = new Date();
      const days = differenceInDays(consent.expiresAt, now);
      const hours = differenceInHours(consent.expiresAt, now) % 24;
      const minutes = differenceInMinutes(consent.expiresAt, now) % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [consent.expiresAt]);

  const isRevoked = consent.status === 'revoked';
  const statusExpired = consent.status === 'expired' || isExpired;
  const isInactive = isRevoked || statusExpired;

  const getStatusBadge = () => {
    if (isRevoked) {
      return <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">Revoked</Badge>;
    }
    if (statusExpired) {
      return (
        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          EXPIRED
        </Badge>
      );
    }
    return <Badge className="bg-status-green/20 text-status-green border-status-green/30">Active</Badge>;
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        isInactive && "opacity-60 bg-muted/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                isInactive ? "bg-muted" : "bg-accent/10"
              )}>
                {consent.appLogo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-medium",
                    isInactive ? "text-muted-foreground" : "text-foreground"
                  )}>{consent.appName}</h4>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>{consent.scopeLabel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{consent.linkedAddress}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <Clock className={cn(
                    "h-3 w-3",
                    statusExpired ? "text-destructive" : "text-accent"
                  )} />
                  <span className={cn(
                    statusExpired ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    {statusExpired ? 'Access Denied - Token Expired' : `Expires: ${timeLeft}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isInactive && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="border-accent/30 text-accent hover:bg-accent/10"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevoke?.(consent.id)}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </>
              )}
              {isInactive && (
                <span className="text-xs text-muted-foreground italic">
                  {isRevoked ? 'Access revoked' : 'Token expired'}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditValidityModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        consent={consent}
        onUpdate={(id, newExpiry) => onUpdateValidity?.(id, newExpiry)}
      />
    </>
  );
}
