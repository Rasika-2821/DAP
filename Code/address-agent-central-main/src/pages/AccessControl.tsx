import { useState } from 'react';
import { Shield, AlertCircle, Plus, Globe, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessConsentCard } from '@/components/access/AccessConsentCard';
import { AccessRequestCard } from '@/components/access/AccessRequestCard';
import { AddURLModal } from '@/components/access/AddURLModal';
import { ConsentManagerPanel } from '@/components/admin/ConsentManagerPanel';
import { useDAP } from '@/contexts/DAPContext';
import { toast } from 'sonner';

export default function AccessControl() {
  const { 
    consents, 
    requests, 
    revokeConsent, 
    updateConsent, 
    approveRequest, 
    denyRequest,
    trustedServices,
    addTrustedService,
    removeTrustedService
  } = useDAP();
  
  const [isAddURLOpen, setIsAddURLOpen] = useState(false);

  const activeConsents = consents.filter(c => c.status === 'active');
  const expiredConsents = consents.filter(c => c.status === 'expired' || c.status === 'revoked');

  const handleUpdateValidity = (id: string, newExpiry: Date) => {
    updateConsent(id, { expiresAt: newExpiry });
  };

  const handleRemoveService = (id: string, name: string) => {
    removeTrustedService(id);
    toast.success(`${name} removed from trusted services`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Access Control</h1>
          <p className="text-muted-foreground mt-1">
            Manage which applications can access your digital addresses
          </p>
        </div>
        <Button onClick={() => setIsAddURLOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      </div>

      {/* Trusted Services */}
      {trustedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Trusted Services ({trustedServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trustedServices.map((service) => (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.url}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveService(service.id, service.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <Card className="border-status-orange/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-status-orange" />
              Pending Access Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((request) => (
              <AccessRequestCard
                key={request.id}
                request={request}
                onApprove={approveRequest}
                onDeny={denyRequest}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Consents */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeConsents.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired / Revoked ({expiredConsents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-3">
          {activeConsents.length > 0 ? (
            activeConsents.map((consent) => (
              <AccessConsentCard
                key={consent.id}
                consent={consent}
                onRevoke={revokeConsent}
                onUpdateValidity={handleUpdateValidity}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active consents</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you grant access to apps, they will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6 space-y-3">
          {expiredConsents.length > 0 ? (
            expiredConsents.map((consent) => (
              <AccessConsentCard
                key={consent.id}
                consent={consent}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No expired or revoked consents</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* AIA Consent Manager */}
      <div className="mt-8">
        <ConsentManagerPanel />
      </div>

      {/* Add URL Modal */}
      <AddURLModal
        open={isAddURLOpen}
        onOpenChange={setIsAddURLOpen}
        onAdd={addTrustedService}
      />
    </div>
  );
}
