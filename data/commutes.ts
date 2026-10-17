import { CommuteRecord } from '../lib/types';

export const COMMUTES: Record<string, CommuteRecord> = {
  // Scarborough Centre
  'scarborough-centre_hospital-row': {
    neighbourhoodId: 'scarborough-centre',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 52,
      kmOneWay: 24.5,
      transfers: 1,
      routeDescription: 'Line 2 Express Bus to Kennedy Station, Line 2 to St. George, Line 1 to Queen\'s Park Station',
    },
    car: { minutesOneWay: 44, kmOneWay: 24.5 },
  },
  'scarborough-centre_financial-district': {
    neighbourhoodId: 'scarborough-centre',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 48,
      kmOneWay: 23.8,
      transfers: 1,
      routeDescription: 'Line 2 Express Bus to Kennedy, Stouffville GO train or Line 1 to King / Union',
    },
    car: { minutesOneWay: 40, kmOneWay: 23.8 },
  },
  'scarborough-centre_pearson-logistics': {
    neighbourhoodId: 'scarborough-centre',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 72,
      kmOneWay: 36.4,
      transfers: 2,
      routeDescription: 'Line 4 Sheppard connect to Highway 407 GO bus or Line 2 westward',
    },
    car: { minutesOneWay: 42, kmOneWay: 36.4 },
  },
  'scarborough-centre_north-york-centre': {
    neighbourhoodId: 'scarborough-centre',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 42,
      kmOneWay: 18.2,
      transfers: 1,
      routeDescription: 'TTC 985 Sheppard East Express to Don Mills, Line 4 to Sheppard-Yonge',
    },
    car: { minutesOneWay: 28, kmOneWay: 18.2 },
  },

  // Islington Etobicoke
  'islington-etobicoke_hospital-row': {
    neighbourhoodId: 'islington-etobicoke',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 32,
      kmOneWay: 15.2,
      transfers: 1,
      routeDescription: 'Line 2 Subway direct to St. George, transfer Line 1 south 1 stop to Queen\'s Park',
    },
    car: { minutesOneWay: 28, kmOneWay: 15.2 },
  },
  'islington-etobicoke_financial-district': {
    neighbourhoodId: 'islington-etobicoke',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 30,
      kmOneWay: 14.8,
      transfers: 1,
      routeDescription: 'Line 2 to St. George, Line 1 South to St. Andrew / Union',
    },
    car: { minutesOneWay: 26, kmOneWay: 14.8 },
  },
  'islington-etobicoke_pearson-logistics': {
    neighbourhoodId: 'islington-etobicoke',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 28,
      kmOneWay: 12.4,
      transfers: 0,
      routeDescription: 'MiWay Route 107 Express or TTC 900 Airport Rocket connection',
    },
    car: { minutesOneWay: 16, kmOneWay: 12.4 },
  },
  'islington-etobicoke_north-york-centre': {
    neighbourhoodId: 'islington-etobicoke',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 46,
      kmOneWay: 21.0,
      transfers: 1,
      routeDescription: 'Line 2 to Spadina/St. George, Line 1 North to North York Centre',
    },
    car: { minutesOneWay: 28, kmOneWay: 21.0 },
  },

  // Downtown East
  'downtown-east_hospital-row': {
    neighbourhoodId: 'downtown-east',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 16,
      kmOneWay: 3.2,
      transfers: 0,
      routeDescription: 'TTC 505 Dundas Streetcar direct or 12-min bicycle commute along Gerrard bike lanes',
    },
    car: { minutesOneWay: 15, kmOneWay: 3.2 },
  },
  'downtown-east_financial-district': {
    neighbourhoodId: 'downtown-east',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 14,
      kmOneWay: 2.8,
      transfers: 0,
      routeDescription: 'TTC 501 Queen Streetcar or 504 King Streetcar direct to Financial Core',
    },
    car: { minutesOneWay: 14, kmOneWay: 2.8 },
  },
  'downtown-east_pearson-logistics': {
    neighbourhoodId: 'downtown-east',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 44,
      kmOneWay: 27.2,
      transfers: 1,
      routeDescription: 'Streetcar/Walk to Union Station, UP Express to Pearson Terminal 1',
    },
    car: { minutesOneWay: 34, kmOneWay: 27.2 },
  },
  'downtown-east_north-york-centre': {
    neighbourhoodId: 'downtown-east',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 34,
      kmOneWay: 15.6,
      transfers: 1,
      routeDescription: 'Walk 6 min to Line 1 Queen/Dundas station, Subway North to North York Centre',
    },
    car: { minutesOneWay: 26, kmOneWay: 15.6 },
  },

  // High Park Junction
  'high-park-junction_hospital-row': {
    neighbourhoodId: 'high-park-junction',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 24,
      kmOneWay: 8.9,
      transfers: 1,
      routeDescription: 'Line 2 Subway from High Park / Keele to St. George, Line 1 to Queen\'s Park (2 stops)',
    },
    car: { minutesOneWay: 22, kmOneWay: 8.9 },
  },
  'high-park-junction_financial-district': {
    neighbourhoodId: 'high-park-junction',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 20,
      kmOneWay: 8.5,
      transfers: 0,
      routeDescription: 'UP Express from Bloor GO to Union Station (8 mins) or Line 2/1 Subway (22 mins)',
    },
    car: { minutesOneWay: 20, kmOneWay: 8.5 },
  },
  'high-park-junction_pearson-logistics': {
    neighbourhoodId: 'high-park-junction',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 22,
      kmOneWay: 18.2,
      transfers: 0,
      routeDescription: 'UP Express directly from Bloor GO Station to Pearson Airport (17 mins)',
    },
    car: { minutesOneWay: 20, kmOneWay: 18.2 },
  },
  'high-park-junction_north-york-centre': {
    neighbourhoodId: 'high-park-junction',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 40,
      kmOneWay: 17.0,
      transfers: 1,
      routeDescription: 'Line 2 to St. George, Line 1 North to North York Centre',
    },
    car: { minutesOneWay: 25, kmOneWay: 17.0 },
  },

  // North York Centre
  'north-york-centre_hospital-row': {
    neighbourhoodId: 'north-york-centre',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 28,
      kmOneWay: 15.4,
      transfers: 0,
      routeDescription: 'TTC Line 1 Subway direct from North York Centre to Queen\'s Park Station (no transfers)',
    },
    car: { minutesOneWay: 26, kmOneWay: 15.4 },
  },
  'north-york-centre_financial-district': {
    neighbourhoodId: 'north-york-centre',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 30,
      kmOneWay: 16.0,
      transfers: 0,
      routeDescription: 'Line 1 Subway direct to King or Union Station',
    },
    car: { minutesOneWay: 28, kmOneWay: 16.0 },
  },
  'north-york-centre_pearson-logistics': {
    neighbourhoodId: 'north-york-centre',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 46,
      kmOneWay: 23.5,
      transfers: 1,
      routeDescription: 'GO Bus Route 34 or TTC Line 1 to York Mills, 952/express connections',
    },
    car: { minutesOneWay: 22, kmOneWay: 23.5 },
  },
  'north-york-centre_north-york-centre': {
    neighbourhoodId: 'north-york-centre',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 5,
      kmOneWay: 1.2,
      transfers: 0,
      routeDescription: 'Underground PATH pedestrian concourse or 5-min walk',
    },
    car: { minutesOneWay: 4, kmOneWay: 1.2 },
  },

  // Thorncliffe Park
  'thorncliffe-park_hospital-row': {
    neighbourhoodId: 'thorncliffe-park',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 36,
      kmOneWay: 10.8,
      transfers: 1,
      routeDescription: 'TTC 81 bus to Pape Station, Line 2 to Bloor-Yonge, Line 1 to Queen\'s Park',
    },
    car: { minutesOneWay: 25, kmOneWay: 10.8 },
  },
  'thorncliffe-park_financial-district': {
    neighbourhoodId: 'thorncliffe-park',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 34,
      kmOneWay: 10.2,
      transfers: 1,
      routeDescription: 'TTC 81 Thorncliffe to Pape, Line 2 to Bloor-Yonge, Line 1 to King',
    },
    car: { minutesOneWay: 22, kmOneWay: 10.2 },
  },
  'thorncliffe-park_pearson-logistics': {
    neighbourhoodId: 'thorncliffe-park',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 62,
      kmOneWay: 28.5,
      transfers: 2,
      routeDescription: 'Bus to Line 2, Subway West to Kipling, 900 Airport Express',
    },
    car: { minutesOneWay: 32, kmOneWay: 28.5 },
  },
  'thorncliffe-park_north-york-centre': {
    neighbourhoodId: 'thorncliffe-park',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 38,
      kmOneWay: 12.5,
      transfers: 1,
      routeDescription: 'TTC 25 Don Mills Express North to Don Mills Station, Line 4 to Sheppard-Yonge',
    },
    car: { minutesOneWay: 20, kmOneWay: 12.5 },
  },

  // Parkdale Little Portugal
  'parkdale-little-portugal_hospital-row': {
    neighbourhoodId: 'parkdale-little-portugal',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 24,
      kmOneWay: 5.6,
      transfers: 1,
      routeDescription: 'TTC 504 King Streetcar to Spadina, 510 Spadina to College / Queen\'s Park',
    },
    car: { minutesOneWay: 20, kmOneWay: 5.6 },
  },
  'parkdale-little-portugal_financial-district': {
    neighbourhoodId: 'parkdale-little-portugal',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 18,
      kmOneWay: 5.2,
      transfers: 0,
      routeDescription: 'TTC 504 King Streetcar direct into Financial Core (King & Bay)',
    },
    car: { minutesOneWay: 18, kmOneWay: 5.2 },
  },
  'parkdale-little-portugal_pearson-logistics': {
    neighbourhoodId: 'parkdale-little-portugal',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 36,
      kmOneWay: 21.4,
      transfers: 1,
      routeDescription: 'TTC 504 to Dundas West / Bloor GO, UP Express direct to Pearson',
    },
    car: { minutesOneWay: 24, kmOneWay: 21.4 },
  },
  'parkdale-little-portugal_north-york-centre': {
    neighbourhoodId: 'parkdale-little-portugal',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 42,
      kmOneWay: 18.0,
      transfers: 1,
      routeDescription: '504 King or 29 Dufferin to Line 2, transfer Line 1 North',
    },
    car: { minutesOneWay: 28, kmOneWay: 18.0 },
  },

  // Danforth East York
  'danforth-east-york_hospital-row': {
    neighbourhoodId: 'danforth-east-york',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 22,
      kmOneWay: 7.8,
      transfers: 1,
      routeDescription: 'Line 2 Subway from Pape to Bloor-Yonge, Line 1 South to Queen\'s Park (4 stops)',
    },
    car: { minutesOneWay: 20, kmOneWay: 7.8 },
  },
  'danforth-east-york_financial-district': {
    neighbourhoodId: 'danforth-east-york',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 20,
      kmOneWay: 7.2,
      transfers: 1,
      routeDescription: 'Line 2 to Bloor-Yonge, Line 1 South to King / Union',
    },
    car: { minutesOneWay: 18, kmOneWay: 7.2 },
  },
  'danforth-east-york_pearson-logistics': {
    neighbourhoodId: 'danforth-east-york',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 52,
      kmOneWay: 29.0,
      transfers: 1,
      routeDescription: 'Line 2 westbound to Dundas West, UP Express to Pearson',
    },
    car: { minutesOneWay: 32, kmOneWay: 29.0 },
  },
  'danforth-east-york_north-york-centre': {
    neighbourhoodId: 'danforth-east-york',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 32,
      kmOneWay: 14.5,
      transfers: 1,
      routeDescription: 'Line 2 to Bloor-Yonge, Line 1 North to North York Centre',
    },
    car: { minutesOneWay: 22, kmOneWay: 14.5 },
  },

  // Weston Mount Dennis
  'weston-mount-dennis_hospital-row': {
    neighbourhoodId: 'weston-mount-dennis',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 28,
      kmOneWay: 14.2,
      transfers: 1,
      routeDescription: 'UP Express or Kitchener GO train to Bloor GO (6 mins), transfer Line 2 / Line 1 or direct to Union (15 mins)',
    },
    car: { minutesOneWay: 26, kmOneWay: 14.2 },
  },
  'weston-mount-dennis_financial-district': {
    neighbourhoodId: 'weston-mount-dennis',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 22,
      kmOneWay: 14.0,
      transfers: 0,
      routeDescription: 'UP Express from Weston GO directly into Union Station (15 min train ride)',
    },
    car: { minutesOneWay: 24, kmOneWay: 14.0 },
  },
  'weston-mount-dennis_pearson-logistics': {
    neighbourhoodId: 'weston-mount-dennis',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 16,
      kmOneWay: 11.2,
      transfers: 0,
      routeDescription: 'UP Express 1 stop direct to Pearson Airport Terminal 1 (11 mins)',
    },
    car: { minutesOneWay: 14, kmOneWay: 11.2 },
  },
  'weston-mount-dennis_north-york-centre': {
    neighbourhoodId: 'weston-mount-dennis',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 38,
      kmOneWay: 13.5,
      transfers: 1,
      routeDescription: 'TTC 89 Weston bus to Wilson Station, Line 1 to Sheppard-Yonge',
    },
    car: { minutesOneWay: 20, kmOneWay: 13.5 },
  },

  // Malvern Rouge
  'malvern-rouge_hospital-row': {
    neighbourhoodId: 'malvern-rouge',
    workplaceId: 'hospital-row',
    transit: {
      minutesOneWay: 65,
      kmOneWay: 31.5,
      transfers: 2,
      routeDescription: 'TTC 131 Nugget bus to Scarborough Centre, Line 2 Express to Kennedy, Line 2 to St. George, Line 1 to Queen\'s Park',
    },
    car: { minutesOneWay: 48, kmOneWay: 31.5 },
  },
  'malvern-rouge_financial-district': {
    neighbourhoodId: 'malvern-rouge',
    workplaceId: 'financial-district',
    transit: {
      minutesOneWay: 60,
      kmOneWay: 31.0,
      transfers: 1,
      routeDescription: 'TTC bus to Rouge Hill GO Station, Lakeshore East GO train to Union (35 min train)',
    },
    car: { minutesOneWay: 46, kmOneWay: 31.0 },
  },
  'malvern-rouge_pearson-logistics': {
    neighbourhoodId: 'malvern-rouge',
    workplaceId: 'pearson-logistics',
    transit: {
      minutesOneWay: 80,
      kmOneWay: 42.0,
      transfers: 2,
      routeDescription: 'Long cross-GTA transit trip requiring 407 GO bus or multiple transfers',
    },
    car: { minutesOneWay: 45, kmOneWay: 42.0 },
  },
  'malvern-rouge_north-york-centre': {
    neighbourhoodId: 'malvern-rouge',
    workplaceId: 'north-york-centre',
    transit: {
      minutesOneWay: 52,
      kmOneWay: 23.0,
      transfers: 2,
      routeDescription: 'TTC 134 to Sheppard, 985 Sheppard East Express to Line 4, transfer Line 1',
    },
    car: { minutesOneWay: 30, kmOneWay: 23.0 },
  },
};
