import { CalculatedCost, CommuteMode, UserPreferences } from '../types';
import { calculateNeighbourhoodCosts } from './calculator';
import { NEIGHBOURHOODS } from '../data/neighbourhoods';

export interface CrossoverPoint {
  parameter: 'commuteDays' | 'wageFactor' | 'rentSpread';
  parameterLabel: string;
  currentWinnerId: string;
  currentWinnerName: string;
  challengerId: string;
  challengerName: string;
  flipValue: number;
  formattedFlipValue: string;
  currentValue: number;
  narrative: string;
  fragility: 'fragile' | 'moderate' | 'robust';
  costAtCrossover: number;
  direction: 'higher' | 'lower';
}

export interface SensitivitySweepPoint {
  parameterValue: number;
  label: string;
  costs: Record<string, number>; // neighbourhoodId -> trueMonthlyCost or totalImpact
  winnerId: string;
}

export interface SensitivityAnalysisResult {
  commuteDaysSweep: SensitivitySweepPoint[];
  wageFactorSweep: SensitivitySweepPoint[];
  crossovers: CrossoverPoint[];
  primaryBreakEvenNarrative: string;
  isRankingFragile: boolean;
}

/**
 * Computes deterministic sensitivity and break-even analysis by sweeping key parameters:
 * 1. Commute days per month (0 to 22 days)
 * 2. Wage factor / time valuation rate (0.0 to 1.2)
 *
 * Finds the exact crossover points where neighbourhood rankings flip.
 */
