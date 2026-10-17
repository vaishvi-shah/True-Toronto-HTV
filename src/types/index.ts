export type BedroomType = 'bachelor' | '1bed' | '2bed' | '3bed';

export type CommuteMode = 'transit' | 'car' | 'hybrid' | 'walk_bike';

export type RentMode = 'user_entered' | 'cmhc_benchmark' | 'no_rent';

export type ListingPlatform = 'housesigma' | 'zillow' | 'realtor' | 'rentals_ca';

export interface RentalPosting {
  id: string;
  neighbourhoodId: string;
  title: string;
  address: string;
  unit?: string;
  postalCode?: string;
  monthlyRent: number;
  bedrooms: BedroomType;
  bathrooms: number;
  sqft?: number;
  platform: ListingPlatform;
  platformListingId?: string; // e.g. MLS# or HouseSigma ID
  url: string; // Direct link to HouseSigma, Realtor.ca, Zillow, or Rentals.ca
  imageUrl: string;
  features: string[]; // e.g. ['In-Unit Laundry', 'Balcony', 'Hydro Included', 'Parking Spot', 'Pet Friendly']
  rentControlStatus: 'protected_pre_2018' | 'exempt_post_2018' | 'verified_rent_stabilized';
  daysOnMarket: number;
  listedDate: string;
  propertyType: 'Condo Apartment' | 'Purpose-Built Rental' | 'Basement Suite' | 'Townhouse / Multi-Plex';
  walkToSubwayMins?: number;
}

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
  annualIncome: number | null; // User-defined or null if unspecified
  householdMembers: number;
  bedrooms: BedroomType;
  commuteMode: CommuteMode;
  hybridRemoteDaysPerWeek: number; // 0 to 5
  timeValuationRate: number; // e.g. 0.5 (50% of wage)
  timeValuationType?: 'percent_of_wage' | 'custom_rate' | 'zero';
  customHourlyTimeValuation?: number; // e.g. $25/hr
  rentMode: RentMode; // user_entered, cmhc_benchmark, or no_rent
  customFixedRent?: number | null; // User's monthly rent/housing budget if provided
  customNeighbourhoodRents?: Record<string, number>; // Individual neighbourhood overrides
  customUtilitiesMonthly?: number | null; // Optional user-defined utility budget
  // Compatibility fields
  rentInputMode?: 'market_median' | 'custom_fixed';
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
  stickerRent: number; // effective rent used in direct calculation (0 if no rent/unspecified)
  originalMarketRent: number; // CMHC median reference
  isCustomRent: boolean;
  rentStatus: 'user_entered' | 'cmhc_benchmark' | 'no_rent' | 'unspecified';
  rentLabel: string;
  effectiveRent: number | null;
  utilitiesCost: number;
  isCustomUtilities: boolean;
  commuteBreakdown: CommuteBreakdown;
  trueMonthlyCost: number; // Rent (if applicable) + Commute + Utilities
  monthlyCommuteHours: number;
  hourlyWage: number | null; // null if income unspecified
  timeCostMonthly: number; // Commute hours * wage * timeValuationRate (0 if disabled)
  totalImpactMonthly: number; // trueMonthlyCost + timeCostMonthly
  carbonFootprintKg: {
    commute: number;
    home: number;
    total: number;
  };
  rentRank: number;
  trueCostRank: number;
  rankShift: number; // positive = better rank under true cost, negative = worse
  incomeSharePercent: number | null; // null if income unspecified
  isRentBurdened: boolean | null; // > 30%
  isSeverelyBurdened: boolean | null; // > 50%
  missingInformation: string[]; // Explains clearly what data is not provided
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
