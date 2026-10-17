import React from 'react';
import {
  Compass,
  ShieldCheck,
  SlidersHorizontal,
  Database,
  BrainCircuit,
  Building2,
} from 'lucide-react';
import { UserPreferences } from '../types';

interface HeaderProps {
  preferences: UserPreferences;
  onOpenMethodology: () => void;
  onOpenTenantResources: () => void;
  onOpenWhatIf: () => void;
  onOpenDemoListings: () => void;
  onOpenMlEstimator?: () => void;
  onResetPreferences: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  onOpenMethodology,
  onOpenTenantResources,
  onOpenWhatIf,
  onOpenDemoListings,
  onOpenMlEstimator,
  onResetPreferences,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1b1712] bg-[#f4f1e8]/95 backdrop-blur-sm">
      {/* Dateline strip */}
      <div className="bg-[#1b1712] px-4 py-1.5 text-[#e8e2d4] sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="dateline text-[#e8e2d4]">
            Toronto &middot; Civic open data &middot; No preset personas
          </p>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <button
              onClick={onOpenMethodology}
              className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-white"
              title="See public sources from CMHC, City of Toronto, TTC, and TRCA"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Data sources &amp; methodology</span>
            </button>
            <span aria-hidden="true" className="text-[#5c554a]">
              |
            </span>
            <button
              onClick={onOpenTenantResources}
              className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-white"
              title="Tenant rights, Ontario rent guideline, and legal advocacy"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Tenant rights &amp; FMTA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nameplate */}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5" data-parallax-section>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#1b1712] text-[#f4f1e8]">
            <Compass className="h-6 w-6" data-parallax="0.06" />
          </div>
          <div>
            <p className="dateline text-stone-500">
              The honest cost-of-living ledger &middot; 10 neighbourhoods
            </p>
            <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-[#1b1712] sm:text-4xl">
              TrueRent Toronto
            </h1>
            <p className="mt-1.5 text-xs text-stone-600 sm:text-[13px]">
              Housing + transit + utilities + the hours your commute takes back.
            </p>
          </div>
        </div>

        {/* Action controls — one primary, the rest quiet */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenWhatIf}
            className="pressable flex cursor-pointer items-center gap-2 bg-[#1b1712] px-4 py-2 text-xs font-bold text-[#f4f1e8] transition-colors hover:bg-emerald-900"
            title="Explore what-if scenarios (e.g. changing commute mode or hybrid schedule)"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>AI scenario explorer</span>
          </button>
          <button
            onClick={onOpenDemoListings}
            className="pressable flex cursor-pointer items-center gap-2 border border-[#1b1712]/25 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#1b1712] transition-colors hover:border-[#1b1712] hover:bg-[#1b1712]/5"
            title="Browse illustrative demo rent examples"
          >
            <Building2 className="h-4 w-4" />
            <span>Demo listings</span>
          </button>

          {onOpenMlEstimator && (
            <button
              onClick={onOpenMlEstimator}
              className="pressable flex cursor-pointer items-center gap-1.5 border border-[#1b1712]/25 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#1b1712] transition-colors hover:border-[#1b1712] hover:bg-[#1b1712]/5"
              title="Estimate rents for unobserved unit gaps (including 4-bed suites) using Linear Regression"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>ML rent estimator</span>
            </button>
          )}

          <button
            onClick={onResetPreferences}
            className="pressable cursor-pointer px-2 py-2 text-xs font-semibold text-stone-500 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-[#1b1712]"
            title="Reset to clean baseline inputs"
          >
            Reset inputs
          </button>
        </div>
      </div>
      <div className="rule-double mx-auto max-w-7xl" aria-hidden="true" />
    </header>
  );
};
