/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';
import { calculateNeighbourhoodCosts, normalizeToUserPreferences } from '../src/services/calculator';
import { SYSTEM_DIRECTIVE } from '../lib/llm/prompts';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export const config = { runtime: 'nodejs' };

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
    return res.status(503).json({
      ...engineDeltas,
      summary: '',
      isAiGenerated: false,
      error: { status: 503, code: 'GEMINI_KEY_MISSING', message: 'GEMINI_API_KEY is not set for this deployment. Add it in Vercel project Environment Variables and redeploy.' },
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

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 10_000),
    );

    const geminiPromise = ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', // runtime pick; hardcoded if unset
      contents: prompt,
      config: { systemInstruction: SYSTEM_DIRECTIVE, responseMimeType: 'application/json' },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const parsed =
      typeof response.text === 'string' && response.text.trim().length > 0
        ? JSON.parse(response.text.trim())
        : {};

    return res.json({
      ...parsed,
      ...engineDeltas,
      isAiGenerated: true,
    });
  } catch (error) {
    const e = error as Record<string, unknown>;
    const rawStatus = typeof e.status === 'number' ? e.status : typeof e.statusCode === 'number' ? e.statusCode : 502;
    const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 502;
    const code = typeof e.code === 'string' || typeof e.code === 'number' ? String(e.code) : `GEMINI_HTTP_${status}`;
    const message = typeof e.message === 'string' && e.message ? e.      message:
        status === 503
          ? 'Set GEMINI_API_KEY in Vercel Environment Variables and redeploy.'
          : 'Gemini what-if request failed';

    console.warn('Gemini what-if error:', error instanceof Error ? error.message : error);

    return res.status(502).json({
      ...engineDeltas,
      summary: '',
      isAiGenerated: false,
      error: { status, code, message },
    });
  }
}
