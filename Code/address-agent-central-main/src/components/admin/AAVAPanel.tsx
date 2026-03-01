import { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, RefreshCw, MapPin, Camera, Upload, AlertTriangle, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Label } from '@/components/ui/label';
import { useDAP } from '@/contexts/DAPContext';
import { toast } from 'sonner';

// Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface VerificationState {
  photo: File | null;
  photoPreview: string | null;
  photoGeoTag: { lat: number; lon: number } | null;
  currentLocation: { lat: number; lon: number } | null;
  locationError: string | null;
  isGettingLocation: boolean;
}

export function AAVAPanel() {
  const { completeVerification, token } = useDAP();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localRequests, setLocalRequests] = useState<any[]>([]);
  const [verificationStates, setVerificationStates] = useState<Record<string, VerificationState>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const MAX_DISTANCE_METERS = 100; // Must be within 100 meters

  // Fetch verification requests from backend
  const fetchRequests = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/aava/all-verifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLocalRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch verification requests:', error);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const getVerificationState = (requestId: string): VerificationState => {
    return verificationStates[requestId] || {
      photo: null,
      photoPreview: null,
      photoGeoTag: null,
      currentLocation: null,
      locationError: null,
      isGettingLocation: false
    };
  };

  const updateVerificationState = (requestId: string, updates: Partial<VerificationState>) => {
    setVerificationStates(prev => ({
      ...prev,
      [requestId]: { ...getVerificationState(requestId), ...updates }
    }));
  };

  // Extract GPS coordinates from image EXIF data
  const extractGeoTag = async (file: File): Promise<{ lat: number; lon: number } | null> => {
    return new Promise((resolve) => {
      // For demo purposes, we'll simulate geotag extraction
      // In production, use a library like exif-js or piexifjs
      const reader = new FileReader();
      reader.onload = () => {
        // Simulate geotag extraction - in real implementation parse EXIF
        // Return null to indicate no geotag found (user can use current location)
        resolve(null);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePhotoUpload = async (requestId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    
    // Try to extract geotag
    const geoTag = await extractGeoTag(file);
    
    updateVerificationState(requestId, {
      photo: file,
      photoPreview: preview,
      photoGeoTag: geoTag
    });

    if (geoTag) {
      toast.success(`Photo geotag detected: ${geoTag.lat.toFixed(4)}, ${geoTag.lon.toFixed(4)}`);
    } else {
      toast.info('No geotag found in photo. Please capture your current location.');
    }
  };

  const getCurrentLocation = async (requestId: string) => {
    updateVerificationState(requestId, { isGettingLocation: true, locationError: null });

    if (!navigator.geolocation) {
      updateVerificationState(requestId, { 
        isGettingLocation: false, 
        locationError: 'Geolocation is not supported by your browser' 
      });
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateVerificationState(requestId, {
          isGettingLocation: false,
          currentLocation: {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
        });
        toast.success(`Location captured: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      },
      (error) => {
        let errorMsg = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }
        updateVerificationState(requestId, { isGettingLocation: false, locationError: errorMsg });
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const canVerify = (requestId: string, targetLat: number, targetLon: number): { canVerify: boolean; distance?: number; reason?: string } => {
    const state = getVerificationState(requestId);
    
    if (!state.photo) {
      return { canVerify: false, reason: 'Please upload a photo of the location' };
    }

    const locationToUse = state.photoGeoTag || state.currentLocation;
    if (!locationToUse) {
      return { canVerify: false, reason: 'Please capture your current location' };
    }

    const distance = calculateDistance(locationToUse.lat, locationToUse.lon, targetLat, targetLon);
    
    if (distance > MAX_DISTANCE_METERS) {
      return { 
        canVerify: false, 
        distance,
        reason: `You are ${distance.toFixed(0)}m away. Must be within ${MAX_DISTANCE_METERS}m of the address.` 
      };
    }

    return { canVerify: true, distance };
  };

  const handleComplete = async (requestId: string, verified: boolean, targetLat: number, targetLon: number) => {
    if (verified) {
      const check = canVerify(requestId, targetLat, targetLon);
      if (!check.canVerify) {
        toast.error(check.reason || 'Cannot verify');
        return;
      }
    }

    const success = await completeVerification(requestId, verified);
    if (success) {
      toast.success(verified ? 'Address verified successfully! Upgraded to L3.' : 'Verification rejected.');
      // Clear verification state
      setVerificationStates(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
      fetchRequests();
    } else {
      toast.error('Failed to complete verification');
    }
  };

  const pendingRequests = localRequests.filter(r => r.status === 'PENDING');
  const completedRequests = localRequests.filter(r => r.status !== 'PENDING');

  return (
    <Card className="border-yellow-500/30 bg-yellow-50/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AAVA Field Agent Panel</CardTitle>
              <CardDescription>Complete physical verification with photo & location proof</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No pending verification requests</p>
            <p className="text-sm mt-1">Use "Request Verification" on any address to create one</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {pendingRequests.length} pending verification(s)
            </div>
            {pendingRequests.map((req) => {
              const state = getVerificationState(req.request_id);
              const verifyCheck = canVerify(req.request_id, req.latitude, req.longitude);
              const locationToUse = state.photoGeoTag || state.currentLocation;

              return (
                <div key={req.request_id} className="p-4 rounded-lg border bg-card space-y-4">
                  {/* Address Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="font-semibold">{req.address_label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        DIGIPIN: <code className="bg-muted px-1 rounded">{req.digipin}</code>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {req.latitude?.toFixed(6)}, {req.longitude?.toFixed(6)}
                      </p>
                    </div>
                    <StatusBadge variant="blue">{req.status}</StatusBadge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>Request ID: {req.request_id}</p>
                    <p>Purpose: {req.purpose}</p>
                  </div>

                  {/* Photo Upload Section */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <Label className="text-sm font-medium">Step 1: Upload Photo with Geotag</Label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={(el) => fileInputRefs.current[req.request_id] = el}
                      onChange={(e) => handlePhotoUpload(req.request_id, e)}
                    />
                    
                    {state.photoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={state.photoPreview} 
                          alt="Verification photo" 
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Photo uploaded
                          {state.photoGeoTag && (
                            <span className="text-muted-foreground">
                              (Geotag: {state.photoGeoTag.lat.toFixed(4)}, {state.photoGeoTag.lon.toFixed(4)})
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => fileInputRefs.current[req.request_id]?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => fileInputRefs.current[req.request_id]?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload/Capture Photo
                      </Button>
                    )}
                  </div>

                  {/* Location Capture Section */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <Label className="text-sm font-medium">Step 2: Capture Current Location</Label>
                    
                    {state.currentLocation ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Navigation className="h-3 w-3" />
                          Your Location: {state.currentLocation.lat.toFixed(6)}, {state.currentLocation.lon.toFixed(6)}
                        </div>
                        {locationToUse && (
                          <div className={`text-xs ${verifyCheck.canVerify ? 'text-green-600' : 'text-red-500'}`}>
                            Distance to target: {verifyCheck.distance?.toFixed(0) || 'N/A'}m
                            {verifyCheck.canVerify ? ' ✓ Within range' : ` (must be within ${MAX_DISTANCE_METERS}m)`}
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => getCurrentLocation(req.request_id)}
                          disabled={state.isGettingLocation}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Update Location
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {state.locationError && (
                          <div className="flex items-center gap-2 text-xs text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            {state.locationError}
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => getCurrentLocation(req.request_id)}
                          disabled={state.isGettingLocation}
                        >
                          <Navigation className={`h-4 w-4 mr-2 ${state.isGettingLocation ? 'animate-pulse' : ''}`} />
                          {state.isGettingLocation ? 'Getting Location...' : 'Get Current Location'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Verification Status */}
                  {!verifyCheck.canVerify && state.photo && locationToUse && (
                    <div className="p-2 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        {verifyCheck.reason}
                      </div>
                    </div>
                  )}

                  {verifyCheck.canVerify && (
                    <div className="p-2 rounded bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Ready to verify! Location confirmed within {verifyCheck.distance?.toFixed(0)}m
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleComplete(req.request_id, true, req.latitude, req.longitude)}
                      disabled={!verifyCheck.canVerify}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify (L3)
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleComplete(req.request_id, false, req.latitude, req.longitude)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {completedRequests.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Completed Verifications ({completedRequests.length})
            </p>
            <div className="space-y-2">
              {completedRequests.slice(0, 5).map((req) => (
                <div key={req.request_id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <span>{req.address_label}</span>
                  <StatusBadge variant={req.status === 'VERIFIED' ? 'gold' : 'gray'}>
                    {req.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
