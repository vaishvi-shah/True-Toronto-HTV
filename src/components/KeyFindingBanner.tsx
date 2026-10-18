import React from 'react';
import {
  Info,
  RotateCw,
  Lightbulb,
  AlertCircle,
  ArrowRight,
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
    isAiGenerated?: boolean;
  } | null;
  aiError?: {
    status: number | string;
    code: string;
    message: string;
  } | null;
  isLoadingAi: boolean;
  onRefreshAi: () => void;
  onOpenWhatIf: () => void;
}

export const KeyFindingBanner: React.FC<KeyFindingBannerProps> = ({
  results,
  currentLivingCost,
  preferences,
  aiExplanation,
  aiError,
  isLoadingAi,
  onRefreshAi,
  onOpenWhatIf,
}) => {
  if (!results.length) return null;

  const cheapestTrueItem = results[0]; // Personalized total includes cash costs and valued commute time.
  const cheapestRentItem = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];

  const rentMode = preferences.rentMode || (preferences.rentInputMode === 'custom_fixed' ? 'user_entered' : 'user_entered');
  const hasRentAmount = cheapestTrueItem.effectiveRent !== null && cheapestTrueItem.effectiveRent > 0;
  const isRentExcluded = rentMode === 'no_rent';
  const isRentUnspecified = cheapestTrueItem.rentStatus === 'unspecified';

  const isDivergent =
    hasRentAmount && cheapestRentItem.neighbourhood.id !== cheapestTrueItem.neighbourhood.id;
  const netMonthlySavings =
    cheapestRentItem.trueMonthlyCost - cheapestTrueItem.trueMonthlyCost;
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
  // Use the personalized summary only when its figures match the local results;
  // otherwise keep the calculation-based summary visible.
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
    ? 'Rent excluded'
    : isRentUnspecified
    ? 'Rent not provided'
    : isDivergent
    ? 'Lowest rent differs from lowest personalized total'
    : 'Rent and personalized total align';

  return (
    <section aria-label="Cost verdict" className="atlas-verdict mb-10" data-reveal="fade-up">
      <div className="atlas-verdict-inner rule-double pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="dateline flex items-center gap-2 text-stone-500">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-800" />
            The result &middot; lowest personalized monthly total
          </p>
          <p className="figures text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          {verdictState}
          </p>
        </div>

        <h2
          className="atlas-verdict-title font-display mt-3 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-tight text-[#1b1712] sm:text-[2.75rem]"
          data-motion-text="words"
        >
          {explanation?.headline ||
            (isRentExcluded
              ? `${cheapestTrueItem.neighbourhood.name} has the lowest personalized total at $${cheapestTrueItem.totalImpactMonthly}/mo, including valued commute time.`
              : isRentUnspecified
              ? `${cheapestTrueItem.neighbourhood.name} has the lowest personalized total at $${cheapestTrueItem.totalImpactMonthly}/mo, with rent excluded from the calculation.`
              : `${cheapestTrueItem.neighbourhood.name} has the lowest personalized monthly total at $${cheapestTrueItem.totalImpactMonthly}/mo, including $${cheapestTrueItem.timeCostMonthly}/mo for commute time.`)}
        </h2>

        {/* Cash expenses and time valuation stay visible as separate amounts. */}
        <div className="atlas-cost-ledger mt-5 flex flex-col gap-5 border-y border-[#1b1712]/20 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <p className="atlas-cost-total figures text-5xl font-bold leading-none tracking-tight text-[#1b1712] sm:text-6xl">
              ${cheapestTrueItem.totalImpactMonthly.toLocaleString()}
              <span className="ml-1 align-baseline text-base font-semibold text-stone-500">/mo total</span>
            </p>
            <div className="pb-1 text-xs leading-relaxed text-stone-600">
              <p className="font-bold text-[#1b1712]">{cheapestTrueItem.neighbourhood.name}</p>
              <p>
                Cash costs $${cheapestTrueItem.trueMonthlyCost.toLocaleString()} · time value ${cheapestTrueItem.timeCostMonthly.toLocaleString()} ·{' '}
                {cheapestTrueItem.commuteBreakdown.monthlyCommuteHours} commute hrs/mo
              </p>
            </div>
          </div>
          <div className="figures flex flex-wrap gap-x-6 gap-y-1 pb-1 text-xs font-semibold text-stone-600">
            <span>Based on your selected travel mode, home size, household, income, and commute-time value</span>
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
                <span>Preparing your personalized summary...</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="skeleton-block h-3 w-3/4" />
                <div className="skeleton-block h-3 w-1/2" />
              </div>
            </div>
          ) : (
            <>
              {(aiError || explanation?.isAiGenerated === false) && (
                <p role="status" className="mb-2 text-xs text-stone-500">
                  Personalized narration is temporarily unavailable. Your comparison and summary below use calculated results.
                </p>
              )}
            <p>
              {explanation?.body ||
                `${cheapestTrueItem.neighbourhood.name} has estimated cash expenses of $${cheapestTrueItem.trueMonthlyCost}/mo plus $${cheapestTrueItem.timeCostMonthly}/mo in commute-time value. The personalized total is $${cheapestTrueItem.totalImpactMonthly}/mo for a ${cheapestTrueItem.monthlyCommuteHours}-hour monthly commute. Choose another sort to compare out-of-pocket expenses alone.`}
              </p>
            </>
          )}
        </div>

        {/* Current-home comparison */}
        {currentLivingCost && (
          <div className="figures mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-1 border-t border-[#1b1712]/15 pt-3 text-xs">
            <span className="dateline text-stone-500">Your current home</span>
            <span>
              Recommended <strong>${cheapestTrueItem.totalImpactMonthly.toLocaleString()}/mo total</strong>
            </span>
            <span>
              Current <strong>${currentLivingCost.totalImpactMonthly.toLocaleString()}/mo total</strong>
            </span>
            {cheapestTrueItem.effectiveRent !== null && (
              <span
                className={
                  currentLivingCost.totalImpactMonthly >= cheapestTrueItem.totalImpactMonthly
                    ? 'font-bold text-emerald-800'
                    : 'font-bold text-amber-800'
                }
              >
                {currentLivingCost.trueMonthlyCost >= cheapestTrueItem.trueMonthlyCost
                  ? `−$${(currentLivingCost.totalImpactMonthly - cheapestTrueItem.totalImpactMonthly).toLocaleString()}/mo by moving`
                  : `+$${(cheapestTrueItem.totalImpactMonthly - currentLivingCost.totalImpactMonthly).toLocaleString()}/mo by moving`}
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
            {explanation?.isAiGenerated ? 'Personalized AI summary' : 'Calculation-based summary'}
          </span>
          <button
            onClick={onRefreshAi}
            disabled={isLoadingAi}
            className="flex cursor-pointer items-center gap-1 font-semibold text-[#1b1712] underline decoration-stone-300 underline-offset-4 hover:decoration-[#1b1712]"
          >
            <RotateCw className={`h-3 w-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
            Refresh summary
          </button>
          <button
            onClick={onOpenWhatIf}
            className="pressable ml-auto flex cursor-pointer items-center gap-1.5 bg-[#1b1712] px-4 py-2 text-xs font-bold text-[#f4f1e8] transition-colors hover:bg-emerald-900"
          >
            Explore a scenario <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
