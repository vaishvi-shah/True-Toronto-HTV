import React, { useState } from 'react';
import {
  Clock,
  Car,
  Bus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Leaf,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  RotateCcw,
  Database,
  Building2,
  ExternalLink,
  Sparkles,
  MapPin,
  ShieldCheck,
  ChevronRight,
  BrainCircuit,
  Dices,
} from 'lucide-react';
import { buildPlatformSearchUrls, getPostingsForNeighbourhood } from '../data/listings';
import { CalculatedCost, UserPreferences } from '../types';
import { RiskBadge } from './RiskBadge';

interface NeighbourhoodCardProps {
  cost: CalculatedCost;
  preferences: UserPreferences;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
  onSelectForDetails?: (id: string) => void;
  onUpdateNeighbourhoodRent?: (id: string, rent: number | null) => void;
  onOpenPostingsModal?: (id: string) => void;
  onOpenMlEstimator?: (id: string) => void;
  monteCarloRange?: [number, number];
}

export const NeighbourhoodCard: React.FC<NeighbourhoodCardProps> = ({
  cost: b,
  preferences,
  isCompared,
  onToggleCompare,
  onUpdateNeighbourhoodRent,
  onOpenPostingsModal,
  onOpenMlEstimator,
  monteCarloRange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPostings, setShowPostings] = useState(false);
  const [isEditingRent, setIsEditingRent] = useState(false);
  const [tempRentInput, setTempRentInput] = useState<number>(b.effectiveRent ?? b.originalMarketRent);

  const n = b.neighbourhood;

  // Attached postings from HouseSigma, Realtor.ca, Zillow, Rentals.ca
  const attachedPostings = getPostingsForNeighbourhood(n.id, preferences.bedrooms);
  const searchUrls = buildPlatformSearchUrls(n.name, preferences.bedrooms);

  const handleSaveCustomRent = () => {
    if (onUpdateNeighbourhoodRent) {
      onUpdateNeighbourhoodRent(n.id, tempRentInput > 0 ? tempRentInput : null);
    }
    setIsEditingRent(false);
  };

  const handleResetRent = () => {
    if (onUpdateNeighbourhoodRent) {
      onUpdateNeighbourhoodRent(n.id, null);
    }
    setTempRentInput(b.originalMarketRent);
    setIsEditingRent(false);
  };

  // Rank shift indicator
  const rankShiftLabel =
    b.rankShift > 0 ? (
      <span className="flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
        +{b.rankShift} ranks higher under true cost
      </span>
    ) : b.rankShift < 0 ? (
      <span className="flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
        {b.rankShift} ranks lower under true cost
      </span>
    ) : (
      <span className="flex items-center text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 mr-0.5" />
        Same rank as sticker rent
      </span>
    );

  const commuteDetail = n.commutes[preferences.workplaceId] || {
    transitMinutes: 45,
    transitTransfers: 1,
    transitRouteDescription: 'Standard TTC route',
    carMinutes: 35,
    carDistanceKm: 18,
  };

  const isRentUnspecified = b.rentStatus === 'unspecified';
  const isRentFree = b.rentStatus === 'no_rent';

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
        isCompared
          ? 'border-emerald-600 ring-2 ring-emerald-500/20'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-xl bg-stone-900 text-white font-mono text-xs font-bold shadow-xs shrink-0"
              title={`True Cost Rank #${b.trueCostRank}`}
            >
              #{b.trueCostRank}
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                {n.name}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {n.borough}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleCompare(n.id)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              isCompared
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Comparing</span>
              </>
            ) : (
              <span>+ Compare</span>
            )}
          </button>
        </div>

        {/* Rank shift comparison pill */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {rankShiftLabel}
          <span className="text-[11px] text-stone-400 font-mono">
            Rent Rank: #{b.rentRank}
          </span>
        </div>
      </div>

      {/* Main Numbers: True Monthly Out-of-Pocket Cost */}
      <div className="p-4 sm:p-5 bg-stone-50/60">
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              True Monthly Cost
            </div>
            <div className="text-2xl font-extrabold text-stone-900 font-mono tracking-tight mt-0.5">
              ${b.trueMonthlyCost.toLocaleString()}
              <span className="text-xs font-normal text-stone-500"> /mo</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {isRentFree
                ? 'Commute + Utilities only'
                : isRentUnspecified
                ? 'Commute + Utilities (rent unspecified)'
                : 'Rent + Commute + Utilities'}
            </div>
            {monteCarloRange && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                <Dices className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>80% CI: ${monteCarloRange[0].toLocaleString()}–${monteCarloRange[1].toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Housing / Rent Section */}
          <div className="border-l border-stone-200 pl-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Housing / Rent
                </span>

                <div className="flex items-center gap-1">
                  {onOpenMlEstimator && !isRentFree && (
                    <button
                      type="button"
                      onClick={() => onOpenMlEstimator(b.neighbourhood.id)}
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5 cursor-pointer bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200"
                      title="Estimate rent for unit gaps using Multivariable Linear Regression"
                    >
                      <BrainCircuit className="w-2.5 h-2.5 text-purple-600" />
                      <span>ML Gap</span>
                    </button>
                  )}

                  {!isEditingRent && onUpdateNeighbourhoodRent && !isRentFree && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempRentInput(b.effectiveRent ?? b.originalMarketRent);
                        setIsEditingRent(true);
                      }}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200"
                      title="Customize rent for this specific neighbourhood"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{b.isCustomRent ? 'Edit' : isRentUnspecified ? 'Enter Rent' : 'Custom'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditingRent ? (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-600">$</span>
                    <input
                      type="number"
                      min="0"
                      max="15000"
                      step="25"
                      value={tempRentInput}
                      onChange={(e) => setTempRentInput(Number(e.target.value))}
                      className="w-24 bg-white border border-emerald-400 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                    <span className="text-[10px] text-stone-400">/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCustomRent}
                      className="px-2 py-0.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingRent(false)}
                      className="px-2 py-0.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-0.5">
                  {isRentFree ? (
                    <div>
                      <div className="text-base font-bold font-mono text-stone-700">$0 /mo</div>
                      <span className="text-[10px] text-stone-500">Living rent-free</span>
                    </div>
                  ) : isRentUnspecified ? (
                    <div>
                      <div className="text-sm font-semibold text-amber-700">Unspecified</div>
                      <span className="text-[10px] text-stone-500">Not included in total</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold font-mono text-stone-900">
                        ${b.effectiveRent?.toLocaleString()}
                        <span className="text-xs font-normal text-stone-500"> /mo</span>
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1 flex-wrap">
                        {b.isCustomRent ? (
                          <>
                            <span className="text-emerald-800 font-semibold bg-emerald-50 px-1 rounded-sm">
                              Your Rent
                            </span>
                            <button
                              type="button"
                              onClick={handleResetRent}
                              className="text-[10px] text-stone-400 hover:text-stone-700 underline flex items-center gap-0.5 cursor-pointer ml-1"
                              title="Reset to survey median"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              CMHC: ${b.originalMarketRent}
                            </button>
                          </>
                        ) : (
                          <span>CMHC Benchmark ({preferences.bedrooms})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Line Items */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Housing
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              {b.effectiveRent !== null ? `$${b.effectiveRent.toLocaleString()}` : '—'}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Commute
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${b.commuteBreakdown.totalMonthlyCommuteCost.toLocaleString()}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200/80">
            <span className="block text-[10px] uppercase font-semibold text-stone-400">
              Utilities
            </span>
            <span className="text-xs font-bold font-mono text-stone-800">
              ${b.utilitiesCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Income burden indicator or missing info message */}
        <div className="mt-3 flex items-center justify-between text-xs">
          {b.incomeSharePercent !== null ? (
            <>
              <span className="text-stone-600">
                Gross Income Share: <strong className="text-stone-900">{b.incomeSharePercent}%</strong>
              </span>
              {b.isSeverelyBurdened ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  Severe Burden (&gt;50%)
                </span>
              ) : b.isRentBurdened ? (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Rent Burdened (&gt;30%)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Affordable Ratio (&le;30%)
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-stone-400 italic">
              Income not provided &bull; Burden ratio uncalculated
            </span>
          )}
        </div>
      </div>

      {/* --- ATTACHED POSTINGS SECTION (HouseSigma / Realtor.ca / Zillow) --- */}
      <div className="border-t border-b border-stone-200 bg-amber-50/30">
        <div className="p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900">
                  Attached Live Postings
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                  {attachedPostings.length}
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                HouseSigma, Realtor.ca &amp; Zillow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPostings(!showPostings)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span>{showPostings ? 'Hide Postings' : 'View Postings'}</span>
              {showPostings ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              )}
            </button>

            {onOpenPostingsModal && (
              <button
                type="button"
                onClick={() => onOpenPostingsModal(n.id)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-white/80 transition-colors cursor-pointer"
                title="Open full listings browser"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Postings Drawer */}
        {showPostings && (
          <div className="p-3.5 pt-0 space-y-3 animate-in fade-in duration-150">
            {attachedPostings.slice(0, 2).map((posting) => {
              const isApplied = b.effectiveRent === posting.monthlyRent;
              return (
                <div
                  key={posting.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={posting.imageUrl}
                      alt={posting.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-200"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                          {posting.platform === 'housesigma'
                            ? 'HouseSigma'
                            : posting.platform === 'zillow'
                            ? 'Zillow'
                            : posting.platform === 'realtor'
                            ? 'Realtor.ca'
                            : 'Rentals.ca'}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900">
                          ${posting.monthlyRent.toLocaleString()}
                          <span className="text-[10px] font-normal text-stone-400">/mo</span>
                        </span>
                      </div>

                      <h5 className="text-xs font-semibold text-stone-900 truncate mt-1">
                        {posting.title}
                      </h5>

                      <div className="text-[10px] text-stone-500 flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-stone-400" />
                        <span>{posting.address} {posting.unit || ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]">
                    {posting.rentControlStatus === 'protected_pre_2018' ? (
                      <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Rent Controlled
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-800 font-medium">
                        Exempt Post-2018
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {onUpdateNeighbourhoodRent && !isRentFree && (
                        <button
                          type="button"
                          onClick={() => onUpdateNeighbourhoodRent(n.id, posting.monthlyRent)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            isApplied
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                          title="Adopt this rent into this neighbourhood's true cost calculation"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{isApplied ? 'Applied' : 'Adopt Rent'}</span>
                        </button>
                      )}

                      <a
                        href={posting.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Platform Quick Links */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500">
              <span className="text-[10px]">Direct search:</span>
              <div className="flex items-center gap-2">
                <a
                  href={searchUrls.houseSigma}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-800 font-medium flex items-center gap-0.5 underline cursor-pointer"
                >
                  HouseSigma ↗
                </a>
                <span>&bull;</span>
                <a
                  href={searchUrls.zillow}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 font-medium flex items-center gap-0.5 underline cursor-pointer"
                >
                  Zillow ↗
                </a>
                <span>&bull;</span>
                <a
                  href={searchUrls.realtorCa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-700 font-medium flex items-center gap-0.5 underline cursor-pointer"
                >
                  Realtor.ca ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Value of Your Time: Separated out so it never silently inflates out-of-pocket cash */}
      <div className="p-3.5 sm:p-4 bg-stone-50 border-b border-stone-200/80">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Commute Time Economic Valuation</span>
          </div>
          <span className="text-xs font-mono font-bold text-stone-900">
            {b.timeCostMonthly > 0 ? `+$${b.timeCostMonthly.toLocaleString()}/mo` : `${b.monthlyCommuteHours} hrs/mo`}
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
          {b.monthlyCommuteHours} hrs/mo travel time ({commuteDetail.transitMinutes || commuteDetail.carMinutes} min one-way).
          {b.timeCostMonthly > 0
            ? ` Quantified separately as economic time value.`
            : ` (Monetization disabled or rate unspecified).`}
        </p>
      </div>

      {/* Commute and Carbon footprint */}
      <div className="p-4 sm:p-5 border-b border-stone-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-700 flex items-center gap-1.5">
            {preferences.commuteMode === 'car' ? (
              <Car className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Commute Details:</span>
          </span>
          <span className="font-medium text-stone-800">
            {preferences.commuteMode === 'car'
              ? `${commuteDetail.carMinutes} mins (${commuteDetail.carDistanceKm} km each way)`
              : `${commuteDetail.transitMinutes} mins (${commuteDetail.transitTransfers} transfer)`}
          </span>
        </div>

        {/* Carbon Footprint */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-100">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            Carbon Footprint:
          </span>
          <span className="font-mono text-stone-700">
            <strong>{b.carbonFootprintKg.total}</strong> kg CO₂e / mo
          </span>
        </div>
      </div>

      {/* Climate Risk Badges & Displacement Flag */}
      <div className="p-4 sm:p-5 space-y-2 flex-1">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Climate Exposure &amp; Tenant Displacement
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <RiskBadge
            type="flood"
            level={n.floodRisk.level}
            label={n.floodRisk.level}
            details={`${n.floodRisk.watershed} - ${n.floodRisk.details}`}
          />
          <RiskBadge
            type="heat"
            level={n.heatRisk.level}
            label={n.heatRisk.level}
            details={n.heatRisk.details}
            subValue={n.heatRisk.canopyCoverPercent}
          />
        </div>

        <RiskBadge
            type="displacement"
            level={n.displacementFlag.level}
            label={n.displacementFlag.label}
            details={n.displacementFlag.details}
            subValue={n.displacementFlag.turnoverGapPercent}
          />
      </div>

      {/* Collapsible Provenance Drawer */}
      <div className="border-t border-stone-200 mt-auto">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50/80 hover:bg-stone-100 flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-stone-500" />
            <span>Public Data Citations</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 bg-stone-50 text-[11px] text-stone-600 space-y-2 border-t border-stone-200">
            <div>
              <strong className="text-stone-800">Rent Survey:</strong> {n.provenance.rentSource} ({n.provenance.rentDate}).
            </div>
            <div>
              <strong className="text-stone-800">Transit:</strong> {n.provenance.transitSource} &bull; Route: {commuteDetail.transitRouteDescription}.
            </div>
            <div>
              <strong className="text-stone-800">Flood Data:</strong> {n.floodRisk.source} ({n.floodRisk.sourceDate}). Watershed: {n.floodRisk.watershed}.
            </div>
            <div>
              <strong className="text-stone-800">Heat / Canopy:</strong> {n.heatRisk.source} ({n.heatRisk.sourceDate}).
              {n.heatRisk.canopyCoverPercent === null && (
                <span className="text-amber-800 ml-1">Sensor canopy is &quot;no data&quot; for this zone.</span>
              )}
            </div>
            <div>
              <strong className="text-stone-800">Displacement Gap:</strong> {n.displacementFlag.source}. Turnover spread: +{n.displacementFlag.turnoverGapPercent}%.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
