import React, { useState } from 'react';
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
  Clock,
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WORKPLACES, NEIGHBOURHOODS, CALCULATION_ASSUMPTIONS } from '../data/neighbourhoods';
import { BedroomType, CommuteMode, RentMode, UserPreferences } from '../types';
import { WorkplaceMapPicker } from './WorkplaceMapPicker';

interface UserInputBarProps {
  preferences: UserPreferences;
  onChange: (updated: Partial<UserPreferences>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
  hasUnanalyzedChanges: boolean;
  onOpenMethodology: () => void;
}

export const UserInputBar: React.FC<UserInputBarProps> = ({
  preferences,
  onChange,
  onAnalyze,
  isAnalyzing,
  hasAnalyzed,
  hasUnanalyzedChanges,
  onOpenMethodology,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [incomeMode, setIncomeMode] = useState<'annual' | 'monthly'>('annual');

  const selectedWorkplace =
    preferences.workplaceId === 'custom-workplace' && preferences.customWorkplace
      ? { ...WORKPLACES[0], name: preferences.customWorkplace.name, shortName: preferences.customWorkplace.name, address: preferences.customWorkplace.address, district: 'Custom destination', parkingCostMonthly: 0, description: 'User-selected destination' }
      : WORKPLACES.find((w) => w.id === preferences.workplaceId) || WORKPLACES[0];
  const isCustomWorkplace = preferences.workplaceId === 'custom-workplace';
  const customWorkplace = preferences.customWorkplace;

  const hasNeighbourhoodOverrides =
    preferences.customNeighbourhoodRents &&
    Object.keys(preferences.customNeighbourhoodRents).length > 0;

  const currentRentMode: RentMode =
    preferences.rentMode ||
    (preferences.rentInputMode === 'custom_fixed'
      ? 'user_entered'
      : 'cmhc_benchmark');

  const hasIncome =
    typeof preferences.annualIncome === 'number' && preferences.annualIncome > 0;

  const annualIncomeValue = hasIncome ? preferences.annualIncome! : 0;
  const monthlyIncomeValue = hasIncome ? Math.round(annualIncomeValue / 12) : 0;
  const hourlyWageValue = hasIncome
    ? (annualIncomeValue / CALCULATION_ASSUMPTIONS.standardWorkHoursPerYear).toFixed(2)
    : null;

  const onSiteDays = 5 - preferences.hybridRemoteDaysPerWeek;

  return (
    <section className="bg-white border-b border-stone-200 py-6 px-4 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Your Circumstances &amp; Financial Information</span>
              <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                User-Defined &bull; No Presets
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              All calculations and cost breakdowns reflect only the details you specify below.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={onOpenMethodology}
              className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>How Calculations Work</span>
            </button>
          </div>
        </div>

        {/* 3 Main Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Work Destination & Commute */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  1. Work &amp; Travel
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {onSiteDays} {onSiteDays === 1 ? 'day' : 'days'}/wk on-site
                </span>
              </div>

              {/* Destination Dropdown */}
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Primary Destination / Workplace
                </label>
                <select
                  value={preferences.workplaceId}
                  onChange={(e) => onChange({ workplaceId: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  {WORKPLACES.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} ({wp.district})
                    </option>
                  ))}
                  <option value="custom-workplace">Enter a custom destination…</option>
                </select>
                {isCustomWorkplace ? (
                  <WorkplaceMapPicker value={customWorkplace} onChange={(location) => onChange({ customWorkplace: location })} />
                ) : (
                  <p className="mt-1 text-[11px] text-stone-500 truncate" title={selectedWorkplace.description}>
                    {selectedWorkplace.address} &bull; {selectedWorkplace.parkingCostMonthly > 0 ? `$${selectedWorkplace.parkingCostMonthly}/mo parking` : 'Free parking'}
                  </p>
                )}
              </div>

              {/* Travel Mode */}
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Commute Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChange({ commuteMode: 'transit' })}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                      preferences.commuteMode === 'transit'
                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Bus className="w-4 h-4 mb-1" />
                    <span>Transit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ commuteMode: 'car' })}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                      preferences.commuteMode === 'car'
                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Car className="w-4 h-4 mb-1" />
                    <span>Car</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ commuteMode: 'hybrid' })}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                      preferences.commuteMode === 'hybrid'
                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 mb-1" />
                    <span>Mixed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ commuteMode: 'walk_bike' })}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                      preferences.commuteMode === 'walk_bike'
                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Footprints className="w-4 h-4 mb-1" />
                    <span>Active</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Remote / WFH Days Slider */}
            <div className="pt-3 border-t border-stone-200/80">
              <div className="flex items-center justify-between text-xs text-stone-700 mb-1.5">
                <span className="font-semibold">Remote / WFH Days:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {preferences.hybridRemoteDaysPerWeek} days remote
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={preferences.hybridRemoteDaysPerWeek}
                onChange={(e) =>
                  onChange({ hybridRemoteDaysPerWeek: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-stone-600 mt-1">
                <span>0 days (full on-site)</span>
                <span>5 days (100% remote)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Housing & Rent Choice (Never Assumed) */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600" />
                  2. Housing &amp; Rent
                </span>
                <span className="text-[11px] font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                  Never Assumed
                </span>
              </div>

              {/* Rent Mode 3-Way Selector */}
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  How should housing costs be handled?
                </label>
                <div className="space-y-1.5">
                  <label className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    currentRentMode === 'user_entered'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="rentMode"
                      value="user_entered"
                      checked={currentRentMode === 'user_entered'}
                      onChange={() =>
                        onChange({
                          rentMode: 'user_entered',
                          rentInputMode: 'custom_fixed',
                        })
                      }
                      className="mt-0.5 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="block font-semibold">Enter My Actual Rent / Budget</span>
                      <span className="text-[11px] text-stone-500 block">
                        Provide your specific monthly rent or leave blank if unspecified
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    currentRentMode === 'cmhc_benchmark'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="rentMode"
                      value="cmhc_benchmark"
                      checked={currentRentMode === 'cmhc_benchmark'}
                      onChange={() =>
                        onChange({
                          rentMode: 'cmhc_benchmark',
                          rentInputMode: 'market_median',
                        })
                      }
                      className="mt-0.5 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="block font-semibold">Use area-specific CMHC rent reference</span>
                      <span className="text-[11px] text-stone-500 block">
                        Varies by neighbourhood and unit size; source is dated October 2024
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    currentRentMode === 'no_rent'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="rentMode"
                      value="no_rent"
                      checked={currentRentMode === 'no_rent'}
                      onChange={() =>
                        onChange({
                          rentMode: 'no_rent',
                        })
                      }
                      className="mt-0.5 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="block font-semibold">Exclude Rent (Rent-Free / Commute Only)</span>
                      <span className="text-[11px] text-stone-500 block">
                        Focus strictly on transportation and utilities (e.g. living with family, homeowner)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional User Rent Input */}
              {currentRentMode === 'user_entered' && (
                <div className="mb-3 p-3 bg-white border border-emerald-300 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-emerald-950">
                      Your Monthly Rent / Target:
                    </label>
                    <span className="text-[11px] text-stone-500">Optional</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={preferences.customFixedRent ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                        onChange({ customFixedRent: val });
                      }}
                      placeholder="Leave blank for unspecified"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-7 pr-3 py-1.5 font-mono text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">
                    {preferences.customFixedRent
                      ? `Applied across all 10 areas ($${preferences.customFixedRent.toLocaleString()}/mo)`
                      : 'Left unspecified — out-of-pocket costs will calculate without rent'}
                  </p>
                </div>
              )}

              {/* Unit Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Unit Size
                  </label>
                  <select
                    value={preferences.bedrooms}
                    onChange={(e) => onChange({ bedrooms: e.target.value as BedroomType })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  >
                    <option value="bachelor">Bachelor / Studio</option>
                    <option value="1bed">1-Bedroom</option>
                    <option value="2bed">2-Bedroom</option>
                    <option value="3bed">3-Bedroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Household Size
                  </label>
                  <select
                    value={preferences.householdMembers}
                    onChange={(e) => onChange({ householdMembers: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  >
                    <option value={1}>1 person</option>
                    <option value={2}>2 people</option>
                    <option value={3}>3 people</option>
                    <option value={4}>4 people</option>
                    <option value={5}>5+ people</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Overrides indicator if any individual neighbourhood rent was set */}
            {hasNeighbourhoodOverrides && (
              <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-xs text-amber-800 bg-amber-50 p-2 rounded-lg">
                <span>
                  <strong>{Object.keys(preferences.customNeighbourhoodRents || {}).length}</strong> area override(s) active
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ customNeighbourhoodRents: {} })}
                  className="font-bold underline cursor-pointer hover:text-amber-950 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Income & Value of Your Time */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  3. Income &amp; Time Value
                </span>
                <span className="text-[11px] font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                  {hasIncome ? `$${annualIncomeValue.toLocaleString()}/yr` : 'Unspecified'}
                </span>
              </div>

              {/* Income Configuration */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Gross Income (Optional)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIncomeMode('annual')}
                      className={`font-medium cursor-pointer ${
                        incomeMode === 'annual'
                          ? 'text-emerald-800 font-bold underline'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Annual
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={() => setIncomeMode('monthly')}
                      className={`font-medium cursor-pointer ${
                        incomeMode === 'monthly'
                          ? 'text-emerald-800 font-bold underline'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 font-bold text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={
                      hasIncome
                        ? incomeMode === 'annual'
                          ? annualIncomeValue
                          : monthlyIncomeValue
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value === '') {
                        onChange({ annualIncome: null });
                      } else {
                        const val = Math.max(0, Number(e.target.value));
                        const annual = incomeMode === 'annual' ? val : val * 12;
                        onChange({ annualIncome: annual });
                      }
                    }}
                    placeholder="Enter income or leave blank"
                    className="w-full bg-white border border-stone-300 rounded-xl pl-7 pr-3 py-1.5 font-mono text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
                  {hasIncome ? (
                    <>
                      <span>Gross: ${monthlyIncomeValue.toLocaleString()}/mo</span>
                      <span className="font-mono font-medium">${hourlyWageValue}/hr</span>
                    </>
                  ) : (
                    <span className="text-stone-400 italic">
                      Income unspecified &bull; Rent-to-income ratio will not be calculated
                    </span>
                  )}
                </div>
              </div>

              {/* Commute Time Valuation */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    How to Value Your Commute Time:
                  </span>
                </label>
                <select
                  value={
                    preferences.timeValuationType === 'zero'
                      ? 'zero'
                      : preferences.timeValuationType === 'custom_rate'
                      ? 'custom'
                      : String(preferences.timeValuationRate ?? 0.5)
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'zero') {
                      onChange({
                        timeValuationType: 'zero',
                        timeValuationRate: 0,
                      });
                    } else if (val === 'custom') {
                      onChange({
                        timeValuationType: 'custom_rate',
                        customHourlyTimeValuation: preferences.customHourlyTimeValuation || 25,
                      });
                    } else {
                      onChange({
                        timeValuationType: 'percent_of_wage',
                        timeValuationRate: Number(val),
                      });
                    }
                  }}
                  className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  <option value="0.5">50% of hourly wage (Metrolinx standard)</option>
                  <option value="1">100% of hourly wage</option>
                  <option value="0.75">75% of hourly wage</option>
                  <option value="custom">Custom hourly rate ($/hr)</option>
                  <option value="zero">Do not monetize time (display hours only)</option>
                </select>

                {preferences.timeValuationType === 'custom_rate' && (
                  <div className="mt-2 flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-2.5 py-1">
                    <span className="text-xs text-stone-600 font-medium">Your rate: $</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={preferences.customHourlyTimeValuation ?? 25}
                      onChange={(e) =>
                        onChange({
                          customHourlyTimeValuation: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-16 font-mono text-xs font-bold text-stone-900 focus:outline-hidden"
                    />
                    <span className="text-xs text-stone-500">/hr for commute time</span>
                  </div>
                )}

                <p className="mt-1 text-[11px] text-stone-500">
                  {preferences.timeValuationType === 'zero'
                    ? 'Commute time tracked in hours only'
                    : 'Separately quantified economic time cost'}
                </p>
              </div>
            </div>

            {/* Advanced Preferences Toggle */}
            <div className="pt-3 border-t border-stone-200/80 mt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <span>Optional Utilities Customization</span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-2 pt-2 border-t border-stone-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-stone-700">Custom Monthly Utilities:</span>
                    <span className="font-mono font-semibold">
                      {preferences.customUtilitiesMonthly !== null && preferences.customUtilitiesMonthly !== undefined
                        ? `$${preferences.customUtilitiesMonthly}/mo`
                        : 'Area Average (~$120-$170)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="e.g. 150"
                      value={preferences.customUtilitiesMonthly ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                        onChange({ customUtilitiesMonthly: val });
                      }}
                      className="w-28 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                    />
                    {preferences.customUtilitiesMonthly !== null && preferences.customUtilitiesMonthly !== undefined && (
                      <button
                        type="button"
                        onClick={() => onChange({ customUtilitiesMonthly: null })}
                        className="text-[11px] text-stone-500 underline hover:text-stone-800 cursor-pointer"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">4. Compare with your current home</h3>
              <p className="mt-1 text-[11px] text-stone-600">Enter your current rent and area. We estimate commute and utilities with the same assumptions used for recommended areas.</p>
            </div>
            <span className="rounded-md border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-900">Optional comparison</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-700">Current neighbourhood</label>
              <select value={preferences.currentNeighbourhoodId || ''} onChange={(e) => onChange({ currentNeighbourhoodId: e.target.value })} className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900">
                <option value="">Choose your current area</option>
                {NEIGHBOURHOODS.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-700">Current monthly rent ($)</label>
              <input type="number" min="0" step="50" value={preferences.currentMonthlyRent ?? ''} onChange={(e) => onChange({ currentMonthlyRent: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} placeholder="e.g. 1,850" className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-700">Utilities ($/month, optional)</label>
              <input type="number" min="0" step="10" value={preferences.currentUtilitiesMonthly ?? ''} onChange={(e) => onChange({ currentUtilitiesMonthly: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} placeholder="Use area estimate" className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-700">Current home size</label>
              <select value={preferences.currentBedrooms || '1bed'} onChange={(e) => onChange({ currentBedrooms: e.target.value as BedroomType })} className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900">
                <option value="bachelor">Studio</option><option value="1bed">1 bedroom</option><option value="2bed">2 bedrooms</option><option value="3bed">3+ bedrooms</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-700">How you travel to work</label>
              <select value={preferences.currentCommuteMode || preferences.commuteMode} onChange={(e) => onChange({ currentCommuteMode: e.target.value as CommuteMode })} className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900">
                <option value="transit">Transit</option><option value="car">Car</option><option value="hybrid">Mixed transit / car</option><option value="walk_bike">Walk / bike</option>
              </select>
            </div>
          </div>
          {preferences.currentNeighbourhoodId && (() => {
            const area = NEIGHBOURHOODS.find((item) => item.id === preferences.currentNeighbourhoodId);
            const commute = area?.commutes[preferences.workplaceId];
            if (!commute) return null;
            const mode = preferences.currentCommuteMode || preferences.commuteMode;
            const minutes = mode === 'car' ? commute.carMinutes : commute.transitMinutes;
            const distance = commute.carDistanceKm;
            return <p className="mt-2 text-[10px] text-stone-500">Estimated one-way office trip from {area?.name}: {minutes} min · about {distance} km by road. Based on the selected workplace and current work-from-home schedule.</p>;
          })()}
        </div>

        {/* Active Configuration Summary Pill */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-800">Current Scope:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Destination: {selectedWorkplace.shortName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Mode: {preferences.commuteMode.toUpperCase()} ({onSiteDays}d/wk)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Housing: {currentRentMode === 'user_entered' ? (preferences.customFixedRent ? `Your Rent: $${preferences.customFixedRent}/mo` : 'Rent Unspecified') : currentRentMode === 'no_rent' ? 'No Rent (Rent-Free)' : 'Area CMHC reference'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Income: {hasIncome ? `$${annualIncomeValue.toLocaleString()}/yr` : 'Not specified'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero assumptions &bull; Driven by your inputs</span>
          </div>
        </div>
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-stone-100 pt-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-stone-500">{hasAnalyzed && !hasUnanalyzedChanges ? 'Your results are up to date.' : hasAnalyzed ? 'Your changes are ready to analyze.' : 'Your information stays private and is used to personalize this comparison.'}</p>
          <button type="button" onClick={onAnalyze} disabled={isAnalyzing} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg disabled:cursor-wait disabled:opacity-70 sm:w-auto">
            <span>{isAnalyzing ? 'Calculating routes…' : hasAnalyzed ? 'Analyze my updates' : 'Analyze my options'}</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};
