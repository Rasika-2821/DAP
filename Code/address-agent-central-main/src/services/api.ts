// src/services/api.ts
// Real API integration with backend services

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = {
    activityLogs: {
      async fetch(token: string) {
        const response = await fetch(`${API_BASE_URL}/activity-logs/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        return response.json();
      },
    },
  aiu: {
    async autoLocate() {
      try {
        const response = await fetch(`${API_BASE_URL}/locations/ip-location`);
        if (!response.ok) {
          throw new Error('Failed to get IP location');
        }
        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('IP location error:', error);
        // Fallback to default location if API fails
        return {
          data: {
            latitude: 12.9716,
            longitude: 77.5946,
            city: 'Bengaluru',
            region: 'Karnataka',
            country: 'India',
            zipcode: '560001',
          },
        };
      }
    },
    async gpsLocate({ latitude, longitude }: { latitude: number; longitude: number }) {
      try {
        const response = await fetch(`${API_BASE_URL}/addresses/generate-digipin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latitude, longitude }),
        });
        if (!response.ok) {
          throw new Error('Failed to generate DIGIPIN');
        }
        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('DIGIPIN generation error:', error);
        throw error;
      }
    },
  },
  addresses: {
    async update(addressId: number, updates: Record<string, any>, token: string) {
      const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update address');
      }
      return response.json();
    },
    async delete(addressId: number, token: string) {
      const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      return response.json();
    },
  },
};

export default api;
