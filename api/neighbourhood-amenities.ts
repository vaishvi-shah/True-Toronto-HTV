/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AREA_ROUTING_COORDINATES } from '../src/data/routingCoordinates.js';
import { NEIGHBOURHOODS } from '../src/data/neighbourhoods.js';

export const config = { runtime: 'nodejs' };

const RADIUS_METRES = 1500;
const POI_ENDPOINT = 'https://api.heigit.org/openpoiservice/v0/pois';
const POI_CATEGORY_IDS = [
  518, 451, 474, 475, // supermarkets and grocery shops
  208, 370, 192, 191, 396, 393, 456, 502, // everyday services
  588, 587, 604, 597, 605, 607, 608, 595, // transit
  280, 283, 282, 288, 271, 292, 272, 279, // parks, play and sports
  133, 363, 131, 299, 134, 132, // libraries and culture
];

type PlaceFeature = {
  geometry?: { type?: string; coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    distance?: number;
    osm_tags?: Record<string, string>;
  };
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

function distanceKm(a: [number, number], b: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = radians(b[1] - a[1]);
  const lonDelta = radians(b[0] - a[0]);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function displayName(tags: Record<string, string>) {
  if (tags.name?.trim()) return tags.name.trim();
  return tags.shop || tags.amenity || tags.leisure || tags.public_transport || tags.railway || tags.highway || tags.tourism || 'Mapped place';
}

async function loadAreaPlaces(areaId: string) {
  const point = AREA_ROUTING_COORDINATES[areaId];
  const apiKey = process.env.ORS_API_KEY;
  if (!point) return [];
  if (!apiKey) throw new Error('ORS_API_KEY is not configured');

  const response = await fetch(POI_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      request: 'pois',
      geometry: { geojson: { type: 'Point', coordinates: point }, buffer: RADIUS_METRES },
      filters: { category_ids: POI_CATEGORY_IDS },
      limit: 500,
      sortby: 'distance',
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`OpenPOIService returned HTTP ${response.status}: ${detail}`);
  }
  const payload = await response.json() as { features?: PlaceFeature[] };
  if (!Array.isArray(payload.features)) throw new Error('OpenPOIService response did not include features');
  return payload.features;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. GET required.' });
  }

  try {
    const byNeighbourhood: Record<string, Record<keyof typeof categories, PlaceSummary>> = {};

    const areaResults = await Promise.all(NEIGHBOURHOODS.map(async (area) => ({
      area,
      features: await loadAreaPlaces(area.id),
    })));
    for (const { area, features } of areaResults) {
      const areaPoint = AREA_ROUTING_COORDINATES[area.id];
      if (!areaPoint) continue;
      const nearby = features.flatMap((feature) => {
        const point = feature.geometry?.coordinates;
        if (!point || point.length !== 2 || distanceKm(areaPoint, point) > RADIUS_METRES / 1000) return [];
        return [{ tags: feature.properties?.osm_tags || {}, distance: feature.properties?.distance != null
          ? feature.properties.distance / 1000
          : distanceKm(areaPoint, point) }];
      });
      const summaries = {} as Record<keyof typeof categories, PlaceSummary>;
      for (const key of Object.keys(categories) as Array<keyof typeof categories>) {
        const matched = nearby
          .filter(({ tags }) => categories[key](tags))
          .sort((a, b) => a.distance - b.distance);
        summaries[key] = {
          countWithin1_5Km: matched.length,
          nearest: matched[0]
            ? { name: displayName(matched[0].tags), distanceKm: Number(matched[0].distance.toFixed(2)) }
            : null,
        };
      }
      byNeighbourhood[area.id] = summaries;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      byNeighbourhood,
      dataAsOf: new Date().toISOString().slice(0, 10),
      source: 'OpenStreetMap via openpoiservice',
      radiusKm: RADIUS_METRES / 1000,
    });
  } catch (error) {
    console.error('[api/neighbourhood-amenities] load failed', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Nearby place data is temporarily unavailable' });
  }
}
