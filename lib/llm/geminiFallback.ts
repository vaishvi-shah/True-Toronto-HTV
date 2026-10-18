const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getGeminiStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as { status?: unknown; statusCode?: unknown; message?: unknown };
  const status = typeof value.status === 'number'
    ? value.status
    : typeof value.statusCode === 'number'
      ? value.statusCode
      : null;
  if (status !== null) return status;
  const message = typeof value.message === 'string' ? value.message : '';
  const match = message.match(/\bHTTP\s*(500|502|503|504)\b|\b(500|502|503|504)\b/i);
  return match ? Number(match[1] || match[2]) : null;
}

export function isRetryableGeminiError(error: unknown): boolean {
  const status = getGeminiStatus(error);
  return status !== null && RETRYABLE_STATUSES.has(status);
}

/** Try the configured model and at most two compatible alternatives. */
export async function generateWithGeminiFallback<T>(
  primaryModel: string,
  generate: (model: string) => Promise<T>,
  canContinue: () => boolean = () => true,
): Promise<{ response: T; model: string; attempts: number }> {
  const models = [...new Set([primaryModel, ...FALLBACK_MODELS])].slice(0, 3);
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    if (!canContinue()) throw lastError ?? new Error('Gemini fallback deadline reached');
    const model = models[index];
    try {
      const response = await generate(model);
      return { response, model, attempts: index + 1 };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || index === models.length - 1) throw error;
      if (!canContinue()) throw error;
      console.warn('[gemini] transient upstream error; trying compatible fallback model', {
        status: getGeminiStatus(error),
        nextAttempt: index + 2,
        model: models[index + 1],
      });
      await pause(index === 0 ? 200 : 400);
    }
  }

  throw lastError;
}
