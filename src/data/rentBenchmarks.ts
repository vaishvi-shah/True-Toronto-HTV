import { BedroomType } from '../types';

/**
 * Statistics Canada Quarterly Rent Statistics, table 46-10-0092-01.
 * Toronto CMA average asking rents for apartments, Q2 2026. These are
 * city-wide quarterly estimates, not neighbourhood-level or live listing prices.
 */
export const TORONTO_ASKING_RENT_BENCHMARKS: Record<BedroomType, number> = {
  bachelor: 1750,
  '1bed': 2090,
  '2bed': 2650,
  '3bed': 3270,
};

export const TORONTO_RENT_BENCHMARK_PERIOD = 'Q2 2026';
export const TORONTO_RENT_BENCHMARK_SOURCE =
  'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201';
