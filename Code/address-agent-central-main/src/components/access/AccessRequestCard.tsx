import { useState } from 'react';
import { Clock, MapPin, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccessRequest } from '@/data/mock-data';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { SetAccessLifetimeModal } from './SetAccessLifetimeModal';

interface AccessRequestCardProps {
  request: AccessRequest;
  onApprove?: (id: string, validUntil: Date) => void;
  onDeny?: (id: string) => void;
}

export function AccessRequestCard({ request, onApprove, onDeny }: AccessRequestCardProps) {
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);

  const handleApproveClick = () => {
    setShowLifetimeModal(true);
  };

  const handleConfirmAccess = (validUntil: Date) => {
    onApprove?.(request.id, validUntil);
    toast.success(`Access granted to ${request.appName}`);
  };

  const handleDeny = () => {
    onDeny?.(request.id);
    toast.info(`Request from ${request.appName} denied`);
  };

  return (
    <>
      <Card className="border-status-orange/30 bg-status-orange/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-status-orange/20 flex items-center justify-center text-2xl">
                {request.appLogo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{request.appName}</h4>
                  <span className="text-xs text-status-orange font-medium bg-status-orange/10 px-2 py-0.5 rounded-full">
                    New Request
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Requesting: <span className="font-medium">{request.requestedScope}</span>
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{request.requestedAddress}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(request.requestedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeny}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-1" />
                Deny
              </Button>
              <Button 
                size="sm"
                onClick={handleApproveClick}
                className="bg-success hover:bg-success/90"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SetAccessLifetimeModal
        open={showLifetimeModal}
        onOpenChange={setShowLifetimeModal}
        appName={request.appName}
        onConfirm={handleConfirmAccess}
      />
    </>
  );
}
