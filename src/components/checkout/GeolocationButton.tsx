import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoAddress {
  street: string;
  number: string;
  neighborhood: string;
}

interface GeolocationButtonProps {
  onAddressFound: (address: GeoAddress) => void;
}

export function GeolocationButton({ onAddressFound }: GeolocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Seu navegador não suporta geolocalização.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          onAddressFound({
            street: addr.road || addr.pedestrian || addr.footway || '',
            number: addr.house_number || '',
            neighborhood:
              addr.suburb || addr.neighbourhood || addr.city_district || addr.town || '',
          });
        } catch {
          setError('Não foi possível obter o endereço. Preencha manualmente.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Permissão de localização negada. Preencha o endereço manualmente.');
        } else {
          setError('Não foi possível obter sua localização. Tente novamente.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Render Leaflet map when coords are available
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    // Destroy previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      attributionControl: false,
    }).setView([coords.lat, coords.lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Custom marker icon to avoid default icon issues
    const icon = L.divIcon({
      html: '<div style="color:hsl(var(--primary));display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg></div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([coords.lat, coords.lng], { icon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGetLocation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="h-4 w-4" />
        )}
        {loading ? 'Obtendo localização...' : 'Usar minha localização'}
      </Button>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {coords && (
        <div
          ref={mapRef}
          className="w-full h-40 rounded-xl overflow-hidden border border-border"
        />
      )}
    </div>
  );
}
