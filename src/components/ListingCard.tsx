import React from 'react';
import {
  ExternalLink,
  MapPin,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  Train,
  CheckCircle2,
} from 'lucide-react';
import { RentalPosting } from '../types';

interface ListingCardProps {
  posting: RentalPosting;
  benchmarkRent?: number;
  isSelectedRent?: boolean;
  onApplyRent?: (rent: number) => void;
  compact?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  posting,
  benchmarkRent,
  isSelectedRent = false,
  onApplyRent,
  compact = false,
}) => {
  // Brand styling per platform
  const getPlatformInfo = (platform: RentalPosting['platform']) => {
    switch (platform) {
      case 'housesigma':
        return {
          name: 'HouseSigma',
          tagColor: 'bg-amber-50 text-amber-900 border-amber-300',
          accentColor: 'text-amber-800',
          badgeText: 'HouseSigma MLS®',
          actionText: 'View on HouseSigma',
        };
      case 'realtor':
        return {
          name: 'Realtor.ca',
          tagColor: 'bg-red-50 text-red-900 border-red-300',
          accentColor: 'text-red-700',
          badgeText: 'Realtor.ca CREA®',
          actionText: 'View on Realtor.ca',
        };
      case 'zillow':
        return {
          name: 'Zillow',
          tagColor: 'bg-blue-50 text-blue-900 border-blue-300',
          accentColor: 'text-blue-700',
          badgeText: 'Zillow Toronto',
          actionText: 'View on Zillow',
        };
      case 'rentals_ca':
        return {
          name: 'Rentals.ca',
          tagColor: 'bg-teal-50 text-teal-900 border-teal-300',
          accentColor: 'text-teal-800',
          badgeText: 'Rentals.ca Verified',
          actionText: 'View on Rentals.ca',
        };
      default:
        return {
          name: 'Live Listing',
          tagColor: 'bg-stone-100 text-stone-800 border-stone-200',
          accentColor: 'text-stone-800',
          badgeText: 'Verified Listing',
          actionText: 'View Posting',
        };
    }
  };

  const platformInfo = getPlatformInfo(posting.platform);

  // Compare to CMHC benchmark
  const diffFromBenchmark = benchmarkRent ? posting.monthlyRent - benchmarkRent : null;

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 flex flex-col overflow-hidden ${
        isSelectedRent
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
      }`}
    >
      {/* Top Media Bar */}
      <div className="relative h-36 w-full bg-stone-100 overflow-hidden">
        <img
          src={posting.imageUrl}
          alt={posting.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Platform Badge Overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs bg-white/95 backdrop-blur-xs ${platformInfo.tagColor}`}
          >
            {platformInfo.badgeText}
          </span>
          {posting.platformListingId && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-stone-900/80 text-stone-200 backdrop-blur-xs">
              {posting.platformListingId}
            </span>
          )}
        </div>

        {/* Rent Control Pill */}
        <div className="absolute top-2 right-2">
          {posting.rentControlStatus === 'protected_pre_2018' ? (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-900/90 text-emerald-200 backdrop-blur-xs flex items-center gap-1 shadow-xs"
              title="Built before Nov 15, 2018: Protected by Ontario annual rent increase guideline cap (2.5%)"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              Rent Controlled
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-900/90 text-amber-200 backdrop-blur-xs flex items-center gap-1 shadow-xs"
              title="First occupied after Nov 15, 2018: No statutory rent control cap upon annual renewal"
            >
              Exempt Post-2018
            </span>
          )}
        </div>

        {/* Price Tag Overlay at bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <div className="bg-stone-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg shadow-sm">
            <span className="text-sm font-extrabold font-mono tracking-tight">
              ${posting.monthlyRent.toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-300"> /mo</span>
          </div>

          {posting.walkToSubwayMins && (
            <div className="bg-stone-900/80 backdrop-blur-xs text-stone-200 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
              <Train className="w-3 h-3 text-emerald-400" />
              <span>{posting.walkToSubwayMins}m to transit</span>
            </div>
          )}
        </div>
      </div>

      {/* Body Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h4 className="text-xs font-bold text-stone-900 line-clamp-1 leading-snug">
              {posting.title}
            </h4>
          </div>

          <div className="text-[11px] text-stone-600 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="truncate">
              {posting.address}
              {posting.unit ? ` (${posting.unit})` : ''}
              {posting.postalCode ? `, ${posting.postalCode}` : ''}
            </span>
          </div>

          {/* Key Specs: Beds, Baths, Sqft */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-stone-700 pb-2 mb-2 border-b border-stone-100 flex-wrap">
            <span className="bg-stone-100 px-2 py-0.5 rounded-md">
              {posting.bedrooms === 'bachelor'
                ? 'Studio'
                : posting.bedrooms === '1bed'
                ? '1 Bed'
                : posting.bedrooms === '2bed'
                ? '2 Bed'
                : '3 Bed'}
            </span>
            <span className="bg-stone-100 px-2 py-0.5 rounded-md">
              {posting.bathrooms} {posting.bathrooms === 1 ? 'Bath' : 'Baths'}
            </span>
            {posting.sqft && (
              <span className="bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                {posting.sqft} sq ft
              </span>
            )}
            <span className="text-[10px] text-stone-400 flex items-center gap-0.5 ml-auto">
              <Clock className="w-3 h-3" />
              {posting.daysOnMarket === 1
                ? '1d ago'
                : `${posting.daysOnMarket}d ago`}
            </span>
          </div>

          {/* Benchmark comparison note */}
          {diffFromBenchmark !== null && (
            <div className="text-[10px] text-stone-500 mb-2 flex items-center gap-1">
              <span>CMHC Survey Median: ${benchmarkRent}/mo</span>
              <span>&bull;</span>
              <span
                className={
                  diffFromBenchmark <= 0
                    ? 'text-emerald-700 font-semibold'
                    : 'text-amber-700 font-semibold'
                }
              >
                {diffFromBenchmark === 0
                  ? 'Matches median'
                  : diffFromBenchmark < 0
                  ? `$${Math.abs(diffFromBenchmark)} below median`
                  : `+$${diffFromBenchmark} vs median`}
              </span>
            </div>
          )}

          {/* Features Pills */}
          <div className="flex flex-wrap gap-1 mb-3">
            {posting.features.slice(0, compact ? 2 : 4).map((feat, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-stone-50 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md flex items-center gap-1"
              >
                <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: Apply rent to calculation & View on website */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
          {onApplyRent && (
            <button
              type="button"
              onClick={() => onApplyRent(posting.monthlyRent)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                isSelectedRent
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
              title="Use this exact asking rent in your True Cost calculation"
            >
              {isSelectedRent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Applied (${posting.monthlyRent})</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use Rent (${posting.monthlyRent})</span>
                </>
              )}
            </button>
          )}

          <a
            href={posting.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
            title={`Open listing on ${platformInfo.name}`}
          >
            <span>{platformInfo.name}</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
        </div>
      </div>
    </div>
  );
};
