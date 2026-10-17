import React from 'react';
import {
  Compass,
  ShieldCheck,
  Sparkles,
  Database,
  Building2,
  BrainCircuit,
} from 'lucide-react';
import { UserPreferences } from '../types';

interface HeaderProps {
  preferences: UserPreferences;
  onOpenMethodology: () => void;
  onOpenTenantResources: () => void;
  onOpenWhatIf: () => void;
  onOpenLivePostings: () => void;
  onOpenMlEstimator?: () => void;
  onResetPreferences: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  onOpenMethodology,
  onOpenTenantResources,
  onOpenWhatIf,
  onOpenLivePostings,
  onOpenMlEstimator,
  onResetPreferences,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Civic & Ethical Transparency Sub-bar */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Civic Open Data
            </span>
            <span className="text-stone-300 text-xs hidden sm:inline">
              100% Public Open Data &bull; Zero Preset Personas &bull; User-Defined Financials
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={onOpenLivePostings}
              className="hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer text-amber-200"
              title="Browse attached rental postings from HouseSigma, Realtor.ca, and Zillow"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>HouseSigma &amp; Zillow Feeds</span>
            </button>
            <span className="text-stone-700">|</span>
            <button
              onClick={onOpenMethodology}
              className="hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer text-stone-300"
              title="See public sources from CMHC, City of Toronto, TTC, and TRCA"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Sources &amp; Methodology</span>
            </button>
            <span className="text-stone-700">|</span>
            <button
              onClick={onOpenTenantResources}
              className="hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer text-stone-300"
              title="Tenant rights, Ontario rent guideline, and legal advocacy"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tenant Rights &amp; FMTA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900">
                TrueRent Toronto
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                10 Neighbourhoods
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Real living expenses: Housing + Transit + Utilities + Commute Travel Time
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={onOpenLivePostings}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 cursor-pointer shadow-2xs hover:shadow-xs"
            title="Browse attached rental postings from HouseSigma, Realtor.ca, Zillow, and Rentals.ca"
          >
            <Building2 className="w-4 h-4 text-amber-700" />
            <span>Live Postings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/90 text-amber-900 font-bold">
              Feeds
            </span>
          </button>

          <button
            onClick={onOpenWhatIf}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 cursor-pointer shadow-2xs hover:shadow-xs"
            title="Explore what-if scenarios (e.g. changing commute mode or hybrid schedule)"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Scenario Explorer</span>
          </button>

          {onOpenMlEstimator && (
            <button
              onClick={onOpenMlEstimator}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 cursor-pointer shadow-2xs hover:shadow-xs"
              title="Estimate rents for unobserved unit gaps (including 4-bed suites) using Linear Regression"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
              <span>ML Rent Estimator</span>
            </button>
          )}

          <button
            onClick={onResetPreferences}
            className="px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
            title="Reset to clean baseline inputs"
          >
            Reset Inputs
          </button>
        </div>
      </div>
    </header>
  );
};
