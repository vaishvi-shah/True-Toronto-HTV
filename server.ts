import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMMUTES } from './data/commutes';
import { NEIGHBOURHOODS } from './data/neighbourhoods';
import { WORKPLACES } from './data/workplaces';
import { computeAllTrueCosts, computeTrueCost } from './lib/engine/computeTrueCost';
import { buildExplainPrompt, SYSTEM_DIRECTIVE } from './lib/llm/prompts';
import { Breakdown, Profile } from './lib/types';
import { ATTACHED_POSTINGS, buildPlatformSearchUrls } from './src/data/listings';
import { analyzeSensitivity } from './src/services/sensitivityAnalysis';
import { runMonteCarloSimulation } from './src/services/monteCarloSimulation';
import { estimateRentWithInterval, getModelCoefficients } from './src/services/rentRegressionModel';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
 * Generate fallback explanation without AI if API key is absent or quota exceeded
 */
function generateDeterministicFallback(
  profile: Profile & { rentMode?: string },
  breakdowns: Breakdown[],
  sensitivityNarrative?: string,
  monteCarloInsight?: string
) {
  const isRentFree = profile.rentMode === 'no_rent' || profile.customRent === 0;
  const isRentUnspecified = profile.rentMode === 'user_entered' && (profile.customRent === null || profile.customRent === undefined);

  const cheapestRent = [...breakdowns].sort(
    (a, b) => a.rent.effectivePaid - b.rent.effectivePaid
  )[0];
  const cheapestTrue = breakdowns[0];

  const hasRankDiscrepancy = cheapestRent.neighbourhoodId !== cheapestTrue.neighbourhoodId;
  const rentDifference = cheapestTrue.rent.effectivePaid - cheapestRent.rent.effectivePaid;
  const netSavings = cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost;

  let headline = '';
  let body = '';

  if (isRentFree) {
    headline = `${cheapestTrue.neighbourhoodName} offers the lowest overall expenses with rent excluded ($${cheapestTrue.trueMonthlyCost}/mo).`;
    body = `With housing expenses excluded, your total overhead consists of transportation ($${cheapestTrue.transport.totalMonthlyCost}/mo) and utilities ($${cheapestTrue.utilities.totalMonthlyCost}/mo), with ${cheapestTrue.transport.monthlyHours} monthly hours spent commuting.`;
  } else if (isRentUnspecified) {
    headline = `${cheapestTrue.neighbourhoodName} has the lowest transport + utility overhead at $${cheapestTrue.trueMonthlyCost}/mo (rent unspecified).`;
    body = `Because rent was not specified, costs include travel ($${cheapestTrue.transport.totalMonthlyCost}/mo) and home utilities ($${cheapestTrue.utilities.totalMonthlyCost}/mo). You can enter your specific rent or select CMHC survey medians in the parameters to include housing expenses.`;
  } else if (hasRankDiscrepancy) {
    headline = `${cheapestTrue.neighbourhoodName} is $${netSavings}/mo cheaper overall than ${cheapestRent.neighbourhoodName}, despite having higher asking rent.`;
    body = `While ${cheapestRent.neighbourhoodName} has the lowest advertised rent ($${cheapestRent.rent.effectivePaid}/mo), its commute costs ($${cheapestRent.transport.totalMonthlyCost}/mo) and ${cheapestRent.transport.monthlyHours} hours of travel push its true monthly cost to $${cheapestRent.trueMonthlyCost}/mo. In comparison, living closer in ${cheapestTrue.neighbourhoodName} costs $${rentDifference} more in rent ($${cheapestTrue.rent.effectivePaid}/mo), but lower travel expenses ($${cheapestTrue.transport.totalMonthlyCost}/mo) bring your total out-of-pocket cost down to $${cheapestTrue.trueMonthlyCost}/mo.`;
  } else {
    headline = `${cheapestTrue.neighbourhoodName} offers both the lowest housing cost ($${cheapestTrue.rent.effectivePaid}) and lowest true monthly cost ($${cheapestTrue.trueMonthlyCost}).`;
    body = `Because your workplace is located conveniently close to ${cheapestTrue.neighbourhoodName}, commute penalties do not overwhelm the housing advantage. However, be sure to weigh climate risks (${cheapestTrue.climateRisk.flood.label}, ${cheapestTrue.climateRisk.heat.label}) and tenant displacement vulnerability (${cheapestTrue.displacement.label}).`;
  }

  return {
    headline,
    body,
    cheapestRentNeighbourhood: cheapestRent.neighbourhoodName,
    cheapestTrueNeighbourhood: cheapestTrue.neighbourhoodName,
    monthlyDifference: Math.abs(netSavings),
    timeDifferenceHours: Math.abs(
      Number((cheapestRent.transport.monthlyHours - cheapestTrue.transport.monthlyHours).toFixed(1))
    ),
    breakEvenNarrative: sensitivityNarrative || '',
    monteCarloInsight: monteCarloInsight || '',
    tenantRightsNotice:
      'Tenant reminder: Market rents shown represent new vacancies (turnover rates from CMHC). Existing Ontario tenants under rent control are protected by the provincial annual guideline cap (2.5% in 2024/2025). Units first occupied after Nov 15, 2018 have no statutory rent cap upon renewal. For legal advice, consult the Federation of Metro Tenants\' Associations (FMTA) or the Landlord and Tenant Board (LTB).',
    isAiGenerated: false,
  };
}

