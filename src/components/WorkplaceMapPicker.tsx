import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, LoaderCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export interface PickedWorkplace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface WorkplaceMapPickerProps {
  value?: PickedWorkplace | null;
  onChange: (location: PickedWorkplace) => void;
}

const TORONTO: [number, number] = [43.6532, -79.3832];
const icon = L.divIcon({
  className: 'workplace-map-marker',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#047857;border:3px solid white;box-shadow:0 2px 8px #0005"><div style="width:7px;height:7px;border-radius:50%;background:white;margin:7px"></div></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function ClickMarker({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click(event) { onPick(event.latlng.lat, event.latlng.lng); } });
  return null;
}

export const WorkplaceMapPicker: React.FC<WorkplaceMapPickerProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value?.name || '');
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('Search for a place or click anywhere on the map to set your workplace.');
  const center = useMemo<[number, number]>(() => value ? [value.latitude, value.longitude] : TORONTO, [value?.latitude, value?.longitude]);

  useEffect(() => { setQuery(value?.name || ''); }, [value?.name]);

  const pickCoordinates = async (latitude: number, longitude: number, label?: string) => {
    const name = label || `Pinned location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    onChange({ name, address: name, latitude, longitude });
    setQuery(name);
    setMessage('Destination pinned. Exact commute time will be calculated when you analyze.');
  };

  const searchLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    setSearching(true);
    setMessage('Searching OpenStreetMap places…');
    try {
      const response = await fetch('/api/locations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Location search is unavailable');
      const result = data.results?.[0];
      if (!result) {
        setMessage('No matching places found. Try a city, intersection, postal code, or nearby landmark, or click the map.');
        return;
      }
      onChange({ name: result.name, address: result.name, latitude: result.latitude, longitude: result.longitude });
      setQuery(result.name);
      setMessage('Place selected. Exact car commute estimates are calculated when you analyze; transit is a rough estimate for custom destinations.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not search locations. You can still click the map to choose a point.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <form onSubmit={searchLocation} className="flex gap-1.5 p-2">
        <div className="relative min-w-0 flex-1">
          <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city, address, intersection…" aria-label="Search workplace location" className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-8 pr-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button type="submit" disabled={searching || !query.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
          {searching ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
        </button>
      </form>
      <MapContainer center={center} zoom={9} scrollWheelZoom className="h-56 w-full" maxBounds={[[40.2, -85.5], [47.2, -73.5]]}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <MapUpdater center={center} />
        <ClickMarker onPick={(latitude, longitude) => void pickCoordinates(latitude, longitude)} />
        {value && <Marker position={center} icon={icon} />}
      </MapContainer>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="text-[10px] leading-relaxed text-stone-500">{message}</p>
        {value && <a href={`https://www.openstreetmap.org/?mlat=${value.latitude}&mlon=${value.longitude}#map=13/${value.latitude}/${value.longitude}`} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] font-semibold text-emerald-800 hover:underline">Open map ↗</a>}
      </div>
      <p className="border-t border-stone-100 bg-stone-50 px-3 py-1.5 text-[9px] text-stone-500">Map data © OpenStreetMap contributors. The map covers the Toronto region and a broad surrounding area; this is a map boundary, not a guaranteed travel-time radius.</p>
    </div>
  );
};
