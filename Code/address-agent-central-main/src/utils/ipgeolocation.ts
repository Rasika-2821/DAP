// Utility to get current location using ipgeolocation.io
// You need to set your API key in the .env file as VITE_IPGEOLOCATION_API_KEY

export interface IPLocation {
  ip: string;
  country_name: string;
  state_prov: string;
  city: string;
  latitude: number;
  longitude: number;
  zipcode?: string;
  district?: string;
  isp?: string;
}

export async function getCurrentLocationByIP(): Promise<IPLocation | null> {
  try {
    const apiKey = import.meta.env.VITE_IPGEOLOCATION_API_KEY;
    if (!apiKey) throw new Error('Missing VITE_IPGEOLOCATION_API_KEY');
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch location');
    const data = await response.json();
    return {
      ip: data.ip,
      country_name: data.country_name,
      state_prov: data.state_prov,
      city: data.city,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      zipcode: data.zipcode,
      district: data.district,
      isp: data.isp,
    };
  } catch (e) {
    console.error('IPGeolocation error:', e);
    return null;
  }
}
