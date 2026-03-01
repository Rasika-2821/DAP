import { useState } from 'react';
import { User, Bell, Shield, Globe, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { EditProfileModal } from '@/components/settings/EditProfileModal';
import { useDAP } from '@/contexts/DAPContext';

export default function Settings() {
  const { user, updateUser } = useDAP();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSaveProfile = (profile: { name: string; email: string; phone: string }) => {
    updateUser({
      name: profile.name,
      phone: profile.phone
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and security
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-2xl text-white font-semibold">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {user.kycStatus === 'verified' && (
                <StatusBadge variant="green">KYC Verified</StatusBadge>
              )}
              {user.aadhaarLinked && (
                <StatusBadge variant="blue">Aadhaar Linked</StatusBadge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Access requests', desc: 'When apps request access to your address' },
            { label: 'Consent expiry', desc: 'When a time-bound consent is about to expire' },
            { label: 'Verification updates', desc: 'When your address verification status changes' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Biometric Login</Label>
              <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button variant="outline" className="mt-2">Change Password</Button>
        </CardContent>
      </Card>

      {/* Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Address Provider
          </CardTitle>
          <CardDescription>Your addresses are hosted by an AIP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">📮</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">India Post AIP</p>
              <p className="text-sm text-muted-foreground">Primary provider for 2 addresses</p>
            </div>
            <Button variant="outline" size="sm">Migrate</Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        currentProfile={{
          name: user.name,
          email: user.email,
          phone: user.phone
        }}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
