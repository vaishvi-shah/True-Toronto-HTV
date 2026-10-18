import React from 'react';
import {
  X,
  BookOpen,
  DollarSign,
  Car,
  Clock,
  Droplets,
  Flame,
} from 'lucide-react';

interface HowWeCalculatedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowWeCalculatedModal: React.FC<HowWeCalculatedModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60">
      <div className="modal-enter bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                How the Comparison Works
              </h3>
              <p className="text-xs text-stone-500">
                Data sources, assumptions, and known limitations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 leading-relaxed">
          {/* Quick Summary: Where All Data Comes From */}
          <div className="p-4 rounded-xl bg-stone-900 text-white">
            <h4 className="font-bold text-emerald-400 text-sm mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Public Data Sources Directory
            </h4>
            <p className="text-xs text-stone-300 mb-3">
              The comparison combines user-entered values, historical housing references, route calculations, and assumptions. Figures are not all live data; the notes below identify estimates and gaps.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold">
                    <th className="py-1.5 pr-2">Category</th>
                    <th className="py-1.5 pr-2">Official Source</th>
                    <th className="py-1.5 pr-2">Agency / Publisher</th>
                    <th className="py-1.5">Release Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Historical Rent Reference</td>
                    <td className="py-1.5 pr-2">Rental Market Survey (RMS) Zone Tables</td>
                    <td className="py-1.5 pr-2">Canada Mortgage &amp; Housing Corp (CMHC)</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Area Rent References</td>
                    <td className="py-1.5 pr-2">Historical CMHC zone averages mapped approximately to app neighbourhoods, by bedroom size</td>
                    <td className="py-1.5 pr-2">CMHC Rental Market Report (source noted on each area card)</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Public Transit Fares</td>
                    <td className="py-1.5 pr-2">$3.30 adult PRESTO fare; monthly cap after 47 eligible paid trips</td>
                    <td className="py-1.5 pr-2">Toronto Transit Commission (TTC)</td>
                    <td className="py-1.5 font-mono text-stone-400">Fare $3.30; cap since Aug 2026</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Vehicle Driving Costs</td>
                    <td className="py-1.5 pr-2">Assumed $1.62/L fuel, 8.8 L/100 km, and $410 monthly vehicle-cost allowance; not live prices</td>
                    <td className="py-1.5 pr-2">App assumptions</td>
                    <td className="py-1.5 font-mono text-stone-400">Fuel price date not recorded</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Commute Travel Times</td>
                    <td className="py-1.5 pr-2">Stored area-to-destination estimates; some destinations use a generic baseline</td>
                    <td className="py-1.5 pr-2">App estimates; not live transit itineraries</td>
                    <td className="py-1.5 font-mono text-stone-400">Not consistently dated</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Car Route Distance &amp; Time</td>
                    <td className="py-1.5 pr-2">Road matrix between area representative points and workplace</td>
                    <td className="py-1.5 pr-2">OpenRouteService (no live traffic)</td>
                    <td className="py-1.5 font-mono text-stone-400">On analysis</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Commute Time Value</td>
                    <td className="py-1.5 pr-2">User-selected share of gross hourly wage (50% default)</td>
                    <td className="py-1.5 pr-2">App setting; 1,950 work hours/year</td>
                    <td className="py-1.5 font-mono text-stone-400">User adjustable</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Residential Utilities</td>
                    <td className="py-1.5 pr-2">Static planning estimates by neighbourhood and bedroom count; detailed source/sample metadata is not stored</td>
                    <td className="py-1.5 pr-2">App estimate; user can enter a bill</td>
                    <td className="py-1.5 font-mono text-stone-400">Not consistently dated</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Commute Emissions</td>
                    <td className="py-1.5 pr-2">Gasoline factor and Toronto transit network average; estimates are not measured</td>
                    <td className="py-1.5 pr-2">NRCan / City of Toronto TTC analysis</td>
                    <td className="py-1.5 font-mono text-stone-400">NRCan 2024 guide / City study</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Riverine Flood Risk</td>
                    <td className="py-1.5 pr-2">Regulatory Flood Hazard GIS Atlases</td>
                    <td className="py-1.5 pr-2">Toronto &amp; Region Conservation Authority (TRCA)</td>
                    <td className="py-1.5 font-mono text-stone-400">June 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Heat Island &amp; Canopy</td>
                    <td className="py-1.5 pr-2">Heat Vulnerability Index (HVI) &amp; Canopy Study</td>
                    <td className="py-1.5 pr-2">City of Toronto Public Health &amp; Forestry</td>
                    <td className="py-1.5 font-mono text-stone-400">2023/2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Live Rental Search</td>
                    <td className="py-1.5 pr-2">External search links only; this app does not retrieve or store listings</td>
                    <td className="py-1.5 pr-2">Linked portals; verify every ad</td>
                    <td className="py-1.5 font-mono text-stone-400">External search; listing date not stored</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-stone-800 text-[11px] text-emerald-200 border border-emerald-500/20">
              <strong>Rent data note:</strong> The neighbourhood references are historical CMHC survey-zone averages by bedroom type (October 2024), not current asking listings. The app does not have per-area sample counts. See the <a className="underline" href="https://assets.cmhc-schl.gc.ca/sites/cmhc/professional/housing-markets-data-and-research/market-reports/rental-market-report/fall-2024/rental-market-report-fall-2024-en.pdf" target="_blank" rel="noreferrer">CMHC Fall 2024 Rental Market Report</a>. Enter a verified rent for a current comparison; listing portals are external links.
            </div>
          </div>

          {/* Section 1: The Core Formula */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              1. The True Monthly Cost Formula
            </h4>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs text-emerald-950 font-semibold mb-2">
              Estimated Monthly Total = Rent + Monthly Commute Expenses + Utilities
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              <li>
                <strong>Housing:</strong> The preset uses a historical CMHC survey-zone average for the selected bedroom count (October 2024). It is an area-level reference, not a current listing or a price for a specific home. The source sample size is not available in the app. Enter a current rent for a more relevant estimate.
              </li>
              <li>
                <strong>Monthly Commute Expenses:</strong> TTC fare estimates use the schedule above and assume two paid one-way trips on each on-site workday. Driving uses the OpenRouteService road distance from representative points when available, the 8.8 L/100 km and $1.62/L assumptions, a $410 monthly vehicle-cost allowance, and known workplace parking. Mixed mode assumes half the trips are transit and half driving. Walk/cycle has no direct travel charge; its time estimate averages walking at 4.8 km/h and cycling at 15 km/h using representative-point distance plus a 25% street-network allowance. Transit times without stored area-to-work data use a distance estimate; neither estimate is a live itinerary. Driving times are estimates without live traffic. Unknown parking is excluded.
              </li>
              <li>
                <strong>Utilities:</strong> Static planning estimates by neighbourhood and bedroom count. The app does not store verifiable sample or source details for these values; enter your actual monthly bill when available.
              </li>
            </ul>
          </div>

          {/* Section 2: Commute Time Valuation */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              2. The Cost of Your Time (Shown Separately)
            </h4>
            <p className="mb-2 text-stone-700">
              Why is this number kept separate? In standard economics, long commutes have a real human and opportunity cost. However, if an app silently adds your travel time into your rent calculation, it misrepresents your actual bank account out-of-pocket expenses.
            </p>
            <div className="bg-white p-3 rounded-lg border border-amber-200 font-mono text-xs text-amber-950 font-semibold mb-2">
              Time Cost = Monthly Commute Hours &times; (Annual Income &divide; 1,950 hrs) &times; Your selected wage percentage
            </div>
            <p className="text-stone-600 text-[11px]">
              This is shown separately from out-of-pocket expenses. The default is 50% of gross hourly income; you can adjust or turn off the time valuation in your inputs.
            </p>
          </div>

          {/* Section 3: Climate Exposure */}
          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-700" />
              3. Flood and Heat Exposure Indicators
            </h4>
            <p className="mb-2 text-stone-700">
              These are dated, area-level context indicators, not assessments of a specific property. Results depend on approximate representative locations and the source datasets listed on each neighbourhood card.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-white p-3 rounded-lg border border-sky-200">
                <span className="font-semibold text-stone-900 block mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  Flood Exposure
                </span>
                <p className="text-[11px] text-stone-600">
                  Sourced from Toronto and Region Conservation Authority (TRCA) Regulatory Flood Hazard Atlases (Humber, Don, Rouge, and Highland Creek watersheds) and overland street flow zones.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200">
                <span className="font-semibold text-stone-900 block mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Extreme Heat Exposure
                </span>
                <p className="text-[11px] text-stone-600">
                  Sourced from City of Toronto Heat Vulnerability Index (HVI) and Urban Tree Canopy studies (measuring concrete surface ratio and mature canopy cooling deficit).
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Carbon Footprint */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1">
              Estimated Monthly Transportation Emissions
            </h4>
            <p className="text-[11px] text-stone-600">
              This is an estimate, not a measurement. For driving, monthly emissions = round-trip road distance × on-site days × assumed fuel use (8.8 L/100 km) × 2.307 kg CO₂e per litre of gasoline. The factor is from <a className="underline" href="https://www.canada.ca/en/environment-climate-change/services/climate-change/pricing-pollution-how-it-will-work/output-based-pricing-system/federal-greenhouse-gas-offset-system/emission-factors-reference-values.html" target="_blank" rel="noreferrer">Environment and Climate Change Canada</a>. Transit uses a Toronto network-average factor of about 20 g CO₂e per passenger-km from a <a className="underline" href="https://www.toronto.ca/legdocs/mmis/2025/ttc/bgrd/backgroundfile-255187.pdf" target="_blank" rel="noreferrer">City of Toronto TTC analysis</a>, applied to the available road-distance proxy because the app has no transit routing service. Active travel is shown as zero operational emissions; equipment and lifecycle emissions are excluded. Home energy emissions are not included because the app has no validated household energy data.
            </p>
          </div>

          {/* Missing data */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-300">
            <h4 className="font-bold text-stone-900 text-sm mb-1">
              Missing Data
            </h4>
            <p className="text-[11px] text-stone-600">
              The app labels missing destination-specific commute information when it falls back to a generic baseline. Historical rent and utility estimates are shown with their date/source limitations; user-entered values can replace them. Not every input is live or independently verified.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1">7. Commute and data limitations</h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              OpenRouteService supplies driving routes from representative neighbourhood points when available; saved road estimates are used otherwise. Commute times are stored estimates rather than live traffic or transit itineraries. Some workplaces do not have a destination-specific transit estimate, so the comparison flags when a generic baseline is used. Unknown parking is excluded. TTC cost assumes two paid one-way trips per on-site workday and applies the $3.30 fare and 47-trip monthly cap. Housing, utilities, fuel, and saved commute figures may be stale; check their stated dates and assumptions before relying on them.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
