import { ASSUMPTIONS } from '../../data/assumptions';
import { CommuteRecord, Profile } from '../types';

export interface TransportResult {
  mode: Profile['commuteMode'];
  transitPassOrFares: number;
  fuelCost: number;
  vehicleOperating: number;
  parkingCost: number;
  totalMonthlyCost: number;
  minutesOneWay: number;
  monthlyHours: number;
  monthlyTrips: number;
  kmOneWay: number;
  kmMonthly: number;
}

/**
 * Pure calculation function for commute transportation costs and travel time.
 * Same inputs -> Same outputs. CAD per month.
 */
export function computeTransportCost(
  profile: Profile,
  commute: CommuteRecord,
  workplaceParkingCad: number
): TransportResult {
  const daysPerMonth = Math.max(0, profile.commuteDaysPerMonth);
  const monthlyTrips = daysPerMonth * ASSUMPTIONS.COMMUTE_TRIPS_PER_DAY.value;

  if (profile.commuteMode === 'transit') {
    const minutesOneWay = commute.transit.minutesOneWay;
    const kmOneWay = commute.transit.kmOneWay;
    const monthlyHours = Number(((minutesOneWay * monthlyTrips) / 60).toFixed(1));
    const kmMonthly = kmOneWay * monthlyTrips;

    // Fares: minimum of unlimited monthly pass or pay-per-trip PRESTO single fare
    const payPerTrip = monthlyTrips * ASSUMPTIONS.PRESTO_ADULT_SINGLE_FARE_CAD.value;
    const transitPassOrFares = Math.min(
      ASSUMPTIONS.TTC_ADULT_MONTHLY_PASS_CAD.value,
      payPerTrip
    );

    return {
      mode: 'transit',
      transitPassOrFares: Math.round(transitPassOrFares),
      fuelCost: 0,
      vehicleOperating: 0,
      parkingCost: 0,
      totalMonthlyCost: Math.round(transitPassOrFares),
      minutesOneWay,
      monthlyHours,
      monthlyTrips,
      kmOneWay,
      kmMonthly,
    };
  }

  if (profile.commuteMode === 'car') {
    const minutesOneWay = commute.car.minutesOneWay;
    const kmOneWay = commute.car.kmOneWay;
    const monthlyHours = Number(((minutesOneWay * monthlyTrips) / 60).toFixed(1));
    const kmMonthly = kmOneWay * monthlyTrips;

    // Car: kmPerMonth * perKmOperatingCost + insurance + maintenance/depreciation + destination parking
    const variableFuelTiresCost = kmMonthly * ASSUMPTIONS.CAR_COST_PER_KM_CAD.value;
    const fixedInsurance = ASSUMPTIONS.CAR_FIXED_MONTHLY_INSURANCE_CAD.value;
    const fixedDeprecMaint = ASSUMPTIONS.CAR_MONTHLY_DEPRECIATION_MAINT_CAD.value;
    const parkingCost = workplaceParkingCad;

    const totalMonthlyCost =
      variableFuelTiresCost + fixedInsurance + fixedDeprecMaint + parkingCost;

    return {
      mode: 'car',
      transitPassOrFares: 0,
      fuelCost: Math.round(variableFuelTiresCost),
      vehicleOperating: Math.round(fixedInsurance + fixedDeprecMaint),
      parkingCost: Math.round(parkingCost),
      totalMonthlyCost: Math.round(totalMonthlyCost),
      minutesOneWay,
      monthlyHours,
      monthlyTrips,
      kmOneWay,
      kmMonthly,
    };
  }

  if (profile.commuteMode === 'hybrid') {
    // 50% transit / 50% vehicle commute trips
    const minutesOneWay = Math.round(
      (commute.transit.minutesOneWay + commute.car.minutesOneWay) / 2
    );
    const kmOneWay = commute.car.kmOneWay;
    const monthlyHours = Number(((minutesOneWay * monthlyTrips) / 60).toFixed(1));
    const kmMonthly = kmOneWay * monthlyTrips * 0.5;

    const transitTrips = Math.floor(monthlyTrips * 0.5);
    const transitPassOrFares = Math.min(
      ASSUMPTIONS.TTC_ADULT_MONTHLY_PASS_CAD.value * 0.7,
      transitTrips * ASSUMPTIONS.PRESTO_ADULT_SINGLE_FARE_CAD.value
    );
    const variableFuel = kmMonthly * ASSUMPTIONS.CAR_COST_PER_KM_CAD.value;
    const fixedVehicle =
      (ASSUMPTIONS.CAR_FIXED_MONTHLY_INSURANCE_CAD.value +
        ASSUMPTIONS.CAR_MONTHLY_DEPRECIATION_MAINT_CAD.value) *
      0.75;
    const parkingCost = Math.round(workplaceParkingCad * 0.5);

    const totalMonthlyCost =
      transitPassOrFares + variableFuel + fixedVehicle + parkingCost;

    return {
      mode: 'hybrid',
      transitPassOrFares: Math.round(transitPassOrFares),
      fuelCost: Math.round(variableFuel),
      vehicleOperating: Math.round(fixedVehicle),
      parkingCost,
      totalMonthlyCost: Math.round(totalMonthlyCost),
      minutesOneWay,
      monthlyHours,
      monthlyTrips,
      kmOneWay,
      kmMonthly,
    };
  }

  // Walk / Bike
  const minutesOneWay = Math.min(commute.transit.minutesOneWay, 25);
  const monthlyHours = Number(((minutesOneWay * monthlyTrips) / 60).toFixed(1));

  return {
    mode: 'walk_bike',
    transitPassOrFares: 0,
    fuelCost: 0,
    vehicleOperating: 15, // Bike maintenance / Bike Share Toronto membership
    parkingCost: 0,
    totalMonthlyCost: 15,
    minutesOneWay,
    monthlyHours,
    monthlyTrips,
    kmOneWay: commute.car.kmOneWay,
    kmMonthly: commute.car.kmOneWay * monthlyTrips,
  };
}
