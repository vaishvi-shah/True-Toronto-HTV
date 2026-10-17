import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  Info,
  Compass,
  Building2,
  Zap,
  Dices,
  BrainCircuit,
} from 'lucide-react';
import { Header } from './components/Header';
import { UserInputBar } from './components/UserInputBar';
import { KeyFindingBanner } from './components/KeyFindingBanner';
import { NeighbourhoodCard } from './components/NeighbourhoodCard';
import { NeighbourhoodTable } from './components/NeighbourhoodTable';
import { CostBarChart } from './components/CostBarChart';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { AiWhatIfExplorer } from './components/AiWhatIfExplorer';
import { HowWeCalculatedModal } from './components/HowWeCalculatedModal';
import { TenantResourcesModal } from './components/TenantResourcesModal';
import { LivePostingsModal } from './components/LivePostingsModal';
import { SensitivityExplorer } from './components/SensitivityExplorer';
import { MonteCarloUncertaintyPanel } from './components/MonteCarloUncertaintyPanel';
import { MlRentGapEstimatorModal } from './components/MlRentGapEstimatorModal';
import { calculateNeighbourhoodCosts } from './services/calculator';
import { runMonteCarloSimulation } from './services/monteCarloSimulation';
import { CalculatedCost, UserPreferences } from './types';
import { NEIGHBOURHOODS } from './data/neighbourhoods';

