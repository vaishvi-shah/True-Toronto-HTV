import { ASSUMPTIONS } from '../../data/assumptions';
import { Profile } from '../types';
import { TransportResult } from './transport';

export interface CarbonResult {
  commuteKg: number;
  homeEnergyKg: number;
  totalMonthlyKg: number;
}

/**
 * Pure calculation for monthly carbon emissions in kg CO2e.
 */
export function computeCarbon(
  profile: Profile,
  transport: TransportResult
): CarbonResult {
  let commuteKg = 0;

  if (profile.commuteMode === 'car') {
    commuteKg = transport.kmMonthly * ASSUMPTIONS.EMISSIONS_CAR_KG_CO2E_PER_KM.value;
  } else if (profile.commuteMode === 'transit') {
    commuteKg = transport.kmMonthly * ASSUMPTIONS.EMISSIONS_TRANSIT_KG_CO2E_PER_KM.value;
  } else if (profile.commuteMode === 'hybrid') {
    commuteKg =
      transport.kmMonthly *
      ((ASSUMPTIONS.EMISSIONS_CAR_KG_CO2E_PER_KM.value +
        ASSUMPTIONS.EMISSIONS_TRANSIT_KG_CO2E_PER_KM.value) /
        2);
  } else {
    commuteKg = 2; // Negligible cycling/walking footprint
  }

  const homeEnergyKg =
    ASSUMPTIONS.EMISSIONS_HOME_ENERGY_MONTHLY_KG.value[profile.bedrooms] || 150;

  return {
    commuteKg: Math.round(commuteKg),
    homeEnergyKg,
    totalMonthlyKg: Math.round(commuteKg + homeEnergyKg),
  };
}
