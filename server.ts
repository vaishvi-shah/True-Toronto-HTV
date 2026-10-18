import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_DIRECTIVE } from './lib/llm/prompts';
import { ATTACHED_POSTINGS, buildPlatformSearchUrls } from './src/data/listings';
import {
  buildUnifiedExplainPrompt,
  buildUnifiedFallback,
  calculateNeighbourhoodCosts,
  normalizeToUserPreferences,
} from './src/services/unifiedEngine';
import { UserPreferences } from './src/types';
import { analyzeSensitivity } from './src/services/sensitivityAnalysis';
import { runMonteCarloSimulation } from './src/services/monteCarloSimulation';
import { estimateRentWithInterval, getModelCoefficients } from './src/services/rentRegressionModel';
import { NEIGHBOURHOODS as APP_NEIGHBOURHOODS } from './src/data/neighbourhoods';
import { AREA_ROUTING_COORDINATES, WORKPLACE_ROUTING_COORDINATES } from './src/data/routingCoordinates';

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const nearbyAmenityCache = new Map<string, { cachedAt: number; payload: unknown }>();

app.use(express.json());

// Initialize Google GenAI with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Single-engine note: all routes below run the SAME client calculator via
 * src/services/unifiedEngine (normalize + calculateNeighbourhoodCosts).
 * The legacy lib/engine copy is no longer used in serving paths, so server
 * anchors always agree with the banner/panel/cards ($2,039 unanimous).
 * The isExplanationConsistent guard stays client-side as a safety net.
 */

/**
 * Route: POST /api/compare
 * Pure calculation route: Profile + optional neighbourhood IDs -> Breakdown[]
 */
app.post('/api/compare', (req: Request, res: Response) => {
  const raw = req.body.profile || req.body.preferences;
  if (!raw) {
    return res.status(400).json({ error: 'Missing profile parameter' });
  }
  const preferences: UserPreferences = normalizeToUserPreferences(raw);
  const ids: string[] | undefined = req.body.neighbourhoodIds;

  let results = calculateNeighbourhoodCosts(preferences);
  if (Array.isArray(ids) && ids.length > 0) {
    results = results.filter((r) => ids.includes(r.neighbourhood.id));
  }

  // `breakdowns` kept for legacy consumers; `results` is the canonical shape.
  return res.json({ breakdowns: results, results });
});

/**
 * Route: POST /api/explain & POST /api/gemini/explain
 * Explains calculation results in plain language without calculating new math.
 * Includes a computed estimate range for the result view.
 */
const handleExplain = async (req: Request, res: Response) => {
  const raw = req.body.profile || req.body.preferences;

  if (!raw) {
    return res.status(400).json({ error: 'Missing profile/preferences' });
  }

  const preferences: UserPreferences = normalizeToUserPreferences(raw);
  const results = calculateNeighbourhoodCosts(preferences);

  // Compute the estimate range used by the result view.
  let monteCarloResult;
  try {
    monteCarloResult = runMonteCarloSimulation(preferences, 1000);
  } catch (err) {
    console.warn('Estimate range computation error:', err);
  }

  const monteCarloInsight = monteCarloResult?.primaryInsight || '';
  const fallback = buildUnifiedFallback(preferences, results, monteCarloInsight);

  if (!apiKey) {
    return res.json({
      ...fallback,
      monteCarlo: monteCarloResult,
    });
  }

  try {
    const prompt = buildUnifiedExplainPrompt(preferences, results, monteCarloInsight);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_DIRECTIVE,
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      monteCarloInsight: parsed.monteCarloInsight || monteCarloInsight,
      monteCarlo: monteCarloResult,
      isAiGenerated: true,
    });
  } catch (error) {
    console.warn('Gemini explain error or timeout, falling back:', error);
    return res.json({
      ...fallback,
      monteCarlo: monteCarloResult,
    });
  }
};

app.post('/api/explain', handleExplain);
app.post('/api/gemini/explain', handleExplain);

/**
 * Route: POST /api/chat & POST /api/gemini/what-if
 * What-if exploration: executes deterministic engine, then LLM explains tradeoffs
 */
