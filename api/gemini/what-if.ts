/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';
import { calculateNeighbourhoodCosts } from '../../src/services/calculator.js';
import { normalizeToUserPreferences } from '../../src/services/unifiedEngine.js';
import { SYSTEM_DIRECTIVE } from '../../lib/llm/prompts.js';
import { generateWithGeminiFallback, getGeminiStatus } from '../../lib/llm/geminiFallback.js';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' }, retryOptions: { attempts: 1 } },
});

export const config = { runtime: 'nodejs' };

function buildCalculatedScenarioSummary(costDifference: number, hoursDifference: number, carbonDifference: number) {
  const cost = Math.abs(costDifference).toLocaleString();
  const hours = Math.abs(hoursDifference).toLocaleString();
  const carbon = Math.abs(carbonDifference).toLocaleString();
  const costSentence = costDifference < 0
    ? `Estimated monthly costs decrease by $${cost}.`
    : costDifference > 0
      ? `Estimated monthly costs increase by $${cost}.`
      : 'Estimated monthly costs remain unchanged.';
  const travelSentence = hoursDifference < 0
    ? `Monthly commute time decreases by ${hours} hours.`
    : hoursDifference > 0
      ? `Monthly commute time increases by ${hours} hours.`
      : 'Monthly commute time remains unchanged.';
  const emissionsSentence = carbonDifference < 0
    ? `Monthly emissions decrease by ${carbon} kg.`
    : carbonDifference > 0
      ? `Monthly emissions increase by ${carbon} kg.`
      : 'Monthly emissions remain unchanged.';
  return `${costSentence} ${travelSentence} ${emissionsSentence}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST required.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});

  const originalRaw = body.originalProfile || body.originalPreferences;
  const scenarioPatch = body.scenarioPatch || {};
  const question =
    typeof body.question === 'string' && body.question.trim().length > 0
      ? body.question.trim()
      : 'What if I change my commute or rent?';

  if (!originalRaw) {
    return res.status(400).json({
      error: { status: 400, code: 'MISSING_ORIGINAL_PROFILE', message: 'Missing originalProfile or originalPreferences' },
      scenarioTitle: question,
      costDifference: 0,
      hoursDifference: 0,
      carbonDifference: 0,
      oldCheapestName: '',
      newCheapestName: '',
      summary: '',
      isAiGenerated: false,
      newBreakdowns: [],
    });
  }

  const originalPreferences = normalizeToUserPreferences(originalRaw);
  const newPreferences = normalizeToUserPreferences({ ...originalRaw, ...scenarioPatch });

  const oldResults = calculateNeighbourhoodCosts(originalPreferences);
  const newResults = calculateNeighbourhoodCosts(newPreferences);

  const oldCheapest = oldResults[0];
  const newCheapest = newResults[0];

  const costDifference = newCheapest.trueMonthlyCost - oldCheapest.trueMonthlyCost;
  const hoursDifference = Number((newCheapest.monthlyCommuteHours - oldCheapest.monthlyCommuteHours).toFixed(1));
  const carbonDifference = newCheapest.carbonFootprintKg.total - oldCheapest.carbonFootprintKg.total;

  const engineDeltas = {
    scenarioTitle: question,
    costDifference,
    hoursDifference,
    carbonDifference,
    oldCheapestName: oldCheapest.neighbourhood.name,
    newCheapestName: newCheapest.neighbourhood.name,
    newBreakdowns: newResults.slice(0, 5).map((n) => ({
      neighbourhood: { id: n.neighbourhood.id, name: n.neighbourhood.name },
      trueMonthlyCost: n.trueMonthlyCost,
      stickerRent: n.effectiveRent,
      commuteBreakdown: n.commuteBreakdown,
      utilitiesCost: n.utilitiesCost,
    })),
  };

  if (apiKey == null || apiKey.trim() === '') {
    console.warn('[api/gemini/what-if] Gemini unavailable; returning calculated fallback');
    return res.json({
      ...engineDeltas,
      summary: buildCalculatedScenarioSummary(costDifference, hoursDifference, carbonDifference),
      isAiGenerated: false,
    });
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

    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error('Gemini API timeout'));
      }, 10_000);
    });

    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const { response, model: successfulModel, attempts } = await Promise.race([
      generateWithGeminiFallback(model, (candidate, signal) => ai.models.generateContent({
        model: candidate,
        contents: prompt,
        config: { systemInstruction: SYSTEM_DIRECTIVE, responseMimeType: 'application/json', abortSignal: signal },
      }), () => !timedOut),
      timeoutPromise,
    ]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    const parsed =
      typeof response.text === 'string' && response.text.trim().length > 0
        ? JSON.parse(response.text.trim())
        : {};

    console.info('[api/gemini/what-if] Gemini response received', { model: successfulModel, attempts });
    return res.json({
      ...parsed,
      ...engineDeltas,
      isAiGenerated: true,
    });
  } catch (error) {
    console.warn('[api/gemini/what-if] narration unavailable; returning calculated fallback', {
      status: getGeminiStatus(error),
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return res.json({
      ...engineDeltas,
      summary: buildCalculatedScenarioSummary(costDifference, hoursDifference, carbonDifference),
      isAiGenerated: false,
    });
  }
}
