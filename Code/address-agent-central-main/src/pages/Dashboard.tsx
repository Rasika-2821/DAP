import { MapPin, Shield, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDAP } from '@/contexts/DAPContext';

export default function Dashboard() {
  const { user, addresses, consents, requests } = useDAP();
  const activeConsents = consents.filter(c => c.status === 'active');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Manage your digital addresses and access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {user.kycStatus === 'verified' && (
            <StatusBadge variant="green">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              KYC Verified
            </StatusBadge>
          )}
          {user.aadhaarLinked && (
            <StatusBadge variant="blue">
              Aadhaar Linked
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Digital Addresses', 
            value: addresses.length, 
            icon: MapPin, 
            color: 'text-accent',
            bg: 'bg-accent/10'
          },
          { 
            label: 'Active Consents', 
            value: activeConsents.length, 
            icon: Shield, 
            color: 'text-success',
            bg: 'bg-success/10'
          },
          { 
            label: 'Pending Requests', 
            value: requests.length, 
            icon: Clock, 
            color: 'text-status-orange',
            bg: 'bg-status-orange/10'
          },
          { 
            label: 'Verified (L3)', 
            value: addresses.filter(a => a.verificationLevel === 'L3').length, 
            icon: CheckCircle2, 
            color: 'text-status-gold',
            bg: 'bg-status-gold/10'
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Requests Alert */}
      {requests.length > 0 && (
        <Card className="border-status-orange/30 bg-status-orange/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-status-orange/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-status-orange" />
                </div>
                <div>
                  <h3 className="font-semibold">You have {requests.length} pending access requests</h3>
                  <p className="text-sm text-muted-foreground">
                    {requests.map(r => r.appName).join(', ')} want to access your address
                  </p>
                </div>
              </div>
              <Link to="/user/dashboard/access">
                <Button>
                  Review Requests
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Addresses */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Addresses</CardTitle>
            <Link to="/user/dashboard/addresses">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.slice(0, 3).map((address) => (
              <div 
                key={address.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{address.label}</p>
                    <code className="text-xs text-muted-foreground font-mono">{address.digipin}</code>
                  </div>
                </div>
                <StatusBadge variant={address.verificationLevel === 'L3' ? 'gold' : address.verificationLevel === 'L2' ? 'blue' : 'gray'}>
                  {address.verificationLabel}
                </StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Consents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Consents</CardTitle>
            <Link to="/user/dashboard/access">
              <Button variant="ghost" size="sm">
                Manage
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeConsents.slice(0, 3).map((consent) => (
              <div 
                key={consent.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                    {consent.appLogo}
                  </div>
                  <div>
                    <p className="font-medium">{consent.appName}</p>
                    <p className="text-xs text-muted-foreground">{consent.linkedAddress}</p>
                  </div>
                </div>
                <StatusBadge variant={consent.accessScope === 'permanent' ? 'blue' : 'gray'}>
                  {consent.scopeLabel}
                </StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