const handleWhatIfChat = async (req: Request, res: Response) => {
  const originalRaw = req.body.originalProfile || req.body.originalPreferences;
  const scenarioPatch = req.body.scenarioPatch || {};
  const question: string = req.body.question || req.body.message || 'What if I change my commute or rent?';

  if (!originalRaw) {
    return res.status(400).json({ error: 'Missing originalProfile' });
  }

  const originalPreferences: UserPreferences = normalizeToUserPreferences(originalRaw);
  const newPreferences: UserPreferences = normalizeToUserPreferences({
    ...originalRaw,
    ...scenarioPatch,
  });

  const oldResults = calculateNeighbourhoodCosts(originalPreferences);
  const newResults = calculateNeighbourhoodCosts(newPreferences);

  const oldCheapest = oldResults[0];
  const newCheapest = newResults[0];

  const costDifference = newCheapest.trueMonthlyCost - oldCheapest.trueMonthlyCost;
  const hoursDifference = Number(
    (newCheapest.monthlyCommuteHours - oldCheapest.monthlyCommuteHours).toFixed(1)
  );
  const carbonDifference = newCheapest.carbonFootprintKg.total - oldCheapest.carbonFootprintKg.total;

  const fallbackAnswer = {
    scenarioTitle: question,
    costDifference,
    hoursDifference,
    carbonDifference,
    oldCheapestName: oldCheapest.neighbourhood.name,
    newCheapestName: newCheapest.neighbourhood.name,
    summary:
      costDifference < 0
        ? `This scenario saves $${Math.abs(costDifference)}/month in out-of-pocket true costs and shifts your best option to ${newCheapest.neighbourhood.name}. Monthly commute travel changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`
        : `This scenario increases true costs by $${costDifference}/month. Monthly commute travel changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`,
    isAiGenerated: false,
    newBreakdowns: newResults.slice(0, 5),
  };

  if (!apiKey) {
    return res.json(fallbackAnswer);
  }

  try {
    const prompt = `The user asked a "what if" question: "${question}"

The deterministic calculator has already rerun all the math.
BASELINE:
- Mode: ${originalPreferences.commuteMode}, Income: $${originalPreferences.annualIncome}, Remote days/week: ${originalPreferences.hybridRemoteDaysPerWeek}
- Best True Cost Option: ${oldCheapest.neighbourhood.name} ($${oldCheapest.trueMonthlyCost}/mo true cost, ${oldCheapest.monthlyCommuteHours}h commute/mo, ${oldCheapest.carbonFootprintKg.total} kg CO2e/mo)

NEW SCENARIO:
- Mode: ${newPreferences.commuteMode}, Income: $${newPreferences.annualIncome}, Remote days/week: ${newPreferences.hybridRemoteDaysPerWeek}
- Best True Cost Option: ${newCheapest.neighbourhood.name} ($${newCheapest.trueMonthlyCost}/mo true cost, ${newCheapest.monthlyCommuteHours}h commute/mo, ${newCheapest.carbonFootprintKg.total} kg CO2e/mo)

DIFFERENCES:
- True monthly cost delta: $${costDifference} (negative is savings, positive is more expensive)
- Travel time delta: ${hoursDifference} hrs/month
- Carbon emissions delta: ${carbonDifference} kg CO2e/month

Respond with JSON:
{
  "scenarioTitle": "${question}",
  "costDifference": ${costDifference},
  "hoursDifference": ${hoursDifference},
  "carbonDifference": ${carbonDifference},
  "oldCheapestName": "${oldCheapest.neighbourhood.name}",
  "newCheapestName": "${newCheapest.neighbourhood.name}",
  "summary": "2-3 short, friendly, precise sentences explaining the financial and quality-of-life impact using only the numbers above. Never invent numbers."
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_DIRECTIVE,
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      isAiGenerated: true,
      newBreakdowns: newResults.slice(0, 5),
    });
  } catch (error) {
    console.warn('Gemini what-if error, falling back:', error);
    return res.json(fallbackAnswer);
  }
};

app.post('/api/chat', handleWhatIfChat);
app.post('/api/gemini/what-if', handleWhatIfChat);

/**
 * Route: POST /api/routes/driving
 * OpenRouteService road distances and durations from neighborhood centers to a workplace.
 */
app.post('/api/routes/driving', async (req: Request, res: Response) => {
  const workplaceId = req.body?.workplaceId;
  const destination = WORKPLACE_ROUTING_COORDINATES[workplaceId];
  if (!destination) return res.status(400).json({ error: 'Unknown workplace' });

  const orsApiKey = process.env.ORS_API_KEY;
  if (!orsApiKey) return res.status(503).json({ error: 'Driving route service is not configured' });

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

    const matrix = await orsResponse.json() as {
      distances?: Array<Array<number | null>>;
      durations?: Array<Array<number | null>>;
    };
    const estimates: Record<string, { carDistanceKm: number; carMinutes: number }> = {};
    areas.forEach((area, index) => {
      const distanceMeters = matrix.distances?.[index]?.[0];
      const durationSeconds = matrix.durations?.[index]?.[0];
      // Ignore missing or implausibly long results; the calculator retains its TTC/area-data fallback.
      if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters <= 0 || distanceMeters > 500_000) return;
      if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 300 * 60) return;
      estimates[area.id] = {
        carDistanceKm: Number((distanceMeters / 1000).toFixed(1)),
        carMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      };
    });

    return res.json({ estimates, source: 'OpenRouteService', estimateNote: 'Road routing estimate from neighborhood centers; not live traffic.' });
  } catch (error) {
    console.warn('OpenRouteService matrix request failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(502).json({ error: 'Driving routes are temporarily unavailable' });
  }
});

/**
 * Nearby grocery, transit, and recreation POIs from OpenStreetMap.
 * Cache one Toronto-area snapshot for all representative neighbourhood centers to avoid
 * repeating public Overpass queries on every map interaction.
 */
app.get('/api/neighbourhood-amenities', async (_req: Request, res: Response) => {
  const cached = nearbyAmenityCache.get('toronto-neighbourhoods');
  if (cached && Date.now() - cached.cachedAt < 12 * 60 * 60 * 1000) {
    return res.json({ ...cached.payload as object, cached: true });
  }

  const areaCoordinates = APP_NEIGHBOURHOODS.map((area) => AREA_ROUTING_COORDINATES[area.id]).filter(Boolean);
  if (areaCoordinates.length !== APP_NEIGHBOURHOODS.length) return res.status(500).json({ error: 'A neighbourhood location is missing.' });
  const south = Math.min(...areaCoordinates.map((point) => point[1])) - 0.03;
  const west = Math.min(...areaCoordinates.map((point) => point[0])) - 0.04;
  const north = Math.max(...areaCoordinates.map((point) => point[1])) + 0.03;
  const east = Math.max(...areaCoordinates.map((point) => point[0])) + 0.04;
  const inBounds = (filter: string) => `nwr(${south},${west},${north},${east})[${filter}];`;
  const query = `[out:json][timeout:25];(${inBounds('"shop"~"^(supermarket|grocery|greengrocer)$"')}${inBounds('"shop"="convenience"')}${inBounds('"amenity"~"^(pharmacy|cafe)$"')}${inBounds('"public_transport"~"^(platform|station)$"')}${inBounds('"highway"="bus_stop"')}${inBounds('"railway"="subway_entrance"')}${inBounds('"leisure"~"^(park|playground|sports_centre|fitness_centre)$"')}${inBounds('"amenity"~"^(library|community_centre|fitness_centre|cinema|theatre)$"')});out center tags;`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': 'TrueCostOfHome/1.0 (Toronto neighbourhood exploration)' },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn(`OpenStreetMap Overpass query failed: HTTP ${response.status}`);
      return res.status(502).json({ error: 'Nearby place data is temporarily unavailable.' });
    }

    const data = await response.json() as {
      osm3s?: { timestamp_osm_base?: string };
      elements?: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
    };
    const elements = data.elements || [];
    const distanceKm = (element: NonNullable<typeof data.elements>[number], latitude: number, longitude: number) => {
      const point = element.center || (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null);
      if (!point) return null;
      const radians = (degrees: number) => degrees * Math.PI / 180;
      const latDelta = radians(point.lat - latitude);
      const lonDelta = radians(point.lon - longitude);
      const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(point.lat)) * Math.sin(lonDelta / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const summarize = (items: Array<{ element: NonNullable<typeof data.elements>[number]; distance: number }>) => ({
      countWithin1_5Km: items.length,
      nearest: items[0] ? { name: items[0].element.tags?.name || 'Unnamed place', distanceKm: Number(items[0].distance.toFixed(2)) } : null,
    });
    const byNeighbourhood = Object.fromEntries(APP_NEIGHBOURHOODS.map((area) => {
      const [longitude, latitude] = AREA_ROUTING_COORDINATES[area.id];
      const nearbyElements = (predicate: (tags: Record<string, string>) => boolean) => elements
        .filter((element) => predicate(element.tags || {}))
        .map((element) => ({ element, distance: distanceKm(element, latitude, longitude) }))
        .filter((item): item is { element: NonNullable<typeof data.elements>[number]; distance: number } => item.distance !== null && item.distance <= 1.5)
        .sort((a, b) => a.distance - b.distance);
      const groceries = nearbyElements((tags) => ['supermarket', 'grocery', 'greengrocer'].includes(tags.shop || ''));
      const essentials = nearbyElements((tags) => tags.shop === 'convenience' || ['pharmacy', 'cafe'].includes(tags.amenity || ''));
      const transit = nearbyElements((tags) => tags.public_transport === 'platform' || tags.public_transport === 'station' || tags.highway === 'bus_stop' || tags.railway === 'subway_entrance');
      const recreation = nearbyElements((tags) => ['park', 'playground', 'sports_centre', 'fitness_centre'].includes(tags.leisure || '') || ['library', 'community_centre', 'fitness_centre', 'cinema', 'theatre'].includes(tags.amenity || ''));
      return [area.id, {
        groceries: summarize(groceries),
        everydayEssentials: summarize(essentials),
        transitAccess: summarize(transit),
        recreation: summarize(recreation),
      }];
    }));
    const payload = {
      source: 'OpenStreetMap contributors via Overpass API',
      dataAsOf: data.osm3s?.timestamp_osm_base || null,
      areaReference: 'Approximate neighbourhood representative point; straight-line radius up to 1.5 km. OpenStreetMap coverage may be incomplete.',
      byNeighbourhood,
    };
    nearbyAmenityCache.set('toronto-neighbourhoods', { cachedAt: Date.now(), payload });
    return res.json(payload);
  } catch (error) {
    console.warn('OpenStreetMap Overpass query failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(502).json({ error: 'Nearby place data is temporarily unavailable.' });
  }
});

/**
 * Route: GET /api/listings
 * Returns attached postings from HouseSigma, Realtor.ca, Zillow, and Rentals.ca
 */
app.get('/api/listings', (req: Request, res: Response) => {
  const { neighbourhoodId, bedrooms, platform, maxPrice } = req.query;

  // No licensed verified listing feed is connected; do not return bundled sample postings as live data.
  let results: typeof ATTACHED_POSTINGS = [];

  if (neighbourhoodId && typeof neighbourhoodId === 'string' && neighbourhoodId !== 'all') {
    results = results.filter((p) => p.neighbourhoodId === neighbourhoodId);
  }

  if (bedrooms && typeof bedrooms === 'string' && bedrooms !== 'all') {
    results = results.filter((p) => p.bedrooms === bedrooms);
  }

  if (platform && typeof platform === 'string' && platform !== 'all') {
    results = results.filter((p) => p.platform === platform);
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    results = results.filter((p) => p.monthlyRent <= Number(maxPrice));
  }

  return res.json({
    count: results.length,
    listings: results,
  });
});

/**
 * Route: GET /api/listings/search-urls
 * Generate direct search URLs for HouseSigma, Realtor.ca, Zillow, and Rentals.ca
 */
app.get('/api/listings/search-urls', (req: Request, res: Response) => {
  const neighbourhood = (req.query.neighbourhood as string) || 'Toronto';
  const bedrooms = req.query.bedrooms as any;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  const urls = buildPlatformSearchUrls(neighbourhood, bedrooms, maxPrice);
  return res.json({ urls });
});

/**
 * Route: POST /api/sensitivity
 * Parameter sweep & break-even crossover analysis
 */
app.post('/api/sensitivity', (req: Request, res: Response) => {
  const preferences = req.body.preferences || req.body.profile;
  if (!preferences) {
    return res.status(400).json({ error: 'Missing preferences/profile' });
  }
  const result = analyzeSensitivity(preferences);
  return res.json(result);
});

/**
 * Route: POST /api/monte-carlo
 * 2,000 run Monte Carlo simulation with uncertainty bands & pairwise probabilities
 */
app.post('/api/monte-carlo', (req: Request, res: Response) => {
  const preferences = req.body.preferences || req.body.profile;
  const iterations = req.body.iterations ? Number(req.body.iterations) : 2000;
  if (!preferences) {
    return res.status(400).json({ error: 'Missing preferences/profile' });
  }
  const result = runMonteCarloSimulation(preferences, iterations);
  return res.json(result);
});

/**
 * Route: POST /api/ml/estimate-rent
 * Multivariable linear regression rent gap estimation with 95% prediction interval
 */
app.post('/api/ml/estimate-rent', (req: Request, res: Response) => {
  const { neighbourhoodId, bedrooms } = req.body;
  if (!neighbourhoodId || bedrooms === undefined) {
    return res.status(400).json({ error: 'Missing neighbourhoodId or bedrooms' });
  }
  const result = estimateRentWithInterval(neighbourhoodId, bedrooms);
  return res.json(result);
});

/**
 * Route: GET /api/ml/model
 * Returns transparent ML regression weights and training provenance
 */
app.get('/api/ml/model', (_req: Request, res: Response) => {
  const coefficients = getModelCoefficients();
  return res.json({ model: coefficients });
});

// Dev vs Prod Vite mounting
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`True Cost of Home (Toronto) server running at http://localhost:${PORT}`);
  });
}

startServer();
