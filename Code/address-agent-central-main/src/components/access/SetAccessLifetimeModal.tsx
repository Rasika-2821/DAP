import { useState } from 'react';
import { Clock, Timer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface SetAccessLifetimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  onConfirm: (validUntil: Date) => void;
}

const durations = [
  { id: '1h', label: '1 Hour', hours: 1 },
  { id: '24h', label: '24 Hours', hours: 24 },
  { id: '7d', label: '7 Days', hours: 24 * 7 },
  { id: 'custom', label: 'Custom Date', hours: 0 },
];

export function SetAccessLifetimeModal({
  open,
  onOpenChange,
  appName,
  onConfirm,
}: SetAccessLifetimeModalProps) {
  const [selectedDuration, setSelectedDuration] = useState('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const handleConfirm = () => {
    let validUntil: Date;
    
    if (selectedDuration === 'custom' && customDate) {
      validUntil = customDate;
    } else {
      const duration = durations.find(d => d.id === selectedDuration);
      validUntil = new Date(Date.now() + (duration?.hours || 24) * 60 * 60 * 1000);
    }
    
    onConfirm(validUntil);
    onOpenChange(false);
    setSelectedDuration('24h');
    setCustomDate(undefined);
  };

  const isConfirmDisabled = selectedDuration === 'custom' && !customDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent" />
            Set Access Lifetime
          </DialogTitle>
          <DialogDescription>
            How long should <span className="font-semibold text-foreground">{appName}</span> have access to your address?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="mb-3 block">Select Duration</Label>
          <RadioGroup
            value={selectedDuration}
            onValueChange={setSelectedDuration}
            className="space-y-3"
          >
            {durations.map((duration) => (
              <div key={duration.id} className="flex items-center space-x-3">
                <RadioGroupItem value={duration.id} id={duration.id} />
                <Label
                  htmlFor={duration.id}
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {duration.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedDuration === 'custom' && (
            <div className="mt-4">
              <Label className="mb-2 block">Select Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? format(customDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={setCustomDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isConfirmDisabled}
            className="bg-success hover:bg-success/90"
          >
            Confirm Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
