import { ASSUMPTIONS } from '../../data/assumptions';
import { DisplacementLevel, Neighbourhood, Profile } from '../types';

export interface DisplacementResult {
  level: DisplacementLevel;
  label: string;
  askingVsInPlaceGapPct: number;
  reason: string;
  rentControlNote: string;
}

/**
 * Pure function evaluating displacement pressure.
 * Combines turnover gap, renter share, and rent growth YoY.
 * Indicator only, not an eviction prediction.
 */
export function computeDisplacement(
  profile: Profile,
  neighbourhood: Neighbourhood
): DisplacementResult {
  const bedroom = profile.bedrooms;
  const rentData = neighbourhood.rent[bedroom] || neighbourhood.rent['1bed'];
  const inPlace = rentData.inPlace;
  const asking = rentData.asking;

  const gapPct = inPlace > 0 ? Number((((asking - inPlace) / inPlace) * 100).toFixed(1)) : 0;

  let level: DisplacementLevel = 'green';
  let label = 'Stable Rent Trajectory';
  let reason = '';

  const highThreshold = ASSUMPTIONS.DISPLACEMENT_TURNOVER_GAP_HIGH_PCT.value;
  const modThreshold = ASSUMPTIONS.DISPLACEMENT_TURNOVER_GAP_MOD_PCT.value;

  if (gapPct >= highThreshold || (neighbourhood.renterShare > 0.6 && neighbourhood.rentGrowthYoY > 8.0)) {
    level = 'red';
    label = 'High Turnover & Escalation Risk';
    reason = `New turnover listings rent ${gapPct}% higher than sitting tenants (exceeds ${highThreshold}% threshold), with ${Math.round(
      neighbourhood.renterShare * 100
    )}% renter share. Tenants who lose existing leases face steep rent jumps.`;
  } else if (gapPct >= modThreshold || neighbourhood.rentGrowthYoY > 5.0) {
    level = 'yellow';
    label = 'Moderate Escalation Risk';
    reason = `Turnover gap is ${gapPct}%, with steady upward pressure and ${Math.round(
      neighbourhood.renterShare * 100
    )}% renter households in the area.`;
  } else {
    level = 'green';
    label = 'Stable Rent Trajectory';
    reason = `Turnover gap is ${gapPct}%, below the ${modThreshold}% alert mark, showing relatively consistent tenancy pricing across the neighbourhood.`;
  }

  const rentControlNote = `Ontario Rent Control note: The provincial 2.5% rent increase guideline applies only to units first occupied before ${ASSUMPTIONS.ONTARIO_RENT_CONTROL_CUTOFF_DATE.value}. Newer buildings/condos have no legal cap on annual rent hikes upon lease renewal.`;

  return {
    level,
    label,
    askingVsInPlaceGapPct: gapPct,
    reason,
    rentControlNote,
  };
}
