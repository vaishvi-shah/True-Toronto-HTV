import React from 'react';
import {
  Briefcase,
  DollarSign,
  Users,
  Car,
  Bus,
  Footprints,
  SlidersHorizontal,
  Home,
  Info,
} from 'lucide-react';
import { WORKPLACES, CALCULATION_ASSUMPTIONS } from '../data/neighbourhoods';
import { BedroomType, CommuteMode, UserPreferences } from '../types';

interface UserInputBarProps {
  preferences: UserPreferences;
  onChange: (updated: Partial<UserPreferences>) => void;
  onOpenMethodology: () => void;
}

export const UserInputBar: React.FC<UserInputBarProps> = ({
  preferences,
  onChange,
  onOpenMethodology,
}) => {
  const hourlyWage = (
    preferences.annualIncome / CALCULATION_ASSUMPTIONS.standardWorkHoursPerYear
  ).toFixed(2);
  const monthlyGross = Math.round(preferences.annualIncome / 12);

  const selectedWorkplace =
    WORKPLACES.find((w) => w.id === preferences.workplaceId) || WORKPLACES[0];

  return (
    <div className="bg-white border-b border-stone-200 py-5 px-4 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
              Your Living & Work Parameters
            </h2>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline-block">
            Change any number to immediately recalculate all 10 neighbourhoods
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Input 1: Workplace Location */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Where do you work?</span>
            </label>
            <select
              value={preferences.workplaceId}
              onChange={(e) => onChange({ workplaceId: e.target.value })}
              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {WORKPLACES.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name} ({wp.district})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-stone-500 truncate" title={selectedWorkplace.description}>
              {selectedWorkplace.shortName} • {selectedWorkplace.parkingCostMonthly > 0 ? `$${selectedWorkplace.parkingCostMonthly}/mo park` : 'free parking'}
            </p>
          </div>

          {/* Input 2: Annual Household Income */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Annual Household Income</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-800">
                ${preferences.annualIncome.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="18000"
                max="160000"
                step="2000"
                value={preferences.annualIncome}
                onChange={(e) => onChange({ annualIncome: Number(e.target.value) })}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
              <span>Gross: ${monthlyGross.toLocaleString()}/mo</span>
              <span className="font-mono font-medium">${hourlyWage}/hr</span>
            </div>
          </div>

          {/* Input 3: Household & Bedroom Size */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Household & Unit Size</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={preferences.householdMembers}
                onChange={(e) => onChange({ householdMembers: Number(e.target.value) })}
                className="bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={1}>1 person</option>
                <option value={2}>2 people</option>
                <option value={3}>3 people</option>
                <option value={4}>4 people</option>
                <option value={5}>5+ people</option>
              </select>

              <select
                value={preferences.bedrooms}
                onChange={(e) => onChange({ bedrooms: e.target.value as BedroomType })}
                className="bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="bachelor">Bachelor / Studio</option>
                <option value="1bed">1-Bedroom</option>
                <option value="2bed">2-Bedroom</option>
                <option value="3bed">3-Bedroom</option>
              </select>
            </div>
            <p className="mt-1.5 text-[11px] text-stone-500">
              CMHC median rental tables applied
            </p>
          </div>

          {/* Input 4: Commute Mode & Remote Days */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>Travel Mode</span>
              </label>
              {preferences.hybridRemoteDaysPerWeek > 0 && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                  {preferences.hybridRemoteDaysPerWeek}d remote
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => onChange({ commuteMode: 'transit' })}
                className={`py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  preferences.commuteMode === 'transit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                title="TTC / Metrolinx public transit"
              >
                <Bus className="w-3.5 h-3.5 mb-0.5" />
                <span>Transit</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ commuteMode: 'car' })}
                className={`py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  preferences.commuteMode === 'car'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                title="Personal car (Fuel + Insurance + Maint + Parking)"
              >
                <Car className="w-3.5 h-3.5 mb-0.5" />
                <span>Car</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ commuteMode: 'hybrid' })}
                className={`py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  preferences.commuteMode === 'hybrid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                title="Mix of transit and car"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mb-0.5" />
                <span>Mixed</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ commuteMode: 'walk_bike' })}
                className={`py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  preferences.commuteMode === 'walk_bike'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                title="Walk or Bicycle (Low cost, proximity dependent)"
              >
                <Footprints className="w-3.5 h-3.5 mb-0.5" />
                <span>Bike/Walk</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2">
              <label htmlFor="hybrid-slider" className="cursor-pointer">
                Remote:
              </label>
              <input
                id="hybrid-slider"
                type="range"
                min="0"
                max="4"
                step="1"
                value={preferences.hybridRemoteDaysPerWeek}
                onChange={(e) =>
                  onChange({ hybridRemoteDaysPerWeek: Number(e.target.value) })
                }
                className="w-20 h-1 bg-stone-200 rounded-sm appearance-none cursor-pointer accent-emerald-600 ml-1 mr-1"
                title={`${preferences.hybridRemoteDaysPerWeek} days working from home`}
              />
              <span className="font-mono">{preferences.hybridRemoteDaysPerWeek}d/wk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
