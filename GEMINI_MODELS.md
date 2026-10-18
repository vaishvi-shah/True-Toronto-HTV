# Gemini models for TrueRent Toronto

Checked against Google's Gemini API documentation on October 18, 2026. This app uses `@google/genai`'s `models.generateContent`, passes a system instruction, asks for `application/json`, and parses the returned text as JSON. The candidates below are text generation models documented to support structured outputs, so they fit the response format used here.

## Compatible model IDs

| Model ID | Status / notes |
| --- | --- |
| `gemini-3.8-flash` | Stable, newest Flash model. It is the previous default in this app. |
| `gemini-3.6-flash` | Stable. Current fallback in the Vercel API functions. |
| `gemini-3.5-flash-lite` | Stable, lightweight option suitable for routine narration. |
| `gemini-3.1-flash-lite` | Stable, lightweight option suitable for routine narration. |
| `gemini-3.1-pro-preview` | Supports structured output, but is a preview model; expect lifecycle or behavior changes. |
| `gemini-2.5-pro` | Supported, but Google limits access to accounts that have actively used 2.5 models. |
| `gemini-2.5-flash` | Supported, but Google limits access to accounts that have actively used 2.5 models. |
| `gemini-2.5-flash-lite` | Supported, but Google limits access to accounts that have actively used 2.5 models. |

For a stable, lower-cost alternative to the latest Flash model, try `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite`. Google's docs don't publish per-model popularity or capacity, so a different model may still return 503; it cannot be guaranteed to be less busy.

Avoid `gemini-3.5-flash` and `gemini-3.7-flash`: Google marks them deprecated and routes requests to newer models. Avoid `gemini-2.0-flash`: Google lists its API shutdown as June 1, 2026.

## Automatic service fallback

Both Vercel Gemini endpoints try the configured model (or `gemini-3.6-flash` by default), then at most two compatible alternatives: `gemini-3.5-flash-lite` and `gemini-3.1-flash-lite`. The alternatives are only tried for upstream HTTP 500, 502, 503, or 504 responses. SDK-level retries are disabled so one user request makes no more than three Gemini calls. If all attempts fail, the app returns the locally calculated results and a short calculation-based summary without exposing provider error codes.

## Where the model is selected

### Vercel API functions

The active Preview API routes use the `GEMINI_MODEL` environment variable when set, otherwise they use the fallback shown here:

- [`api/gemini/explain.ts`](api/gemini/explain.ts#L108) — analysis / narration, fallback `gemini-3.6-flash`.
- [`api/gemini/what-if.ts`](api/gemini/what-if.ts#L117) — what-if narration, fallback `gemini-3.6-flash`.

To select one model for both Vercel API routes, set `GEMINI_MODEL` to the model ID in the Vercel Preview (and Production, if desired) Environment Variables, then redeploy the matching environment. `GEMINI_API_KEY` is separate and remains required.

### Local Express server

The local `npm run dev` / `npm start` server uses hardcoded model IDs and currently does not read `GEMINI_MODEL`:

- [`server.ts`](server.ts#L151) — `/api/explain` and `/api/gemini/explain`, fallback currently `gemini-3.8-flash`.
- [`server.ts`](server.ts#L274) — `/api/gemini/what-if`, fallback currently `gemini-3.8-flash`.

Change both selectors to the same model ID to keep local-server behavior aligned with Vercel. Alternatively, update the server to use `process.env.GEMINI_MODEL || '<model-id>'` in both places.

### Standalone legacy page

- [`hero-truerent.html`](hero-truerent.html#L529) and [`hero-truerent.html`](hero-truerent.html#L620) call the Gemini REST endpoint directly with `gemini-2.0-flash`.

This is a standalone/legacy page rather than either active app API route. It is not a valid model choice now because Gemini 2.0 Flash's API shutdown date has passed. If this page is still used, migrate both REST URLs to a supported model; otherwise it can be ignored when changing the main app's model.

## What is deployed now

The latest Preview deployment I created is [truerenttoronto-kzfh58ogk-vaishvi.vercel.app](https://truerenttoronto-kzfh58ogk-vaishvi.vercel.app/). Its Preview environment has `GEMINI_API_KEY` and no `GEMINI_MODEL` override, so it uses `gemini-3.6-flash` in the two Vercel API files. This was a Preview deployment only; Production was not redeployed.

## Google references

- [Models and model IDs](https://ai.google.dev/gemini-api/docs/models)
- [Structured output support](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- [Gemini model deprecations and access limits](https://ai.google.dev/gemini-api/docs/deprecations)
