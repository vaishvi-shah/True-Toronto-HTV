import { describe, expect, it } from 'vitest';
import { isExplanationConsistent } from './explanationTrust';
import {
  buildUnifiedFallback,
  calculateNeighbourhoodCosts,
  normalizeToUserPreferences,
} from './unifiedEngine';

// Default analyzed profile: Hospital Row, 1bed, transit, on-site, CMHC medians.
const DEFAULT_PREFS = {
  workplaceId: 'downtown-hospital',
  annualIncome: 55000,
  householdMembers: 1,
  bedrooms: '1bed',
  commuteMode: 'transit',
  hybridRemoteDaysPerWeek: 0,
  timeValuationRate: 0.5,
  rentMode: 'cmhc_benchmark',
} as const;

describe('unified engine parity (server == client)', () => {
  it('computes the client-verified Malvern total ($2,039) through the server path', () => {
    const prefs = normalizeToUserPreferences({ ...DEFAULT_PREFS });
    const results = calculateNeighbourhoodCosts(prefs);
    const malvern = results.find((r) => r.neighbourhood.id === 'malvern-rouge')!;
    // 1750 rent + 150 utilities estimate + 139 transit (42 trips capped below pass)
    expect(malvern.trueMonthlyCost).toBe(2039);
    expect(results[0].neighbourhood.id).toBe('malvern-rouge');
  });

  it('server fallback anchors pass the banner consistency guard', () => {
    const prefs = normalizeToUserPreferences({ ...DEFAULT_PREFS });
    const results = calculateNeighbourhoodCosts(prefs);
    const fallback = buildUnifiedFallback(prefs, results);
    const cheapestRent = [...results].sort((a, b) => a.stickerRent - b.stickerRent)[0];
    const cheapestTrue = results[0];
    expect(
      isExplanationConsistent(
        {
          cheapestTrueNeighbourhood: fallback.cheapestTrueNeighbourhood,
          cheapestRentNeighbourhood: fallback.cheapestRentNeighbourhood,
          cheapestTrueMonthlyCost: fallback.cheapestTrueMonthlyCost,
          cheapestTrueRent: fallback.cheapestTrueRent,
          monthlyDifference: fallback.monthlyDifference,
          timeDifferenceHours: fallback.timeDifferenceHours,
        },
        {
          cheapestTrueName: cheapestTrue.neighbourhood.name,
          cheapestRentName: cheapestRent.neighbourhood.name,
          cheapestTrueMonthlyCost: cheapestTrue.trueMonthlyCost,
          cheapestTrueRent: cheapestTrue.effectiveRent,
          monthlyDifference: Math.abs(cheapestRent.trueMonthlyCost - cheapestTrue.trueMonthlyCost),
          timeDifferenceHours: Math.abs(
            Number((cheapestRent.monthlyCommuteHours - cheapestTrue.monthlyCommuteHours).toFixed(1))
          ),
        }
      )
    ).toBe(true);
  });

  it('maps legacy server workplace IDs and commute-day counts onto calculator inputs', () => {
    const prefs = normalizeToUserPreferences({
      workplaceId: 'hospital-row',
      commuteDaysPerMonth: 21,
      annualIncome: 55000,
      bedrooms: '1bed',
      commuteMode: 'transit',
      rentMode: 'cmhc_benchmark',
    });
    expect(prefs.workplaceId).toBe('downtown-hospital');
    expect(prefs.hybridRemoteDaysPerWeek).toBe(0);
    const results = calculateNeighbourhoodCosts(prefs);
    expect(results[0]?.trueMonthlyCost).toBe(2039);
  });

  it('maps legacy customRent onto user_entered without changing the winner', () => {
    const prefs = normalizeToUserPreferences({
      workplaceId: 'hospital-row',
      commuteDaysPerMonth: 21,
      bedrooms: '1bed',
      commuteMode: 'transit',
      customRent: 1750,
    });
    expect(prefs.rentMode).toBe('user_entered');
    expect(prefs.customFixedRent).toBe(1750);
  });
});
