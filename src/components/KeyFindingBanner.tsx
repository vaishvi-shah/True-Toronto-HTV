import React from 'react';
import {
  Info,
  RotateCw,
  Lightbulb,
  AlertCircle,
  ArrowRight,
  Zap,
  Dices,
} from 'lucide-react';
import { CalculatedCost, UserPreferences } from '../types';
import { isExplanationConsistent } from '../services/explanationTrust';

interface KeyFindingBannerProps {
  results: CalculatedCost[];
  currentLivingCost?: CalculatedCost | null;
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
  currentLivingCost,
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

  // Single source of truth: the banner may only reuse server explanation copy
  // when its structured anchors agree with the client-computed winner. The
  // server engine is a separate implementation and can disagree on absolutes
  // (e.g. headline $2,010 vs panel $2,039). Any mismatch falls back to the
  // deterministic client copy below, which renders from results[0].
  const explanation = isExplanationConsistent(aiExplanation, {
    cheapestTrueName: cheapestTrueItem.neighbourhood.name,
    cheapestRentName: cheapestRentItem.neighbourhood.name,
    cheapestTrueMonthlyCost: cheapestTrueItem.trueMonthlyCost,
    cheapestTrueRent: cheapestTrueItem.effectiveRent,
    monthlyDifference: Math.abs(netMonthlySavings),
    timeDifferenceHours: Math.abs(hoursSaved),
  })
    ? aiExplanation
    : null;

  const verdictState = isRentExcluded
    ? 'Commute & utilities focus'
    : isRentUnspecified
    ? 'Rent unspecified — transport + utilities'
    : isDivergent
    ? 'Sticker rent masks real commute expense'
    : 'Rent & transit align';

