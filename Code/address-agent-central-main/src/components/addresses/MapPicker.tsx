import { useEffect, useRef } from 'react';

interface MapPickerProps {
  lat: number;
  lon: number;
  onPick: (lat: number, lon: number) => void;
}

export function MapPicker({ lat, lon, onPick }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.L) return;
    const map = window.L.map(mapRef.current!).setView([lat, lon], 16);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    const marker = window.L.marker([lat, lon], { draggable: true }).addTo(map);
    marker.on('dragend', function (e: L.DragEndEvent) {
      const { lat, lng } = e.target.getLatLng();
      onPick(lat, lng);
    });
    return () => {
      map.remove();
    };
  }, [lat, lon, onPick]);
  return <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 8, marginTop: 16 }} />;
}
