/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';
import {
  buildUnifiedExplainPrompt,
  normalizeToUserPreferences,
} from '../../src/services/unifiedEngine.js';
import { calculateNeighbourhoodCosts } from '../../src/services/calculator.js';
import { SYSTEM_DIRECTIVE } from '../../lib/llm/prompts.js';
import { generateWithGeminiFallback, getGeminiStatus } from '../../lib/llm/geminiFallback.js';

// Share one SDK client across the project's function invocations so the
// (serverless) Gemini calls do not pay connection-setup cost every request.
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
    // The bounded model fallback below owns retries, avoiding nested SDK retries.
    retryOptions: { attempts: 1 },
  },
});

console.info('[api/gemini/explain] module initialized', {
  geminiKeyConfigured: apiKey.trim().length > 0,
});

export const config = { runtime: 'nodejs' };

function buildCalculatedFallback(results: ReturnType<typeof calculateNeighbourhoodCosts>) {
  const recommended = results[0];
  const cheapestRent = [...results].sort(
    (a, b) => (a.effectiveRent ?? Number.POSITIVE_INFINITY) - (b.effectiveRent ?? Number.POSITIVE_INFINITY),
  )[0];
  return {
    headline: 'Your cost comparison is ready',
    body: recommended
      ? `Based on your inputs, ${recommended.neighbourhood.name} has the lowest personalized monthly total at $${recommended.totalImpactMonthly.toLocaleString()}. This includes $${recommended.trueMonthlyCost.toLocaleString()} in estimated cash expenses and $${recommended.timeCostMonthly.toLocaleString()} in commute-time value.`
      : 'Your calculated comparison is ready below.',
    cheapestRentNeighbourhood: cheapestRent?.neighbourhood.name,
    cheapestTrueNeighbourhood: recommended?.neighbourhood.name,
    cheapestTrueMonthlyCost: recommended?.trueMonthlyCost,
    cheapestTrueRent: recommended?.effectiveRent,
    isAiGenerated: false,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let stage = 'request_validation';
  console.info('[api/gemini/explain] request received', { method: req.method });

  // Reject non-post calls and mirror the legacy routes only where they used GET.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST required.' });
  }

  let calculatedResults: ReturnType<typeof calculateNeighbourhoodCosts> = [];
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
    calculatedResults = results;

    console.info('[api/gemini/explain] local analysis complete', {
      resultCount: results.length,
    });
    const prompt = buildUnifiedExplainPrompt(preferences as any, results as any);

    if (!apiKey.trim()) {
      console.warn('[api/gemini/explain] Gemini unavailable; returning calculated fallback');
      return res.json({
        ...buildCalculatedFallback(results),
      });
    }

    // Vercel functions have generous timeouts, but a hung upstream call is
    // still a bad experience — keep a hard guard.
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error('Gemini API timeout'));
      }, 10_000);
    });

    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    stage = 'gemini_request';
    console.info('[api/gemini/explain] Gemini request started', { model });
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

    console.info('[api/gemini/explain] Gemini response received', { model: successfulModel, attempts });

    return res.json({
      ...parsed,
      isAiGenerated: true,
    });
  } catch (error) {
    const status = getGeminiStatus(error);

    console.error('[api/gemini/explain] request failed', {
      stage,
      status,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    const fallback = buildCalculatedFallback(calculatedResults);
    return res.json({
      ...fallback,
    });
  }
}
