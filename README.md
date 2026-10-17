# True Cost of Home

A Toronto-area housing and commuting comparison app built with React, TypeScript, Vite, and Express. The workplace picker uses Leaflet/OpenStreetMap, and place search and driving-route estimates use the server-side OpenRouteService API.

## Run it on a new computer

This project needs **Node.js and npm**. npm is included when Node.js is installed; there is no separate npm download. It does not use Python or `pip`.

1. Install the current **Node.js LTS** release from [nodejs.org](https://nodejs.org/en/download). On Windows, use the installer and leave the option to add Node to PATH enabled. On macOS or Linux, use the official installer or your preferred Node version manager.
2. Open a terminal (PowerShell on Windows, Terminal on macOS/Linux) and check the installs:

   ```sh
   node --version
   npm --version
   ```

   Use Node.js 22.12 or newer. If those commands are not found, close and reopen the terminal after installation.

3. Download/clone this repository, open a terminal in the project folder (the folder containing `package.json`), then install the exact dependencies recorded in `package-lock.json`:

   ```sh
   npm ci
   ```

4. Configure the optional server keys as described below.
5. Start the development app:

   ```sh
   npm run dev
   ```

6. Open <http://localhost:3000> in a browser. Keep the terminal running while using the app. Press `Ctrl+C` in that terminal to stop it.

## API keys

The app can open without keys, but the corresponding connected features will not work:

- `ORS_API_KEY` enables place search and driving route estimates. Create a key at [openrouteservice.org](https://openrouteservice.org/dev/#/signup), then keep it on the server—do not prefix it with `VITE_` or commit it.
- `GEMINI_API_KEY` enables AI-generated explanations. It is optional; deterministic app calculations can still be used without it.

Create a local environment file by copying the example:

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```sh
cp .env.example .env.local
```

Open `.env.local`, replace the placeholder values for the keys you have, and save. `.env.local` is ignored by Git. Restart `npm run dev` after changing it. Never share or commit this file.

## Useful commands

```sh
npm run dev    # start the local app
npm run lint   # TypeScript check
npm test       # run tests
npm run build  # create a production build in dist/
npm start      # run the server (normally after npm run build)
```

If `npm ci` reports a lockfile or dependency error, check that you are in the repository root and that Node/npm installed correctly. If port 3000 is already in use, stop the other app using it and retry.

## Why there is also a `requirements.txt`

`requirements.txt` is conventionally for Python packages installed with `pip`. This repository is not a Python project, so its `requirements.txt` intentionally contains no installable packages; use `npm ci` to install the JavaScript/TypeScript dependencies. The authoritative dependency lists are `package.json` and `package-lock.json`.
