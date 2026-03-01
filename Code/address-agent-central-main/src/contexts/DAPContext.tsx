import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Central Type Definitions
export interface DigitalAddress {
  id: string;
  label: string;
  digipin: string;
  provider: string;
  verificationLevel: 'L1' | 'L2' | 'L3';
  verificationLabel: string;
  createdAt: string;
  lat: number;
  lon: number;
  description?: string;
  building?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface AccessConsent {
  id: string;
  appName: string;
  appLogo: string;
  accessScope: string;
  scopeLabel: string;
  linkedAddress: string;
  expiresAt: Date | null;
  status: 'active' | 'expired' | 'revoked';
}

export interface AccessRequest {
  id: string;
  appName: string;
  appLogo: string;
  requestedScope: string;
  requestedAddress: string;
  requestedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: 'verified' | 'pending' | 'unverified';
  aadhaarLinked: boolean;
}

export interface TrustedService {
  id: string;
  name: string;
  url: string;
  addedAt: Date;
}

export interface VerificationRequest {
  request_id: string;
  address_id: number;
  address_label: string;
  digipin: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  purpose: string;
  latitude: number;
  longitude: number;
  requester_name: string;
}

export interface PendingConsentRequest {
  request_id: string;
  address_label: string;
  aiu_name: string;
  purpose: string;
  purpose_description: string;
  scope: string[];
  validity_hours: number;
  status: string;
  created_at: string;
}

interface DAPContextType {
  // User Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  login: (userData: UserProfile, token: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
  token: string | null;
  username: string;

  // Trusted Services
  trustedServices: TrustedService[];
  addTrustedService: (name: string, url: string) => void;
  removeTrustedService: (id: string) => void;

