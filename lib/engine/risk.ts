import { Neighbourhood, RiskLevel } from '../types';

export interface ClimateRiskResult {
  flood: {
    level: RiskLevel;
    label: string;
    details: string;
    watershed: string;
    source: string;
    asOf: string;
  };
  heat: {
    level: RiskLevel;
    label: string;
    canopyCoverPct: number | null;
    surfaceTempDiffC: number;
    details: string;
    source: string;
    asOf: string;
  };
}

/**
 * Pure risk assessment module.
 * Never blends flood and heat into a single score.
 * Describes geographic exposure only; never calls an area 'bad' or 'dangerous'.
 */
export function computeRisk(neighbourhood: Neighbourhood): ClimateRiskResult {
  return {
    flood: {
      level: neighbourhood.floodRisk.level,
      label: neighbourhood.floodRisk.label,
      details: neighbourhood.floodRisk.details,
      watershed: neighbourhood.floodRisk.watershed,
      source: neighbourhood.floodRisk.source,
      asOf: neighbourhood.floodRisk.asOf,
    },
    heat: {
      level: neighbourhood.heatRisk.level,
      label: neighbourhood.heatRisk.label,
      canopyCoverPct: neighbourhood.heatRisk.canopyCoverPct,
      surfaceTempDiffC: neighbourhood.heatRisk.surfaceTempDiffC,
      details: neighbourhood.heatRisk.details,
      source: neighbourhood.heatRisk.source,
      asOf: neighbourhood.heatRisk.asOf,
    },
  };
}
