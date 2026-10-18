// Vercel Node runtime polyfills for the serverless functions only.
// Kept minimal on purpose.
// This shim is only imported at runtime inside api/ functions.
// It must NOT be imported by the Vite frontend build.
// If a frontend compiler sees this file, add it to vite.config exclusions or keep it api-only.

export const _apiPolyfill = 'api-polyfill';
// These functions only need the Node stdlib bits they
// import (path, etc.) plus a fetch implementation that Vercel provides on newer
// runtimes. We bail out early so nothing here runs on the static frontend build.

const isNodeFunction =
  typeof process !== 'undefined' && process.env?.VERCEL !== undefined;

if (isNodeFunction) {
  // Reserve fetch: Vercel Node runtimes already expose a spec-compatible fetch.
  // Importing or overriding it here would only conflict with that runtime fetch.
}