function normalizeProfile(raw: any): Profile & { rentMode?: string } {
  const onSiteDaysPerWeek =
    raw.hybridRemoteDaysPerWeek !== undefined
      ? Math.max(0, 5 - raw.hybridRemoteDaysPerWeek)
      : 5;
  const commuteDaysPerMonth =
    raw.commuteDaysPerMonth ?? Math.round(onSiteDaysPerWeek * 4.3);

  let customRent: number | null = null;
  if (raw.rentMode === 'no_rent') {
    customRent = 0;
  } else if (raw.customFixedRent !== undefined && raw.customFixedRent !== null && raw.customFixedRent > 0) {
    customRent = raw.customFixedRent;
  } else if (raw.customRent !== undefined && raw.customRent !== null) {
    customRent = raw.customRent;
  }

  return {
    workplaceId: raw.workplaceId || 'hospital-row',
    annualIncome: raw.annualIncome || 55000,
    incomeBasis: raw.incomeBasis || 'pretax',
    householdSize: raw.householdMembers || raw.householdSize || 1,
    bedrooms: raw.bedrooms || '1bed',
    commuteDaysPerMonth: commuteDaysPerMonth || 20,
    wageFactor: raw.timeValuationRate ?? raw.wageFactor ?? 0.5,
    hasCar: raw.commuteMode === 'car' || raw.commuteMode === 'hybrid' || !!raw.hasCar,
    commuteMode: raw.commuteMode || 'transit',
    customRent,
    customNeighbourhoodRents: raw.customNeighbourhoodRents || {},
    rentMode: raw.rentMode,
  };
}

/**
 * Route: POST /api/compare
 * Pure calculation route: Profile + optional neighbourhood IDs -> Breakdown[]
 */
app.post('/api/compare', (req: Request, res: Response) => {
  const raw = req.body.profile || req.body.preferences;
  if (!raw) {
    return res.status(400).json({ error: 'Missing profile parameter' });
  }
  const profile: Profile = normalizeProfile(raw);
  const ids: string[] | undefined = req.body.neighbourhoodIds;

  let selectedNeighbourhoods = NEIGHBOURHOODS;
  if (Array.isArray(ids) && ids.length > 0) {
    selectedNeighbourhoods = NEIGHBOURHOODS.filter((n) => ids.includes(n.id));
  }

  const results = computeAllTrueCosts(profile, selectedNeighbourhoods, COMMUTES, WORKPLACES);
  return res.json({ breakdowns: results });
});

/**
 * Route: POST /api/explain & POST /api/gemini/explain
 * Explains calculation results in plain language without calculating new math.
 * Enriched with deterministic break-even flip points and Monte Carlo confidence.
 */
