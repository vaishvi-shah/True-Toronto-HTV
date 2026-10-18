import { BedroomType } from '../types';

/**
 * Generate platform direct search links for any neighbourhood and bedroom filter.
 * This project has no licensed live-listing feed, so the app links out to the
 * portals themselves (HouseSigma, Realtor.ca, Zillow, Rentals.ca) instead of
 * presenting bundled sample postings as real offers.
 */
export function buildPlatformSearchUrls(neighbourhoodName: string, bedrooms?: BedroomType, maxPrice?: number) {
  const cleanName = neighbourhoodName.replace(/\s*\([^)]*\)/g, '').trim();
  const bedNum = bedrooms === 'bachelor' ? '0' : bedrooms === '1bed' ? '1' : bedrooms === '2bed' ? '2' : bedrooms === '3bed' ? '3' : '1';

  return {
    houseSigma: `https://housesigma.com/on/toronto-real-estate?lease=1&address=${encodeURIComponent(cleanName + ', Toronto')}`,
    realtorCa: `https://www.realtor.ca/map#ZoomLevel=13&Center=43.6532,-79.3832&TransactionTypeId=3&PropertyTypeGroupID=1&Keywords=${encodeURIComponent(cleanName + ' Toronto')}`,
    zillow: `https://www.zillow.com/toronto-on/rentals/?searchQueryState=${encodeURIComponent(
      JSON.stringify({
        pagination: {},
        usersSearchTerm: `${cleanName}, Toronto, ON`,
        filterState: {
          isForRent: { value: true },
          beds: { min: Number(bedNum) },
          ...(maxPrice ? { monthlyPayment: { max: maxPrice } } : {}),
        },
      })
    )}`,
    rentalsCa: `https://rentals.ca/toronto/${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  };
}
