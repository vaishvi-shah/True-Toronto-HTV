import {
  CALCULATION_ASSUMPTIONS,
  NEIGHBOURHOODS,
  WORKPLACES,
} from '../data/neighbourhoods';
import {
  CalculatedCost,
  CommuteBreakdown,
  NeighbourhoodData,
  UserPreferences,
  WorkplaceLocation,
} from '../types';

export function calculateNeighbourhoodCosts(
  preferences: UserPreferences
): CalculatedCost[] {
  const workplace =
    WORKPLACES.find((w) => w.id === preferences.workplaceId) || WORKPLACES[0];
  const grossMonthlyIncome = Math.max(1, preferences.annualIncome / 12);
  const hourlyWage =
    preferences.annualIncome / CALCULATION_ASSUMPTIONS.standardWorkHoursPerYear;

  // On-site working days per month after deducting remote hybrid days
  const remoteRatio = Math.min(5, Math.max(0, preferences.hybridRemoteDaysPerWeek)) / 5;
  const onSiteWorkdays = Math.round(CALCULATION_ASSUMPTIONS.workdaysPerMonth * (1 - remoteRatio));
  const monthlyOneWayTrips = onSiteWorkdays * CALCULATION_ASSUMPTIONS.commuteTripsPerDay;

  const rawResults = NEIGHBOURHOODS.map((neighbourhood: NeighbourhoodData) => {
    const originalMarketRent = neighbourhood.rents[preferences.bedrooms] || neighbourhood.rents['1bed'];
    
    // Check if user specified a custom rent for this specific neighbourhood or globally
    let stickerRent = originalMarketRent;
    let isCustomRent = false;

    if (
      preferences.customNeighbourhoodRents &&
      preferences.customNeighbourhoodRents[neighbourhood.id] !== undefined &&
      preferences.customNeighbourhoodRents[neighbourhood.id] > 0
    ) {
      stickerRent = preferences.customNeighbourhoodRents[neighbourhood.id];
      isCustomRent = true;
    } else if (
      preferences.rentInputMode === 'custom_fixed' &&
      preferences.customFixedRent !== undefined &&
      preferences.customFixedRent > 0
    ) {
      stickerRent = preferences.customFixedRent;
      isCustomRent = true;
    }

    const utilitiesCost =
      neighbourhood.utilitiesEstimate[preferences.bedrooms] || neighbourhood.utilitiesEstimate['1bed'];

    const commuteInfo = neighbourhood.commutes[workplace.id] || {
      transitMinutes: 40,
      transitTransfers: 1,
      transitRouteDescription: 'Standard TTC transit route',
      carMinutes: 30,
      carDistanceKm: 15,
    };

    let commuteBreakdown: CommuteBreakdown;
    let oneWayMinutes = 0;
    let commuteDistanceKmTotal = 0;

    if (preferences.commuteMode === 'transit') {
      oneWayMinutes = commuteInfo.transitMinutes;
      // Cap at monthly pass or pay per trip whichever is lower
      const payPerTrip = monthlyOneWayTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare;
      const transitFares = Math.min(CALCULATION_ASSUMPTIONS.ttcAdultMonthlyPass, payPerTrip);
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
      const fuelCost = fuelLiters * CALCULATION_ASSUMPTIONS.gasPricePerLiterCad;
      const vehicleOperating = CALCULATION_ASSUMPTIONS.carFixedMonthlyCost;
      const workplaceParking = workplace.parkingCostMonthly;

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
      // 50% transit / 50% car or transit with occasional car use
      oneWayMinutes = Math.round((commuteInfo.transitMinutes + commuteInfo.carMinutes) / 2);
      const roundtripKm = commuteInfo.carDistanceKm * 2;
      commuteDistanceKmTotal = roundtripKm * onSiteWorkdays;

      const transitTrips = Math.floor(monthlyOneWayTrips * 0.5);
      const transitFares = Math.min(
        CALCULATION_ASSUMPTIONS.ttcAdultMonthlyPass * 0.7,
        transitTrips * CALCULATION_ASSUMPTIONS.prestoAdultSingleFare
      );
      const drivingKm = (commuteDistanceKmTotal * 0.5);
      const fuelLiters = (drivingKm / 100) * CALCULATION_ASSUMPTIONS.fuelConsumptionLPer100Km;
      const fuelCost = fuelLiters * CALCULATION_ASSUMPTIONS.gasPricePerLiterCad;
      const vehicleOperating = CALCULATION_ASSUMPTIONS.carFixedMonthlyCost * 0.75;
      const workplaceParking = Math.round(workplace.parkingCostMonthly * 0.5);

      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      const totalCost = transitFares + fuelCost + vehicleOperating + workplaceParking;

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
      // Walk / Bike
      oneWayMinutes = Math.min(commuteInfo.transitMinutes, 25);
      const monthlyCommuteHours = (oneWayMinutes * monthlyOneWayTrips) / 60;
      commuteDistanceKmTotal = 0;
      commuteBreakdown = {
        transitFares: 0,
        fuel: 0,
        vehicleOperating: 15, // Bike maintenance / Bike Share pass allowance
        workplaceParking: 0,
        totalMonthlyCommuteCost: 15,
        monthlyOneWayTrips,
        monthlyCommuteHours: Number(monthlyCommuteHours.toFixed(1)),
        roundtripDistanceKm: commuteInfo.carDistanceKm * 2,
      };
    }

    // Time cost: commute hours * hourly wage * valuation rate (default 0.5)
    const timeValuationRate = preferences.timeValuationRate ?? CALCULATION_ASSUMPTIONS.defaultTimeValuationRatio;
    const timeCostMonthly = Math.round(
      commuteBreakdown.monthlyCommuteHours * hourlyWage * timeValuationRate
    );

    // True Monthly Cost (Direct Out-of-Pocket: Rent + Utilities + Commute)
    const trueMonthlyCost =
      stickerRent + utilitiesCost + commuteBreakdown.totalMonthlyCommuteCost;

    // Total Economic Impact (True Cost + Separately Quantified Time Cost)
    const totalImpactMonthly = trueMonthlyCost + timeCostMonthly;

    // Carbon emissions calculation
    let commuteCarbonKg = 0;
    if (preferences.commuteMode === 'car') {
      commuteCarbonKg = commuteDistanceKmTotal * CALCULATION_ASSUMPTIONS.carEmissionsKgCo2ePerKm;
    } else if (preferences.commuteMode === 'transit') {
      commuteCarbonKg = commuteDistanceKmTotal * CALCULATION_ASSUMPTIONS.transitEmissionsKgCo2ePerKm;
    } else if (preferences.commuteMode === 'hybrid') {
      commuteCarbonKg =
        (commuteDistanceKmTotal * 0.5 * CALCULATION_ASSUMPTIONS.carEmissionsKgCo2ePerKm) +
        (commuteDistanceKmTotal * 0.5 * CALCULATION_ASSUMPTIONS.transitEmissionsKgCo2ePerKm);
    } else {
      commuteCarbonKg = 2; // Negligible cycling/walking footprint
    }

    const homeCarbonKg =
      CALCULATION_ASSUMPTIONS.homeEnergyEmissionsMonthlyKg[preferences.bedrooms] || 150;
    const totalCarbonKg = Math.round(commuteCarbonKg + homeCarbonKg);

    const incomeSharePercent = Number(((trueMonthlyCost / grossMonthlyIncome) * 100).toFixed(1));
    const isRentBurdened = incomeSharePercent > 30.0;
    const isSeverelyBurdened = incomeSharePercent > 50.0;

    return {
      neighbourhood,
      stickerRent,
      originalMarketRent,
      isCustomRent,
      utilitiesCost,
      commuteBreakdown,
      trueMonthlyCost,
      monthlyCommuteHours: commuteBreakdown.monthlyCommuteHours,
      hourlyWage: Number(hourlyWage.toFixed(2)),
      timeCostMonthly,
      totalImpactMonthly,
      carbonFootprintKg: {
        commute: Math.round(commuteCarbonKg),
        home: homeCarbonKg,
        total: totalCarbonKg,
      },
      rentRank: 0,
      trueCostRank: 0,
      rankShift: 0,
      incomeSharePercent,
      isRentBurdened,
      isSeverelyBurdened,
    };
  });

  // Calculate Ranks:
  // 1. Rent Rank (1 = cheapest sticker rent)
  const byRent = [...rawResults].sort((a, b) => a.stickerRent - b.stickerRent);
  byRent.forEach((item, index) => {
    item.rentRank = index + 1;
  });

  // 2. True Cost Rank (1 = cheapest true monthly cost)
  const byTrueCost = [...rawResults].sort((a, b) => a.trueMonthlyCost - b.trueMonthlyCost);
  byTrueCost.forEach((item, index) => {
    item.trueCostRank = index + 1;
    // Positive shift means neighbourhood is ranked BETTER (more economical) under true cost than under sticker rent
    // e.g. Rent Rank 7 -> True Cost Rank 2: rankShift = 7 - 2 = +5 (Huge positive win!)
    item.rankShift = item.rentRank - item.trueCostRank;
  });

  return byTrueCost;
}

export function findWorkplace(id: string): WorkplaceLocation {
  return WORKPLACES.find((w) => w.id === id) || WORKPLACES[0];
}
