import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateNeighbourhoodCosts } from './src/services/calculator';
import { UserPreferences } from './src/types';

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
 * Generate fallback explanation without AI if key is absent or quota exceeded
 */
function generateDeterministicExplanation(preferences: UserPreferences) {
  const results = calculateNeighbourhoodCosts(preferences);
  const cheapestRent = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];
  const cheapestTrue = results[0]; // Already sorted by true cost

  const hasRankDiscrepancy = cheapestRent.neighbourhood.id !== cheapestTrue.neighbourhood.id;
  const rentDifference = cheapestTrue.stickerRent - cheapestRent.stickerRent;
  const commuteDifference =
    cheapestRent.commuteBreakdown.totalMonthlyCommuteCost -
    cheapestTrue.commuteBreakdown.totalMonthlyCommuteCost;
  const netSavings = cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost;

  let headline = '';
  let body = '';

  if (hasRankDiscrepancy) {
    headline = `${cheapestTrue.neighbourhood.name} is $${netSavings}/mo cheaper overall than ${cheapestRent.neighbourhood.name}, despite having higher sticker rent.`;
    body = `While ${cheapestRent.neighbourhood.name} appears cheapest with a sticker rent of $${cheapestRent.stickerRent}/mo, its commute costs ($${cheapestRent.commuteBreakdown.totalMonthlyCommuteCost}/mo) and ${cheapestRent.commuteBreakdown.monthlyCommuteHours} hrs of travel make its true monthly cost $${cheapestRent.trueMonthlyCost}/mo. In comparison, ${cheapestTrue.neighbourhood.name} has a sticker rent of $${cheapestTrue.stickerRent}/mo ($${Math.abs(rentDifference)} higher), but lower transit/driving expenses ($${cheapestTrue.commuteBreakdown.totalMonthlyCommuteCost}/mo) bring its true total down to $${cheapestTrue.trueMonthlyCost}/mo.`;
  } else {
    headline = `${cheapestTrue.neighbourhood.name} offers both the lowest sticker rent ($${cheapestTrue.stickerRent}) and lowest true monthly cost ($${cheapestTrue.trueMonthlyCost}).`;
    body = `Because your workplace is located conveniently close to ${cheapestTrue.neighbourhood.name}, commute penalties do not overwhelm the rent advantage. However, be sure to weigh climate risks (${cheapestTrue.neighbourhood.floodRisk.level}, ${cheapestTrue.neighbourhood.heatRisk.level}) and tenant displacement vulnerability (${cheapestTrue.neighbourhood.displacementFlag.label}).`;
  }

  return {
    headline,
    body,
    cheapestRentNeighbourhood: cheapestRent.neighbourhood.name,
    cheapestTrueNeighbourhood: cheapestTrue.neighbourhood.name,
    monthlyDifference: Math.abs(netSavings),
    timeDifferenceHours: Math.abs(
      Number(
        (
          cheapestRent.commuteBreakdown.monthlyCommuteHours -
          cheapestTrue.commuteBreakdown.monthlyCommuteHours
        ).toFixed(1)
      )
    ),
    tenantRightsNotice:
      'Tenant reminder: Market rents shown represent new vacancies (turnover rates from CMHC). Existing Ontario tenants under rent control are protected by the provincial annual guideline cap (2.5% in 2024/2025). For legal advice, consult the Federation of Metro Tenants\' Associations (FMTA) or the Landlord and Tenant Board (LTB).',
    isAiGenerated: false,
  };
}

/**
 * Route: POST /api/gemini/explain
 * Explains calculation results in plain language without calculating new math.
 */
