import { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, XCircle, RefreshCw, Clock, Ban, Shield, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDAP } from '@/contexts/DAPContext';
import { toast } from 'sonner';

// Service providers for demo
const DEMO_SERVICE_PROVIDERS = [
  { id: 'flipkart', name: 'Flipkart', icon: '🛒', purpose: 'DELIVERY', desc: 'Package Delivery' },
  { id: 'amazon', name: 'Amazon', icon: '📦', purpose: 'DELIVERY', desc: 'Package Delivery' },
  { id: 'zomato', name: 'Zomato', icon: '🍕', purpose: 'DELIVERY', desc: 'Food Delivery' },
  { id: 'swiggy', name: 'Swiggy', icon: '🍔', purpose: 'DELIVERY', desc: 'Food Delivery' },
  { id: 'hdfc', name: 'HDFC Bank', icon: '🏦', purpose: 'KYC', desc: 'KYC Verification' },
  { id: 'sbi', name: 'SBI', icon: '🏛️', purpose: 'KYC', desc: 'KYC Verification' },
  { id: 'epfo', name: 'EPFO', icon: '📋', purpose: 'GOVERNMENT', desc: 'Government Services' },
  { id: 'urban', name: 'Urban Company', icon: '🔧', purpose: 'DELIVERY', desc: 'Service Visit' },
];

// Time duration options
const DURATION_OPTIONS = [
  { value: '1', label: '1 Hour', hours: 1 },
  { value: '2', label: '2 Hours', hours: 2 },
  { value: '6', label: '6 Hours', hours: 6 },
  { value: '12', label: '12 Hours', hours: 12 },
  { value: '24', label: '24 Hours (1 Day)', hours: 24 },
  { value: '48', label: '48 Hours (2 Days)', hours: 48 },
  { value: '168', label: '7 Days', hours: 168 },
];

