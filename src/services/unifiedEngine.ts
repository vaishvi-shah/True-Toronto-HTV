import { SYSTEM_DIRECTIVE } from '../../lib/llm/prompts.js';
import { CALCULATION_ASSUMPTIONS } from '../data/neighbourhoods.js';
import type { CalculatedCost, UserPreferences } from '../types';
import { calculateNeighbourhoodCosts } from './calculator.js';

/**
 * Single source of truth for all server-side explanations.
 *
 * Historical context: the server explain/compare/chat routes used a second
 * engine copy (`lib/engine/computeTrueCost` + `data/*`) while the UI rendered
 * `src/services/calculator` + `src/data/*`. The two disagreed by ~$29 on the
 * default profile (Malvern: $2,010 server vs $2,039 client) because of three
 * small divergences:
 *   1. Utilities: flat `utilitiesEstimate` (client, $150) vs scaled base with
 *      included-in-rent zeroing (server, $115) = -$35.
 *   2. Commute days: `Math.round(5 * 4.3) = 22` (server) vs 21-day baseline
 *      (client) pushed transit $139 -> $145 = +$6.
 *   3. Workplace IDs: `hospital-row` (server) vs `downtown-hospital`
 *      (client) only worked via fallback.
 * Net: -$35 + $6 = -$29.
 *
 * This module normalizes any incoming profile shape onto UserPreferences and
 * runs the SAME client calculator, so server anchors always agree with the
 * banner/panel/cards. The `isExplanationConsistent` guard stays as a safety
 * net but should now always pass.
 */

const WORKPLACE_ALIASES: Record<string, string> = {
  'hospital-row': 'downtown-hospital',
  'downtown-hospital': 'downtown-hospital',
  'financial-district': 'downtown-financial',
  'downtown-financial': 'downtown-financial',
  'pearson-logistics': 'pearson-logistics',
  'north-york-centre': 'north-york-centre',
  'scarborough-centre': 'scarborough-centre',
  'downtown-east': 'downtown-east',
  'high-park-junction': 'high-park-junction',
  'thorncliffe-park': 'thorncliffe-park',
  'parkdale-little-portugal': 'parkdale-little-portugal',
  'danforth-east-york': 'danforth-east-york',
  'weston-mount-dennis': 'weston-mount-dennis',
  'malvern-rouge': 'malvern-rouge',
  'islington-etobicoke': 'islington-etobicoke',
};

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Normalize the loose profile shapes sent by clients (legacy Profile fields
 * like commuteDaysPerMonth/annualIncome/customRent plus current
 * UserPreferences fields) onto a full UserPreferences the calculator accepts.
 */
export function normalizeToUserPreferences(raw: any): UserPreferences {
  const r = raw ?? {};
  const workplaceId =
    WORKPLACE_ALIASES[r.workplaceId] || 'downtown-hospital';

  // Commute days: legacy callers send commuteDaysPerMonth (server convention);
  // the calculator wants hybridRemoteDaysPerWeek. Convert via the 21-day base.
  let hybridRemoteDaysPerWeek = toNumber(r.hybridRemoteDaysPerWeek, 0);
  if (r.hybridRemoteDaysPerWeek === undefined && r.commuteDaysPerMonth !== undefined) {
    const days = toNumber(r.commuteDaysPerMonth, CALCULATION_ASSUMPTIONS.workdaysPerMonth);
    const remoteFraction = Math.max(
      0,
      Math.min(1, 1 - days / CALCULATION_ASSUMPTIONS.workdaysPerMonth)
    );
    hybridRemoteDaysPerWeek = Number((remoteFraction * 5).toFixed(1));
  }
  hybridRemoteDaysPerWeek = Math.min(5, Math.max(0, hybridRemoteDaysPerWeek));

  // Rent: legacy customRent / customFixedRent / no_rent converge here.
  let rentMode = r.rentMode || 'cmhc_benchmark';
  let customFixedRent: number | null = r.customFixedRent ?? null;
  if (r.rentMode === 'no_rent' || r.customRent === 0) {
    rentMode = 'no_rent';
    customFixedRent = null;
  } else if (
    (customFixedRent === null || customFixedRent === undefined) &&
    typeof r.customRent === 'number' &&
    r.customRent > 0
  ) {
    rentMode = 'user_entered';
    customFixedRent = r.customRent;
  }
  if (rentMode !== 'no_rent' && rentMode !== 'cmhc_benchmark' && rentMode !== 'user_entered') {
    rentMode = 'cmhc_benchmark';
  }

  return {
    workplaceId,
    annualIncome: typeof r.annualIncome === 'number' ? r.annualIncome : 55000,
    householdMembers: toNumber(r.householdMembers ?? r.householdSize, 1),
    bedrooms: r.bedrooms || '1bed',
    commuteMode: r.commuteMode || 'transit',
    hybridRemoteDaysPerWeek,
    timeValuationRate: toNumber(r.timeValuationRate ?? r.wageFactor, 0.5),
    timeValuationType: r.timeValuationType || 'percent_of_wage',
    customHourlyTimeValuation: r.customHourlyTimeValuation,
    rentMode,
    customFixedRent,
    customNeighbourhoodRents: r.customNeighbourhoodRents || {},
    customUtilitiesMonthly: r.customUtilitiesMonthly ?? null,
    routeEstimates: r.routeEstimates,
    currentNeighbourhoodId: r.currentNeighbourhoodId,
    currentMonthlyRent: r.currentMonthlyRent ?? null,
    currentUtilitiesMonthly: r.currentUtilitiesMonthly ?? null,
    currentCommuteMode: r.currentCommuteMode,
    currentBedrooms: r.currentBedrooms,
  };
}

