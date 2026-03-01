import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

interface AddURLModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (serviceName: string, url: string) => void;
}

export function AddURLModal({ open, onOpenChange, onAdd }: AddURLModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!url.trim()) {
      toast.error('URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    onAdd(serviceName.trim(), url.trim());
    toast.success(`${serviceName} added to trusted services`);
    setServiceName('');
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add Trusted Service
          </DialogTitle>
          <DialogDescription>
            Add a third-party website that can request access to your digital addresses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g., Swiggy, Amazon, Flipkart"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              Once added, this service can initiate access requests
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            Add Service
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