export function ConsentManagerPanel() {
  const { 
    pendingConsentRequests, 
    approveConsentRequest,
    fetchPendingConsents,
    consents,
    revokeConsent,
    requestConsent,
    addresses,
    token
  } = useDAP();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; requestId: string; aiuName: string; addressLabel: string } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('24');
  const [revokeDialog, setRevokeDialog] = useState<{ open: boolean; consentId: string; appName: string } | null>(null);
  
  // Demo simulator state
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoAddress, setDemoAddress] = useState('');
  const [demoProvider, setDemoProvider] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleSimulateRequest = async () => {
    if (!demoAddress || !demoProvider) {
      toast.error('Select an address and service provider');
      return;
    }

    const provider = DEMO_SERVICE_PROVIDERS.find(p => p.id === demoProvider);
    if (!provider) return;

    setIsRequesting(true);
    const result = await requestConsent(
      demoAddress,
      provider.name,
      provider.purpose,
      ['digipin', 'city', 'pincode'],
      24
    );

    if (result.success) {
      toast.success(`${provider.name} is requesting access to ${demoAddress}`);
      await fetchPendingConsents();
    } else {
      toast.error('Failed to create request');
    }
    setIsRequesting(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingConsents();
    setIsRefreshing(false);
  };

  const openApprovalModal = (requestId: string, aiuName: string, addressLabel: string) => {
    setApprovalModal({ open: true, requestId, aiuName, addressLabel });
    setSelectedDuration('24'); // Reset to default
  };

  const handleApprove = async () => {
    if (!approvalModal) return;
    
    const success = await approveConsentRequest(approvalModal.requestId, true);
    if (success) {
      const duration = DURATION_OPTIONS.find(d => d.value === selectedDuration);
      toast.success(`Access granted to ${approvalModal.aiuName} for ${duration?.label || '24 hours'}. Check terminal for token generation.`);
    } else {
      toast.error('Failed to approve consent');
    }
    setApprovalModal(null);
  };

  const handleDeny = async (requestId: string) => {
    const success = await approveConsentRequest(requestId, false);
    if (success) {
      toast.success('Consent denied.');
    } else {
      toast.error('Failed to deny consent');
    }
  };

  const openRevokeDialog = (consentId: string, appName: string) => {
    setRevokeDialog({ open: true, consentId, appName });
  };

  const handleRevoke = () => {
    if (!revokeDialog) return;
    revokeConsent(revokeDialog.consentId);
    toast.success(`Access revoked for ${revokeDialog.appName}`);
    setRevokeDialog(null);
  };

  const activeConsents = consents.filter(c => c.status === 'active');
  const expiredConsents = consents.filter(c => c.status === 'expired');
  const revokedConsents = consents.filter(c => c.status === 'revoked');

  const formatTimeRemaining = (expiresAt: Date | undefined) => {
    if (!expiresAt) return 'Unknown';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  // All addresses can be used for consent demo (no filter needed)
  const availableAddresses = addresses;

  return (
    <div className="space-y-4">
      {/* Demo Request Simulator */}
      <Collapsible open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <Card className="border-dashed border-2 border-purple-400/50 bg-purple-50/5">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-purple-50/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Send className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Simulate Consent Request</CardTitle>
                    <CardDescription>Demo: Create a request from a service provider</CardDescription>
                  </div>
                </div>
                {isDemoOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Select Address</Label>
                  <Select value={demoAddress} onValueChange={setDemoAddress}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an address" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAddresses.map(addr => (
                        <SelectItem key={addr.id} value={addr.label}>
                          {addr.label} ({addr.digipin})
                        </SelectItem>
                      ))}
                      {availableAddresses.length === 0 && (
                        <SelectItem value="_none" disabled>No addresses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Provider</Label>
                  <Select value={demoProvider} onValueChange={setDemoProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_SERVICE_PROVIDERS.map(sp => (
                        <SelectItem key={sp.id} value={sp.id}>
                          <span className="flex items-center gap-2">
                            <span>{sp.icon}</span>
                            <span>{sp.name}</span>
                            <span className="text-xs text-muted-foreground">({sp.desc})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSimulateRequest} 
                  disabled={isRequesting || !demoAddress || !demoProvider}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Simulate Request
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This simulates a service provider requesting access to your address. The request will appear below for you to approve/deny.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Pending Consent Requests */}
      <Card className="border-green-500/30 bg-green-50/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">AIA Consent Manager</CardTitle>
                <CardDescription>Manage access requests to your digital addresses</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingConsentRequests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No pending consent requests</p>
              <p className="text-xs mt-1">Requests from service providers will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-2">
                {pendingConsentRequests.length} pending request(s)
              </div>
              {pendingConsentRequests.map((req) => (
                <div key={req.request_id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏢</span>
                        <span className="font-semibold">{req.aiu_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requesting access to: <code className="bg-muted px-1 rounded">{req.address_label}</code>
                      </p>
                    </div>
                    <StatusBadge variant="blue">{req.status}</StatusBadge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <p>Purpose: <span className="font-medium">{req.purpose_description || req.purpose}</span></p>
                    <p>Scope: {req.scope?.join(', ')}</p>
                    <p>Request ID: {req.request_id}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => openApprovalModal(req.request_id, req.aiu_name, req.address_label)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Grant Access
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeny(req.request_id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Consents with Revoke Option */}
      <Card className="border-blue-500/30 bg-blue-50/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Active Access Grants</CardTitle>
              <CardDescription>Services currently authorized to access your addresses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeConsents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No active access grants</p>
              <p className="text-xs mt-1">Approved consents will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeConsents.map((consent) => (
                <div key={consent.id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{consent.appLogo}</span>
                    <div>
                      <p className="font-medium">{consent.appName}</p>
                      <p className="text-xs text-muted-foreground">
                        Address: {consent.linkedAddress}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(consent.expiresAt)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => openRevokeDialog(consent.id, consent.appName)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired & Revoked History */}
      {(expiredConsents.length > 0 || revokedConsents.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Access History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...revokedConsents, ...expiredConsents].slice(0, 5).map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{consent.appLogo}</span>
                    <span>{consent.appName}</span>
                    <span className="text-muted-foreground">→ {consent.linkedAddress}</span>
                  </div>
                  <StatusBadge variant={consent.status === 'revoked' ? 'gray' : 'gray'}>
                    {consent.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Modal with Duration Selection */}
      <Dialog open={!!approvalModal?.open} onOpenChange={(open) => !open && setApprovalModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Access</DialogTitle>
            <DialogDescription>
              Allow <strong>{approvalModal?.aiuName}</strong> to access your address <strong>{approvalModal?.addressLabel}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Access Duration</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose how long this service can access your address
              </p>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium">What they can access:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                <li>DIGIPIN code</li>
                <li>City and Pincode</li>
                <li>Verification status</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> You can revoke access anytime from the Active Access Grants section.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeDialog?.open} onOpenChange={(open) => !open && setRevokeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke <strong>{revokeDialog?.appName}</strong>'s access to your address. 
              They will no longer be able to retrieve your address information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
