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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
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
                <strong>Sticker Rent:</strong> Median market asking rents by bedroom count, drawn directly from the Canada Mortgage and Housing Corporation (CMHC) Rental Market Survey (October 2024 tables).
              </li>
              <li>
                <strong>Monthly Commute Expenses:</strong> Either TTC Adult Monthly Pass ($156.00/mo) or single-ride PRESTO ($3.30/trip); OR personal vehicle operating costs (GTA average unleaded fuel at $1.62/L, 8.8 L/100km, plus CAA standard $410/mo insurance & maintenance baseline, plus workplace destination parking).
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
              Time Cost = Monthly Commute Hours &times; (Annual Income &divide; 1,950 hrs) &times; 50%
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
              6. The &ldquo;No Data&rdquo; Honesty Guarantee
            </h4>
            <p className="text-[11px] text-stone-600">
              When public open data is missing for a specific micro-neighbourhood or sensor quadrant (such as satellite tree canopy sensor gaps in Malvern North-East), it is marked as <strong>&ldquo;no data&rdquo;</strong> rather than filled with fictional placeholders.
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
