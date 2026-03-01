export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  address?: {
    building?: string;
    road?: string;
    street?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
    pincode?: string;
  };
}

export const searchLocation = async (query: string): Promise<GeocodingResult[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DAP-Connect/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        building: item.address?.building || item.address?.house_number,
        road: item.address?.road,
        street: item.address?.street,
        suburb: item.address?.suburb,
        neighbourhood: item.address?.neighbourhood,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode
      }
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<GeocodingResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DAP-Connect/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();

    return {
      lat,
      lon,
      displayName: data.display_name,
      address: {
        building: data.address?.building || data.address?.house_number,
        road: data.address?.road,
        street: data.address?.street,
        suburb: data.address?.suburb,
        neighbourhood: data.address?.neighbourhood,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
        postcode: data.address?.postcode
      }
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};
