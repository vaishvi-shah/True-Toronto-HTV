export type BedroomType = 'bachelor' | '1bed' | '2bed' | '3bed';

export type CommuteMode = 'transit' | 'car' | 'hybrid' | 'walk_bike';

export interface WorkplaceLocation {
  id: string;
  name: string;
  shortName: string;
  district: string;
  address: string;
  description: string;
  parkingCostMonthly: number;
}

export interface NeighbourhoodData {
  id: string;
  name: string;
  borough: 'Old Toronto' | 'Scarborough' | 'North York' | 'Etobicoke' | 'East York' | 'York';
  summary: string;
  rents: {
    bachelor: number;
    '1bed': number;
    '2bed': number;
    '3bed': number;
  };
  utilitiesEstimate: {
    bachelor: number;
    '1bed': number;
    '2bed': number;
    '3bed': number;
  };
  commutes: Record<string, {
    transitMinutes: number;
    transitTransfers: number;
    transitRouteDescription: string;
    carMinutes: number;
    carDistanceKm: number;
  }>;
  floodRisk: {
    level: 'Lower exposure' | 'Moderate exposure' | 'Higher exposure';
    watershed: string;
    details: string;
    source: string;
    sourceDate: string;
  };
  heatRisk: {
    level: 'Lower exposure' | 'Moderate exposure' | 'Higher exposure';
    canopyCoverPercent: number | null; // Can be null for "no data"
    details: string;
    source: string;
    sourceDate: string;
  };
  displacementFlag: {
    level: 'green' | 'yellow' | 'red';
    label: string;
    turnoverGapPercent: number; // CMHC turnover spread %
    details: string;
    source: string;
    sourceDate: string;
  };
  provenance: {
    rentSource: string;
    rentDate: string;
    transitSource: string;
    climateSource: string;
    lastVerified: string;
  };
  missingDataNotes?: string;
}

export interface UserPreferences {
  workplaceId: string;
  annualIncome: number;
  householdMembers: number;
  bedrooms: BedroomType;
  commuteMode: CommuteMode;
  hybridRemoteDaysPerWeek: number; // 0 to 5
  timeValuationRate: number; // standard 0.5 (50% of wage)
  rentInputMode?: 'market_median' | 'custom_fixed';
  customFixedRent?: number; // Custom user rent applied across comparisons
  customNeighbourhoodRents?: Record<string, number>; // Individual neighbourhood overrides
}

export interface CommuteBreakdown {
  transitFares: number;
  fuel: number;
  vehicleOperating: number;
  workplaceParking: number;
  totalMonthlyCommuteCost: number;
  monthlyOneWayTrips: number;
  monthlyCommuteHours: number;
  roundtripDistanceKm: number;
}

export interface CalculatedCost {
  neighbourhood: NeighbourhoodData;
  stickerRent: number;
  originalMarketRent: number;
  isCustomRent: boolean;
  utilitiesCost: number;
  commuteBreakdown: CommuteBreakdown;
  trueMonthlyCost: number; // Rent + Commute + Utilities
  monthlyCommuteHours: number;
  hourlyWage: number;
  timeCostMonthly: number; // Commute hours * wage * timeValuationRate
  totalImpactMonthly: number; // trueMonthlyCost + timeCostMonthly
  carbonFootprintKg: {
    commute: number;
    home: number;
    total: number;
  };
  rentRank: number;
  trueCostRank: number;
  rankShift: number; // positive = better rank under true cost, negative = worse
  incomeSharePercent: number; // (trueMonthlyCost / grossMonthlyIncome) * 100
  isRentBurdened: boolean; // > 30%
  isSeverelyBurdened: boolean; // > 50%
}

export interface PersonaPreset {
  id: string;
  title: string;
  role: string;
  avatar: string;
  story: string;
  income: number;
  workplaceId: string;
  householdMembers: number;
  bedrooms: BedroomType;
  commuteMode: CommuteMode;
  hybridDays: number;
  insight: string;
}

export interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  iconName: string;
  patch: Partial<UserPreferences>;
}
