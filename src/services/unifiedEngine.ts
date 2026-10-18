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
  breakEvenNarrative: string;
  monteCarloInsight: string;
  tenantRightsNotice: string;
  isAiGenerated: boolean;
}

/**
 * Deterministic fallback copy rendered from the SAME calculator results the
 * UI shows, so headline/panel/card totals always agree.
 */
export function buildUnifiedFallback(
  preferences: UserPreferences,
  results: CalculatedCost[],
  sensitivityNarrative = '',
  monteCarloInsight = ''
): UnifiedFallback {
  const cheapestTrue = results[0];
  const cheapestRent = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];

  const netSavings = cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost;
  const rentGap = (cheapestTrue.effectiveRent ?? 0) - (cheapestRent.effectiveRent ?? 0);
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
    headline = `${cheapestTrue.neighbourhood.name} offers the lowest overall expenses with rent excluded ($${cheapestTrue.trueMonthlyCost}/mo).`;
    body = `With housing expenses excluded, your total overhead consists of transportation ($${cheapestTrue.commuteBreakdown.totalMonthlyCommuteCost}/mo) and utilities ($${cheapestTrue.utilitiesCost}/mo), with ${cheapestTrue.monthlyCommuteHours} monthly hours spent commuting.`;
  } else if (isRentUnspecified) {
    headline = `${cheapestTrue.neighbourhood.name} has the lowest transport + utility overhead at $${cheapestTrue.trueMonthlyCost}/mo (rent unspecified).`;
    body = `Because rent was not specified, costs include travel ($${cheapestTrue.commuteBreakdown.totalMonthlyCommuteCost}/mo) and home utilities ($${cheapestTrue.utilitiesCost}/mo). You can enter your specific rent or select CMHC survey medians in the parameters to include housing expenses.`;
  } else if (hasRankDiscrepancy && hasRentAmount) {
    headline = `${cheapestTrue.neighbourhood.name} is $${netSavings}/mo cheaper overall than ${cheapestRent.neighbourhood.name}, despite having higher asking rent.`;
    body = `While ${cheapestRent.neighbourhood.name} has the lowest advertised rent ($${cheapestRent.effectiveRent}/mo), its commute costs ($${cheapestRent.commuteBreakdown.totalMonthlyCommuteCost}/mo) and ${cheapestRent.monthlyCommuteHours} hours of travel push its true monthly cost to $${cheapestRent.trueMonthlyCost}/mo. In comparison, living closer in ${cheapestTrue.neighbourhood.name} costs $${rentGap} more in rent ($${cheapestTrue.effectiveRent}/mo), but lower travel expenses ($${cheapestTrue.commuteBreakdown.totalMonthlyCommuteCost}/mo) bring your total out-of-pocket cost down to $${cheapestTrue.trueMonthlyCost}/mo.`;
  } else {
    headline = `${cheapestTrue.neighbourhood.name} offers both the lowest housing cost ($${cheapestTrue.effectiveRent}) and lowest true monthly cost ($${cheapestTrue.trueMonthlyCost}).`;
    body = `Because your workplace is located conveniently close to ${cheapestTrue.neighbourhood.name}, commute penalties do not overwhelm the housing advantage. However, be sure to weigh climate risks (${cheapestTrue.neighbourhood.floodRisk.level}, ${cheapestTrue.neighbourhood.heatRisk.level}) and tenant displacement vulnerability (${cheapestTrue.neighbourhood.displacementFlag.label}).`;
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
    breakEvenNarrative: sensitivityNarrative || '',
    monteCarloInsight: monteCarloInsight || '',
    tenantRightsNotice:
      "Tenant reminder: Market rents shown represent new vacancies (turnover rates from CMHC). Existing Ontario tenants under rent control are protected by the provincial annual guideline cap (2.5% in 2024/2025). Units first occupied after Nov 15, 2018 have no statutory rent cap upon renewal. For legal advice, consult the Federation of Metro Tenants' Associations (FMTA) or the Landlord and Tenant Board (LTB).",
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
  sensitivityNarrative = '',
  monteCarloInsight = ''
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

  const monthlyDifference = Math.abs(
    cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost
  );
  const timeDifferenceHours = Math.abs(
    Number((cheapestRent.monthlyCommuteHours - cheapestTrue.monthlyCommuteHours).toFixed(1))
  );

  return `Explain the cost of home tradeoffs for this renter profile:
- Annual Income: $${(preferences.annualIncome ?? 0).toLocaleString()} CAD
- Household Size: ${preferences.householdMembers} person(s), Unit: ${preferences.bedrooms}
- Commute Mode: ${preferences.commuteMode}, Remote days/week: ${preferences.hybridRemoteDaysPerWeek}
- Time valuation: ${Math.round(preferences.timeValuationRate * 100)}% of wage

DETERMINISTIC RESULTS (computed by the single shared calculator):
Cheapest Sticker Rent Option: ${cheapestRent.neighbourhood.name} (Rent: $${cheapestRent.effectiveRent}/mo, True Cost: $${cheapestRent.trueMonthlyCost}/mo, Travel: ${cheapestRent.monthlyCommuteHours}h)
Cheapest True Monthly Cost Option: ${cheapestTrue.neighbourhood.name} (Rent: $${cheapestTrue.effectiveRent}/mo, True Cost: $${cheapestTrue.trueMonthlyCost}/mo, Travel: ${cheapestTrue.monthlyCommuteHours}h)

${sensitivityNarrative ? `DETERMINISTIC SENSITIVITY & BREAK-EVEN FLIP POINTS:\n- ${sensitivityNarrative}\n` : ''}${monteCarloInsight ? `MONTE CARLO UNCERTAINTY SIMULATION:\n- ${monteCarloInsight}\n` : ''}
TOP NEIGHBOURHOODS SUMMARY:
${JSON.stringify(top, null, 2)}

Respond with JSON matching this structure:
{
  "headline": "A concise 1-sentence finding about rent vs true monthly cost and ranking fragility",
  "body": "2 short paragraphs explaining the trade-offs, commute math, and break-even flip points in plain, empathetic Canadian English. Never invent numbers.",
  "cheapestRentNeighbourhood": "${cheapestRent.neighbourhood.name}",
  "cheapestTrueNeighbourhood": "${cheapestTrue.neighbourhood.name}",
  "monthlyDifference": ${monthlyDifference},
  "timeDifferenceHours": ${timeDifferenceHours},
  "cheapestTrueMonthlyCost": ${cheapestTrue.trueMonthlyCost},
  "cheapestTrueRent": ${cheapestTrue.effectiveRent},
  "breakEvenNarrative": "${(sensitivityNarrative || '').replace(/"/g, "'")}",
  "monteCarloInsight": "${(monteCarloInsight || '').replace(/"/g, "'")}",
  "tenantRightsNotice": "Standard reminder directing renters to FMTA or LTB"
}`;
}

export { SYSTEM_DIRECTIVE, calculateNeighbourhoodCosts };