export interface UnifiedFallback {
  headline: string;
  body: string;
  cheapestRentNeighbourhood: string;
  cheapestTrueNeighbourhood: string;
  cheapestTrueMonthlyCost: number;
  cheapestTrueRent: number | null;
  monthlyDifference: number;
  timeDifferenceHours: number;
  isAiGenerated: boolean;
}

/**
 * Deterministic fallback copy rendered from the SAME calculator results the
 * UI shows, so headline/panel/card totals always agree.
 */
export function buildUnifiedFallback(
  preferences: UserPreferences,
  results: CalculatedCost[],
): UnifiedFallback {
  const cheapestTrue = results[0];
  const cheapestRent = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];

  const netSavings = cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost;
  const hoursGap = Number(
    (cheapestRent.monthlyCommuteHours - cheapestTrue.monthlyCommuteHours).toFixed(1)
  );

  const isRentFree = preferences.rentMode === 'no_rent';
  const isRentUnspecified = cheapestTrue.rentStatus === 'unspecified';
  const hasRankDiscrepancy = cheapestRent.neighbourhood.id !== cheapestTrue.neighbourhood.id;
  const hasRentAmount =
    cheapestTrue.effectiveRent !== null && cheapestTrue.effectiveRent > 0;

  let headline = '';
  let body = '';

  if (isRentFree) {
    headline = `${cheapestTrue.neighbourhood.name} has the lowest personalized total at $${cheapestTrue.totalImpactMonthly}/mo, with rent excluded.`;
    body = `Cash expenses are $${cheapestTrue.trueMonthlyCost}/mo, plus $${cheapestTrue.timeCostMonthly}/mo in commute-time value across ${cheapestTrue.monthlyCommuteHours} travel hours.`;
  } else if (isRentUnspecified) {
    headline = `${cheapestTrue.neighbourhood.name} has the lowest personalized total at $${cheapestTrue.totalImpactMonthly}/mo, with rent unspecified.`;
    body = `The total includes $${cheapestTrue.trueMonthlyCost}/mo in recorded cash expenses and $${cheapestTrue.timeCostMonthly}/mo in commute-time value. Rent is not included.`;
  } else if (hasRankDiscrepancy && hasRentAmount) {
    headline = `${cheapestTrue.neighbourhood.name} has the lowest personalized total at $${cheapestTrue.totalImpactMonthly}/mo.`;
    body = `The personalized total combines $${cheapestTrue.trueMonthlyCost}/mo in cash expenses with $${cheapestTrue.timeCostMonthly}/mo in commute-time value. ${cheapestRent.neighbourhood.name} has the lowest rent at $${cheapestRent.effectiveRent}/mo; the ranking reflects your selected travel mode, home size, household size, income, and time valuation.`;
  } else {
    headline = `${cheapestTrue.neighbourhood.name} has the lowest personalized total at $${cheapestTrue.totalImpactMonthly}/mo.`;
    body = `The total combines $${cheapestTrue.trueMonthlyCost}/mo in estimated cash expenses with $${cheapestTrue.timeCostMonthly}/mo for commute time. The selected home size, household size, commute, income, and time valuation are reflected in the calculation.`;
  }

  return {
    headline,
    body,
    cheapestRentNeighbourhood: cheapestRent.neighbourhood.name,
    cheapestTrueNeighbourhood: cheapestTrue.neighbourhood.name,
    cheapestTrueMonthlyCost: cheapestTrue.trueMonthlyCost,
    cheapestTrueRent: cheapestTrue.effectiveRent,
    monthlyDifference: Math.abs(netSavings),
    timeDifferenceHours: Math.abs(hoursGap),
    isAiGenerated: false,
  };
}