  return (
    <section aria-label="Cost verdict" className="mb-10" data-reveal="fade-up">
      <div className="rule-double pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="dateline flex items-center gap-2 text-stone-500">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-800" />
            The verdict &middot; true cost reality
          </p>
          <p className="figures text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {verdictState}
          </p>
        </div>

        <h2
          className="font-display mt-3 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-tight text-[#1b1712] sm:text-[2.75rem]"
          data-motion-text="words"
        >
          {explanation?.headline ||
            (isRentExcluded
              ? `${cheapestTrueItem.neighbourhood.name} offers the lowest transit & utility overhead for your trips.`
              : isRentUnspecified
              ? `${cheapestTrueItem.neighbourhood.name} provides the lowest transit + utilities overhead at $${cheapestTrueItem.trueMonthlyCost}/mo.`
              : isDivergent
              ? `${cheapestTrueItem.neighbourhood.name} is $${netMonthlySavings}/mo cheaper overall than ${cheapestRentItem.neighbourhood.name}, despite higher asking rent.`
              : `${cheapestTrueItem.neighbourhood.name} delivers the most economical overall true monthly cost at $${cheapestTrueItem.trueMonthlyCost}/mo.`)}
        </h2>

        {/* Verdict ledger: the winning figure + its composition. Full per-area
            numbers live in the ranked ledger below — this states the finding. */}
        <div className="mt-5 flex flex-col gap-5 border-y border-[#1b1712]/20 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <p className="figures text-5xl font-bold leading-none tracking-tight text-[#1b1712] sm:text-6xl">
              ${cheapestTrueItem.trueMonthlyCost.toLocaleString()}
              <span className="ml-1 align-baseline text-base font-semibold text-stone-500">/mo</span>
            </p>
            <div className="pb-1 text-xs leading-relaxed text-stone-600">
              <p className="font-bold text-[#1b1712]">{cheapestTrueItem.neighbourhood.name}</p>
              <p>
                {cheapestTrueItem.effectiveRent !== null
                  ? `Rent $${cheapestTrueItem.effectiveRent.toLocaleString()} · `
                  : ''}
                Travel ${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost} ·{' '}
                {cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hrs/mo
              </p>
            </div>
          </div>
          <div className="figures flex flex-wrap gap-x-6 gap-y-1 pb-1 text-xs font-semibold text-stone-600">
            {isDivergent && (
              <span>
                saves <strong className="text-emerald-800">${netMonthlySavings}/mo</strong> vs{' '}
                {cheapestRentItem.neighbourhood.name}
              </span>
            )}
            <span>{cheapestTrueItem.monthlyCommuteHours} commute hrs</span>
            <span>
              {cheapestTrueItem.effectiveRent !== null
                ? `$${cheapestTrueItem.effectiveRent.toLocaleString()} rent`
                : 'rent excluded'}
            </span>
          </div>
        </div>

        <div className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-700">
          {isLoadingAi ? (
            <div className="py-1" role="status" aria-busy="true" aria-label="Loading analysis">
              <div className="flex items-center gap-2 text-stone-500">
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Formulating personalized analysis...</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="skeleton-block h-3 w-3/4" />
                <div className="skeleton-block h-3 w-1/2" />
              </div>
            </div>
          ) : (
            <p>
              {explanation?.body ||
                (isRentExcluded
                  ? `With housing expenses excluded, your primary costs are travel ($${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) and utilities ($${cheapestTrueItem.utilitiesCost}/mo). Living in ${cheapestTrueItem.neighbourhood.name} gives you a ${cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hour monthly commute to your destination.`
                  : isRentUnspecified
                  ? `Because no rent was entered, true costs currently tally transit ($${cheapestTrueItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) and utilities ($${cheapestTrueItem.utilitiesCost}/mo). You can enter your specific rent or choose CMHC survey medians in the inputs above to include housing.`
                  : isDivergent
                  ? `${cheapestRentItem.neighbourhood.name} has the lowest advertised rent ($${cheapestRentItem.stickerRent}/mo), but its commute costs ($${cheapestRentItem.commuteBreakdown.totalMonthlyCommuteCost}/mo) push total out-of-pocket expenses to $${cheapestRentItem.trueMonthlyCost}. By contrast, ${cheapestTrueItem.neighbourhood.name} costs $${rentDelta}/mo more in rent but saves $${commuteDelta}/mo on travel, saving you $${netMonthlySavings} net each month.`
                  : `${cheapestTrueItem.neighbourhood.name} minimizes your out-of-pocket overhead ($${cheapestTrueItem.trueMonthlyCost}/mo total) with commute travel of ${cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} hours per month.`)}
            </p>
          )}
        </div>

        {/* Break-even tipping point & Monte Carlo uncertainty */}
        {(explanation?.breakEvenNarrative || explanation?.monteCarloInsight) && (
          <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
            {explanation.breakEvenNarrative && (
              <div className="flex flex-col gap-2 border border-amber-700/40 bg-amber-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-amber-950">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <span>
                    <strong>Break-even flip point:</strong> &ldquo;{explanation.breakEvenNarrative}&rdquo;
                  </span>
                </p>
                {onOpenSensitivity && (
                  <button
                    type="button"
                    onClick={onOpenSensitivity}
                    className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-amber-900 hover:underline"
                  >
                    Explore sensitivity curves <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {explanation.monteCarloInsight && (
              <div className="flex flex-col gap-2 border border-[#1b1712]/25 bg-white/60 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-stone-700">
                  <Dices className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
                  <span>
                    <strong className="text-[#1b1712]">Monte Carlo uncertainty:</strong>{' '}
                    {explanation.monteCarloInsight}
                  </span>
                </p>
                {onOpenMonteCarlo && (
                  <button
                    type="button"
                    onClick={onOpenMonteCarlo}
                    className="pressable flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-[#1b1712] hover:underline"
                  >
                    View uncertainty bands <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current-home comparison — compact ledger strip, not a second panel */}
        {currentLivingCost && (
          <div className="figures mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-t border-[#1b1712]/15 pt-3 text-xs">
            <span className="dateline text-stone-500">Your current home</span>
            <span>
              Recommended <strong>${cheapestTrueItem.trueMonthlyCost.toLocaleString()}/mo</strong>
            </span>
            <span>
              Current <strong>${currentLivingCost.trueMonthlyCost.toLocaleString()}/mo</strong>
            </span>
            {cheapestTrueItem.effectiveRent !== null && (
              <span
                className={
                  currentLivingCost.trueMonthlyCost >= cheapestTrueItem.trueMonthlyCost
                    ? 'font-bold text-emerald-800'
                    : 'font-bold text-amber-800'
                }
              >
                {currentLivingCost.trueMonthlyCost >= cheapestTrueItem.trueMonthlyCost
                  ? `−$${(currentLivingCost.trueMonthlyCost - cheapestTrueItem.trueMonthlyCost).toLocaleString()}/mo by moving`
                  : `+$${(cheapestTrueItem.trueMonthlyCost - currentLivingCost.trueMonthlyCost).toLocaleString()}/mo by moving`}
              </span>
            )}
            <span className="text-stone-500">
              {cheapestTrueItem.monthlyCommuteHours} vs {currentLivingCost.monthlyCommuteHours} hrs/mo
              · {currentLivingCost.neighbourhood.name}
            </span>
          </div>
        )}

        {cheapestTrueItem.missingInformation.length > 0 && (
          <p className="mt-3 flex items-center gap-2 text-[11px] text-amber-800">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Note:</strong> {cheapestTrueItem.missingInformation.join(' • ')}.
            </span>
          </p>
        )}

        {/* Provenance + actions */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            {explanation?.isAiGenerated
              ? 'Narrated by Gemini 3.8 Flash'
              : 'Deterministic civic engine · instant calculation'}
          </span>
          <button
            onClick={onRefreshAi}
            disabled={isLoadingAi}
            className="flex cursor-pointer items-center gap-1 font-semibold text-[#1b1712] underline decoration-stone-300 underline-offset-4 hover:decoration-[#1b1712]"
          >
            <RotateCw className={`h-3 w-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
            Re-analyze
          </button>
          <button
            onClick={onOpenWhatIf}
            className="pressable ml-auto flex cursor-pointer items-center gap-1.5 bg-[#1b1712] px-4 py-2 text-xs font-bold text-[#f4f1e8] transition-colors hover:bg-emerald-900"
          >
            Test a what-if scenario <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