export default function App() {
  // User-defined preferences (no predefined personas, rent unspecified by default)
  const [preferences, setPreferences] = useState<UserPreferences>({
    workplaceId: 'downtown-hospital',
    currentNeighbourhoodId: '',
    currentMonthlyRent: null,
    currentUtilitiesMonthly: null,
    currentCommuteMode: 'transit',
    currentBedrooms: '1bed',
    annualIncome: 55000,
    householdMembers: 1,
    bedrooms: '1bed',
    commuteMode: 'transit',
    hybridRemoteDaysPerWeek: 0,
    timeValuationRate: 0.5,
    timeValuationType: 'percent_of_wage',
    rentMode: 'cmhc_benchmark',
    customFixedRent: null, // Left unspecified until user defines it!
    customNeighbourhoodRents: {},
  });
  const [analyzedPreferences, setAnalyzedPreferences] = useState<UserPreferences | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // View state: grid | table | chart | sensitivity | uncertainty
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'chart' | 'sensitivity' | 'uncertainty'>('grid');
  const [selectedBorough, setSelectedBorough] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trueCost' | 'rent' | 'transport' | 'utilities' | 'commuteTime' | 'carbon'>('trueCost');

  // Comparison State
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  // Modals state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isTenantResourcesOpen, setIsTenantResourcesOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isLivePostingsOpen, setIsLivePostingsOpen] = useState(false);
  const [postingsModalNeighbourhoodId, setPostingsModalNeighbourhoodId] = useState<string | null>(null);
  const [isMlEstimatorOpen, setIsMlEstimatorOpen] = useState(false);
  const [mlEstimatorNeighbourhoodId, setMlEstimatorNeighbourhoodId] = useState<string | null>(null);

  // AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<{
    headline: string;
    body: string;
    cheapestRentNeighbourhood?: string;
    cheapestTrueNeighbourhood?: string;
    monthlyDifference?: number;
    timeDifferenceHours?: number;
    breakEvenNarrative?: string;
    monteCarloInsight?: string;
    tenantRightsNotice?: string;
    isAiGenerated?: boolean;
  } | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Calculate costs deterministically (instant and transparent)
  const calculatedResults = useMemo(() => {
    return analyzedPreferences ? calculateNeighbourhoodCosts(analyzedPreferences) : [];
  }, [analyzedPreferences]);

  const currentLivingCost = useMemo(() => {
    if (!analyzedPreferences?.currentNeighbourhoodId || analyzedPreferences.currentMonthlyRent == null || analyzedPreferences.currentMonthlyRent < 0) return null;
    const currentProfile: UserPreferences = {
      ...analyzedPreferences,
      bedrooms: analyzedPreferences.currentBedrooms || analyzedPreferences.bedrooms,
      commuteMode: analyzedPreferences.currentCommuteMode || analyzedPreferences.commuteMode,
      rentMode: 'cmhc_benchmark',
      customFixedRent: null,
      customNeighbourhoodRents: {
        ...(analyzedPreferences.customNeighbourhoodRents || {}),
        [analyzedPreferences.currentNeighbourhoodId]: analyzedPreferences.currentMonthlyRent,
      },
      customUtilitiesMonthly: analyzedPreferences.currentUtilitiesMonthly ?? null,
    };
    return calculateNeighbourhoodCosts(currentProfile).find((item) => item.neighbourhood.id === analyzedPreferences.currentNeighbourhoodId) || null;
  }, [analyzedPreferences]);

  // Fast Monte Carlo simulation for 80% CI bands across cards and panels
  const monteCarloSimulation = useMemo(() => {
    return analyzedPreferences ? runMonteCarloSimulation(analyzedPreferences, 1500) : null;
  }, [analyzedPreferences]);

  // Fetch AI explanation whenever preferences change
  const fetchAiExplanation = async (profile: UserPreferences = analyzedPreferences || preferences) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: profile }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setAiExplanation(data);
    } catch (err) {
      console.warn('Using client-side deterministic summary:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    let snapshot: UserPreferences = { ...preferences, customNeighbourhoodRents: { ...preferences.customNeighbourhoodRents }, routeEstimates: undefined };
    try {
      const routeResponse = await fetch('/api/routes/driving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplaceId: snapshot.workplaceId, destination: snapshot.customWorkplace ? { latitude: snapshot.customWorkplace.latitude, longitude: snapshot.customWorkplace.longitude } : undefined }),
      });
      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        snapshot = { ...snapshot, routeEstimates: routeData.estimates };
      }
    } catch (error) {
      console.warn('Using published commute estimates because live road routing is unavailable.');
    }
    const recommendedArea = calculateNeighbourhoodCosts(snapshot)[0]?.neighbourhood;
    setSelectedBorough(recommendedArea ? `area:${recommendedArea.id}` : 'all');
    setAnalyzedPreferences(snapshot);
    setAiExplanation(null);
    void fetchAiExplanation(snapshot);
    setIsAnalyzing(false);
  };

  // Preference update handler
  const handlePreferenceChange = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updated }));
  };

  // Reset preferences to clean baseline
  const handleResetPreferences = () => {
    setPreferences({
      workplaceId: 'downtown-hospital',
      currentNeighbourhoodId: '',
      currentMonthlyRent: null,
      currentUtilitiesMonthly: null,
      currentCommuteMode: 'transit',
      currentBedrooms: '1bed',
      annualIncome: null,
      householdMembers: 1,
      bedrooms: '1bed',
      commuteMode: 'transit',
      hybridRemoteDaysPerWeek: 0,
      timeValuationRate: 0.5,
      timeValuationType: 'percent_of_wage',
      rentMode: 'cmhc_benchmark',
      customFixedRent: null,
      customNeighbourhoodRents: {},
    });
    setComparedIds([]);
  };

  // Handle individual neighbourhood custom rent override
  const handleUpdateNeighbourhoodRent = (id: string, rent: number | null) => {
    setPreferences((prev) => {
      const updated = { ...(prev.customNeighbourhoodRents || {}) };
      if (rent === null || rent <= 0) {
        delete updated[id];
      } else {
        updated[id] = rent;
      }
      return {
        ...prev,
        customNeighbourhoodRents: updated,
      };
    });
  };

  const handleOpenPostingsModal = (neighbourhoodId?: string) => {
    const recommendedNeighbourhoodId = analyzedPreferences ? calculatedResults[0]?.neighbourhood.id : undefined;
    setPostingsModalNeighbourhoodId(neighbourhoodId || recommendedNeighbourhoodId || null);
    setIsLivePostingsOpen(true);
  };

  // Comparison toggles
  const handleToggleCompare = (id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id]; // keep max 3
      }
      return [...prev, id];
    });
  };

  // Filter & sort results
  const filteredResults = useMemo(() => {
    let list = [...calculatedResults];

    if (selectedBorough.startsWith('area:')) {
      const areaId = selectedBorough.slice('area:'.length);
      list = list.filter((item) => item.neighbourhood.id === areaId);
    } else if (selectedBorough !== 'all') {
      list = list.filter((item) => item.neighbourhood.borough === selectedBorough);
    }

    if (sortBy === 'rent') {
      list.sort((a, b) => (a.effectiveRent ?? 0) - (b.effectiveRent ?? 0));
    } else if (sortBy === 'transport') {
      list.sort((a, b) => a.commuteBreakdown.totalMonthlyCommuteCost - b.commuteBreakdown.totalMonthlyCommuteCost);
    } else if (sortBy === 'utilities') {
      list.sort((a, b) => a.utilitiesCost - b.utilitiesCost);
    } else if (sortBy === 'commuteTime') {
      list.sort((a, b) => a.monthlyCommuteHours - b.monthlyCommuteHours);
    } else if (sortBy === 'carbon') {
      list.sort((a, b) => a.carbonFootprintKg.total - b.carbonFootprintKg.total);
    } else {
      list.sort((a, b) => a.trueMonthlyCost - b.trueMonthlyCost);
    }

    return list;
  }, [calculatedResults, selectedBorough, sortBy]);

  const comparedCosts = useMemo(() => {
    return calculatedResults.filter((item) =>
      comparedIds.includes(item.neighbourhood.id)
    );
  }, [calculatedResults, comparedIds]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Top Header */}
      <Header
        preferences={preferences}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenTenantResources={() => setIsTenantResourcesOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenDemoListings={() => handleOpenPostingsModal()}
        onOpenMlEstimator={() => {
          setMlEstimatorNeighbourhoodId(null);
          setIsMlEstimatorOpen(true);
        }}
        onResetPreferences={handleResetPreferences}
      />

      {/* User Circumstances & Financial Configurator */}
      <UserInputBar
        preferences={preferences}
        onChange={handlePreferenceChange}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        hasAnalyzed={!!analyzedPreferences}
        hasUnanalyzedChanges={JSON.stringify(preferences) !== JSON.stringify(analyzedPreferences)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Key Finding Banner (True cost vs sticker rent insight with break-even & Monte Carlo) */}
        {!analyzedPreferences ? (
          <section className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><BrainCircuit className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Your recommendation is one click away</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">Enter your circumstances above, then select <span className="font-semibold text-emerald-800">Analyze my options</span> to see the neighbourhood that best fits your budget and commute.</p>
          </section>
        ) : (
        <>
        {JSON.stringify(preferences) !== JSON.stringify(analyzedPreferences) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span>Your details changed. Results still show your last analysis.</span><button onClick={handleAnalyze} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800">Analyze updates</button></div>
        )}
        <KeyFindingBanner
          results={calculatedResults}
          preferences={analyzedPreferences}
          currentLivingCost={currentLivingCost}
          aiExplanation={aiExplanation}
          isLoadingAi={isLoadingAi}
          onRefreshAi={() => fetchAiExplanation(analyzedPreferences)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onOpenSensitivity={() => setViewMode('sensitivity')}
          onOpenMonteCarlo={() => setViewMode('uncertainty')}
        />

        {/* View Controls & Filter Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
          {/* Borough Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Area:
            </span>
            {[
              { id: 'all', label: 'All 10 Areas' },
              { id: 'Old Toronto', label: 'Old Toronto' },
              { id: 'Scarborough', label: 'Scarborough' },
              { id: 'North York', label: 'North York' },
              { id: 'Etobicoke', label: 'Etobicoke' },
              { id: 'East York', label: 'East York' },
              { id: 'York', label: 'York' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBorough(b.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  selectedBorough === b.id
                    ? 'bg-stone-900 text-white font-semibold shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {b.label}
              </button>
            ))}
            {calculatedResults[0] && (
              <button
                onClick={() => setSelectedBorough(`area:${calculatedResults[0].neighbourhood.id}`)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${selectedBorough === `area:${calculatedResults[0].neighbourhood.id}` ? 'bg-emerald-800 text-white font-semibold shadow-xs' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'}`}
                title="Show only the recommended neighbourhood"
              >
                Recommended: {calculatedResults[0].neighbourhood.name}
              </button>
            )}
          </div>

          {/* Sort & View Mode Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <label htmlFor="sort-select" className="font-medium">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                <option value="trueCost">True Monthly Cost (Lowest)</option>
                <option value="rent">Housing / Rent (Lowest)</option>
                <option value="transport">Transportation (Lowest)</option>
                <option value="utilities">Utilities (Lowest)</option>
                <option value="commuteTime">Travel Time (Shortest)</option>
                <option value="carbon">Lowest Carbon Footprint</option>
              </select>
            </div>

            {/* View Mode Switcher: Cards vs Table vs Stacked Chart vs Sensitivity vs Uncertainty */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl border border-stone-300 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Comparison Table Matrix"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'chart'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Stacked Cost Chart"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">Chart</span>
              </button>
              <button
                onClick={() => setViewMode('sensitivity')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'sensitivity'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
                title="Sensitivity & Break-Even Analysis (Parameter Sweeps)"
              >
                <Zap className="w-4 h-4" />
                <span className="text-[11px]">Break-Even</span>
              </button>
              <button
                onClick={() => setViewMode('uncertainty')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'uncertainty'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-indigo-800 hover:text-indigo-950'
                }`}
                title="Monte Carlo Uncertainty Bands (2,000 Simulations)"
              >
                <Dices className="w-4 h-4" />
                <span className="text-[11px]">Monte Carlo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Container */}
        {viewMode === 'sensitivity' ? (
          <div className="mb-16">
            <SensitivityExplorer
              preferences={analyzedPreferences}
              results={calculatedResults}
              onApplyPreference={handlePreferenceChange}
            />
          </div>
        ) : viewMode === 'uncertainty' ? (
          <div className="mb-16">
            <MonteCarloUncertaintyPanel
              preferences={analyzedPreferences}
              results={calculatedResults}
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredResults.map((cost) => (
              <NeighbourhoodCard
                key={cost.neighbourhood.id}
                cost={cost}
                preferences={analyzedPreferences}
                isCompared={comparedIds.includes(cost.neighbourhood.id)}
                onToggleCompare={handleToggleCompare}
                onSelectForDetails={() => {}}
                onUpdateNeighbourhoodRent={handleUpdateNeighbourhoodRent}
                onOpenPostingsModal={handleOpenPostingsModal}
                onOpenMlEstimator={(id) => {
                  setMlEstimatorNeighbourhoodId(id);
                  setIsMlEstimatorOpen(true);
                }}
                monteCarloRange={
                  monteCarloSimulation?.neighbourhoodStats[cost.neighbourhood.id]?.confidenceInterval80
                }
              />
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <div className="mb-16">
            <NeighbourhoodTable
              results={filteredResults}
              preferences={analyzedPreferences}
              comparedIds={comparedIds}
              onToggleCompare={handleToggleCompare}
              onUpdateNeighbourhoodRent={handleUpdateNeighbourhoodRent}
              onOpenPostingsModal={handleOpenPostingsModal}
              getMonteCarloRange={(id) =>
                monteCarloSimulation?.neighbourhoodStats[id]?.confidenceInterval80
              }
            />
          </div>
        ) : (
          <div className="mb-16">
            <CostBarChart results={filteredResults} maxDisplay={10} />
          </div>
        )}

        {/* Civic Integrity Pledge Section */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs mb-12">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">
                Civic Transparency &amp; Non-Assumptive Methodology
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-4xl">
                TrueRent Toronto is built for renters, commuters, and families. We do not categorize you into predefined personas or silently assume what rent you pay. The rent calculator uses Statistics Canada’s quarterly Toronto CMA estimates. Demo listing examples are generated around those published averages and do not represent real available units.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-4 text-xs font-semibold text-emerald-800">
                <button
                  onClick={() => handleOpenPostingsModal()}
                  className="hover:underline flex items-center gap-1.5 cursor-pointer text-amber-800"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Browse demo rent examples
                </button>
                <button
                  onClick={() => setIsMethodologyOpen(true)}
                  className="hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  Read full calculation formulas and data sources
                </button>
                <button
                  onClick={() => setIsTenantResourcesOpen(true)}
                  className="hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Access Tenant Rights Hotline &amp; FMTA Advocacy
                </button>
              </div>
            </div>
          </div>
        </section>
        </>
        )}
      </main>

      {/* Floating Bottom Comparison Drawer (when neighbourhoods are selected) */}
      <ComparisonDrawer
        comparedCosts={comparedCosts}
        preferences={preferences}
        onRemove={handleToggleCompare}
        onClear={() => setComparedIds([])}
        onOpenPostingsModal={handleOpenPostingsModal}
      />

      {/* AI What-If Scenario Modal */}
      <AiWhatIfExplorer
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        currentPreferences={preferences}
        onApplyScenario={(patch) => {
          handlePreferenceChange(patch);
        }}
      />

      {/* Live Postings Modal */}
      <LivePostingsModal
        isOpen={isLivePostingsOpen}
        onClose={() => setIsLivePostingsOpen(false)}
        preferences={preferences}
        selectedNeighbourhoodId={postingsModalNeighbourhoodId}
        onApplyNeighbourhoodRent={handleUpdateNeighbourhoodRent}
      />

      {/* Methodology & Data Sources Modal */}
      <HowWeCalculatedModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Tenant Resources Modal */}
      <TenantResourcesModal
        isOpen={isTenantResourcesOpen}
        onClose={() => setIsTenantResourcesOpen(false)}
      />

      {/* ML Rent Gap Estimator Modal */}
      <MlRentGapEstimatorModal
        isOpen={isMlEstimatorOpen}
        onClose={() => setIsMlEstimatorOpen(false)}
        onApplyNeighbourhoodRent={handleUpdateNeighbourhoodRent}
        defaultNeighbourhoodId={mlEstimatorNeighbourhoodId || undefined}
        defaultBedrooms={preferences.bedrooms}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 px-4 sm:px-6 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-stone-200">TrueRent Toronto</span>
            <span>&bull; Public Housing &amp; Commute Intelligence</span>
          </div>
          <div className="text-stone-400 text-center md:text-right">
            <span>Statistics Canada Quarterly Rent Statistics &bull; Demo examples, not live listings &bull; City of Toronto Open Data &bull; TTC GTFS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