/**
 * Gemini prompt built from calculator results (never re-does math; the model
 * only narrates pre-computed anchors).
 */
export function buildUnifiedExplainPrompt(
  preferences: UserPreferences,
  results: CalculatedCost[],
  ..._legacyInsights: string[]
): string {
  const cheapestTrue = results[0];
  const cheapestRent = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];
  const top = results.slice(0, 5).map((c) => ({
    neighbourhood: c.neighbourhood.name,
    borough: c.neighbourhood.borough,
    effectiveRent: c.effectiveRent,
    transportCost: c.commuteBreakdown.totalMonthlyCommuteCost,
    commuteHoursPerMonth: c.monthlyCommuteHours,
    utilitiesCost: c.utilitiesCost,
    trueMonthlyCost: c.trueMonthlyCost,
    timeCostValuedSeparately: c.timeCostMonthly,
    allInWithTime: c.totalImpactMonthly,
    carbonMonthlyKg: c.carbonFootprintKg.total,
    rentRank: c.rentRank,
    trueCostRank: c.trueCostRank,
    rankShift: c.rankShift,
  }));


  return `Explain the cost of home tradeoffs for this renter profile:
- Annual Income: $${(preferences.annualIncome ?? 0).toLocaleString()} CAD
- Household Size: ${preferences.householdMembers} person(s), Unit: ${preferences.bedrooms}
- Commute Mode: ${preferences.commuteMode}, Remote days/week: ${preferences.hybridRemoteDaysPerWeek}
- Time valuation: ${Math.round(preferences.timeValuationRate * 100)}% of wage

DETERMINISTIC RESULTS (computed by the single shared calculator):
Lowest rent figure: ${cheapestRent.neighbourhood.name} ($${cheapestRent.effectiveRent}/mo)
Lowest personalized monthly total: ${cheapestTrue.neighbourhood.name} ($${cheapestTrue.totalImpactMonthly}/mo; cash expenses $${cheapestTrue.trueMonthlyCost}/mo plus commute-time value $${cheapestTrue.timeCostMonthly}/mo)

TOP NEIGHBOURHOODS SUMMARY:
${JSON.stringify(top, null, 2)}

Respond with JSON matching this structure:
{
  "headline": "A concise 1-sentence finding about the lowest personalized total including commute-time value",
  "body": "A short explanation distinguishing cash expenses from commute-time value in plain Canadian English. Never invent numbers or claim probabilities.",
  "cheapestTrueNeighbourhood": "${cheapestTrue.neighbourhood.name}",
  "cheapestTrueMonthlyCost": ${cheapestTrue.trueMonthlyCost},
  "cheapestTrueRent": ${cheapestTrue.effectiveRent},
  "cheapestRentNeighbourhood": "${cheapestRent.neighbourhood.name}",
  "monthlyDifference": ${Math.abs(cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost)},
  "timeDifferenceHours": ${Math.abs(Number((cheapestRent.monthlyCommuteHours - cheapestTrue.monthlyCommuteHours).toFixed(1)))}
}`;
}

export { SYSTEM_DIRECTIVE, calculateNeighbourhoodCosts };
