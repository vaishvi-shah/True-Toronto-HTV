import { describe, expect, it } from 'vitest';
import { calculateNeighbourhoodCosts } from './calculator';
import type { UserPreferences } from '../types';

const profile: UserPreferences = {
  workplaceId: 'downtown-hospital',
  annualIncome: 55_000,
  householdMembers: 1,
  bedrooms: '1bed',
  commuteMode: 'transit',
  hybridRemoteDaysPerWeek: 0,
  timeValuationRate: 0.5,
  rentMode: 'cmhc_benchmark',
};

describe('monthly comparison inputs', () => {
  it('updates historical rent with bedroom size and neighbourhood', () => {
    const oneBedroom = calculateNeighbourhoodCosts(profile).find(
      (item) => item.neighbourhood.id === 'malvern-rouge',
    )!;
    const twoBedroom = calculateNeighbourhoodCosts({ ...profile, bedrooms: '2bed' }).find(
      (item) => item.neighbourhood.id === 'malvern-rouge',
    )!;
    const otherNeighbourhood = calculateNeighbourhoodCosts(profile).find(
      (item) => item.neighbourhood.id === 'downtown-east',
    )!;

    expect(oneBedroom.effectiveRent).not.toBe(twoBedroom.effectiveRent);
    expect(oneBedroom.effectiveRent).not.toBe(otherNeighbourhood.effectiveRent);
  });

  it('uses current TTC adult fare and responds to on-site frequency', () => {
    const fullTime = calculateNeighbourhoodCosts(profile).find(
      (item) => item.neighbourhood.id === 'malvern-rouge',
    )!;
    const hybrid = calculateNeighbourhoodCosts({ ...profile, hybridRemoteDaysPerWeek: 2 }).find(
      (item) => item.neighbourhood.id === 'malvern-rouge',
    )!;

    expect(fullTime.commuteBreakdown.totalMonthlyCommuteCost).toBe(139);
    expect(hybrid.commuteBreakdown.totalMonthlyCommuteCost).toBe(86);
  });

  it('uses ORS distance for driving costs and estimated vehicle emissions', () => {
    const result = calculateNeighbourhoodCosts({
      ...profile,
      commuteMode: 'car',
      routeEstimates: { 'malvern-rouge': { carDistanceKm: 10, carMinutes: 20 } },
    }).find((item) => item.neighbourhood.id === 'malvern-rouge')!;

    expect(result.commuteBreakdown.totalMonthlyCommuteCost).toBe(750);
    expect(result.carbonFootprintKg.total).toBe(85);
    expect(result.carbonFootprintKg.home).toBe(0);
  });

  it('reports zero direct active-travel expense and flags missing commute routes', () => {
    const result = calculateNeighbourhoodCosts({
      ...profile,
      workplaceId: 'thorncliffe-park',
      commuteMode: 'walk_bike',
    }).find((item) => item.neighbourhood.id === 'north-york-centre')!;

    expect(result.commuteBreakdown.totalMonthlyCommuteCost).toBe(0);
    expect(result.carbonFootprintKg.total).toBe(0);
    expect(result.missingInformation.join(' ')).toContain('generic baseline');
  });
});
