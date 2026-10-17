import { ASSUMPTIONS } from '../../data/assumptions';
import { Neighbourhood, Profile } from '../types';

export interface UtilitiesResult {
  hydro: number;
  gasHeat: number;
  water: number;
  totalMonthlyCost: number;
  includedInRent: {
    heat: boolean;
    hydro: boolean;
    water: boolean;
  };
}

/**
 * Pure calculation for monthly residential utilities in Toronto.
 * Zeros out any utility included in rent (heat, hydro, water).
 */
export function computeUtilities(
  profile: Profile,
  neighbourhood: Neighbourhood
): UtilitiesResult {
  const baseMonthly =
    ASSUMPTIONS.UTILITIES_BASE_HYDRO_GAS_WATER.value[profile.bedrooms] || 150.0;

  // Scale slightly for household members (extra occupant adds modest water/electricity)
  const householdScale = 1.0 + Math.max(0, profile.householdSize - 1) * 0.12;
  const scaledTotal = baseMonthly * householdScale;

  const rawHydro = scaledTotal * ASSUMPTIONS.UTILITY_HYDRO_SHARE.value;
  const rawGasHeat = scaledTotal * ASSUMPTIONS.UTILITY_GAS_HEAT_SHARE.value;
  const rawWater = scaledTotal * ASSUMPTIONS.UTILITY_WATER_SHARE.value;

  const inc = neighbourhood.utilitiesIncluded;

  const hydro = inc.hydro ? 0 : Math.round(rawHydro);
  const gasHeat = inc.heat ? 0 : Math.round(rawGasHeat);
  const water = inc.water ? 0 : Math.round(rawWater);

  return {
    hydro,
    gasHeat,
    water,
    totalMonthlyCost: hydro + gasHeat + water,
    includedInRent: { ...inc },
  };
}
