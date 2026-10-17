import { ASSUMPTIONS } from '../../data/assumptions';
import {
  Breakdown,
  CommuteRecord,
  LineItem,
  Neighbourhood,
  Profile,
  Workplace,
} from '../types';
import { computeCarbon } from './carbon';
import { computeDisplacement } from './displacement';
import { computeRisk } from './risk';
import { computeTransportCost } from './transport';
import { computeUtilities } from './utilities';

/**
 * Pure deterministic function computing the True Cost of Home.
 * Same inputs -> Same outputs.
 * All amounts CAD per month.
 */
export function computeTrueCost(
  profile: Profile,
  neighbourhood: Neighbourhood,
  commute: CommuteRecord,
  workplace: Workplace
): Breakdown {
  // 1. Rent resolution
  const bedroom = profile.bedrooms;
  const baseRentData = neighbourhood.rent[bedroom] || neighbourhood.rent['1bed'];
  const asking = baseRentData.asking;
  const inPlace = baseRentData.inPlace;

  let effectivePaid = asking;
  let isCustom = false;

  if (
    profile.customNeighbourhoodRents &&
    profile.customNeighbourhoodRents[neighbourhood.id] !== undefined &&
    profile.customNeighbourhoodRents[neighbourhood.id] > 0
  ) {
    effectivePaid = profile.customNeighbourhoodRents[neighbourhood.id];
    isCustom = true;
  } else if (profile.customRent !== undefined && profile.customRent !== null && profile.customRent > 0) {
    effectivePaid = profile.customRent;
    isCustom = true;
  }

  // 2. Transport calculation
  const transport = computeTransportCost(profile, commute, workplace.parkingCostMonthly);

  // 3. Utilities calculation
  const utilities = computeUtilities(profile, neighbourhood);

  // 4. Time cost calculation
  // hourlyWage = annualIncome / 2080 (as specified in CLAUDE.md)
  const hourlyWage = Number((profile.annualIncome / ASSUMPTIONS.ANNUAL_WORKING_HOURS.value).toFixed(2));
  const wageFactor = profile.wageFactor ?? ASSUMPTIONS.DEFAULT_WAGE_FACTOR.value;
  const monthlyValuedCost = Math.round(transport.monthlyHours * hourlyWage * wageFactor);

  // 5. True Monthly Cost (direct out-of-pocket: rent + transport + utilities)
  const trueMonthlyCost = effectivePaid + transport.totalMonthlyCost + utilities.totalMonthlyCost;
  const allInWithTime = trueMonthlyCost + monthlyValuedCost;

  // 6. Carbon emissions
  const carbon = computeCarbon(profile, transport);

  // 7. Displacement & Climate Risk
  const displacement = computeDisplacement(profile, neighbourhood);
  const climateRisk = computeRisk(neighbourhood);

  // 8. Line items list for UI visualization and LLM verification
  const lineItems: LineItem[] = [
    {
      category: 'Rent',
      label: isCustom ? 'Custom Listing Rent' : 'Market Asking Rent (CMHC/Urbanation)',
      amount: effectivePaid,
      isOutOfPocket: true,
      notes: isCustom ? `Custom listing (CMHC median was $${asking})` : `In-place median: $${inPlace}`,
    },
    {
      category: 'Transport',
      label:
        transport.mode === 'car'
          ? 'Car (Fuel, Insurance, Maint & Parking)'
          : transport.mode === 'transit'
          ? 'TTC Public Transit Pass/Fares'
          : transport.mode === 'hybrid'
          ? 'Mixed Transit & Driving'
          : 'Bicycle / Walking Commute',
      amount: transport.totalMonthlyCost,
      isOutOfPocket: true,
      notes: `${transport.monthlyHours} hrs/mo (${transport.minutesOneWay} mins each way)`,
    },
    {
      category: 'Utilities',
      label: 'Home Utilities (Hydro, Heat, Water)',
      amount: utilities.totalMonthlyCost,
      isOutOfPocket: true,
      notes: Object.entries(utilities.includedInRent)
        .filter(([_, inc]) => inc)
        .map(([k]) => `${k} included in rent`)
        .join(', ') || 'No utilities included in rent',
    },
    {
      category: 'Time',
      label: 'Value of Travel Time (Shown Separately)',
      amount: monthlyValuedCost,
      isOutOfPocket: false,
      notes: `${transport.monthlyHours}h @ $${hourlyWage}/hr x ${Math.round(wageFactor * 100)}% valuation`,
    },
  ];

  const monthlyGross = Math.max(1, profile.annualIncome / 12);
  const incomeSharePct = Number(((trueMonthlyCost / monthlyGross) * 100).toFixed(1));
  const isRentBurdened = incomeSharePct > 30.0;
  const isSeverelyBurdened = incomeSharePct > 50.0;

  return {
    neighbourhoodId: neighbourhood.id,
    neighbourhoodName: neighbourhood.name,
    cmhcZone: neighbourhood.cmhcZone,
    borough: neighbourhood.borough,
    isNIA: neighbourhood.isNIA,
    rent: {
      asking,
      inPlace,
      effectivePaid,
      isCustom,
    },
    transport,
    utilities,
    timeCost: {
      hoursPerMonth: transport.monthlyHours,
      hourlyWage,
      wageFactor,
      monthlyValuedCost,
    },
    trueMonthlyCost,
    allInWithTime,
    carbon,
    displacement,
    climateRisk: {
      flood: {
        level: climateRisk.flood.level,
        label: climateRisk.flood.label,
        details: climateRisk.flood.details,
      },
      heat: {
        level: climateRisk.heat.level,
        label: climateRisk.heat.label,
        canopyCoverPct: climateRisk.heat.canopyCoverPct,
        details: climateRisk.heat.details,
      },
    },
    lineItems,
    incomeSharePct,
    isRentBurdened,
    isSeverelyBurdened,
    rentRank: 0,
    trueCostRank: 0,
    rankDelta: 0,
  };
}

/**
 * Compute breakdowns for all neighbourhoods and assign comparative ranks.
 */
export function computeAllTrueCosts(
  profile: Profile,
  neighbourhoods: Neighbourhood[],
  commutes: Record<string, CommuteRecord>,
  workplaces: Workplace[]
): Breakdown[] {
  const workplace =
    workplaces.find((w) => w.id === profile.workplaceId) || workplaces[0];

  const results = neighbourhoods.map((n) => {
    const key = `${n.id}_${workplace.id}`;
    const commute = commutes[key] || {
      neighbourhoodId: n.id,
      workplaceId: workplace.id,
      transit: { minutesOneWay: 40, kmOneWay: 14, transfers: 1, routeDescription: 'TTC Line 1/2' },
      car: { minutesOneWay: 28, kmOneWay: 14 },
    };

    return computeTrueCost(profile, n, commute, workplace);
  });

  // Assign Rent Rank
  const byRent = [...results].sort((a, b) => a.rent.effectivePaid - b.rent.effectivePaid);
  byRent.forEach((item, idx) => {
    item.rentRank = idx + 1;
  });

  // Assign True Cost Rank
  const byTrueCost = [...results].sort((a, b) => a.trueMonthlyCost - b.trueMonthlyCost);
  byTrueCost.forEach((item, idx) => {
    item.trueCostRank = idx + 1;
    item.rankDelta = item.rentRank - item.trueCostRank;
  });

  return byTrueCost;
}
