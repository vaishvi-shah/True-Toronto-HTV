import {
  CALCULATION_ASSUMPTIONS,
  NEIGHBOURHOODS,
  WORKPLACES,
} from '../data/neighbourhoods.js';
import { AREA_ROUTING_COORDINATES, WORKPLACE_ROUTING_COORDINATES } from '../data/routingCoordinates.js';
import type {
  CalculatedCost,
  CommuteBreakdown,
  NeighbourhoodData,
  UserPreferences,
  WorkplaceLocation,
} from '../types';

const MAX_REASONABLE_COMMUTE_MINUTES = 300;

function distanceKm(from: [number, number], to: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const [fromLon, fromLat] = from;
  const [toLon, toLat] = to;
  const latDelta = radians(toLat - fromLat);
  const lonDelta = radians(toLon - fromLon);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateNeighbourhoodCosts(
  preferences: UserPreferences
): CalculatedCost[] {
  const workplace = WORKPLACES.find((w) => w.id === preferences.workplaceId) || WORKPLACES[0];

  const hasIncome =
    typeof preferences.annualIncome === 'number' && preferences.annualIncome > 0;
  const grossMonthlyIncome = hasIncome
    ? preferences.annualIncome! / 12
    : null;
  const hourlyWage = hasIncome
    ? Number(
        (
          preferences.annualIncome! /
          CALCULATION_ASSUMPTIONS.standardWorkHoursPerYear
        ).toFixed(2)
      )
    : null;

  // On-site working days per month after deducting remote hybrid days
  const remoteRatio =
    Math.min(5, Math.max(0, preferences.hybridRemoteDaysPerWeek)) / 5;
  const onSiteWorkdays = Math.round(
    CALCULATION_ASSUMPTIONS.workdaysPerMonth * (1 - remoteRatio)
  );
  const monthlyOneWayTrips =
    onSiteWorkdays * CALCULATION_ASSUMPTIONS.commuteTripsPerDay;

  const rawResults = NEIGHBOURHOODS.map((neighbourhood: NeighbourhoodData) => {
    const originalMarketRent = neighbourhood.rents[preferences.bedrooms];

    const missingInformation: string[] = [];

    // Rent determination
    let effectiveRent: number | null = null;
    let stickerRent = 0;
    let isCustomRent = false;
    let rentStatus: 'user_entered' | 'cmhc_benchmark' | 'no_rent' | 'unspecified' = 'unspecified';
    let rentLabel = 'Rent Unspecified';

    const rentMode = preferences.rentMode || (preferences.rentInputMode === 'custom_fixed' ? 'user_entered' : 'user_entered');

    if (rentMode === 'no_rent') {
      effectiveRent = 0;
      stickerRent = 0;
      rentStatus = 'no_rent';
      rentLabel = 'No Rent (Rent-Free)';
    } else if (
      preferences.customNeighbourhoodRents &&
      preferences.customNeighbourhoodRents[neighbourhood.id] !== undefined &&
      preferences.customNeighbourhoodRents[neighbourhood.id] > 0
    ) {
      effectiveRent = preferences.customNeighbourhoodRents[neighbourhood.id];
      stickerRent = effectiveRent;
      isCustomRent = true;
      rentStatus = 'user_entered';
      rentLabel = 'Your Neighbourhood Rent';
    } else if (rentMode === 'user_entered') {
      if (
        preferences.customFixedRent !== undefined &&
        preferences.customFixedRent !== null &&
        preferences.customFixedRent > 0
      ) {
        effectiveRent = preferences.customFixedRent;
        stickerRent = effectiveRent;
        isCustomRent = true;
        rentStatus = 'user_entered';
        rentLabel = 'Your Defined Rent';
      } else {
        effectiveRent = null;
        stickerRent = 0;
        rentStatus = 'unspecified';
        rentLabel = 'Rent Unspecified';
        missingInformation.push('Rent amount not provided (calculated without rent)');
      }
    } else if (rentMode === 'cmhc_benchmark') {
      effectiveRent = originalMarketRent;
      stickerRent = originalMarketRent;
      rentStatus = 'cmhc_benchmark';
      rentLabel = 'Historical CMHC Zone Average';
    }

    // Utilities determination
    let utilitiesCost: number;
    let isCustomUtilities = false;
    if (
      preferences.customUtilitiesMonthly !== undefined &&
      preferences.customUtilitiesMonthly !== null &&
      preferences.customUtilitiesMonthly >= 0
    ) {
      utilitiesCost = preferences.customUtilitiesMonthly;
      isCustomUtilities = true;
    } else {
      const baseUtilities =
        neighbourhood.utilitiesEstimate[preferences.bedrooms] ||
        neighbourhood.utilitiesEstimate['1bed'];
      utilitiesCost = Math.round(
        baseUtilities * (1 + Math.max(0, preferences.householdMembers - 1) * 0.12)
      );
    }

    // Commute Calculation
    const areaPoint = AREA_ROUTING_COORDINATES[neighbourhood.id];
    const workplacePoint = WORKPLACE_ROUTING_COORDINATES[workplace.id];
    const straightLineKm = areaPoint && workplacePoint ? distanceKm(areaPoint, workplacePoint) : 15;
    const baseCommuteInfo = neighbourhood.commutes[workplace.id] || {
      // When no stored transit itinerary exists, derive a clearly disclosed
      // area-to-work estimate from distance instead of giving every area 40m.
      transitMinutes: Math.max(15, Math.round((straightLineKm * 1.35 / 20) * 60 + 15)),
      transitTransfers: 1,
      transitRouteDescription: 'Generic commute baseline (route data unavailable)',
      carMinutes: 30,
      carDistanceKm: 15,
    };
    const routeEstimate = preferences.routeEstimates?.[neighbourhood.id];
    if (!neighbourhood.commutes[workplace.id]) {
      missingInformation.push('Transit time is an area-to-work distance estimate, not a live itinerary');
    }
    const commuteInfo = {
      ...baseCommuteInfo,
      carMinutes: routeEstimate && Number.isFinite(routeEstimate.carMinutes) && routeEstimate.carMinutes > 0 && routeEstimate.carMinutes <= MAX_REASONABLE_COMMUTE_MINUTES
        ? routeEstimate.carMinutes
        : baseCommuteInfo.carMinutes,
      carDistanceKm: routeEstimate && Number.isFinite(routeEstimate.carDistanceKm) && routeEstimate.carDistanceKm > 0 && routeEstimate.carDistanceKm <= 500
        ? routeEstimate.carDistanceKm
        : baseCommuteInfo.carDistanceKm,
      // TTC schedule times are validated too; fall back to the application's safe default on bad data.
      transitMinutes: Number.isFinite(baseCommuteInfo.transitMinutes) && baseCommuteInfo.transitMinutes > 0 && baseCommuteInfo.transitMinutes <= MAX_REASONABLE_COMMUTE_MINUTES
        ? baseCommuteInfo.transitMinutes
        : 40,
    };

    let commuteBreakdown: CommuteBreakdown;
    let oneWayMinutes = 0;
    let commuteDistanceKmTotal = 0;

    if (preferences.commuteMode === 'transit') {
      oneWayMinutes = commuteInfo.transitMinutes;
      const payPerTrip =
        monthlyOneWayTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare;
      const transitFares = Math.min(
        CALCULATION_ASSUMPTIONS.ttcAdultFareCapTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare,
        payPerTrip
      );
      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      commuteDistanceKmTotal = commuteInfo.carDistanceKm * 2 * onSiteWorkdays;

      commuteBreakdown = {
        transitFares: Math.round(transitFares),
        fuel: 0,
        vehicleOperating: 0,
        workplaceParking: 0,
        totalMonthlyCommuteCost: Math.round(transitFares),
        monthlyOneWayTrips,
        monthlyCommuteHours: Number(monthlyCommuteHours.toFixed(1)),
        roundtripDistanceKm: commuteInfo.carDistanceKm * 2,
      };
    } else if (preferences.commuteMode === 'car') {
      oneWayMinutes = commuteInfo.carMinutes;
      const roundtripKm = commuteInfo.carDistanceKm * 2;
      commuteDistanceKmTotal = roundtripKm * onSiteWorkdays;

      const fuelLiters =
        (commuteDistanceKmTotal / 100) *
        CALCULATION_ASSUMPTIONS.fuelConsumptionLPer100Km;
      const fuelCost =
        fuelLiters * CALCULATION_ASSUMPTIONS.gasPricePerLiterCad;
      const vehicleOperating = CALCULATION_ASSUMPTIONS.carFixedMonthlyCost;
      const workplaceParking = workplace.parkingCostMonthly ?? 0;

      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      const totalCost = fuelCost + vehicleOperating + workplaceParking;

      commuteBreakdown = {
        transitFares: 0,
        fuel: Math.round(fuelCost),
        vehicleOperating: Math.round(vehicleOperating),
        workplaceParking: Math.round(workplaceParking),
        totalMonthlyCommuteCost: Math.round(totalCost),
        monthlyOneWayTrips,
        monthlyCommuteHours: Number(monthlyCommuteHours.toFixed(1)),
        roundtripDistanceKm: roundtripKm,
      };
    } else if (preferences.commuteMode === 'hybrid') {
      oneWayMinutes = Math.round(
        (commuteInfo.transitMinutes + commuteInfo.carMinutes) / 2
      );
      const roundtripKm = commuteInfo.carDistanceKm * 2;
      commuteDistanceKmTotal = roundtripKm * onSiteWorkdays;

      const transitTrips = Math.floor(monthlyOneWayTrips * 0.5);
      const transitFares = Math.min(
        CALCULATION_ASSUMPTIONS.ttcAdultFareCapTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare,
        transitTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare
      );
      const drivingKm = commuteDistanceKmTotal * 0.5;
      const fuelLiters =
        (drivingKm / 100) * CALCULATION_ASSUMPTIONS.fuelConsumptionLPer100Km;
      const fuelCost =
        fuelLiters * CALCULATION_ASSUMPTIONS.gasPricePerLiterCad;
      const vehicleOperating =
        CALCULATION_ASSUMPTIONS.carFixedMonthlyCost * 0.75;
      const workplaceParking = Math.round((workplace.parkingCostMonthly ?? 0) * 0.5);

      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      const totalCost =
        transitFares + fuelCost + vehicleOperating + workplaceParking;

      commuteBreakdown = {
        transitFares: Math.round(transitFares),
        fuel: Math.round(fuelCost),
        vehicleOperating: Math.round(vehicleOperating),
        workplaceParking,
        totalMonthlyCommuteCost: Math.round(totalCost),
        monthlyOneWayTrips,
        monthlyCommuteHours: Number(monthlyCommuteHours.toFixed(1)),
        roundtripDistanceKm: roundtripKm,
      };
    } else {
      // Walking/cycling use each area's distance to the selected workplace.
      // Coordinates are representative points, so include a modest street
      // network detour and disclose this as an estimate in the UI.
      const isCycling = preferences.commuteMode === 'cycling';
      const modeDistanceKm = straightLineKm * 1.25;
      const speedKmh = isCycling ? 15 : 4.8;
      oneWayMinutes = Math.max(1, Math.round((modeDistanceKm / speedKmh) * 60));
      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      commuteDistanceKmTotal = modeDistanceKm * 2 * onSiteWorkdays;
      commuteBreakdown = {
        transitFares: 0,
        fuel: 0,
          vehicleOperating: 0,
        workplaceParking: 0,
          totalMonthlyCommuteCost: 0,
        monthlyOneWayTrips,
        monthlyCommuteHours: Number(monthlyCommuteHours.toFixed(1)),
        roundtripDistanceKm: modeDistanceKm * 2,
      };
    }

    // Time cost: commute hours * user valuation
    let timeCostMonthly = 0;
    const timeValuationType = preferences.timeValuationType || 'percent_of_wage';

    if (timeValuationType === 'zero') {
      timeCostMonthly = 0;
    } else if (timeValuationType === 'custom_rate') {
      const customRate = preferences.customHourlyTimeValuation || 25;
      timeCostMonthly = Math.round(
        commuteBreakdown.monthlyCommuteHours * customRate
      );
    } else if (timeValuationType === 'percent_of_wage') {
      if (hourlyWage !== null) {
        const rate =
          preferences.timeValuationRate ??
          CALCULATION_ASSUMPTIONS.defaultTimeValuationRatio;
        timeCostMonthly = Math.round(
          commuteBreakdown.monthlyCommuteHours * hourlyWage * rate
        );
      } else {
        timeCostMonthly = 0;
        missingInformation.push('Income not provided (time valuation monetized as $0)');
      }
    }

    // True Monthly Cost (Direct Out-of-Pocket: Rent + Utilities + Commute)
    const rentComponent = effectiveRent ?? 0;
    const trueMonthlyCost =
      rentComponent + utilitiesCost + commuteBreakdown.totalMonthlyCommuteCost;

    // Total Economic Impact
    const totalImpactMonthly = trueMonthlyCost + timeCostMonthly;

    // Monthly transportation operational emissions estimate. Driving uses the
    // route distance and assumed fuel consumption; transit uses a published
    // Toronto network-average passenger factor against the available distance
    // proxy. Active modes exclude lifecycle emissions. Home energy is not
    // included because this app has no validated household energy dataset.
    let commuteCarbonKg = 0;
    if (preferences.commuteMode === 'car') {
      commuteCarbonKg =
        commuteDistanceKmTotal * CALCULATION_ASSUMPTIONS.carEmissionsKgCo2ePerKm;
    } else if (preferences.commuteMode === 'transit') {
      commuteCarbonKg =
        commuteDistanceKmTotal *
        CALCULATION_ASSUMPTIONS.transitEmissionsKgCo2ePerKm;
    } else if (preferences.commuteMode === 'hybrid') {
      commuteCarbonKg =
        commuteDistanceKmTotal *
          0.5 *
          CALCULATION_ASSUMPTIONS.carEmissionsKgCo2ePerKm +
        commuteDistanceKmTotal *
          0.5 *
          CALCULATION_ASSUMPTIONS.transitEmissionsKgCo2ePerKm;
    } else {
      commuteCarbonKg = 0;
    }

    const homeCarbonKg = 0;
    const totalCarbonKg = Math.round(commuteCarbonKg);

    let incomeSharePercent: number | null = null;
    let isRentBurdened: boolean | null = null;
    let isSeverelyBurdened: boolean | null = null;

    if (grossMonthlyIncome !== null && grossMonthlyIncome > 0 && effectiveRent !== null) {
      incomeSharePercent = Number(
        ((trueMonthlyCost / grossMonthlyIncome) * 100).toFixed(1)
      );
      isRentBurdened = incomeSharePercent > 30.0;
      isSeverelyBurdened = incomeSharePercent > 50.0;
    }

    return {
      neighbourhood,
      stickerRent,
      originalMarketRent,
      isCustomRent,
      rentStatus,
      rentLabel,
      effectiveRent,
      utilitiesCost,
      isCustomUtilities,
      commuteBreakdown,
      trueMonthlyCost,
      monthlyCommuteHours: commuteBreakdown.monthlyCommuteHours,
      hourlyWage,
      timeCostMonthly,
      totalImpactMonthly,
      carbonFootprintKg: {
        commute: Math.round(commuteCarbonKg),
        home: homeCarbonKg,
        total: totalCarbonKg,
      },
      rentRank: 0,
      trueCostRank: 0,
      impactRank: 0,
      rankShift: 0,
      incomeSharePercent,
      isRentBurdened,
      isSeverelyBurdened,
      missingInformation,
    };
  });

  // Calculate Ranks:
  const byRent = [...rawResults].sort((a, b) => a.stickerRent - b.stickerRent);
  byRent.forEach((item, index) => {
    item.rentRank = index + 1;
  });

  const byTrueCost = [...rawResults].sort(
    (a, b) => a.trueMonthlyCost - b.trueMonthlyCost
  );
  byTrueCost.forEach((item, index) => {
    item.trueCostRank = index + 1;
    item.rankShift = item.rentRank - item.trueCostRank;
  });

  const byImpact = [...rawResults].sort((a, b) => a.totalImpactMonthly - b.totalImpactMonthly);
  byImpact.forEach((item, index) => {
    item.impactRank = index + 1;
  });

  // Recommend the area with the lowest personalized total, which includes
  // user-valued commute time; cash expenses remain a separate displayed figure.
  return byImpact;
}

export function findWorkplace(id: string): WorkplaceLocation {
  return WORKPLACES.find((w) => w.id === id) || WORKPLACES[0];
}
