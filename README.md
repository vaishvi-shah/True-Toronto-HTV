# True Cost of Home

True Cost of Home is an early-stage Toronto housing comparison project. The intended app will compare housing and commute costs, show sourced neighbourhood indicators, and eventually explain trade-offs. **At this stage, it is a scaffold with a small compiled data set: the home page is blank, and no cost calculations or data display have been implemented.**

## Run the project

Run these commands from the repository root (`Hack the Valley`):

```powershell
npm ci
npm run dev
```

Then open <http://localhost:3000>. The Next.js server should start, but the page will be blank because `app/page.tsx` currently returns `null`. There is no separate application file to run directly; use the npm scripts in `package.json`.

To stop the development server, press `Ctrl+C` in the terminal.

The project also has these scripts:

```powershell
npm run build
npm start
npm test
```

`npm start` runs the production server after a successful `npm run build`. Vitest is installed, but no tests have been written yet.

The current project successfully completed `npm run build` on 2026-10-17. This confirms compilation and static prerendering; the resulting home page is still blank by design.

## Data included and where it comes from

### Toronto 2021 Neighbourhood Profiles

The source workbook is stored at [`data/sources/neighbourhood-profiles-2021.xlsx`](data/sources/neighbourhood-profiles-2021.xlsx). It was downloaded from the [City of Toronto Open Data Neighbourhood Profiles dataset](https://open.toronto.ca/dataset/neighbourhood-profiles/). The profiles are based on 2021 Census data and include Toronto social-planning neighbourhood names, renter and total household counts, monthly renter shelter costs, and the City’s TSNS 2020 designation.

[`data/neighbourhoods.json`](data/neighbourhoods.json) contains compiled indicators for the ten project labels:

- **Exact profile matches:** The Annex (City profile name “Annex”), Regent Park, South Riverdale, Thorncliffe Park, and Mount Dennis.
- **Explicit predictions from proxy profiles:** Church-Yonge Corridor, Parkdale, North York Centre, Jane-Finch, and Scarborough Centre. The proxy profile names and calculation method are included in the JSON and [`data/neighbourhood-crosswalk.json`](data/neighbourhood-crosswalk.json). These are predictions, not observed City values for the custom project areas; the proxy groups have not been confirmed against those areas’ exact boundaries.

The renter share is calculated from the source household counts. The shelter-cost value is kept in its own `censusMedianMonthlyShelterCostCad` field. It is **not** treated as rent-only: Statistics Canada defines renter shelter cost to include rent and, where applicable, electricity, heat, water, and other municipal services. See the [2021 Census dictionary](https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/98-301-x2021001-eng.pdf). These are historical 2021 measures, not current rent listings or current asking rents. Missing or unverified fields are `null`.

The workbook and data compiler are already in the repository, so compilation does not require a key or network access. With Python 3 installed, regenerate the JSON by running:

```powershell
python scripts/extract-neighbourhood-data.py
```

The script uses Python’s standard library only.

### TTC fare assumptions

[`data/assumptions.ts`](data/assumptions.ts) contains two values entered from official TTC pages:

- Adult PRESTO/eligible-card single fare: [TTC fares and passes](https://www.ttc.ca/en/Fares-and-passes).
- Eligible paid trip starts before monthly fare capping: [TTC monthly fare capping](https://www.ttc.ca/riding-the-ttc/Updates/TTC-monthly-fare-capping).

Each value has a source URL, checked date, and note. They are reference assumptions only; the transportation cost engine that would use them has not been written.

### Other source files and source research

- [`data/sources/wellbeing-toronto-civics-equity-indicators.xlsx`](data/sources/wellbeing-toronto-civics-equity-indicators.xlsx) is a City-related equity workbook with reference periods 2008 and 2011. It is retained for research but **is not used** as current neighbourhood data.
- [`data/source-catalog.md`](data/source-catalog.md) records other potential sources and their limitations: City neighbourhood boundaries and forest/land cover, CMHC rental tables, the TRCA floodplain viewer, ECCC emissions factors, and possible utility/routing sources. Those sources have not been compiled into values for the app unless specifically noted above.
- No Housesigma or Zillow data, listings, or API connections are included.

## Data and API keys

The app does not currently fetch external data at runtime. The intended architecture is to prepare source data ahead of time and store it under `data/`; the future Gemini integration would be the only planned request-time external call.

`.env.example` contains blank `GEMINI_API_KEY` and `GEMINI_MODEL` entries for a future Gemini integration. **No key is needed to run the current blank app or regenerate the neighbourhood JSON**, because Gemini has not been connected. Copy the example to `.env.local` only when the integration is implemented:

```powershell
Copy-Item .env.example .env.local
```

Local `.env` files are ignored by Git.

## Current project status

### Included

- Next.js App Router, TypeScript strict mode, and Tailwind CSS setup.
- Vitest, Recharts, and Google’s `@google/genai` package installed.
- Domain types in [`lib/types.ts`](lib/types.ts).
- Saved Toronto profile workbooks, a neighbourhood crosswalk, compiled 2021 indicators, TTC assumptions, and a source inventory.
- A repeatable local script for compiling the 2021 neighbourhood indicators.

### Not implemented yet

- UI to display or edit profile/neighbourhood information; charts and maps.
- Rent, commute, car, utility, carbon, affordability, climate-risk, or displacement calculations.
- Current asking rents, rent-only in-place rents, validated CMHC mappings, utility estimates, neighbourhood commute data, or neighbourhood-scale heat, canopy, and flood indicators.
- Online data-refresh scripts, API routes, or Gemini requests.
- Automated tests, deployment, database, or authentication.

See [`current.md`](current.md) for the detailed project handoff and [`plan.md`](plan.md) for the build plan and decisions.
