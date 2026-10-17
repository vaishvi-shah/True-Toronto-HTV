import { Workplace } from '../lib/types';

export const WORKPLACES: Workplace[] = [
  {
    id: 'hospital-row',
    name: 'Hospital Row / University Ave',
    shortName: 'Hospital Row (UHN)',
    district: 'Downtown Core',
    address: '585 University Ave, Toronto, ON M5G 2N2',
    parkingCostMonthly: 280,
    notes: 'Major public healthcare campus: Toronto General, Mount Sinai, SickKids, Princess Margaret.',
  },
  {
    id: 'financial-district',
    name: 'Financial District (Bay & King)',
    shortName: 'Financial District',
    district: 'Downtown Core',
    address: '100 King St W, Toronto, ON M5X 1A9',
    parkingCostMonthly: 340,
    notes: 'High-density office, finance, technology, and civic sector corridor near Union Station.',
  },
  {
    id: 'pearson-logistics',
    name: 'Pearson Airport Employment Zone',
    shortName: 'Pearson Airport Hub',
    district: 'Etobicoke / Airport',
    address: '6301 Silver Dart Dr, Mississauga/Toronto Border',
    parkingCostMonthly: 75,
    notes: 'Aviation, air cargo, distribution, industrial logistics, and manufacturing zone.',
  },
  {
    id: 'north-york-centre',
    name: 'North York Centre (Yonge & Sheppard)',
    shortName: 'North York Centre',
    district: 'North York',
    address: '5150 Yonge St, North York, ON M2N 6L8',
    parkingCostMonthly: 160,
    notes: 'Sub-urban civic centre, corporate offices, municipal services, healthcare facilities.',
  },
];
