/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { AREA_ROUTING_COORDINATES, WORKPLACE_ROUTING_COORDINATES } from '../../src/data/routingCoordinates';
import { NEIGHBOURHOODS as APP_NEIGHBOURHOODS } from '../../src/data/neighbourhoods';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST required.' });
  }

  const workplaceId = req.body?.workplaceId;
  const destination = WORKPLACE_ROUTING_COORDINATES[workplaceId];

  if (!destination) {
    return res.status(400).json({ error: 'Unknown workplace' });
  }

  const orsApiKey = process.env.ORS_API_KEY; // set in Vercel Environment Variables for the deployed function
  if (!orsApiKey) {
    return res.status(503).json({ error: 'Driving route service is not configured' });
  }

  const areas = APP_NEIGHBOURHOODS.map((area) => ({
    id: area.id,
    coordinates: AREA_ROUTING_COORDINATES[area.id],
  }));

  if (areas.some((area) => !area.coordinates)) {
    return res.status(500).json({ error: 'A neighborhood route coordinate is missing' });
  }

  const destinationIndex = areas.length;

  try {
    const orsResponse = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
      method: 'POST',
      headers: {
        Authorization: orsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: [...areas.map((area) => area.coordinates), destination],
        sources: areas.map((_, index) => index),
        destinations: [destinationIndex],
        metrics: ['distance', 'duration'],
      }),
    });

    if (!orsResponse.ok) {
      console.warn(`OpenRouteService matrix request failed: HTTP ${orsResponse.status}`);
      return res.status(502).json({ error: 'Driving routes are temporarily unavailable' });
    }

    const matrix = (await orsResponse.json()) as {
      distances?: Array<Array<number | null>>;
      durations?: Array<Array<number | null>>;
    };

    const estimates: Record<string, { carDistanceKm: number; carMinutes: number }> = {};
    areas.forEach((area, index) => {
      const distanceMeters = matrix.distances?.[index]?.[0];
      const durationSeconds = matrix.durations?.[index]?.[0];

      if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters <= 0 || distanceMeters > 500_000) return;
      if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 300 * 60) return;

      estimates[area.id] = {
        carDistanceKm: Number((distanceMeters / 1000).toFixed(1)),
        carMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      };
    });

    return res.json({
      estimates,
      source: 'OpenRouteService',
      estimateNote: 'Road routing estimate from neighborhood centers; not live traffic.',
    });
  } catch (error) {
    console.warn('OpenRouteService matrix request failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(502).json({ error: 'Driving routes are temporarily unavailable' });
  }
}
