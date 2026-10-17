import React from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  Car,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  Dices,
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
    breakEvenNarrative?: string;
    monteCarloInsight?: string;
    isAiGenerated?: boolean;
  } | null;
  isLoadingAi: boolean;
  onRefreshAi: () => void;
  onOpenWhatIf: () => void;
  onOpenSensitivity?: () => void;
  onOpenMonteCarlo?: () => void;
}

export const KeyFindingBanner: React.FC<KeyFindingBannerProps> = ({
  results,
  preferences,
  aiExplanation,
  isLoadingAi,
  onRefreshAi,
  onOpenWhatIf,
  onOpenSensitivity,
  onOpenMonteCarlo,
}) => {
  if (!results.length) return null;

  const cheapestTrueItem = results[0]; // First in true monthly cost order
  const cheapestRentItem = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];

  const rentMode = preferences.rentMode || (preferences.rentInputMode === 'custom_fixed' ? 'user_entered' : 'user_entered');
  const hasRentAmount = cheapestTrueItem.effectiveRent !== null && cheapestTrueItem.effectiveRent > 0;
  const isRentExcluded = rentMode === 'no_rent';
  const isRentUnspecified = cheapestTrueItem.rentStatus === 'unspecified';

  const isDivergent =
    hasRentAmount && cheapestRentItem.neighbourhood.id !== cheapestTrueItem.neighbourhood.id;
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
    <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md mb-8 border border-stone-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Insight Headline & Body */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              True Cost Reality
            </span>

            {isRentExcluded ? (
              <span className="text-xs font-medium text-stone-300 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700">
                Commute &amp; Utilities Focused
              </span>
            ) : isRentUnspecified ? (
              <span className="text-xs font-medium text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-700/50">
                Rent Unspecified (Showing Transport + Utilities)
              </span>
            ) : isDivergent ? (
              <span className="text-xs font-semibold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-600/30">
                Sticker Rent Masks Real Commute Expense
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-600/30">
                Rent &amp; Transit Align
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            {aiExplanation?.headline ||
              (isRentExcluded
                ? `${cheapestTrueItem.neighbourhood.name} offers the lowest transit & utility overhead for your trips.`
                : isRentUnspecified
                ? `${cheapestTrueItem.neighbourhood.name} provides the lowest transit + utilities overhead at $${cheapestTrueItem.trueMonthlyCost}/mo.`
                : isDivergent
                ? `${cheapestTrueItem.neighbourhood.name} is $${netMonthlySavings}/mo cheaper overall than ${cheapestRentItem.neighbourhood.name}, despite higher asking rent.`
                : `${cheapestTrueItem.neighbourhood.name} delivers the most economical overall true monthly cost at $${cheapestTrueItem.trueMonthlyCost}/mo.`)}
          </h3>

          <div className="mt-2.5 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
            {isLoadingAi ? (
              <div className="flex items-center gap-2 text-stone-400 py-1">
                <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Formulating personalized analysis...</span>
              </div>
            ) : (
              <p>
                {aiExplanation?.body ||
                  (isRentExcluded
                    ? `With housing expenses excluded, your primary costs are travel ($${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) and utilities ($${cheapestTrueItem.utilitiesCost}/mo). Living in ${cheapestTrueItem.neighbourhood.name} gives you a ${cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hour monthly commute to your destination.`
                    : isRentUnspecified
                    ? `Because no rent was entered, true costs currently tally transit ($${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) and utilities ($${cheapestTrueItem.utilitiesCost}/mo). You can enter your specific rent or choose CMHC survey medians in the inputs above to include housing.`
                    : isDivergent
                    ? `${cheapestRentItem.neighbourhood.name} has the lowest advertised rent ($${cheapestRentItem.stickerRent}/mo), but its commute costs ($${cheapestRentItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) push total out-of-pocket expenses to $${cheapestRentItem.trueMonthlyCost}. By contrast, ${cheapestTrueItem.neighbourhood.name} costs $${rentDelta}/mo more in rent but saves $${commuteDelta}/mo on travel—saving you $${netMonthlySavings} net each month.`
                    : `${cheapestTrueItem.neighbourhood.name} minimizes your out-of-pocket overhead ($${cheapestTrueItem.trueMonthlyCost}/mo total) while keeping commute travel to ${cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hours per month.`)}
              </p>
            )}
          </div>

          {/* Break-Even Tipping Point & Monte Carlo Uncertainty Callouts */}
          {(aiExplanation?.breakEvenNarrative || aiExplanation?.monteCarloInsight) && (
            <div className="mt-3.5 space-y-2">
              {aiExplanation.breakEvenNarrative && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-amber-300">Break-Even Flip Point:</strong> &ldquo;{aiExplanation.breakEvenNarrative}&rdquo;
                    </span>
                  </div>
                  {onOpenSensitivity && (
                    <button
                      type="button"
                      onClick={onOpenSensitivity}
                      className="text-amber-300 hover:text-amber-200 font-bold shrink-0 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      Explore Sensitivity Curves <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {aiExplanation.monteCarloInsight && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-indigo-200">
                    <Dices className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      <strong className="text-indigo-300">Monte Carlo Uncertainty:</strong> {aiExplanation.monteCarloInsight}
                    </span>
                  </div>
                  {onOpenMonteCarlo && (
                    <button
                      type="button"
                      onClick={onOpenMonteCarlo}
                      className="text-indigo-300 hover:text-indigo-200 font-bold shrink-0 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      View Uncertainty Bands <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Missing info advisory if user left income or rent unspecified */}
          {cheapestTrueItem.missingInformation.length > 0 && (
            <div className="mt-3 text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Note:</strong> {cheapestTrueItem.missingInformation.join(' • ')}.
              </span>
            </div>
          )}

          {/* Footer Controls: Provenance & AI Status */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {aiExplanation?.isAiGenerated
                ? 'Narrated by Gemini 3.8 Flash'
                : 'Deterministic Civic Engine (Instant calculation)'}
            </span>
            <span className="text-stone-600 hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">Calculations strictly deterministic</span>

            <button
              onClick={onRefreshAi}
              disabled={isLoadingAi}
              className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer ml-auto flex items-center gap-1"
            >
              <RotateCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
          </div>
        </div>

        {/* Right Side: Quick Highlight Card */}
        <div className="lg:w-72 shrink-0 bg-stone-900/90 rounded-xl p-4 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              #1 Ranked Neighbourhood
            </div>
            <div className="text-base font-bold text-white">
              {cheapestTrueItem.neighbourhood.name}
            </div>
            <div className="text-xs text-stone-400 mb-3">
              {cheapestTrueItem.neighbourhood.borough}
            </div>

            <div className="space-y-1.5 text-xs text-stone-300 border-t border-stone-800 pt-2.5">
              <div className="flex justify-between">
                <span className="text-stone-400">Out-of-Pocket Cost:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${cheapestTrueItem.trueMonthlyCost.toLocaleString()}/mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Housing / Rent:</span>
                <span className="font-mono">
                  {cheapestTrueItem.effectiveRent !== null
                    ? `$${cheapestTrueItem.effectiveRent.toLocaleString()}`
                    : 'Unspecified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Travel Expense:</span>
                <span className="font-mono">
                  ${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Monthly Travel Time:</span>
                <span className="font-mono">
                  {cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hrs
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenWhatIf}
            className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test a What-If Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
