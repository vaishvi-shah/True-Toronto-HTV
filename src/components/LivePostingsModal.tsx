import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { buildPlatformSearchUrls } from '../data/listings';
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
  const [foundRent, setFoundRent] = useState<string>('');
  const [applyHint, setApplyHint] = useState<string>('');

  // Keep filter in sync if selectedNeighbourhoodId changes when opened
  React.useEffect(() => {
    setFilterNeighbourhood(selectedNeighbourhoodId || 'all');
    setFoundRent('');
    setApplyHint('');
  }, [selectedNeighbourhoodId]);

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

  const handleApplyFoundRent = () => {
    const rent = Number(foundRent);
    if (!foundRent || isNaN(rent) || rent <= 0) {
      setApplyHint('Enter a monthly rent above $0 first.');
      return;
    }
    const targetId = filterNeighbourhood !== 'all' ? filterNeighbourhood : selectedNeighbourhoodId;
    if (!targetId) {
      setApplyHint('Pick a neighbourhood above so the rent lands on the right area card.');
      return;
    }
    onApplyNeighbourhoodRent(targetId, rent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60">
      <div className="modal-enter bg-white rounded-xl border border-stone-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  Live Rental Search
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Online portals
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                No bundled listings here — search current availability directly on the rental platforms, then apply a rent you found to rerun your comparison.
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

        {/* Filters Controls */}
        <div className="p-4 sm:px-6 bg-white border-b border-stone-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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
        </div>

        {/* External portal searches */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700 text-xs mb-3">
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Search live availability for {currentNeighbourhood?.name || 'Toronto'}:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['HouseSigma (MLS)', currentSearchUrls.houseSigma],
              ['Realtor.ca', currentSearchUrls.realtorCa],
              ['Zillow', currentSearchUrls.zillow],
              ['Rentals.ca', currentSearchUrls.rentalsCa],
            ].map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable px-4 py-3 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 border border-stone-300 hover:border-emerald-300 font-semibold flex items-center justify-between gap-1 transition-[background-color] cursor-pointer text-sm"
              >
                <span>{label}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Apply a rent you found */}
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h3 className="text-xs font-bold text-emerald-950">Found a rent? Apply it to your comparison</h3>
            <p className="mt-1 text-[11px] text-stone-600">
              Enter the asking rent from a live ad{currentNeighbourhood ? ` for ${currentNeighbourhood.name}` : ''} and it becomes that area's custom rent in the ledger.
            </p>
            <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-stone-500 font-bold text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={foundRent}
                  onChange={(e) => { setFoundRent(e.target.value); setApplyHint(''); }}
                  placeholder="e.g. 2150"
                  className="w-full bg-white border border-stone-300 rounded-lg pl-7 pr-3 py-1.5 font-mono text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFoundRent}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Apply this rent
              </button>
            </div>
            {applyHint && <p className="mt-1.5 text-[11px] text-amber-800">{applyHint}</p>}
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-3.5 sm:px-6 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Portal results are third-party ads — verify every rent before deciding.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-stone-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