  // Addresses
  addresses: DigitalAddress[];
  addAddress: (
    label: string,
    digipin: string,
    location: { lat: number; lon: number },
    description?: string,
    details?: {
      building: string;
      street: string;
      landmark: string;
      locality: string;
      city: string;
      state: string;
      pincode: string;
    }
  ) => Promise<boolean>;
  updateAddress: (id: string, updates: Partial<DigitalAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  isAddressLabelTaken: (label: string) => boolean;

  // AAVA Verification
  requestVerification: (addressId: number, purpose: string) => Promise<{ success: boolean; requestId?: string; message?: string }>;
  verificationRequests: VerificationRequest[];
  completeVerification: (requestId: string, verified: boolean) => Promise<boolean>;

  // Consents
  consents: AccessConsent[];
  updateConsent: (id: string, updates: Partial<AccessConsent>) => void;
  revokeConsent: (id: string) => void;
  addConsent: (consent: AccessConsent) => void;
  requestConsent: (addressLabel: string, aiuName: string, purpose: string, scope: string[], validityHours: number) => Promise<{ success: boolean; requestId?: string }>;
  approveConsentRequest: (requestId: string, approved: boolean) => Promise<boolean>;
  pendingConsentRequests: PendingConsentRequest[];
  fetchPendingConsents: () => Promise<void>;

  // Requests
  requests: AccessRequest[];
  approveRequest: (id: string, validUntil: Date) => void;
  denyRequest: (id: string) => void;
  addRequest: (request: AccessRequest) => void;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';
const DAPContext = createContext<DAPContextType | undefined>(undefined);

// Helper to get stored auth data
const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('dap_auth');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error parsing stored auth:', e);
  }
  return null;
};

const defaultUser: UserProfile = {
  id: '',
  name: 'Guest',
  email: '',
  phone: '',
  kycStatus: 'unverified',
  aadhaarLinked: false
};

export function DAPProvider({ children }: { children: ReactNode }) {
  const storedAuth = getStoredAuth();
  const [user, setUser] = useState<UserProfile>(storedAuth?.user || defaultUser);
  const [token, setToken] = useState<string | null>(storedAuth?.token || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!storedAuth?.token);
  const [trustedServices, setTrustedServices] = useState<TrustedService[]>([]);
  const [addresses, setAddresses] = useState<DigitalAddress[]>([]);
  const [consents, setConsents] = useState<AccessConsent[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [pendingConsentRequests, setPendingConsentRequests] = useState<PendingConsentRequest[]>([]);

  const username = user.name ? user.name.split(' ')[0].toLowerCase() : 'user';

  // Periodic checks
  useEffect(() => {
    const checkExpiredConsents = () => {
      setConsents(prev => prev.map(c => {
        if (c.status === 'active' && c.expiresAt && new Date() > c.expiresAt) {
          return { ...c, status: 'expired' as const };
        }
        return c;
      }));
    };
    checkExpiredConsents();
    const interval = setInterval(checkExpiredConsents, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      fetchAddresses();
      fetchVerificationRequests();
      fetchPendingConsents();
    }
  }, [token]);
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const addTrustedService = (name: string, url: string) => {
    const newService: TrustedService = {
      id: `service_${Date.now()}`,
      name,
      url,
      addedAt: new Date()
    };
    setTrustedServices(prev => [newService, ...prev]);
  };

  const removeTrustedService = (id: string) => {
    setTrustedServices(prev => prev.filter(s => s.id !== id));
  };

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        let data = await response.json();
        if (!Array.isArray(data)) {
          console.error('Expected array of addresses, got:', data);
          data = [];
        }
        const transformed: DigitalAddress[] = data.map((addr: any) => ({
          id: `addr_${addr.id}`,
          label: addr.label || 'Unknown Label',
          digipin: addr.digipin || 'N/A',
          provider: addr.provider || 'India Post AIP',
          verificationLevel: addr.verification_level || 'L1',
          verificationLabel: addr.verification_level === 'L3' ? 'Physically Verified' :
            addr.verification_level === 'L2' ? 'Registry Verified' : 'Self Declared',
          createdAt: addr.created_at || new Date().toISOString(),
          lat: typeof addr.latitude === 'number' ? addr.latitude : 0,
          lon: typeof addr.longitude === 'number' ? addr.longitude : 0,
          description: addr.description || '',
          building: addr.building || '',
          street: addr.street || '',
          locality: addr.locality || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
          country: addr.country || 'India'
        }));
        setAddresses(transformed);
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
    }
  };

  const login = (userData: UserProfile, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('dap_auth', JSON.stringify({ user: userData, token: authToken }));
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setUser(defaultUser);
    setToken(null);
    setAddresses([]);
    setConsents([]);
    setRequests([]);
    localStorage.removeItem('dap_auth');
  };

