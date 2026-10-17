/**
 * All named calculation constants with source and asOf metadata.
 * Prime directive: No magic numbers in calculation code.
 */

export interface AssumptionMetadata<T> {
  value: T;
  unit: string;
  source: string;
  asOf: string;
  notes?: string;
}

export const ASSUMPTIONS = {
  // Transport & Commute
  TTC_ADULT_MONTHLY_PASS_CAD: {
    value: 156.0,
    unit: 'CAD / month',
    source: 'Toronto Transit Commission (TTC) Official Fare Guide',
    asOf: 'October 2024',
    notes: 'Adult monthly pass with unlimited travel across TTC subway, streetcar, and bus.',
  },
  PRESTO_ADULT_SINGLE_FARE_CAD: {
    value: 3.3,
    unit: 'CAD / ride',
    source: 'TTC PRESTO Fare Structure',
    asOf: 'October 2024',
    notes: 'Single adult PRESTO e-purse fare (includes 2-hour transfer window).',
  },
  DEFAULT_COMMUTE_DAYS_PER_MONTH: {
    value: 21,
    unit: 'days / month',
    source: 'Standard Canadian working month (5 days/week * 4.2 weeks)',
    asOf: '2024',
  },
  COMMUTE_TRIPS_PER_DAY: {
    value: 2,
    unit: 'trips / day',
    source: 'Standard two-way daily commute',
    asOf: '2024',
  },
  CAR_COST_PER_KM_CAD: {
    value: 0.28,
    unit: 'CAD / km',
    source: 'Canadian Automobile Association (CAA) Driving Costs Study (Fuel + Tires + Maintenance)',
    asOf: '2024',
    notes: 'Variable operating cost per km for a compact/mid-size passenger car in Ontario.',
  },
  CAR_FIXED_MONTHLY_INSURANCE_CAD: {
    value: 220.0,
    unit: 'CAD / month',
    source: 'Financial Services Regulatory Authority of Ontario (FSRA) & CAA GTA benchmark',
    asOf: '2024',
    notes: 'Average comprehensive auto insurance for GTA commuter.',
  },
  CAR_MONTHLY_DEPRECIATION_MAINT_CAD: {
    value: 190.0,
    unit: 'CAD / month',
    source: 'CAA Driving Costs Study 2024',
    asOf: '2024',
    notes: 'Scheduled wear-and-tear, oil, brakes, and ownership baseline.',
  },
  GAS_PRICE_CAD_PER_LITER: {
    value: 1.62,
    unit: 'CAD / liter',
    source: 'Ontario Ministry of Energy Weekly Fuel Price Report (GTA regular unleaded average)',
    asOf: 'September 2024',
  },
  CAR_FUEL_CONSUMPTION_L_PER_100KM: {
    value: 8.8,
    unit: 'liters / 100 km',
    source: 'Natural Resources Canada (NRCan) Fuel Consumption Guide (Urban Passenger Fleet average)',
    asOf: '2024',
  },

  // Time valuation
  ANNUAL_WORKING_HOURS: {
    value: 2080,
    unit: 'hours / year',
    source: 'Standard 40 hours/week * 52 weeks (per CLAUDE.md spec)',
    asOf: '2024',
  },
  DEFAULT_WAGE_FACTOR: {
    value: 0.5,
    unit: 'ratio (0.50 to 1.00)',
    source: 'Transport Canada & Metrolinx Economic Appraisal Guidelines',
    asOf: '2023 Guidelines',
    notes: 'Personal commute time is valued at 50% of gross hourly wage rate. User adjustable.',
  },

  // Utilities
  UTILITIES_BASE_HYDRO_GAS_WATER: {
    value: {
      bachelor: 110.0,
      '1bed': 135.0,
      '2bed': 180.0,
      '3bed': 230.0,
    },
    unit: 'CAD / month',
    source: 'City of Toronto Energy Benchmarking & Ontario Energy Board residential profiles',
    asOf: '2024',
    notes: 'Typical seasonal average combining hydro electricity, natural gas space heating, and municipal water.',
  },
  UTILITY_HYDRO_SHARE: {
    value: 0.42,
    unit: 'share of utility bill',
    source: 'Ontario Energy Board',
    asOf: '2024',
  },
  UTILITY_GAS_HEAT_SHARE: {
    value: 0.43,
    unit: 'share of utility bill',
    source: 'Ontario Energy Board',
    asOf: '2024',
  },
  UTILITY_WATER_SHARE: {
    value: 0.15,
    unit: 'share of utility bill',
    source: 'City of Toronto Water Rates',
    asOf: '2024',
  },

  // Carbon Emissions
  EMISSIONS_CAR_KG_CO2E_PER_KM: {
    value: 0.192,
    unit: 'kg CO2e / km',
    source: 'Environment and Climate Change Canada (ECCC) National Inventory Report',
    asOf: '2024',
  },
  EMISSIONS_TRANSIT_KG_CO2E_PER_KM: {
    value: 0.032,
    unit: 'kg CO2e / passenger-km',
    source: 'TTC Green Fleet Strategy (blended subway, electric streetcar, hybrid/diesel bus)',
    asOf: '2024',
  },
  EMISSIONS_HOME_ENERGY_MONTHLY_KG: {
    value: {
      bachelor: 110,
      '1bed': 145,
      '2bed': 210,
      '3bed': 285,
    },
    unit: 'kg CO2e / month',
    source: 'The Atmospheric Fund (TAF) Greater Toronto Carbon Inventory',
    asOf: '2024',
    notes: 'Ontario electrical grid is clean (hydro/nuclear), so natural gas heating represents the primary home footprint.',
  },

  // Displacement thresholds
  DISPLACEMENT_TURNOVER_GAP_HIGH_PCT: {
    value: 16.0,
    unit: '% asking vs in-place rent spread',
    source: 'CMHC Rental Market Survey (RMS) & ACTO Displacement Watch',
    asOf: 'October 2024',
  },
  DISPLACEMENT_TURNOVER_GAP_MOD_PCT: {
    value: 8.0,
    unit: '% asking vs in-place rent spread',
    source: 'CMHC Rental Market Survey (RMS)',
    asOf: 'October 2024',
  },
  ONTARIO_RENT_CONTROL_CUTOFF_DATE: {
    value: 'November 15, 2018',
    unit: 'calendar date',
    source: 'Ontario Residential Tenancies Act (RTA) Section 6.1',
    asOf: 'Legislation in effect',
    notes: 'Buildings, additions, or basement suites first occupied for residential purposes after Nov 15, 2018 are exempt from Ontario annual rent increase guideline caps.',
  },
  ONTARIO_ANNUAL_RENT_GUIDELINE_CAP_PCT: {
    value: 2.5,
    unit: '% per year',
    source: 'Ontario Landlord and Tenant Board (LTB)',
    asOf: '2024/2025 Guideline',
  },
} as const;
