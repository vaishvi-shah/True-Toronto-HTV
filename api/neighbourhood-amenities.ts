/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AREA_ROUTING_COORDINATES } from '../src/data/routingCoordinates.js';
import { NEIGHBOURHOODS } from '../src/data/neighbourhoods.js';

export const config = { runtime: 'nodejs' };

const RADIUS_METRES = 1500;
// The private.coffee instance is maintained for public use and currently
// offers more capacity than the frequently rate-limited main instance.
const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

type OSMElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PlaceSummary = {
  countWithin1_5Km: number;
  nearest: { name: string; distanceKm: number } | null;
};

const categories = {
  groceries: (tags: Record<string, string>) =>
    /^(supermarket|convenience|greengrocer|grocery|food|farm|deli|bakery)$/.test(tags.shop || ''),
  everydayEssentials: (tags: Record<string, string>) =>
    /^(pharmacy|post_office|bank|atm|laundry|parcel_locker)$/.test(tags.amenity || '')
    || /^(pharmacy|chemist|laundry|dry_cleaning|optician|department_store)$/.test(tags.shop || ''),
  transitAccess: (tags: Record<string, string>) =>
    /^(platform|station|stop_position)$/.test(tags.public_transport || '')
    || tags.highway === 'bus_stop'
    || /^(station|halt|tram_stop|subway_entrance)$/.test(tags.railway || '')
    || /^(bus_station|ferry_terminal)$/.test(tags.amenity || ''),
  recreation: (tags: Record<string, string>) =>
    /^(park|playground|pitch|sports_centre|fitness_centre|swimming_pool|garden|nature_reserve)$/.test(tags.leisure || '')
    || /^(library|community_centre|arts_centre|theatre|cinema)$/.test(tags.amenity || '')
    || /^(museum|gallery)$/.test(tags.tourism || ''),
} satisfies Record<string, (tags: Record<string, string>) => boolean>;

function overpassQuery() {
  const selectors = NEIGHBOURHOODS.flatMap((area) => {
    const point = AREA_ROUTING_COORDINATES[area.id];
    if (!point) return [];
    const [lon, lat] = point;
    const around = `(around:${RADIUS_METRES},${lat},${lon})`;
    // A single key-regex selector per area avoids issuing seven overlapping
    // Overpass scans for each neighbourhood. Category filtering happens here.
    return [`nwr${around}[~"^(shop|amenity|public_transport|highway|railway|leisure|tourism)$"~"."];`];
  });
  return `[out:json][timeout:20];(${selectors.join('')});out center tags;`;
}

function pointFor(element: OSMElement) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return typeof lat === 'number' && typeof lon === 'number' ? [lon, lat] as [number, number] : null;
}

function distanceKm(a: [number, number], b: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = radians(b[1] - a[1]);
  const lonDelta = radians(b[0] - a[0]);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function displayName(element: OSMElement) {
  const tags = element.tags || {};
  if (tags.name?.trim()) return tags.name.trim();
  return tags.shop || tags.amenity || tags.leisure || tags.public_transport || tags.railway || tags.highway || tags.tourism || 'Mapped place';
}

async function loadElements() {
  const body = `data=${encodeURIComponent(overpassQuery())}`;
  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body,
        signal: AbortSignal.timeout(4200),
      });
      if (!response.ok) throw new Error(`Overpass returned HTTP ${response.status}`);
      const payload = await response.json() as { elements?: OSMElement[] };
      if (!Array.isArray(payload.elements)) throw new Error('Overpass response did not include elements');
      return payload.elements;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Nearby place data could not be loaded');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. GET required.' });
  }

  try {
    const elements = await loadElements();
    const byNeighbourhood: Record<string, Record<keyof typeof categories, PlaceSummary>> = {};

    for (const area of NEIGHBOURHOODS) {
      const areaPoint = AREA_ROUTING_COORDINATES[area.id];
      if (!areaPoint) continue;
      const nearby = elements.flatMap((element) => {
        const point = pointFor(element);
        if (!point || distanceKm(areaPoint, point) > RADIUS_METRES / 1000) return [];
        return [{ element, distance: distanceKm(areaPoint, point) }];
      });

      const summaries = {} as Record<keyof typeof categories, PlaceSummary>;
      for (const key of Object.keys(categories) as Array<keyof typeof categories>) {
        const matched = nearby
          .filter(({ element }) => categories[key](element.tags || {}))
          .sort((a, b) => a.distance - b.distance);
        summaries[key] = {
          countWithin1_5Km: matched.length,
          nearest: matched[0]
            ? { name: displayName(matched[0].element), distanceKm: Number(matched[0].distance.toFixed(2)) }
            : null,
        };
      }
      byNeighbourhood[area.id] = summaries;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      byNeighbourhood,
      dataAsOf: new Date().toISOString().slice(0, 10),
      source: 'OpenStreetMap via Overpass API',
      radiusKm: RADIUS_METRES / 1000,
    });
  } catch (error) {
    console.error('[api/neighbourhood-amenities] load failed', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Nearby place data is temporarily unavailable' });
  }
}
