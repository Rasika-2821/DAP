import { useState } from 'react';
import { Search, MapPin, Tag, CheckCircle2, Loader2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchLocation, GeocodingResult, reverseGeocode } from '@/utils/geocoding';
import { getCurrentLocationByIP } from '@/utils/ipgeolocation';
import AutoLocation from './AutoLocation';
import { calculateDigipin } from '@/utils/digipin-engine';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDAP } from '@/contexts/DAPContext';

interface CreateAddressWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (address: { label: string; digipin: string; location: GeocodingResult; description?: string }) => void;
}

const steps = [
  { id: 1, title: 'Search Location', icon: Search },
  { id: 2, title: 'Generate DIGIPIN', icon: MapPin },
  { id: 3, title: 'Add Label', icon: Tag },
];

export function CreateAddressWizard({ open, onOpenChange, onComplete }: CreateAddressWizardProps) {
  const { isAddressLabelTaken, username } = useDAP();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [generatedDigipin, setGeneratedDigipin] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [showAutoLocation, setShowAutoLocation] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };


  const handleAutoLocationFound = (locationData) => {
    // Convert locationData to GeocodingResult shape if needed
    const location = {
      lat: locationData.latitude,
      lon: locationData.longitude,
      displayName: locationData.city
        ? `${locationData.city}, ${locationData.region || ''}, ${locationData.country || ''}`
        : `${locationData.latitude}, ${locationData.longitude}`,
      address: {
        city: locationData.city,
        state: locationData.region,
        country: locationData.country,
        pincode: locationData.pincode || locationData.zipcode
      }
    };
    handleSelectLocation(location);
    setShowAutoLocation(false);
  };

  const handleAutoLocationError = (msg) => {
    toast.error(msg || 'Location detection failed');
    setShowAutoLocation(false);
  };

  const handleSelectLocation = (location: GeocodingResult) => {
    setSelectedLocation(location);
    const digipin = calculateDigipin(location.lat, location.lon);
    setGeneratedDigipin(digipin);
    setCurrentStep(2);
  };



  const handleLabelChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setAddressLabel(sanitized);
    
    // Check if label is taken
    const fullLabel = `${username}@${sanitized}`;
    if (sanitized && isAddressLabelTaken(fullLabel)) {
      setLabelError('This Digital Address ID is already taken. Please choose a unique handle.');
    } else {
      setLabelError(null);
    }
  };

  const handleComplete = () => {
    const fullLabel = `${username}@${addressLabel}`;
    
    // Final validation
    if (isAddressLabelTaken(fullLabel)) {
      setLabelError('This Digital Address ID is already taken. Please choose a unique handle.');
      toast.error('Address label already exists!');
      return;
    }
    
    if (selectedLocation && generatedDigipin && addressLabel) {
      onComplete?.({
        label: addressLabel,
        digipin: generatedDigipin,
        location: selectedLocation,
        description: addressDescription || undefined
      });
      toast.success('Digital Address created successfully!');
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedLocation(null);
    setGeneratedDigipin('');
    setAddressLabel('');
    setAddressDescription('');
    setLabelError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Digital Address</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    currentStep >= step.id
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-16 mx-2",
                  currentStep > step.id ? "bg-accent" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-search">Search your location in India</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="location-search"
                    placeholder="Enter city, area, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAutoLocation(true)}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </Button>
                  {showAutoLocation && (
                    <Dialog open={showAutoLocation} onOpenChange={setShowAutoLocation}>
                      <DialogContent className="max-w-lg">
                        <AutoLocation
                          onLocationFound={handleAutoLocationFound}
                          onError={handleAutoLocationError}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  <Label>Select your location</Label>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full p-3 rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {result.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lat: {result.lat.toFixed(6)}, Lon: {result.lon.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && selectedLocation && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <p className="text-sm text-muted-foreground mb-2">Generated DIGIPIN</p>
                <div className="flex items-center gap-4">
                  <code className="text-3xl font-mono font-bold text-accent tracking-widest">
                    {generatedDigipin}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedDigipin);
                      toast.success('DIGIPIN copied!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This unique 10-character code represents a 4m × 4m area at your selected location.
                </p>
                <div className="mt-4">
                  <p className="text-xs text-accent font-semibold">For best accuracy, please allow your browser to access your device location (GPS) when prompted. If denied, only approximate location can be detected using your IP address.</p>
                </div>
              </div>

              {/* Algorithm Transparency Box */}
              <div className="p-4 rounded-lg border-2 border-dashed border-accent/30 bg-accent/5">
                <p className="text-sm font-semibold text-foreground mb-2">
                  🔬 Technical Trace
                </p>
                <p className="text-sm text-muted-foreground">
                  Algorithm Input Source: <span className="font-semibold text-foreground">Geospatial Coordinates Only</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Latitude: <code className="text-accent font-mono">{selectedLocation.lat.toFixed(6)}</code> | 
                  Longitude: <code className="text-accent font-mono">{selectedLocation.lon.toFixed(6)}</code>
                </p>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Note: Your physical address text (City, Street) is stored as descriptive metadata, 
                  but the DIGIPIN is mathematically derived solely from these coordinates.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Selected Location</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedLocation.displayName}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Location
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="flex-1">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="address-label">Create your Digital Address label</Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-medium text-muted-foreground">{username}@</span>
                  <Input
                    id="address-label"
                    placeholder="home, office, parents..."
                    value={addressLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className={cn("flex-1", labelError && "border-destructive")}
                  />
                </div>
                {labelError ? (
                  <div className="flex items-center gap-2 mt-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs">{labelError}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    This creates a memorable address like <code className="text-accent">{username}@{addressLabel || 'home'}</code>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address-description">Description (optional)</Label>
                <Input
                  id="address-description"
                  placeholder="e.g., My home address, Office at Tech Park..."
                  value={addressDescription}
                  onChange={(e) => setAddressDescription(e.target.value)}
                  className="mt-2"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add a short description to help you identify this address
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-3">Address Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Digital Address</span>
                    <span className="font-medium">{username}@{addressLabel || '...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DIGIPIN</span>
                    <code className="font-mono">{generatedDigipin}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span>India Post AIP</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={!addressLabel || !!labelError}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Digital Address
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