app.post('/api/gemini/explain', async (req: Request, res: Response) => {
  const { preferences } = req.body;

  if (!preferences) {
    return res.status(400).json({ error: 'Missing preferences parameter' });
  }

  const results = calculateNeighbourhoodCosts(preferences);
  const deterministicFallback = generateDeterministicExplanation(preferences);

  if (!apiKey) {
    return res.json(deterministicFallback);
  }

  try {
    const summaryData = results.slice(0, 5).map((r) => ({
      name: r.neighbourhood.name,
      borough: r.neighbourhood.borough,
      stickerRent: r.stickerRent,
      commuteCost: r.commuteBreakdown.totalMonthlyCommuteCost,
      commuteHoursPerMonth: r.monthlyCommuteHours,
      trueMonthlyCost: r.trueMonthlyCost,
      timeCostSeparatelyValued: r.timeCostMonthly,
      carbonKgPerMonth: r.carbonFootprintKg.total,
      floodExposure: r.neighbourhood.floodRisk.level,
      heatExposure: r.neighbourhood.heatRisk.level,
      displacementFlag: r.neighbourhood.displacementFlag.label,
      rentRank: r.rentRank,
      trueCostRank: r.trueCostRank,
      rankShift: r.rankShift,
    }));

    const prompt = `You are the plain-language civic explainer for "TrueRent Toronto", an open civic tool helping Toronto renters understand the true cost of housing (Rent + Transit/Car + Utilities + Commute Time).

CRITICAL CONSTRAINTS:
1. NEVER do new maths or invent numbers. Use only the exact figures provided below.
2. The user's income is $${preferences.annualIncome.toLocaleString()}/year ($${(
      preferences.annualIncome / 1950
    ).toFixed(2)}/hr).
3. Mode of travel: ${preferences.commuteMode}. Hybrid remote days: ${preferences.hybridRemoteDaysPerWeek}/week. Bedroom size: ${preferences.bedrooms}.
4. Provide an objective, honest explanation comparing the sticker-cheapest neighbourhood against the true-cost-cheapest neighbourhood.
5. Highlight how commute hours and costs alter the affordability ranking.
6. Mention climate exposure (flood/heat) and displacement risk neutrally (describe exposure, never call an area "bad" or "dangerous").
7. DO NOT provide legal or financial advice.

DATASET (Pre-calculated by deterministic calculator):
${JSON.stringify(summaryData, null, 2)}

Respond with JSON matching this structure:
{
  "headline": "A concise 1-sentence finding about rent vs true monthly cost",
  "body": "2 short paragraphs explaining the trade-offs, commute math, and climate/displacement factors in plain, empathetic Canadian English.",
  "cheapestRentNeighbourhood": "Name of neighbourhood with lowest sticker rent",
  "cheapestTrueNeighbourhood": "Name of neighbourhood with lowest true cost",
  "monthlyDifference": 120,
  "timeDifferenceHours": 24.5,
  "tenantRightsNotice": "Standard disclaimer directing renters to FMTA or LTB"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (error) {
    console.warn('Gemini API call failed, falling back to deterministic explanation:', error);
    return res.json(deterministicFallback);
  }
});

/**
 * Route: POST /api/gemini/what-if
 * Reruns the deterministic calculator with scenario changes, then explains the exact difference.
 */
app.post('/api/gemini/what-if', async (req: Request, res: Response) => {
  const { originalPreferences, scenarioPatch, question } = req.body;

  if (!originalPreferences || !scenarioPatch) {
    return res.status(400).json({ error: 'Missing originalPreferences or scenarioPatch' });
  }

  const newPreferences: UserPreferences = {
    ...originalPreferences,
    ...scenarioPatch,
  };

  const oldResults = calculateNeighbourhoodCosts(originalPreferences);
  const newResults = calculateNeighbourhoodCosts(newPreferences);

  const oldCheapest = oldResults[0];
  const newCheapest = newResults[0];

  const costDifference = newCheapest.trueMonthlyCost - oldCheapest.trueMonthlyCost;
  const hoursDifference = Number(
    (newCheapest.monthlyCommuteHours - oldCheapest.monthlyCommuteHours).toFixed(1)
  );
  const carbonDifference =
    newCheapest.carbonFootprintKg.total - oldCheapest.carbonFootprintKg.total;

  const fallbackAnswer = {
    scenarioTitle: question || 'Scenario Comparison',
    costDifference,
    hoursDifference,
    carbonDifference,
    oldCheapestName: oldCheapest.neighbourhood.name,
    newCheapestName: newCheapest.neighbourhood.name,
    summary:
      costDifference < 0
        ? `This scenario saves $${Math.abs(costDifference)} per month in true costs and shifts your best option to ${newCheapest.neighbourhood.name}. Monthly commute time changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`
        : `This scenario increases monthly true costs by $${costDifference} per month. Monthly commute time changes by ${hoursDifference > 0 ? '+' : ''}${hoursDifference} hours.`,
    isAiGenerated: false,
    newResults: newResults.slice(0, 5),
  };

  if (!apiKey) {
    return res.json(fallbackAnswer);
  }

  try {
    const prompt = `You are TrueRent Toronto's scenario explainer.
The user asked a "what if" question: "${question || 'What if I change my housing/commute parameters?'}"

The calculator has already rerun all the deterministic math for both the baseline and the modified scenario.

BASELINE:
- Mode: ${originalPreferences.commuteMode}, Hybrid Days: ${originalPreferences.hybridRemoteDaysPerWeek}, Income: $${originalPreferences.annualIncome}
- Best True Cost Option: ${oldCheapest.neighbourhood.name} ($${oldCheapest.trueMonthlyCost}/mo true cost, ${oldCheapest.monthlyCommuteHours} hrs commute/mo, ${oldCheapest.carbonFootprintKg.total} kg CO2e/mo)

NEW SCENARIO:
- Mode: ${newPreferences.commuteMode}, Hybrid Days: ${newPreferences.hybridRemoteDaysPerWeek}, Income: $${newPreferences.annualIncome}
- Best True Cost Option: ${newCheapest.neighbourhood.name} ($${newCheapest.trueMonthlyCost}/mo true cost, ${newCheapest.monthlyCommuteHours} hrs commute/mo, ${newCheapest.carbonFootprintKg.total} kg CO2e/mo)

DIFFERENCES:
- True monthly cost delta: $${costDifference} (negative is savings, positive is more expensive)
- Commute time delta: ${hoursDifference} hrs/month
- Carbon emissions delta: ${carbonDifference} kg CO2e/month

Respond with a JSON object:
{
  "scenarioTitle": "${question || 'What-If Analysis'}",
  "costDifference": ${costDifference},
  "hoursDifference": ${hoursDifference},
  "carbonDifference": ${carbonDifference},
  "oldCheapestName": "${oldCheapest.neighbourhood.name}",
  "newCheapestName": "${newCheapest.neighbourhood.name}",
  "summary": "2-3 short, friendly, precise sentences explaining the financial and quality-of-life impact using only the numbers above. Do not invent numbers."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      isAiGenerated: true,
      newResults: newResults.slice(0, 5),
    });
  } catch (error) {
    console.warn('Gemini what-if error, falling back:', error);
    return res.json(fallbackAnswer);
  }
});

// Production vs Development static mounting
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
    console.log(`TrueRent Toronto server running at http://localhost:${PORT}`);
  });
}

startServer();