const handleExplain = async (req: Request, res: Response) => {
  const raw = req.body.profile || req.body.preferences;

  if (!raw) {
    return res.status(400).json({ error: 'Missing profile/preferences' });
  }

  const profile: Profile = normalizeProfile(raw);
  const breakdowns = computeAllTrueCosts(profile, NEIGHBOURHOODS, COMMUTES, WORKPLACES);

  // Compute deterministic sensitivity & Monte Carlo simulation
  let sensitivityResult;
  let monteCarloResult;
  try {
    sensitivityResult = analyzeSensitivity(raw);
    monteCarloResult = runMonteCarloSimulation(raw, 1000);
  } catch (err) {
    console.warn('Sensitivity/Monte Carlo computation error:', err);
  }

  const sensitivityNarrative = sensitivityResult?.primaryBreakEvenNarrative || '';
  const monteCarloInsight = monteCarloResult?.primaryInsight || '';
  const fallback = generateDeterministicFallback(profile, breakdowns, sensitivityNarrative, monteCarloInsight);

  if (!apiKey) {
    return res.json({
      ...fallback,
      sensitivity: sensitivityResult,
      monteCarlo: monteCarloResult,
    });
  }

  try {
    const prompt = buildExplainPrompt(profile, breakdowns, sensitivityNarrative, monteCarloInsight);

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
      breakEvenNarrative: parsed.breakEvenNarrative || sensitivityNarrative,
      monteCarloInsight: parsed.monteCarloInsight || monteCarloInsight,
      sensitivity: sensitivityResult,
      monteCarlo: monteCarloResult,
      isAiGenerated: true,
    });
  } catch (error) {
    console.warn('Gemini explain error or timeout, falling back:', error);
    return res.json({
      ...fallback,
      sensitivity: sensitivityResult,
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
  const originalProfile: Profile = req.body.originalProfile || req.body.originalPreferences;
  const scenarioPatch: Partial<Profile> = req.body.scenarioPatch || {};
  const question: string = req.body.question || req.body.message || 'What if I change my commute or rent?';

  if (!originalProfile) {
    return res.status(400).json({ error: 'Missing originalProfile' });
  }

  const newProfile: Profile = {
    ...originalProfile,
    ...scenarioPatch,
  };

  const oldBreakdowns = computeAllTrueCosts(originalProfile, NEIGHBOURHOODS, COMMUTES, WORKPLACES);
  const newBreakdowns = computeAllTrueCosts(newProfile, NEIGHBOURHOODS, COMMUTES, WORKPLACES);

  const oldCheapest = oldBreakdowns[0];
  const newCheapest = newBreakdowns[0];

  const costDifference = newCheapest.trueMonthlyCost - oldCheapest.trueMonthlyCost;
  const hoursDifference = Number(
    (newCheapest.transport.monthlyHours - oldCheapest.transport.monthlyHours).toFixed(1)
  );
  const carbonDifference = newCheapest.carbon.totalMonthlyKg - oldCheapest.carbon.totalMonthlyKg;

  const fallbackAnswer = {
    scenarioTitle: question,
    costDifference,
    hoursDifference,
    carbonDifference,
    oldCheapestName: oldCheapest.neighbourhoodName,
    newCheapestName: newCheapest.neighbourhoodName,
    summary:
      costDifference < 0
        ? `This scenario saves $${Math.abs(costDifference)}/month in out-of-pocket true costs and shifts your best option to ${newCheapest.neighbourhoodName}. Monthly commute travel changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`
        : `This scenario increases true costs by $${costDifference}/month. Monthly commute travel changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`,
    isAiGenerated: false,
    newBreakdowns: newBreakdowns.slice(0, 5),
  };

  if (!apiKey) {
    return res.json(fallbackAnswer);
  }

  try {
    const prompt = `The user asked a "what if" question: "${question}"

The deterministic calculator has already rerun all the math.
BASELINE:
- Mode: ${originalProfile.commuteMode}, Income: $${originalProfile.annualIncome}, Commute Days: ${originalProfile.commuteDaysPerMonth}
- Best True Cost Option: ${oldCheapest.neighbourhoodName} ($${oldCheapest.trueMonthlyCost}/mo true cost, ${oldCheapest.transport.monthlyHours}h commute/mo, ${oldCheapest.carbon.totalMonthlyKg} kg CO2e/mo)

NEW SCENARIO:
- Mode: ${newProfile.commuteMode}, Income: $${newProfile.annualIncome}, Commute Days: ${newProfile.commuteDaysPerMonth}
- Best True Cost Option: ${newCheapest.neighbourhoodName} ($${newCheapest.trueMonthlyCost}/mo true cost, ${newCheapest.transport.monthlyHours}h commute/mo, ${newCheapest.carbon.totalMonthlyKg} kg CO2e/mo)

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
  "oldCheapestName": "${oldCheapest.neighbourhoodName}",
  "newCheapestName": "${newCheapest.neighbourhoodName}",
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
      newBreakdowns: newBreakdowns.slice(0, 5),
    });
  } catch (error) {
    console.warn('Gemini what-if error, falling back:', error);
    return res.json(fallbackAnswer);
  }
};

app.post('/api/chat', handleWhatIfChat);
app.post('/api/gemini/what-if', handleWhatIfChat);

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
