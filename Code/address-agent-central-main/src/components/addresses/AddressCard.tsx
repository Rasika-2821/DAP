import { useState } from 'react';
import { MapPin, Building2, Shield, MoreVertical, Copy, ExternalLink, Trash2, Edit, Eye, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DigitalAddress } from '@/data/mock-data';
import { toast } from 'sonner';
import { useDAP } from '@/contexts/DAPContext';

interface AddressCardProps {
  address: DigitalAddress;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<DigitalAddress>) => void;
}

export function AddressCard({ address, onDelete, onUpdate }: AddressCardProps) {
  const { token, requestVerification } = useDAP();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [editLabel, setEditLabel] = useState(address.label.split('@')[1] || '');
  const [isVerifying, setIsVerifying] = useState(false);

  const username = address.label.split('@')[0];

  const getVerificationBadge = () => {
    switch (address.verificationLevel) {
      case 'L3':
        return <StatusBadge variant="gold">⭐ {address.verificationLabel}</StatusBadge>;
      case 'L2':
        return <StatusBadge variant="blue">{address.verificationLabel}</StatusBadge>;
      default:
        return <StatusBadge variant="gray">{address.verificationLabel}</StatusBadge>;
    }
  };

  const handleCopyDigipin = () => {
    navigator.clipboard.writeText(address.digipin);
    toast.success('DIGIPIN copied to clipboard!');
  };

  const handleCopyLabel = () => {
    navigator.clipboard.writeText(address.label);
    toast.success('Digital Address copied to clipboard!');
  };

  const handleEditSave = () => {
    const newLabel = `${username}@${editLabel}`;
    if (onUpdate) {
      onUpdate(address.id, { label: newLabel });
    }
    toast.success('Address label updated!');
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(address.id);
    }
    toast.success('Address deleted successfully');
    setShowDeleteDialog(false);
  };

  const handleRequestVerification = async () => {
    setIsVerifying(true);
    
    // Extract numeric ID from address.id (format: "addr_123")
    const addressId = parseInt(address.id.replace('addr_', ''));
    
    try {
      const result = await requestVerification(addressId, 'Physical Address Verification');
      
      if (result.success) {
        toast.success(`Verification request ${result.requestId} submitted! Check terminal for AAVA activity.`);
      } else {
        toast.error(result.message || 'Failed to request verification');
      }
    } catch (error) {
      console.error('Verification request failed:', error);
      toast.error('Failed to submit verification request');
    }
    
    setIsVerifying(false);
    setShowVerifyModal(false);
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${address.lat},${address.lon}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-accent/30 bg-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{address.label}</h3>
                <p className="text-sm text-muted-foreground">{address.description}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowViewModal(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Label
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowVerifyModal(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Request Verification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInMaps}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Map
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">DIGIPIN</span>
              <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-sm font-medium text-foreground tracking-wider">
                {address.digipin}
              </code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyDigipin}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Hosted by {address.provider}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              {getVerificationBadge()}
              <span className="text-xs text-muted-foreground">
                Created {new Date(address.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Address Details</DialogTitle>
            <DialogDescription>Complete details of your digital address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Digital Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-lg font-semibold">{address.label}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLabel}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">DIGIPIN</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-lg font-mono">{address.digipin}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyDigipin}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <p className="font-mono mt-1">{address.lat.toFixed(6)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <p className="font-mono mt-1">{address.lon.toFixed(6)}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="mt-1">{address.description || 'No description'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Provider</Label>
                <p className="mt-1">{address.provider}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Verification Level</Label>
                <div className="mt-1">{getVerificationBadge()}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="mt-1">{new Date(address.createdAt).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={openInMaps}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Google Maps
            </Button>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Label Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address Label</DialogTitle>
            <DialogDescription>Change the label for your digital address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Label</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-medium text-muted-foreground">{username}@</span>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="home, office, etc."
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                New address will be: <code className="text-accent">{username}@{editLabel || '...'}</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editLabel}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Physical Verification</DialogTitle>
            <DialogDescription>
              Upgrade your address to L3 (Physically Verified) status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  An AAVA (Authorized Address Verification Agent) will be assigned
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  The agent will visit your address for physical verification
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  Upon successful verification, your address will be upgraded to L3
                </li>
              </ul>
            </div>

            <div className="text-sm">
              <p><strong>Address:</strong> {address.label}</p>
              <p><strong>Current Level:</strong> {address.verificationLevel} ({address.verificationLabel})</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
            <Button onClick={handleRequestVerification} disabled={isVerifying}>
              {isVerifying ? 'Submitting...' : 'Request Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Digital Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{address.label}</strong>? This action cannot be undone.
              All active consents linked to this address will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
