/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';
import {
  buildUnifiedExplainPrompt,
  normalizeToUserPreferences,
} from '../src/services/unifiedEngine';
import { calculateNeighbourhoodCosts } from '../src/services/calculator';
import { analyzeSensitivity } from '../src/services/sensitivityAnalysis';
import { runMonteCarloSimulation } from '../src/services/monteCarloSimulation';
import { SYSTEM_DIRECTIVE } from '../lib/llm/prompts';

// Share one SDK client across the project's function invocations so the
// (serverless) Gemini calls do not pay connection-setup cost every request.
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Reject non-post calls and mirror the legacy routes only where they used GET.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST required.' });
  }

  if (apiKey == null || apiKey.trim() === '') {
    return res.status(503).json({
      error: {
        status: 503,
        code: 'GEMINI_KEY_MISSING',
        message:
          'GEMINI_API_KEY is not set for this deployment, or is empty. Add it in Vercel project Environment Variables and redeploy.',
      },
      breakEvenNarrative: '',
      monteCarloInsight: '',
      sensitivity: null,
      monteCarlo: null,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const raw = body.profile || body.preferences;

    if (!raw) {
      return res.status(400).json({ error: 'Missing profile or preferences' });
    }

    const preferences = normalizeToUserPreferences(raw);
    const results = calculateNeighbourhoodCosts(preferences);

    let sensitivityResult: { primaryBreakEvenNarrative?: string } | null = null;
    let monteCarloResult: { primaryInsight?: string } | null = null;
    try {
      sensitivityResult = analyzeSensitivity(preferences);
      monteCarloResult = runMonteCarloSimulation(preferences, 1000);
    } catch (err) {
      // Keep narrating the engine deltas even if the diagnostics step throws.
      console.warn('Sensitivity/Monte Carlo computation error:', err);
    }

    const sensitivityNarrative = sensitivityResult?.primaryBreakEvenNarrative || '';
    const monteCarloInsight = monteCarloResult?.primaryInsight || '';
    const prompt = buildUnifiedExplainPrompt(
      preferences as any,
      results as any,
      sensitivityNarrative,
      monteCarloInsight,
    );

    // Vercel functions have generous timeouts, but a hung upstream call is
    // still a bad experience — keep a hard guard.
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
      breakEvenNarrative: parsed.breakEvenNarrative || sensitivityNarrative,
      monteCarloInsight: parsed.monteCarloInsight || (monteCarloInsight as any),
      sensitivity: sensitivityResult,
      monteCarlo: monteCarloResult,
      isAiGenerated: true,
    });
  } catch (error) {
    const e = error as Record<string, unknown>;
    const rawStatus = typeof e.status === 'number' ? e.status : typeof e.statusCode === 'number' ? e.statusCode : 502;
    const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 502;
    const code =
      typeof e.code === 'string' || typeof e.code === 'number' ? String(e.code) : `GEMINI_HTTP_${status}`;
    const nonceMessage = typeof e.message === 'string' && e.message ? e.message : 'Gemini narration request failed';
    const message = status === 503 ? 'Set GEMINI_API_KEY in Vercel Environment Variables and redeploy.' : nonceMessage;

    return res.status(502).json({
      error: { status, code, message },
      breakEvenNarrative: '',
      monteCarloInsight: '',
      sensitivity: null,
      monteCarlo: null,
    });
  }
}
