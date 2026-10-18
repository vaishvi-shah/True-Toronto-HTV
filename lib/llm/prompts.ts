import { Breakdown, Profile } from '../types';

export const SYSTEM_DIRECTIVE = `You are the plain-language civic explainer for "True Cost of Home (Toronto)", an open civic tool helping Toronto renters understand the real total cost of housing (Rent + Transit/Car + Utilities + Commute Time).

PRIME DIRECTIVES & STRICT CONSTRAINTS:
1. THE CODE CALCULATES, YOU NARRATE. You must NEVER do arithmetic or invent numbers. Every single dollar, hour, or emission figure you state MUST come directly from the pre-calculated Breakdown data provided to you or tool results.
2. If asked about something not in the data provided, you must say: "That is not in the data I have."
3. INDICATORS, NOT PREDICTIONS: Describe exposure and conditions neutrally (e.g. "higher flood exposure", "rents rising faster than the city median"). NEVER describe a neighbourhood as "bad", "dangerous", or "undesirable".
4. NO ADVICE: You do not provide legal, financial, or tenancy advice. Point renters to proper resources like the Federation of Metro Tenants' Associations (FMTA Hotline: 416-921-4070) or the Landlord and Tenant Board (LTB).
5. TONE: Plain Canadian English, empathetic, no jargon, readable at a grade-8 reading level.
6. LEAD WITH THE SURPRISING INSIGHT: Highlight when a neighbourhood with cheaper sticker rent ends up costing more once travel and car costs are counted.
7. Do not claim break-even points or sensitivity results. Only discuss estimate ranges and probabilities when they are included in the provided calculation data.`;

export function buildExplainPrompt(
  profile: Profile,
  breakdowns: Breakdown[],
  sensitivityNarrative?: string,
  monteCarloInsight?: string
): string {
  const topBreakdowns = breakdowns.slice(0, 5).map((b) => ({
    neighbourhood: b.neighbourhoodName,
    borough: b.borough,
    cmhcZone: b.cmhcZone,
    isNIA: b.isNIA,
    askingRent: b.rent.asking,
    inPlaceRent: b.rent.inPlace,
    effectiveRent: b.rent.effectivePaid,
    isCustomRent: b.rent.isCustom,
    transportCost: b.transport.totalMonthlyCost,
    commuteHoursPerMonth: b.transport.monthlyHours,
    commuteMinutesOneWay: b.transport.minutesOneWay,
    utilitiesCost: b.utilities.totalMonthlyCost,
    trueMonthlyCost: b.trueMonthlyCost,
    timeCostValuedSeparately: b.timeCost.monthlyValuedCost,
    allInWithTime: b.allInWithTime,
    carbonMonthlyKg: b.carbon.totalMonthlyKg,
    floodExposure: b.climateRisk.flood.label,
    heatExposure: b.climateRisk.heat.label,
    displacementStatus: b.displacement.label,
    turnoverGapPct: b.displacement.askingVsInPlaceGapPct,
    rentRank: b.rentRank,
    trueCostRank: b.trueCostRank,
    rankDelta: b.rankDelta,
  }));

  const cheapestRent = [...breakdowns].sort((a, b) => a.rent.effectivePaid - b.rent.effectivePaid)[0];
  const cheapestTrue = breakdowns[0];

  const sensitivitySection = sensitivityNarrative
    ? `DETERMINISTIC SENSITIVITY & BREAK-EVEN FLIP POINTS:
- ${sensitivityNarrative}`
    : '';

  const monteCarloSection = monteCarloInsight
    ? `MONTE CARLO UNCERTAINTY SIMULATION (2,000 RUNS):
- ${monteCarloInsight}`
    : '';

  return `Explain the cost of home tradeoffs for this renter profile:
- Annual Income: $${profile.annualIncome.toLocaleString()} CAD (${profile.incomeBasis})
- Household Size: ${profile.householdSize} person(s), Unit: ${profile.bedrooms}
- Commute Mode: ${profile.commuteMode}, Commute Days/mo: ${profile.commuteDaysPerMonth}
- Wage Valuation Factor: ${Math.round(profile.wageFactor * 100)}%

DETERMINISTIC BREAKDOWNS (Computed by pure engine):
Cheapest Sticker Rent Option: ${cheapestRent.neighbourhoodName} (Rent: $${cheapestRent.rent.effectivePaid}/mo, True Cost: $${cheapestRent.trueMonthlyCost}/mo, Travel: ${cheapestRent.transport.monthlyHours}h)
Cheapest True Monthly Cost Option: ${cheapestTrue.neighbourhoodName} (Rent: $${cheapestTrue.rent.effectivePaid}/mo, True Cost: $${cheapestTrue.trueMonthlyCost}/mo, Travel: ${cheapestTrue.transport.monthlyHours}h)

${sensitivitySection}
${monteCarloSection}

TOP NEIGHBOURHOODS SUMMARY:
${JSON.stringify(topBreakdowns, null, 2)}

Respond with JSON matching this structure:
{
  "headline": "A concise 1-sentence finding about rent vs true monthly cost and ranking fragility",
  "body": "2 short paragraphs explaining the trade-offs, commute math, and break-even flip points in plain, empathetic Canadian English. Mention the break-even tipping point (e.g. how many commute days flip the winner). Never invent numbers.",
  "cheapestRentNeighbourhood": "${cheapestRent.neighbourhoodName}",
  "cheapestTrueNeighbourhood": "${cheapestTrue.neighbourhoodName}",
  "monthlyDifference": ${Math.abs(cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost)},
  "timeDifferenceHours": ${Math.abs(Number((cheapestRent.transport.monthlyHours - cheapestTrue.transport.monthlyHours).toFixed(1)))},
  "cheapestTrueMonthlyCost": ${cheapestTrue.trueMonthlyCost},
  "cheapestTrueRent": ${cheapestTrue.rent.effectivePaid},
  "breakEvenNarrative": "${sensitivityNarrative || ''}",
  "monteCarloInsight": "${monteCarloInsight || ''}",
  "tenantRightsNotice": "Standard reminder directing renters to FMTA or LTB"
}`;
}
