import { useState } from 'react';
import { GeocodingResult } from '@/utils/geocoding';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressCard } from '@/components/addresses/AddressCard';
import { CreateAddressWizard } from '@/components/addresses/CreateAddressWizard';
import { useDAP } from '@/contexts/DAPContext';

export default function MyAddresses() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { addresses, addAddress, updateAddress, deleteAddress, username } = useDAP();

  const handleCreateAddress = async (newAddress: { label: string; digipin: string; location: GeocodingResult; description?: string }) => {
    const description = newAddress.description || newAddress.location.displayName.split(',').slice(0, 2).join(', ');
    await addAddress(
      newAddress.label,
      newAddress.digipin,
      { lat: newAddress.location.lat, lon: newAddress.location.lon },
      description
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Digital Addresses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your registered addresses and verification status
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Address
        </Button>
      </div>

      {/* Addresses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map((address) => (
          <AddressCard 
            key={address.id} 
            address={address} 
            onDelete={deleteAddress}
            onUpdate={updateAddress}
          />
        ))}
      </div>

      {/* Create Address Wizard */}
      <CreateAddressWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleCreateAddress}
      />
    </div>
  );
}