export function analyzeSensitivity(preferences: UserPreferences): SensitivityAnalysisResult {
  const baseResults = calculateNeighbourhoodCosts(preferences);
  if (baseResults.length < 2) {
    return {
      commuteDaysSweep: [],
      wageFactorSweep: [],
      crossovers: [],
      primaryBreakEvenNarrative: 'Insufficient data for sensitivity sweep.',
      isRankingFragile: false,
    };
  }

  const currentWinner = baseResults[0];

  // 1. Sweep Commute Days per month (0 to 22 on-site days)
  const commuteDaysSweep: SensitivitySweepPoint[] = [];
  const daysSteps = [0, 2, 4, 6, 8, 10, 11, 12, 14, 16, 18, 20, 22];

  for (const days of daysSteps) {
    // Convert monthly on-site days to remote days per week (21 workdays/month baseline)
    const remoteFraction = Math.max(0, Math.min(1, 1 - days / 21));
    const remoteDaysPerWeek = Number((remoteFraction * 5).toFixed(1));

    const tempPrefs: UserPreferences = {
      ...preferences,
      hybridRemoteDaysPerWeek: remoteDaysPerWeek,
    };

    const costs = calculateNeighbourhoodCosts(tempPrefs);
    const costsMap: Record<string, number> = {};
    for (const c of costs) {
      costsMap[c.neighbourhood.id] = c.trueMonthlyCost;
    }

    commuteDaysSweep.push({
      parameterValue: days,
      label: `${days} d/mo`,
      costs: costsMap,
      winnerId: costs[0].neighbourhood.id,
    });
  }

  // 2. Sweep Wage Factor (0.0 to 1.2 in increments of 0.1)
  const wageFactorSweep: SensitivitySweepPoint[] = [];
  const wageSteps = [0.0, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0, 1.2];

  for (const factor of wageSteps) {
    const tempPrefs: UserPreferences = {
      ...preferences,
      timeValuationType: 'percent_of_wage',
      timeValuationRate: factor,
    };

    const costs = calculateNeighbourhoodCosts(tempPrefs);
    const costsMap: Record<string, number> = {};
    for (const c of costs) {
      costsMap[c.neighbourhood.id] = c.totalImpactMonthly;
    }

    wageFactorSweep.push({
      parameterValue: factor,
      label: `${Math.round(factor * 100)}%`,
      costs: costsMap,
      winnerId: costs[0].neighbourhood.id,
    });
  }

  // 3. Find exact Crossover Points
  const crossovers: CrossoverPoint[] = [];

  // Current on-site commute days
  const currentRemoteFraction = Math.min(5, Math.max(0, preferences.hybridRemoteDaysPerWeek)) / 5;
  const currentOnSiteDays = Math.round(21 * (1 - currentRemoteFraction));
  const currentWageFactor = preferences.timeValuationRate ?? 0.5;

  // Compare current winner with contenders
  const contenders = baseResults.slice(1, 5);

  for (const contender of contenders) {
    // Total commute cost + time value per day for each candidate
    const winnerHoursPerDay = (currentWinner.neighbourhood.commutes[preferences.workplaceId]?.transitMinutes || 35) * 2 / 60;
    const contenderHoursPerDay = (contender.neighbourhood.commutes[preferences.workplaceId]?.transitMinutes || 35) * 2 / 60;

    const hourlyWage = currentWinner.hourlyWage || 28;
    const wageRate = currentWageFactor > 0 ? currentWageFactor : 0.5;

    // Daily commute penalty (fare + valued travel time)
    let winnerCommutePerDay = 6.60 + (winnerHoursPerDay * hourlyWage * wageRate);
    let contenderCommutePerDay = 6.60 + (contenderHoursPerDay * hourlyWage * wageRate);

    if (preferences.commuteMode === 'car' || preferences.commuteMode === 'hybrid') {
      const winnerCommute = currentWinner.neighbourhood.commutes[preferences.workplaceId];
      const contenderCommute = contender.neighbourhood.commutes[preferences.workplaceId];
      const fuelWinner = ((winnerCommute?.carDistanceKm || 15) * 2 / 100) * 8.8 * 1.62;
      const fuelContender = ((contenderCommute?.carDistanceKm || 15) * 2 / 100) * 8.8 * 1.62;
      winnerCommutePerDay = fuelWinner + 15 + (winnerHoursPerDay * hourlyWage * wageRate);
      contenderCommutePerDay = fuelContender + 15 + (contenderHoursPerDay * hourlyWage * wageRate);
    }

    const fixedWinner = currentWinner.stickerRent + currentWinner.utilitiesCost;
    const fixedContender = contender.stickerRent + contender.utilitiesCost;
    const fixedDiff = fixedContender - fixedWinner;

    const commuteDeltaPerDay = winnerCommutePerDay - contenderCommutePerDay;

    if (Math.abs(commuteDeltaPerDay) > 0.5) {
      const breakEvenDays = Number((fixedDiff / commuteDeltaPerDay).toFixed(1));

      if (breakEvenDays >= 1 && breakEvenDays <= 22) {
        const winnerShortName = currentWinner.neighbourhood.name.split(' (')[0];
        const contenderShortName = contender.neighbourhood.name.split(' (')[0];

        const distance = Math.abs(currentOnSiteDays - breakEvenDays);
        const fragility = distance <= 3 ? 'fragile' : distance <= 7 ? 'moderate' : 'robust';

        // Check who wins above and who wins below
        const costWinnerAt0 = fixedWinner;
        const costContenderAt0 = fixedContender;
        const winnerBelow = costWinnerAt0 < costContenderAt0 ? winnerShortName : contenderShortName;
        const winnerAbove = winnerBelow === winnerShortName ? contenderShortName : winnerShortName;

        let narrative = '';
        if (currentOnSiteDays >= breakEvenDays) {
          narrative = `${winnerShortName} beats ${contenderShortName} unless your commute days drop below ${Math.round(breakEvenDays)}/month`;
        } else {
          narrative = `${winnerShortName} stays cheaper unless your commute days rise above ${Math.round(breakEvenDays)}/month (where ${contenderShortName} takes over)`;
        }

        crossovers.push({
          parameter: 'commuteDays',
          parameterLabel: 'Commute Frequency',
          currentWinnerId: currentWinner.neighbourhood.id,
          currentWinnerName: winnerShortName,
          challengerId: contender.neighbourhood.id,
          challengerName: contenderShortName,
          flipValue: breakEvenDays,
          formattedFlipValue: `${Math.round(breakEvenDays)} days/mo`,
          currentValue: currentOnSiteDays,
          fragility,
          costAtCrossover: Math.round(fixedWinner + (winnerCommutePerDay * breakEvenDays)),
          direction: currentOnSiteDays > breakEvenDays ? 'lower' : 'higher',
          narrative,
        });
      }
    }
  }

  // B. Wage Factor Crossover (Time Valuation)
  if (currentWinner.hourlyWage && currentWinner.hourlyWage > 0) {
    for (const contender of contenders) {
      const trueCostDiff = contender.trueMonthlyCost - currentWinner.trueMonthlyCost;
      const hourlyWage = currentWinner.hourlyWage;
      const hoursDiff = currentWinner.monthlyCommuteHours - contender.monthlyCommuteHours;

      // When hoursDiff != 0: w * hourlyWage * hoursDiff = trueCostDiff
      if (Math.abs(hoursDiff) > 1.0) {
        const breakEvenWageFactor = Number((trueCostDiff / (hourlyWage * hoursDiff)).toFixed(2));

        if (breakEvenWageFactor >= 0.05 && breakEvenWageFactor <= 1.4) {
          const distance = Math.abs(currentWageFactor - breakEvenWageFactor);
          const fragility = distance <= 0.2 ? 'fragile' : distance <= 0.4 ? 'moderate' : 'robust';
          const winnerShortName = currentWinner.neighbourhood.name.split(' (')[0];
          const contenderShortName = contender.neighbourhood.name.split(' (')[0];

          crossovers.push({
            parameter: 'wageFactor',
            parameterLabel: 'Time Valuation Rate',
            currentWinnerId: currentWinner.neighbourhood.id,
            currentWinnerName: winnerShortName,
            challengerId: contender.neighbourhood.id,
            challengerName: contenderShortName,
            flipValue: breakEvenWageFactor,
            formattedFlipValue: `${Math.round(breakEvenWageFactor * 100)}% of wage`,
            currentValue: currentWageFactor,
            fragility,
            costAtCrossover: Math.round(currentWinner.trueMonthlyCost + (currentWinner.monthlyCommuteHours * hourlyWage * breakEvenWageFactor)),
            direction: currentWageFactor > breakEvenWageFactor ? 'lower' : 'higher',
            narrative: `The winner flips from ${winnerShortName} to ${contenderShortName} if your time valuation factor goes above ${breakEvenWageFactor} (${Math.round(breakEvenWageFactor * 100)}%)`,
          });
        }
      }
    }
  }

  // Deduplicate and prioritize crossovers
  crossovers.sort((a, b) => {
    const fragOrder = { fragile: 0, moderate: 1, robust: 2 };
    return fragOrder[a.fragility] - fragOrder[b.fragility];
  });

  const primaryBreakEvenNarrative =
    crossovers.length > 0
      ? crossovers[0].narrative
      : `${currentWinner.neighbourhood.name.split(' (')[0]} maintains its #1 rank across all tested commute frequencies.`;

  const isRankingFragile = crossovers.some((c) => c.fragility === 'fragile');

  return {
    commuteDaysSweep,
    wageFactorSweep,
    crossovers,
    primaryBreakEvenNarrative,
    isRankingFragile,
  };
}
