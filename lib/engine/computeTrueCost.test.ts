import { describe, expect, it } from 'vitest';
import { ASSUMPTIONS } from '../../data/assumptions';
import { COMMUTES } from '../../data/commutes';
import { NEIGHBOURHOODS } from '../../data/neighbourhoods';
import { WORKPLACES } from '../../data/workplaces';
import { computeTrueCost } from './computeTrueCost';
import { computeTransportCost } from './transport';
import { computeUtilities } from './utilities';
import { Profile } from '../types';

describe('Calculation Engine (Pure & Deterministic)', () => {
  const sampleProfile: Profile = {
    workplaceId: 'hospital-row',
    annualIncome: 41600, // $41,600 / 2080 hrs = $20.00/hr
    incomeBasis: 'pretax',
    householdSize: 1,
    bedrooms: '1bed',
    commuteDaysPerMonth: 21,
    wageFactor: 0.5,
    hasCar: false,
    commuteMode: 'transit',
  };

  const sampleNeighbourhood = NEIGHBOURHOODS.find((n) => n.id === 'scarborough-centre')!;
  const sampleCommute = COMMUTES['scarborough-centre_hospital-row'];
  const sampleWorkplace = WORKPLACES.find((w) => w.id === 'hospital-row')!;

  it('computes deterministic output: same inputs always equal same output', () => {
    const res1 = computeTrueCost(sampleProfile, sampleNeighbourhood, sampleCommute, sampleWorkplace);
    const res2 = computeTrueCost(sampleProfile, sampleNeighbourhood, sampleCommute, sampleWorkplace);

    expect(res1.trueMonthlyCost).toBe(res2.trueMonthlyCost);
    expect(res1.timeCost.monthlyValuedCost).toBe(res2.timeCost.monthlyValuedCost);
    expect(res1.allInWithTime).toBe(res2.allInWithTime);
  });

  it('handles zero commute days edge case properly', () => {
    const remoteProfile: Profile = {
      ...sampleProfile,
      commuteDaysPerMonth: 0,
    };

    const res = computeTrueCost(remoteProfile, sampleNeighbourhood, sampleCommute, sampleWorkplace);
    expect(res.transport.totalMonthlyCost).toBe(0);
    expect(res.transport.monthlyHours).toBe(0);
    expect(res.timeCost.monthlyValuedCost).toBe(0);
  });

  it('zeros out utilities when included in rent', () => {
    const fullyIncludedNeighbourhood = {
      ...sampleNeighbourhood,
      utilitiesIncluded: { heat: true, hydro: true, water: true },
    };

    const utilRes = computeUtilities(sampleProfile, fullyIncludedNeighbourhood);
    expect(utilRes.totalMonthlyCost).toBe(0);
    expect(utilRes.hydro).toBe(0);
    expect(utilRes.gasHeat).toBe(0);
    expect(utilRes.water).toBe(0);
  });

  it('calculates transit fare cap at monthly pass', () => {
    // 21 days * 2 trips = 42 trips. 42 * $3.30 = $138.60 (less than $156 monthly pass)
    const transport42Trips = computeTransportCost(sampleProfile, sampleCommute, 0);
    expect(transport42Trips.transitPassOrFares).toBe(139);

    // 25 days * 2 trips = 50 trips. 50 * $3.30 = $165.00 -> should cap at $156.00 pass
    const highTripsProfile: Profile = { ...sampleProfile, commuteDaysPerMonth: 25 };
    const transport50Trips = computeTransportCost(highTripsProfile, sampleCommute, 0);
    expect(transport50Trips.transitPassOrFares).toBe(156);
  });

  it('correctly values commute time separately at 50% of wage', () => {
    // Annual income $41,600 / 2080 hrs = $20.00/hr
    // 52 mins one way * 42 trips = 2,184 mins = 36.4 hrs
    // Value = 36.4 hrs * $20/hr * 0.5 wageFactor = $364/mo
    const res = computeTrueCost(sampleProfile, sampleNeighbourhood, sampleCommute, sampleWorkplace);
    expect(res.timeCost.hourlyWage).toBe(20.0);
    expect(res.timeCost.hoursPerMonth).toBe(36.4);
    expect(res.timeCost.monthlyValuedCost).toBe(364);
    // True Monthly Cost must NOT silently inflate with time cost
    expect(res.trueMonthlyCost).toBe(
      res.rent.effectivePaid + res.transport.totalMonthlyCost + res.utilities.totalMonthlyCost
    );
    expect(res.allInWithTime).toBe(res.trueMonthlyCost + 364);
  });

  it('correctly applies custom user rent overrides', () => {
    const customProfile: Profile = {
      ...sampleProfile,
      customRent: 1500,
    };
    const res = computeTrueCost(customProfile, sampleNeighbourhood, sampleCommute, sampleWorkplace);
    expect(res.rent.effectivePaid).toBe(1500);
    expect(res.rent.isCustom).toBe(true);
    expect(res.rent.asking).toBe(1920); // asking remains preserved for context
  });
});
