export type BedroomType = 'bachelor' | '1bed' | '2bed' | '3bed';
export type IncomeBasis = 'pretax' | 'aftertax';
export type CommuteMode = 'transit' | 'car' | 'hybrid' | 'walk_bike';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type DisplacementLevel = 'green' | 'yellow' | 'red';

export interface Profile {
  workplaceId: string;
  annualIncome: number;
  incomeBasis: IncomeBasis;
  householdSize: number;
  bedrooms: BedroomType;
  commuteDaysPerMonth: number;
  wageFactor: number; // 0.5 to 1.0 (default 0.5)
  hasCar: boolean;
  commuteMode: CommuteMode;
  customRent?: number | null;
  customNeighbourhoodRents?: Record<string, number>;
}

export interface Workplace {
  id: string;
  name: string;
  shortName: string;
  district: string;
  address: string;
  parkingCostMonthly: number;
  notes: string;
}

export interface Neighbourhood {
  id: string;
  name: string;
  cmhcZone: string;
  borough: string;
  summary: string;
  rent: {
    bachelor: { inPlace: number; asking: number };
    '1bed': { inPlace: number; asking: number };
    '2bed': { inPlace: number; asking: number };
    '3bed': { inPlace: number; asking: number };
  };
  rentGrowthYoY: number; // percentage
  renterShare: number; // 0.0 to 1.0
  rentBurdenShare: number; // % spending >30% of income on shelter
  isNIA: boolean; // City of Toronto Neighbourhood Improvement Area
  floodRisk: {
    level: RiskLevel;
    label: string;
    watershed: string;
    details: string;
    source: string;
    asOf: string;
  };
  heatRisk: {
    level: RiskLevel;
    label: string;
    canopyCoverPct: number | null;
    surfaceTempDiffC: number;
    details: string;
    source: string;
    asOf: string;
  };
  utilitiesIncluded: {
    heat: boolean;
    hydro: boolean;
    water: boolean;
  };
  parkingAvailable: {
    available: boolean;
    monthlyCostCad: number;
  };
  source: string;
  asOf: string;
  missingDataNotes?: string;
}

export interface CommuteRecord {
  neighbourhoodId: string;
  workplaceId: string;
  transit: {
    minutesOneWay: number;
    kmOneWay: number;
    transfers: number;
    routeDescription: string;
  };
  car: {
    minutesOneWay: number;
    kmOneWay: number;
  };
}

export interface LineItem {
  category: 'Rent' | 'Transport' | 'Utilities' | 'Time';
  label: string;
  amount: number;
  isOutOfPocket: boolean;
  notes?: string;
}

export interface Breakdown {
  neighbourhoodId: string;
  neighbourhoodName: string;
  cmhcZone: string;
  borough: string;
  isNIA: boolean;
  rent: {
    asking: number;
    inPlace: number;
    effectivePaid: number;
    isCustom: boolean;
  };
  transport: {
    mode: CommuteMode;
    transitPassOrFares: number;
    fuelCost: number;
    vehicleOperating: number;
    parkingCost: number;
    totalMonthlyCost: number;
    minutesOneWay: number;
    monthlyHours: number;
    monthlyTrips: number;
    kmOneWay: number;
  };
  utilities: {
    hydro: number;
    gasHeat: number;
    water: number;
    totalMonthlyCost: number;
    includedInRent: {
      heat: boolean;
      hydro: boolean;
      water: boolean;
    };
  };
  timeCost: {
    hoursPerMonth: number;
    hourlyWage: number;
    wageFactor: number;
    monthlyValuedCost: number;
  };
  trueMonthlyCost: number; // rent.effectivePaid + transport.totalMonthlyCost + utilities.totalMonthlyCost
  allInWithTime: number; // trueMonthlyCost + timeCost.monthlyValuedCost
  carbon: {
    commuteKg: number;
    homeEnergyKg: number;
    totalMonthlyKg: number;
  };
  displacement: {
    level: DisplacementLevel;
    label: string;
    askingVsInPlaceGapPct: number;
    reason: string;
    rentControlNote: string;
  };
  climateRisk: {
    flood: {
      level: RiskLevel;
      label: string;
      details: string;
    };
    heat: {
      level: RiskLevel;
      label: string;
      canopyCoverPct: number | null;
      details: string;
    };
  };
  lineItems: LineItem[];
  incomeSharePct: number;
  isRentBurdened: boolean;
  isSeverelyBurdened: boolean;
  rentRank: number;
  trueCostRank: number;
  rankDelta: number;
}

export interface Persona {
  id: string;
  title: string;
  role: string;
  avatar: string;
  story: string;
  profile: Profile;
  insight: string;
}
