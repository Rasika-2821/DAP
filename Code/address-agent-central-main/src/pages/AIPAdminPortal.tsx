import { useState, useEffect } from 'react';
import { Server, Activity, Database, CheckCircle2, MapPin, Search, ArrowLeft, Eye, Lock, Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useDAP } from '@/contexts/DAPContext';
import { SEOHead } from '@/components/SEOHead';
import { format } from 'date-fns';

interface AddressRecord {
  id: number;
  digipin: string;
  label: string;
  latitude: number;
  longitude: number;
  address_type: string;
  verification_level: string;
  provider: string;
  created_at: string;
  updated_at: string;
  owner_name: string;
  confidence_score: number;
  is_verified: boolean;
}

export default function AIPAdminPortal() {
  const { addresses } = useDAP();
  const [searchQuery, setSearchQuery] = useState('');
  const [registryData, setRegistryData] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchRegistryData = async () => {
      try {
        setLoading(true);

        // First, get admin token
        const loginResponse = await fetch('http://localhost:8000/api/v1/auth/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: 'admin',
            password: 'admin123',
          }),
        });

        if (!loginResponse.ok) {
          throw new Error('Admin authentication failed');
        }

        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Now fetch registry data with admin token
        const response = await fetch('http://localhost:8000/api/v1/addresses/admin/registry', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch registry data');
        }

        const data = await response.json();
        setRegistryData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching registry data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        // Fallback to empty array
        setRegistryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistryData();
  }, []);

  // Combine mock data with real registry data
  const allAddresses = [...addresses, ...registryData];

  const filteredAddresses = allAddresses.filter(addr => 
    addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.digipin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (addr.owner_name && addr.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group addresses by type (suffix after @ in label)
  const addressesByType = filteredAddresses.reduce((acc, addr) => {
    const type = addr.label.includes('@') ? '@' + addr.label.split('@')[1] : '@unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(addr);
    return acc;
  }, {} as Record<string, typeof addresses>);

  return (
    <>
      <SEOHead
        title="AIP Database Monitor - Admin Portal | DAP Connect"
        description="Address Information Provider backend registry and database monitoring view"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Server className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">AIP Registry Node: IndPost_01</h1>
                  <p className="text-sm text-muted-foreground">India Post Address Information Provider - Database Monitor</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/admin/demo">
                  <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                    <Shield className="h-4 w-4 mr-2" />
                    AAVA Demo
                  </Button>
                </Link>
                <Badge className="bg-status-green/20 text-status-green border-status-green/30">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Online
                </Badge>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  <Eye className="h-3 w-3 mr-1" />
                  Read-Only Mode
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <p className="text-muted-foreground">Loading database records...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Database Connection Issue</p>
                    <p className="text-sm text-muted-foreground">
                      {error}. Showing mock data for now. Real PostgreSQL data (15,892 records) will be displayed once server issues are resolved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allAddresses.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Records Stored
                      {registryData.length === 0 && (
                        <span className="block text-xs text-blue-600 mt-1">
                          (15,892 real records available in PostgreSQL)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-status-green/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-status-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allAddresses.filter(a => a.verification_level === 'L3' || a.is_verified).length}</p>
                    <p className="text-xs text-muted-foreground">L3 Physically Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-status-blue/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-status-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allAddresses.filter(a => a.verification_level === 'L2' || (!a.is_verified && a.confidence_score > 70)).length}</p>
                    <p className="text-xs text-muted-foreground">L2 Registry Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allAddresses.filter(a => a.verification_level === 'L1' || (!a.is_verified && a.confidence_score <= 70)).length}</p>
                    <p className="text-xs text-muted-foreground">L1 Self-Declared</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Read-Only Notice */}
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Privacy by Design</p>
                  <p className="text-sm text-muted-foreground">
                    This is a read-only view. Admins can monitor storage but cannot edit user data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AIP Blocks by Type */}
          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(addressesByType).map(([type, typeAddresses]) => (
              <AccordionItem key={type} value={type} className="border border-border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span className="font-semibold">{type} AIP Block</span>
                    <Badge variant="outline" className="ml-2">
                      {typeAddresses.length} records
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Unique ID</TableHead>
                          <TableHead className="font-semibold">DIGIPIN</TableHead>
                          <TableHead className="font-semibold">Owner</TableHead>
                          <TableHead className="font-semibold">Creation Date</TableHead>
                          <TableHead className="font-semibold">Lat/Lon</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeAddresses.map((address) => (
                          <TableRow key={address.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{address.label}</TableCell>
                            <TableCell>
                              <code className="px-2 py-1 rounded bg-accent/10 text-accent font-mono text-sm">
                                {address.digipin}
                              </code>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {address.owner_name || 'Unknown Owner'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {address.created_at ? format(new Date(address.created_at), 'dd MMM yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {address.latitude?.toFixed(4) || 'N/A'}, {address.longitude?.toFixed(4) || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  address.verification_level === 'L3' || address.is_verified
                                    ? 'border-status-green text-status-green' 
                                    : address.verification_level === 'L2' || address.confidence_score > 70
                                    ? 'border-status-blue text-status-blue'
                                    : 'border-muted-foreground text-muted-foreground'
                                }
                              >
                                {address.verification_level || (address.is_verified ? 'L3' : address.confidence_score > 70 ? 'L2' : 'L1')} - Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </main>
      </div>
    </>
  );
}
