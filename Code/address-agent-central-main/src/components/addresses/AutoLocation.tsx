import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import api from '../../services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number | string;
  source: string;
  digipin?: string;
  message?: string;
  city?: string;
  region?: string;
  country?: string;
}

export default function AutoLocation({ onLocationFound, onError }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const getGPSLocation = (): Promise<Omit<LocationData, 'digipin' | 'message' | 'city' | 'region' | 'country'>> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // If accuracy is poor, warn user
          if (position.coords.accuracy > 100) {
            setAccuracy(position.coords.accuracy);
          } else {
            setAccuracy(null);
          }
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps'
          });
        },
        (error) => {
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user. Please allow location access in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Try moving to an open area or check your device settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Try again or check your connection.';
              break;
            default:
              errorMessage = 'Unknown location error.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased timeout for better accuracy
          maximumAge: 0 // Always get fresh location
        }
      );
    });
  };

  const getIPLocation = async (): Promise<Omit<LocationData, 'digipin' | 'message'>> => {
    try {
      const response = await api.aiu.autoLocate();
      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        city: response.data.city,
        region: response.data.region,
        country: response.data.country,
        accuracy: 'approximate',
        source: 'ip'
      };
    } catch (error) {
      throw new Error('IP-based location detection failed');
    }
  };

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError('');
    setMethod('');
    setAccuracy(null);

    try {
      // Try GPS first
      setMethod('Detecting via GPS...');
      const gpsLocation = await getGPSLocation();

      // Send GPS coordinates to backend for DIGIPIN generation
      const response = await api.aiu.gpsLocate({
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude
      });

      const locationData = {
        ...gpsLocation,
        digipin: response.data.digipin,
        message: response.data.message
      };

      setLocation(locationData);
      setMethod('GPS Location');
      onLocationFound?.(locationData);

    } catch (gpsError) {
      // If GPS fails, show a tip for better accuracy
      setAccuracy(null);
      setError('GPS location failed. For best results, enable location services, move to an open area, and ensure your device has a clear view of the sky.');
      console.log('GPS failed, trying IP-based location:', gpsError.message);

      try {
        // Fallback to IP-based location
        setMethod('Detecting via IP address...');
        const ipLocation = await getIPLocation();

        const locationData = {
          ...ipLocation,
          message: 'Approximate location detected via IP address'
        };

        setLocation(locationData);
        setMethod('IP-based Location');
        onLocationFound?.(locationData);

      } catch (ipError) {
        setAccuracy(null);
        console.log('IP location also failed:', ipError.message);
        setError('Unable to detect your location. Please enter your address manually.');
        onError?.('Location detection failed');
      }
    } finally {
      setLoading(false);
    }
  }, [onLocationFound, onError]);

  const handleRetry = () => {
    detectLocation();
  };

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-blue-600" />
          Automatic Location Detection
        </h3>
        <button
          onClick={handleRetry}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Detecting...' : 'Retry'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center text-blue-600 mb-4">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          <span>{method}</span>
        </div>
      )}
      {accuracy && (
        <div className="flex items-center text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>
            GPS accuracy is low (~{Math.round(accuracy)} meters). For best results, move to an open area and retry.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      {/* User tips for best accuracy */}
      {!loading && !location && !error && (
        <div className="text-center text-gray-500 py-4">
          <p className="mb-2">Tips for best location accuracy:</p>
          <ul className="text-xs text-gray-400 list-disc list-inside">
            <li>Enable location services in your browser and device settings.</li>
            <li>Move to an open area with a clear view of the sky.</li>
            <li>Wait a few seconds for GPS to lock on.</li>
            <li>If accuracy is low, retry detection.</li>
          </ul>
        </div>
      )}

      {location && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center text-green-800 mb-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Location Found ({method})</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Coordinates:</span>
              <br />
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>

            {location.digipin && (
              <div>
                <span className="font-medium text-gray-700">DIGIPIN:</span>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {location.digipin}
                </code>
              </div>
            )}

            {location.city && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Approximate Location:</span>
                <br />
                {location.city}, {location.region}, {location.country}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-2">{location.message}</p>
        </div>
      )}

      {!loading && !location && !error && (
        <div className="text-center text-gray-500 py-8">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Click "Retry" to detect your location automatically</p>
        </div>
      )}
    </div>
  );
}
