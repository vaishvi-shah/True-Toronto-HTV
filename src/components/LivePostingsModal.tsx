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
import { buildPlatformSearchUrls } from '../data/listings';
import { DEMO_LISTINGS, DemoListing } from '../data/demoListings';
import { TORONTO_RENT_BENCHMARK_PERIOD, TORONTO_RENT_BENCHMARK_SOURCE } from '../data/rentBenchmarks';
import { NEIGHBOURHOODS } from '../data/neighbourhoods';
import { BedroomType, UserPreferences } from '../types';

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
  const [filterBedrooms, setFilterBedrooms] = useState<string>('all');
  const [maxRent, setMaxRent] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'rentAsc' | 'rentDesc'>('rentAsc');
  const [visibleCount, setVisibleCount] = useState(6);

  // Keep filter in sync if selectedNeighbourhoodId changes when opened
  React.useEffect(() => {
    setFilterNeighbourhood(selectedNeighbourhoodId || 'all');
    setVisibleCount(6);
  }, [selectedNeighbourhoodId]);

  React.useEffect(() => {
    setVisibleCount(6);
  }, [filterNeighbourhood, filterBedrooms, maxRent, sortBy]);

  // Filter listings
  const filteredListings = useMemo(() => {
    let list: DemoListing[] = [...DEMO_LISTINGS];

    if (filterNeighbourhood !== 'all') {
      list = list.filter((p) => p.neighbourhoodId === filterNeighbourhood);
    }

    if (filterBedrooms !== 'all') {
      list = list.filter((p) => p.bedrooms === filterBedrooms);
    }

    if (maxRent !== '') {
      list = list.filter((p) => p.monthlyRent <= Number(maxRent));
    }

    if (sortBy === 'rentAsc') {
      list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    } else if (sortBy === 'rentDesc') {
      list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    }

    return list;
  }, [filterNeighbourhood, filterBedrooms, maxRent, sortBy]);

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

  const visibleListings = filteredListings.slice(0, visibleCount);

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
                  Demo Rental Examples
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  Illustrative · not live
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Six sample rents per area, calibrated to Statistics Canada’s Toronto CMA asking-rent averages ({TORONTO_RENT_BENCHMARK_PERIOD}). These are not actual available units. <a className="font-semibold text-emerald-800 underline" href={TORONTO_RENT_BENCHMARK_SOURCE} target="_blank" rel="noreferrer">View source data</a>
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

        {/* External portal searches (not connected listing feeds) */}
        <div className="bg-stone-100 px-4 sm:px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700">
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Search rental sites for {currentNeighbourhood?.name || 'Toronto'}:</span>
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
        <div className="p-4 sm:px-6 bg-white border-b border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                No demo examples match these filters
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                Try changing the area, bedroom count, or maximum rent.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterNeighbourhood('all');
                  setFilterBedrooms('all');
                  setMaxRent('');
                }}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleListings.map((posting) => {
                const targetNeighbourhood = NEIGHBOURHOODS.find((n) => n.id === posting.neighbourhoodId);
                return (
                  <article key={posting.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-stone-50 px-4 py-3">
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">Demo example</span>
                      <span className="text-xs font-semibold text-stone-500">{posting.bedrooms === 'bachelor' ? 'Studio' : posting.bedrooms.replace('bed', ' bedroom')}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-stone-900">{posting.title}</p>
                      <p className="mt-1 text-xs text-stone-500">Illustrative rent for {targetNeighbourhood?.name || 'Toronto'}</p>
                      <p className="mt-4 font-mono text-2xl font-extrabold tracking-tight text-emerald-800">${posting.monthlyRent.toLocaleString()}<span className="ml-1 text-xs font-medium text-stone-500">/mo</span></p>
                      <p className="mt-2 text-[11px] leading-4 text-stone-500">Generated around the Toronto CMA average of ${posting.benchmarkRent.toLocaleString()}/mo for this unit size. Not a real listing or availability claim.</p>
                      <button type="button" onClick={() => onApplyNeighbourhoodRent(posting.neighbourhoodId, posting.monthlyRent)} className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100">Try this demo rent</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {filteredListings.length > visibleCount && (
            <div className="mt-7 flex flex-col items-center gap-2">
              <p className="text-xs text-stone-500">Showing {visibleCount} of {filteredListings.length} demo examples</p>
              <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50">
                View more examples <span aria-hidden="true">↓</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3.5 sm:px-6 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Demo rents are generated around published averages derived from real rental-platform listings; no individual unit is represented.
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
