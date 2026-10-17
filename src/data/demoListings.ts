import { NEIGHBOURHOODS } from './neighbourhoods';
import { TORONTO_ASKING_RENT_BENCHMARKS } from './rentBenchmarks';
import { BedroomType } from '../types';

export interface DemoListing {
  id: string;
  neighbourhoodId: string;
  title: string;
  bedrooms: BedroomType;
  monthlyRent: number;
  benchmarkRent: number;
}

const EXAMPLES: Array<{ bedrooms: BedroomType; factor: number }> = [
  { bedrooms: 'bachelor', factor: 0.92 },
  { bedrooms: '1bed', factor: 0.88 },
  { bedrooms: '1bed', factor: 1.04 },
  { bedrooms: '2bed', factor: 0.91 },
  { bedrooms: '2bed', factor: 1.07 },
  { bedrooms: '3bed', factor: 0.96 },
];

/**
 * Illustrative demo cards only. Their rent levels are generated from the
 * Statistics Canada Toronto CMA averages, which are compiled from real rental
 * platform listings. They do not represent specific available units.
 */
export const DEMO_LISTINGS: DemoListing[] = NEIGHBOURHOODS.flatMap((neighbourhood) =>
  EXAMPLES.map(({ bedrooms, factor }, index) => {
    const benchmarkRent = TORONTO_ASKING_RENT_BENCHMARKS[bedrooms];
    const monthlyRent = Math.round((benchmarkRent * factor) / 25) * 25;

    return {
      id: `demo-${neighbourhood.id}-${index + 1}`,
      neighbourhoodId: neighbourhood.id,
      title: `Demo apartment · ${bedrooms === 'bachelor' ? 'Studio' : bedrooms.replace('bed', ' bedroom')}`,
      bedrooms,
      monthlyRent,
      benchmarkRent,
    };
  })
);
