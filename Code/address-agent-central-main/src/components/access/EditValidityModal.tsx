import { useState } from 'react';
import { Clock, CalendarClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AccessConsent } from '@/data/mock-data';
import { toast } from 'sonner';

interface EditValidityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: AccessConsent;
  onUpdate: (id: string, newExpiry: Date) => void;
}

const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '180', label: '3 hours' },
  { value: '360', label: '6 hours' },
  { value: '1440', label: '24 hours' },
  { value: '4320', label: '3 days' },
  { value: '10080', label: '7 days' },
];

export function EditValidityModal({ open, onOpenChange, consent, onUpdate }: EditValidityModalProps) {
  const [selectedDuration, setSelectedDuration] = useState('60');

  const handleUpdate = () => {
    const minutes = parseInt(selectedDuration, 10);
    const newExpiry = new Date(Date.now() + minutes * 60 * 1000);
    onUpdate(consent.id, newExpiry);
    toast.success(`Access duration updated for ${consent.appName}`);
    onOpenChange(false);
  };

  const currentExpiry = consent.expiresAt 
    ? consent.expiresAt.toLocaleString('en-IN', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      })
    : 'Permanent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent" />
            Update Access Duration for {consent.appName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{consent.appLogo}</span>
              <div>
                <p className="font-medium">{consent.appName}</p>
                <p className="text-sm text-muted-foreground">{consent.scopeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <Clock className="h-4 w-4" />
              <span>Current expiry: {currentExpiry}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Extend access by</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New expiry will be set from the current time
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            Update Validity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
