import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Building2,
  Filter,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { ATTACHED_POSTINGS, buildPlatformSearchUrls } from '../data/listings';
import { NEIGHBOURHOODS } from '../data/neighbourhoods';
import { BedroomType, ListingPlatform, RentalPosting, UserPreferences } from '../types';
import { ListingCard } from './ListingCard';

interface LivePostingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  selectedNeighbourhoodId?: string | null;
  onApplyNeighbourhoodRent: (id: string, rent: number) => void;
}

export const LivePostingsModal: React.FC<LivePostingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  selectedNeighbourhoodId,
  onApplyNeighbourhoodRent,
}) => {
  const [filterNeighbourhood, setFilterNeighbourhood] = useState<string>(
    selectedNeighbourhoodId || 'all'
  );
  const [filterBedrooms, setFilterBedrooms] = useState<string>(preferences.bedrooms || 'all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [maxRent, setMaxRent] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'rentAsc' | 'rentDesc' | 'newest'>('rentAsc');

  // Keep filter in sync if selectedNeighbourhoodId changes when opened
  React.useEffect(() => {
    if (selectedNeighbourhoodId) {
      setFilterNeighbourhood(selectedNeighbourhoodId);
    }
  }, [selectedNeighbourhoodId]);

  // Filter listings
  const filteredListings = useMemo(() => {
    let list = [...ATTACHED_POSTINGS];

    if (filterNeighbourhood !== 'all') {
      list = list.filter((p) => p.neighbourhoodId === filterNeighbourhood);
    }

    if (filterBedrooms !== 'all') {
      list = list.filter((p) => p.bedrooms === filterBedrooms);
    }

    if (filterPlatform !== 'all') {
      list = list.filter((p) => p.platform === filterPlatform);
    }

    if (maxRent !== '') {
      list = list.filter((p) => p.monthlyRent <= Number(maxRent));
    }

    if (sortBy === 'rentAsc') {
      list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    } else if (sortBy === 'rentDesc') {
      list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    }

    return list;
  }, [filterNeighbourhood, filterBedrooms, filterPlatform, maxRent, sortBy]);

  // Selected neighbourhood object
  const currentNeighbourhood = useMemo(() => {
    return NEIGHBOURHOODS.find((n) => n.id === filterNeighbourhood);
  }, [filterNeighbourhood]);

  // Search URLs for the current view
  const currentSearchUrls = useMemo(() => {
    const areaName = currentNeighbourhood ? currentNeighbourhood.name : 'Toronto';
    const bedType = filterBedrooms !== 'all' ? (filterBedrooms as BedroomType) : preferences.bedrooms;
    const maxP = typeof maxRent === 'number' ? maxRent : undefined;
    return buildPlatformSearchUrls(areaName, bedType, maxP);
  }, [currentNeighbourhood, filterBedrooms, preferences.bedrooms, maxRent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  Live Rental Postings &amp; Market Feeds
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {filteredListings.length} Active Attached
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Connected with HouseSigma (MLS®), Realtor.ca, Zillow, and Rentals.ca. Click &quot;Use Rent&quot; to test any posting in your True Cost budget.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Quick Launch Bar */}
        <div className="bg-stone-100 px-4 sm:px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700">
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Search Live Portals for {currentNeighbourhood?.name || 'Toronto'}:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={currentSearchUrls.houseSigma}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>HouseSigma (MLS)</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={currentSearchUrls.realtorCa}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Realtor.ca</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={currentSearchUrls.zillow}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Zillow</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={currentSearchUrls.rentalsCa}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Rentals.ca</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Filters Controls */}
        <div className="p-4 sm:px-6 bg-white border-b border-stone-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Neighbourhood Filter */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Neighbourhood
            </label>
            <select
              value={filterNeighbourhood}
              onChange={(e) => setFilterNeighbourhood(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All 10 Areas</option>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Bedrooms
            </label>
            <select
              value={filterBedrooms}
              onChange={(e) => setFilterBedrooms(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Sizes</option>
              <option value="bachelor">Bachelor / Studio</option>
              <option value="1bed">1 Bedroom</option>
              <option value="2bed">2 Bedroom</option>
              <option value="3bed">3 Bedroom</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Platform Source
            </label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Portals</option>
              <option value="housesigma">HouseSigma</option>
              <option value="realtor">Realtor.ca (MLS®)</option>
              <option value="zillow">Zillow</option>
              <option value="rentals_ca">Rentals.ca</option>
            </select>
          </div>

          {/* Max Budget */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Max Rent ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 2400"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="rentAsc">Price: Lowest First</option>
              <option value="rentDesc">Price: Highest First</option>
              <option value="newest">Newest Listed</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-500 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800 mb-1">
                No matching postings found
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                Try loosening your filters or launch a direct search on HouseSigma, Realtor.ca, or Zillow using the buttons above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterNeighbourhood('all');
                  setFilterBedrooms('all');
                  setFilterPlatform('all');
                  setMaxRent('');
                }}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((posting) => {
                const targetNeighbourhood = NEIGHBOURHOODS.find(
                  (n) => n.id === posting.neighbourhoodId
                );
                const benchmark = targetNeighbourhood
                  ? targetNeighbourhood.rents[posting.bedrooms]
                  : undefined;
                const isSelected =
                  preferences.customNeighbourhoodRents?.[posting.neighbourhoodId] ===
                  posting.monthlyRent;

                return (
                  <ListingCard
                    key={posting.id}
                    posting={posting}
                    benchmarkRent={benchmark}
                    isSelectedRent={isSelected}
                    onApplyRent={(rent) => {
                      onApplyNeighbourhoodRent(posting.neighbourhoodId, rent);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3.5 sm:px-6 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              All listings include direct links to official sources. Rents can be applied directly to evaluate true commuting costs.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-stone-800"
          >
            Done Browsing
          </button>
        </div>
      </div>
    </div>
  );
};
