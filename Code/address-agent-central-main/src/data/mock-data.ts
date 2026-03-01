
export const mockUser = {
  id: 'usr_vikram_001',
  name: 'Vikram Sharma',
  email: 'vikram.sharma@email.com',
  phone: '+91 98765 43210',
  kycStatus: 'verified' as const,
  aadhaarLinked: true,
  createdAt: new Date('2024-01-15')
};

export const mockAddresses: DigitalAddress[] = [
  {
    id: 'addr_001',
    label: 'vikram@home',
    digipin: '3JK-4M5-6LPT',
    provider: 'India Post AIP',
    verificationLevel: 'L3',
    verificationLabel: 'Physically Verified',
    createdAt: '2024-01-15',
    lat: 28.6139,
    lon: 77.2090,
    description: 'A-42, Vasant Kunj, New Delhi'
  },
  {
    id: 'addr_002',
    label: 'vikram@office',
    digipin: '8F9-C3J-K4MP',
    provider: 'PhonePe AIP',
    verificationLevel: 'L2',
    verificationLabel: 'Registry Verified',
    createdAt: '2024-03-20',
    lat: 28.4595,
    lon: 77.0266,
    description: 'Tower B, Cyber City, Gurugram'
  },
  {
    id: 'addr_003',
    label: 'vikram@parents',
    digipin: '2K5-6LM-PT8F',
    provider: 'India Post AIP',
    verificationLevel: 'L1',
    verificationLabel: 'Self Declared',
    createdAt: '2024-06-10',
    lat: 26.8467,
    lon: 80.9462,
    description: 'MG Road, Lucknow'
  }
];

export const mockConsents: AccessConsent[] = [
  {
    id: 'consent_001',
    appName: 'Amazon Logistics',
    appLogo: '📦',
    accessScope: 'one-time',
    scopeLabel: 'One-Time Delivery',
    linkedAddress: 'vikram@home',
    expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 mins from now
    status: 'active'
  },
  {
    id: 'consent_002',
    appName: 'HDFC Bank',
    appLogo: '🏦',
    accessScope: 'permanent',
    scopeLabel: 'KYC Verification',
    linkedAddress: 'vikram@home',
    expiresAt: null,
    status: 'active'
  },
  {
    id: 'consent_003',
    appName: 'Uber',
    appLogo: '🚗',
    accessScope: 'one-time',
    scopeLabel: 'Ride Pickup',
    linkedAddress: 'vikram@office',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins from now
    status: 'active'
  },
  {
    id: 'consent_004',
    appName: 'Flipkart',
    appLogo: '🛒',
    accessScope: 'one-time',
    scopeLabel: 'Delivery Address',
    linkedAddress: 'vikram@home',
    expiresAt: new Date(Date.now() - 10 * 60 * 1000), // expired
    status: 'expired'
  }
];

export const mockPendingRequests: AccessRequest[] = [
  {
    id: 'req_001',
    appName: 'Swiggy',
    appLogo: '🍔',
    requestedScope: 'One-Time Delivery Access',
    requestedAddress: 'vikram@home',
    requestedAt: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: 'req_002',
    appName: 'Zepto',
    appLogo: '⚡',
    requestedScope: 'Recurring Delivery Access',
    requestedAddress: 'vikram@home',
    requestedAt: new Date(Date.now() - 5 * 60 * 1000)
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log_001',
    action: 'Address Accessed',
    description: 'Amazon Logistics resolved vikram@home for delivery',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    type: 'access'
  },
  {
    id: 'log_002',
    action: 'Consent Granted',
    description: 'Approved HDFC Bank for permanent KYC access',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'access'
  },
  {
    id: 'log_003',
    action: 'Address Created',
    description: 'Created new address vikram@parents',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: 'create'
  },
  {
    id: 'log_004',
    action: 'Consent Revoked',
    description: 'Revoked Myntra delivery access',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    type: 'revoke'
  },
  {
    id: 'log_005',
    action: 'Verification Complete',
    description: 'vikram@home verified by India Post AAVA',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    type: 'verify'
  }
];
