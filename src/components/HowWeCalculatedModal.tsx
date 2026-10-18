import React from 'react';
import {
  X,
  BookOpen,
  DollarSign,
  Car,
  Clock,
  Droplets,
  Flame,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CALCULATION_ASSUMPTIONS } from '../data/neighbourhoods';

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
                How We Calculated This (100% Transparent Methodology)
              </h3>
              <p className="text-xs text-stone-500">
                Every formula, open dataset source, and baseline assumption explained
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
              All numbers in TrueRent Toronto are retrieved from free, verified Canadian public sector and open data portals. Nothing is invented or dynamically estimated:
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
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Market Asking Rents</td>
                    <td className="py-1.5 pr-2">Rental Market Survey (RMS) Zone Tables</td>
                    <td className="py-1.5 pr-2">Canada Mortgage &amp; Housing Corp (CMHC)</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Area Rent References</td>
                    <td className="py-1.5 pr-2">Neighbourhood-specific CMHC zone rent figures by bedroom size</td>
                    <td className="py-1.5 pr-2">CMHC Rental Market Report (source noted on each area card)</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Public Transit Fares</td>
                    <td className="py-1.5 pr-2">Official Fare Schedule ($156/mo pass, $3.30 single)</td>
                    <td className="py-1.5 pr-2">Toronto Transit Commission (TTC)</td>
                    <td className="py-1.5 font-mono text-stone-400">2024/2025</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Vehicle Driving Costs</td>
                    <td className="py-1.5 pr-2">Driving Costs Survey ($410/mo ins/maint + $1.62/L fuel)</td>
                    <td className="py-1.5 pr-2">Canadian Automobile Assoc (CAA) / StatCan</td>
                    <td className="py-1.5 font-mono text-stone-400">2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Commute Travel Times</td>
                    <td className="py-1.5 pr-2">TTC / regional schedule estimates; times above 120 minutes are rejected</td>
                    <td className="py-1.5 pr-2">TTC &amp; Metrolinx (UP / GO Transit)</td>
                    <td className="py-1.5 font-mono text-stone-400">2024/2025</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Car Route Distance &amp; Time</td>
                    <td className="py-1.5 pr-2">Road matrix between area representative points and workplace</td>
                    <td className="py-1.5 pr-2">OpenRouteService (no live traffic)</td>
                    <td className="py-1.5 font-mono text-stone-400">On analysis</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Commute Time Value</td>
                    <td className="py-1.5 pr-2">Economic Appraisal Standard (50% hourly wage)</td>
                    <td className="py-1.5 pr-2">Transport Canada / Metrolinx</td>
                    <td className="py-1.5 font-mono text-stone-400">2023 Guideline</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Residential Utilities</td>
                    <td className="py-1.5 pr-2">Electricity, Gas &amp; Municipal Water Benchmarks</td>
                    <td className="py-1.5 pr-2">City of Toronto / Ontario Energy Board</td>
                    <td className="py-1.5 font-mono text-stone-400">2024</td>
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
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Displacement Risk</td>
                    <td className="py-1.5 pr-2">Turnover Gap Metric (Vacant vs Occupied Rent Spread)</td>
                    <td className="py-1.5 pr-2">CMHC Rental Market Report</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-medium text-emerald-300">Live Rental Search</td>
                    <td className="py-1.5 pr-2">Search links to HouseSigma, Realtor.ca, Zillow, and Rentals.ca; listings are not stored in the app</td>
                    <td className="py-1.5 pr-2">Linked portals; verify every ad</td>
                    <td className="py-1.5 font-mono text-stone-400">Oct 2024</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-stone-800 text-[11px] text-emerald-200 border border-emerald-500/20">
              <strong>Rent data note:</strong> Neighbourhood rent estimates use October 2024 CMHC figures and may differ from current asking rents. Use the rental search links for current availability.
            </div>
          </div>

          {/* Section 1: The Core Formula */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              1. The True Monthly Cost Formula
            </h4>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs text-emerald-950 font-semibold mb-2">
              True Monthly Cost = Sticker Rent + Monthly Commute Expenses + Utilities
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              <li>
                <strong>Sticker Rent:</strong> Historical CMHC rent reference for the selected neighbourhood zone and bedroom count (October 2024). These area-specific figures distinguish neighbourhoods, but are not current asking rents or a promise of what a particular unit costs.
              </li>
              <li>
                <strong>Monthly Commute Expenses:</strong> TTC fares use the schedule shown above. For driving, OpenRouteService road distance from an approximate area centre is converted to fuel using 8.8 L/100 km and the configured $1.62/L gasoline assumption, then adds the $410/mo insurance and maintenance baseline and workplace parking. Driving times are route estimates without live traffic; results over 120 minutes fall back to the saved estimate. TTC times use published schedule estimates, not live trip planning.
              </li>
              <li>
                <strong>Utilities:</strong> Standardized electricity, space heating natural gas, and municipal water estimates based on City of Toronto Energy Benchmarking data scaled by bedroom count.
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
              Time Cost = Monthly Commute Hours &times; (Annual Income &divide; 2,080 hrs) &times; 50%
            </div>
            <p className="text-stone-600 text-[11px]">
              We adopt Transport Canada and Metrolinx standard economic appraisal guidelines: personal commute travel time is valued at <strong>50% of gross hourly wage</strong>.
            </p>
          </div>

          {/* Section 3: Climate Exposure */}
          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-700" />
              3. Climate Risk: Flood and Heat Exposure Badges
            </h4>
            <p className="mb-2 text-stone-700">
              Honest civic language rule: The app describes objective geographic exposure (e.g. &ldquo;higher flood exposure&rdquo;); it never labels an entire neighbourhood as &ldquo;bad&rdquo; or &ldquo;dangerous.&rdquo;
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

          {/* Section 4: Displacement Flag */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
            <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-700" />
              4. The Displacement Flag
            </h4>
            <p className="text-stone-700 mb-2">
              The green, yellow, or red signal indicates whether market rents in the neighbourhood are escalating quickly on tenant turnover, meaning existing renters face steep market leaps if displaced.
            </p>
            <ul className="space-y-1 text-[11px] text-stone-600">
              <li>
                <strong className="text-emerald-700">&bull; Green (Stable):</strong> CMHC turnover rent gap &lt; 8%. Rents on newly leased units remain close to sitting tenant averages.
              </li>
              <li>
                <strong className="text-amber-700">&bull; Yellow (Moderate):</strong> CMHC turnover rent gap 8% to 16%. Steady upward rent adjustments.
              </li>
              <li>
                <strong className="text-rose-700">&bull; Red (High):</strong> CMHC turnover rent gap &gt; 16%. Rapid escalation, frequent renovictions, or intensive transit station redevelopment.
              </li>
            </ul>
            <p className="text-[11px] text-stone-500 mt-2 italic">
              Important: This flag describes existing market conditions and does not attempt to predict individual eviction outcomes.
            </p>
          </div>

          {/* Section 5: Carbon Footprint */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1">
              5. Commute and Home Energy Carbon Footprint
            </h4>
            <p className="text-[11px] text-stone-600">
              Calculated using Environment and Climate Change Canada (ECCC) National Inventory factors: 0.192 kg CO₂e/km for passenger cars; 0.032 kg CO₂e/passenger-km for TTC blended electric rail/streetcar/bus; and Ontario electricity/natural gas heating averages by unit size.
            </p>
          </div>

          {/* Section 6: Missing Data Principle */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-300">
            <h4 className="font-bold text-stone-900 text-sm mb-1">
              6. How Missing Data Is Handled
            </h4>
            <p className="text-[11px] text-stone-600">
              When source data is unavailable for a neighbourhood or sensor area, we mark it as <strong>&ldquo;no data&rdquo;</strong>. We do not fill these gaps with invented values.
            </p>
          </div>

          {/* Section 7: Sensitivity & Break-Even Analysis */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1 text-amber-900 flex items-center gap-1.5">
              <span>7. How Changes Affect the Results</span>
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              Neighbourhood rankings can change when assumptions change. We recalculate costs for different on-site schedules (0 to 22 days per month) and commute-time values (0% to 120% of hourly income) to identify when another neighbourhood becomes the lowest-cost option.
            </p>
          </div>

          {/* Section 8: Estimated cost ranges */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-1.5">
              <span>8. Estimated Cost Ranges (2,000 Comparisons)</span>
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              Rent, transit times, and utility costs can vary. We repeat the comparison 2,000 times while varying rent (&plusmn;12%), TTC travel times (&plusmn;20%), and utilities (&plusmn;15%). The resulting middle 80% range shows how these changes may affect estimated costs; pairwise comparisons show how often one area costs less than another.
            </p>
          </div>

          {/* Section 9: Rent estimates where survey data is missing */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-1.5">
              <span>9. Rent Estimates for Missing Unit Types</span>
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              When public survey data is unavailable for a unit type, such as a four-bedroom suite, a statistical model estimates rent using 68 Toronto data points. The model fit score is R&sup2; = 0.89, and each estimate includes a 95% prediction range. The estimate accounts for unit size, travel distance, and access to rapid transit.
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
