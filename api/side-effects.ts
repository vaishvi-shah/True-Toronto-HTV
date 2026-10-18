// Vercel serverless function side-effect shim.
// Imported by every function so any Node runtime polyfill side effects
// run once per cold start.
import './vercel-polyfills';
// Named exports required by Vercel Node runtime's module loader for this file.
export const _apiPolyfill = './vercel-polyfills';
export { _apiPolyfill as default };
// eslint-disable-next-line @typescript-eslint/no-unsafe-export
import type { VercelRequest } from '@vercel/node';
// eslint-disable-next-line @typescript-eslint/require-await
const _fn = async (_req: VercelRequest) => true;
