import React from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  Car,
  AlertCircle,
  RotateCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';

interface KeyFindingBannerProps {
  results: CalculatedCost[];
  preferences: UserPreferences;
  aiExplanation: {
    headline: string;
    body: string;
    cheapestRentNeighbourhood?: string;
    cheapestTrueNeighbourhood?: string;
    monthlyDifference?: number;
    timeDifferenceHours?: number;
    tenantRightsNotice?: string;
    isAiGenerated?: boolean;
  } | null;
  isLoadingAi: boolean;
  onRefreshAi: () => void;
  onOpenWhatIf: () => void;
}

export const KeyFindingBanner: React.FC<KeyFindingBannerProps> = ({
  results,
  preferences,
  aiExplanation,
  isLoadingAi,
  onRefreshAi,
  onOpenWhatIf,
}) => {
  if (!results.length) return null;

  const cheapestRentItem = [...results].sort(
    (a, b) => a.stickerRent - b.stickerRent
  )[0];
  const cheapestTrueItem = results[0]; // First in true monthly cost order

  const isDivergent =
    cheapestRentItem.neighbourhood.id !== cheapestTrueItem.neighbourhood.id;
  const netMonthlySavings =
    cheapestRentItem.trueMonthlyCost - cheapestTrueItem.trueMonthlyCost;
  const rentDelta =
    cheapestTrueItem.stickerRent - cheapestRentItem.stickerRent;
  const commuteDelta =
    cheapestRentItem.commuteBreakdown.totalMonthlyCommuteCost -
    cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost;
  const hoursSaved = Number(
    (
      cheapestRentItem.commuteBreakdown.monthlyCommuteHours -
      cheapestTrueItem.commuteBreakdown.monthlyCommuteHours
    ).toFixed(1)
  );

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-stone-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md mb-8 border border-emerald-800/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: The Key Insight */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              The True Cost Finding
            </span>
            {isDivergent ? (
              <span className="text-xs font-semibold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-sm border border-amber-600/30">
                Sticker Rent Misleads
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-sm border border-emerald-600/30">
                Rent & Commute Align
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
            {aiExplanation?.headline ||
              (isDivergent
                ? `${cheapestTrueItem.neighbourhood.name} is $${netMonthlySavings}/mo cheaper overall than ${cheapestRentItem.neighbourhood.name}`
                : `${cheapestTrueItem.neighbourhood.name} offers both the lowest rent and lowest overall living cost.`)}
          </h3>

          <div className="mt-3 text-sm text-stone-300 leading-relaxed max-w-3xl">
            {isLoadingAi ? (
              <div className="flex items-center gap-2 text-stone-400 py-1">
                <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Explaining findings in plain language...</span>
              </div>
            ) : (
              <p>
                {aiExplanation?.body ||
                  (isDivergent
                    ? `${cheapestRentItem.neighbourhood.name} has the lowest advertised rent ($${cheapestRentItem.stickerRent}/mo), but its commute expenses ($${cheapestRentItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) and ${cheapestRentItem.commuteBreakdown.monthlyCommuteHours} hours of monthly travel increase its true monthly cost to $${cheapestRentItem.trueMonthlyCost}. By living closer in ${cheapestTrueItem.neighbourhood.name}, you pay $${rentDelta} more on rent but save $${commuteDelta}/mo on travel—leaving you $${netMonthlySavings} ahead every month.`
                    : `Because your workplace is conveniently near ${cheapestTrueItem.neighbourhood.name}, travel expenses don't erase the rent advantage. Always consider local flood exposure (${cheapestTrueItem.neighbourhood.floodRisk.level}) and tenant displacement pressures.`)}
              </p>
            )}
          </div>

          {/* Provenance and AI Status indicator */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {aiExplanation?.isAiGenerated
                ? 'Narrated by Gemini 3.8 Flash (Server-Side)'
                : 'Deterministic Civic Summary (Active fallback)'}
            </span>
            <span className="text-stone-600">•</span>
            <span>Math strictly powered by deterministic calculator</span>
            <button
              onClick={onRefreshAi}
              disabled={isLoadingAi}
              className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer ml-auto flex items-center gap-1"
            >
              <RotateCw
                className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`}
              />
              Re-analyze
            </button>
          </div>
        </div>

        {/* Right Side: Quick Math Comparison Cards */}
        {isDivergent && (
          <div className="lg:w-80 shrink-0 bg-stone-900/80 rounded-xl p-4 border border-stone-800 flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Side-by-Side Comparison
            </div>

            {/* Sticker cheapest */}
            <div className="bg-stone-800/70 rounded-lg p-2.5 border border-stone-700/60">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Lowest Sticker Rent</span>
                <span className="text-stone-300 font-medium truncate max-w-[140px]">
                  {cheapestRentItem.neighbourhood.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-mono text-stone-300">
                  Rent: ${cheapestRentItem.stickerRent}
                </span>
                <span className="text-sm font-mono font-bold text-rose-300">
                  True: ${cheapestRentItem.trueMonthlyCost}/mo
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{cheapestRentItem.commuteBreakdown.monthlyCommuteHours}h monthly travel</span>
              </div>
            </div>

            {/* True cost cheapest */}
            <div className="bg-emerald-950/70 rounded-lg p-2.5 border border-emerald-700/60">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Lowest True Cost</span>
                <span className="text-emerald-200 truncate max-w-[140px]">
                  {cheapestTrueItem.neighbourhood.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-mono text-emerald-200">
                  Rent: ${cheapestTrueItem.stickerRent}
                </span>
                <span className="text-base font-mono font-extrabold text-emerald-300">
                  True: ${cheapestTrueItem.trueMonthlyCost}/mo
                </span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                  Saves ${netMonthlySavings}/mo
                </span>
                {hoursSaved > 0 && (
                  <span className="text-stone-300">
                    +{hoursSaved}h saved
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onOpenWhatIf}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask a &ldquo;What-If&rdquo; Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
