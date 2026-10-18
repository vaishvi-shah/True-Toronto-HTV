import { describe, expect, it } from 'vitest';
import { isExplanationConsistent, TrustedTotals } from './explanationTrust';

// Client-computed winner for the default profile: Malvern / Rouge at $2,039.
const clientTotals: TrustedTotals = {
  cheapestTrueName: 'Malvern / Rouge (Scarborough North)',
  cheapestRentName: 'Malvern / Rouge (Scarborough North)',
  cheapestTrueMonthlyCost: 2039,
  cheapestTrueRent: 1750,
  monthlyDifference: 0,
  timeDifferenceHours: 0,
};

describe('isExplanationConsistent', () => {
  it('trusts a server explanation whose anchors match client results', () => {
    expect(
      isExplanationConsistent(
        {
          headline: 'Malvern / Rouge (Scarborough North) delivers the most economical overall true monthly cost at $2039/mo.',
          body: 'Aligned numbers.',
          cheapestRentNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestTrueNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestTrueMonthlyCost: 2039,
          cheapestTrueRent: 1750,
          monthlyDifference: 0,
          timeDifferenceHours: 0,
          isAiGenerated: false,
        },
        clientTotals
      )
    ).toBe(true);
  });

  it('rejects the observed $2,010 vs $2,039 absolute-total divergence', () => {
    // Regression test for the audited P1: same area names and zero gap on
    // both sides, but the server headline total ($2,010) disagrees with the
    // client panel/card total ($2,039). Names and gaps alone would pass, so
    // the absolute anchors must fail closed.
    expect(
      isExplanationConsistent(
        {
          headline: 'Malvern / Rouge (Scarborough North) offers both the lowest housing cost ($1750) and lowest true monthly cost ($2010).',
          body: 'Divergent numbers.',
          cheapestRentNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestTrueNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestTrueMonthlyCost: 2010,
          cheapestTrueRent: 1750,
          monthlyDifference: 0,
          timeDifferenceHours: 0,
          isAiGenerated: false,
        },
        clientTotals
      )
    ).toBe(false);
  });

  it('rejects a wrong-winner explanation', () => {
    expect(
      isExplanationConsistent(
        {
          headline: 'Stale winner.',
          body: 'Stale.',
          cheapestTrueNeighbourhood: 'Parkdale / Little Portugal',
          cheapestTrueMonthlyCost: 2039,
          monthlyDifference: 0,
          timeDifferenceHours: 0,
        },
        clientTotals
      )
    ).toBe(false);
  });

  it('rejects a gap mismatch', () => {
    expect(
      isExplanationConsistent(
        {
          headline: 'Gap mismatch.',
          body: 'Gap mismatch.',
          cheapestTrueNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestRentNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestTrueMonthlyCost: 2039,
          cheapestTrueRent: 1750,
          monthlyDifference: 65,
          timeDifferenceHours: 0,
        },
        clientTotals
      )
    ).toBe(false);
  });

  it('rejects a missing explanation', () => {
    expect(isExplanationConsistent(null, clientTotals)).toBe(false);
    expect(isExplanationConsistent(undefined, clientTotals)).toBe(false);
  });

  it('passes legacy payloads that omit the absolute anchors when names and gaps agree', () => {
    expect(
      isExplanationConsistent(
        {
          headline: 'Legacy shape.',
          body: 'Legacy shape.',
          cheapestTrueNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          cheapestRentNeighbourhood: 'Malvern / Rouge (Scarborough North)',
          monthlyDifference: 0,
          timeDifferenceHours: 0,
        },
        clientTotals
      )
    ).toBe(true);
  });
});
