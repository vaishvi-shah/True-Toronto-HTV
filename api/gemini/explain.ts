/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';
import {
  buildUnifiedExplainPrompt,
  normalizeToUserPreferences,
} from '../../src/services/unifiedEngine.js';
import { calculateNeighbourhoodCosts } from '../../src/services/calculator.js';
import { analyzeSensitivity } from '../../src/services/sensitivityAnalysis.js';
import { runMonteCarloSimulation } from '../../src/services/monteCarloSimulation.js';
import { SYSTEM_DIRECTIVE } from '../../lib/llm/prompts.js';

// Share one SDK client across the project's function invocations so the
// (serverless) Gemini calls do not pay connection-setup cost every request.
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
    // Gemini may return transient 503s under load. Retry a few times with
    // backoff while staying within the function's existing 10s time guard.
    retryOptions: {
      attempts: 3,
      initialDelay: 0.5,
      maxDelay: 2,
      expBase: 2,
      jitter: 0.2,
      httpStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
});

console.info('[api/gemini/explain] module initialized', {
  geminiKeyConfigured: apiKey.trim().length > 0,
});

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let stage = 'request_validation';
  console.info('[api/gemini/explain] request received', { method: req.method });

  // Reject non-post calls and mirror the legacy routes only where they used GET.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST required.' });
  }

  if (apiKey == null || apiKey.trim() === '') {
    console.warn('[api/gemini/explain] GEMINI_API_KEY is not configured for this deployment');
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
    stage = 'local_calculation';
    console.info('[api/gemini/explain] preferences normalized');
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
    console.info('[api/gemini/explain] local analysis complete', {
      resultCount: results.length,
      sensitivityReady: Boolean(sensitivityResult),
      monteCarloReady: Boolean(monteCarloResult),
    });
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

    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    stage = 'gemini_request';
    console.info('[api/gemini/explain] Gemini request started', { model });
    const geminiPromise = ai.models.generateContent({
      model, // runtime pick; hardcoded if unset
      contents: prompt,
      config: { systemInstruction: SYSTEM_DIRECTIVE, responseMimeType: 'application/json' },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const parsed =
      typeof response.text === 'string' && response.text.trim().length > 0
        ? JSON.parse(response.text.trim())
        : {};

    console.info('[api/gemini/explain] Gemini response received');

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
    const message =
      code === 'GEMINI_KEY_MISSING'
        ? 'GEMINI_API_KEY is not set for this deployment. Add it in Vercel project Environment Variables and redeploy.'
        : status === 503
          ? 'Gemini returned HTTP 503. The request reached Gemini, but the service did not fulfill it. Try Re-analyze again shortly.'
          : nonceMessage;

    console.error('[api/gemini/explain] request failed', {
      stage,
      status,
      code,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return res.status(502).json({
      error: { status, code, message },
      breakEvenNarrative: '',
      monteCarloInsight: '',
      sensitivity: null,
      monteCarlo: null,
    });
  }
}