  const addAddress = async (
    label: string,
    digipin: string,
    location: { lat: number; lon: number },
    description?: string,
    details?: {
      building: string;
      street: string;
      landmark: string;
      locality: string;
      city: string;
      state: string;
      pincode: string;
    }
  ) => {
    if (!token) return false;
    try {
      const fullLabel = `${username}@${label}`;
      const response = await fetch(`${API_BASE_URL}/addresses/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: fullLabel,
          digipin,
          latitude: location.lat,
          longitude: location.lon,
          address_type: label,
          building: details?.building,
          street: details?.street,
          landmark: details?.landmark,
          locality: details?.locality,
          city: details?.city,
          state: details?.state,
          pincode: details?.pincode,
          country: "India",
          description: description
        }),
      });

      if (response.ok) {
        await fetchAddresses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Add address error:', error);
      return false;
    }
  };

  const updateAddress = async (id: string, updates: Partial<DigitalAddress>) => {
    if (!token) return;
    try {
      const numericId = id.replace('addr_', '');
      const response = await fetch(`${API_BASE_URL}/addresses/${numericId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: updates.label,
          verification_level: updates.verificationLevel,
        }),
      });
      if (response.ok) fetchAddresses();
    } catch (error) {
      console.error('Update address error:', error);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!token) return;
    try {
      const numericId = id.replace('addr_', '');
      await fetch(`${API_BASE_URL}/addresses/${numericId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (error) {
      console.error('Delete address error:', error);
    }
  };

  const isAddressLabelTaken = (label: string): boolean => {
    return addresses.some(a => a.label.toLowerCase() === label.toLowerCase());
  };

  const requestVerification = async (addressId: number, purpose: string) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const response = await fetch(`${API_BASE_URL}/aava/request-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address_id: addressId, purpose }),
      });
      if (response.ok) {
        const data = await response.json();
        fetchVerificationRequests();
        return { success: true, requestId: data.request_id, message: data.message };
      }
      return { success: false, message: 'Request failed' };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const fetchVerificationRequests = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/aava/all-verifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVerificationRequests(data);
      }
    } catch (error) {
      console.error('Fetch verification requests error:', error);
    }
  };

  const completeVerification = async (requestId: string, verified: boolean) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/aava/complete-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          verified,
          notes: verified ? 'Verified successfully' : 'Verification failed'
        }),
      });
      if (response.ok) {
        fetchVerificationRequests();
        fetchAddresses();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const requestConsent = async (addressLabel: string, aiuName: string, purpose: string, scope: string[], validityHours: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/consent/request-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_label: addressLabel,
          purpose,
          scope,
          validity_hours: validityHours,
          aiu_name: aiuName
        }),
      });
      if (response.ok) {
        const data = await response.json();
        fetchPendingConsents();
        return { success: true, requestId: data.request_id };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  const fetchPendingConsents = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/consent/pending-consents`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingConsentRequests(data);
      }
    } catch (error) {
      console.error('Fetch pending consents error:', error);
    }
  };

  const updateConsent = (id: string, updates: Partial<AccessConsent>) => {
    setConsents(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const revokeConsent = (id: string) => {
    setConsents(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'revoked' as const } : c
    ));
  };

  const addConsent = (consent: AccessConsent) => {
    setConsents(prev => [consent, ...prev]);
  };

  const approveRequest = (id: string, validUntil: Date) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      const newConsent: AccessConsent = {
        id: `consent_${Date.now()}`,
        appName: request.appName,
        appLogo: request.appLogo,
        accessScope: 'one-time',
        scopeLabel: request.requestedScope,
        linkedAddress: request.requestedAddress,
        expiresAt: validUntil,
        status: 'active'
      };
      addConsent(newConsent);
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const denyRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const addRequest = (request: AccessRequest) => {
    setRequests(prev => [request, ...prev]);
  };

  const approveConsentRequest = async (requestId: string, approved: boolean) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/consent/approve-consent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId, approved }),
      });
      if (response.ok) {
        const data = await response.json();
        fetchPendingConsents();
        if (approved && data.consent_id) {
          const newConsent: AccessConsent = {
            id: data.consent_id,
            appName: data.aiu_name || 'Service Provider',
            appLogo: '🏢',
            accessScope: 'one-time',
            scopeLabel: 'Address Access',
            linkedAddress: data.address_label || '',
            expiresAt: new Date(data.valid_until || Date.now() + 86400000),
            status: 'active'
          };
          setConsents(prev => [newConsent, ...prev]);
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DAPContext.Provider value={{
      user, updateUser, login, signOut, isAuthenticated, token, username,
      trustedServices, addTrustedService, removeTrustedService,
      addresses, addAddress, updateAddress, deleteAddress, isAddressLabelTaken,
      requestVerification, verificationRequests, completeVerification,
      consents, updateConsent, revokeConsent, addConsent, requestConsent, approveConsentRequest,
      pendingConsentRequests, fetchPendingConsents,
      requests, approveRequest, denyRequest, addRequest
    }}>
      {children}
    </DAPContext.Provider>
  );
}

export function useDAP() {
  const context = useContext(DAPContext);
  if (context === undefined) throw new Error('useDAP must be used within a DAPProvider');
  return context;
}
