import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Sparkles,
  Scale,
  RotateCw,
  Info,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Header } from './components/Header';
import { UserInputBar } from './components/UserInputBar';
import { KeyFindingBanner } from './components/KeyFindingBanner';
import { NeighbourhoodCard } from './components/NeighbourhoodCard';
import { NeighbourhoodTable } from './components/NeighbourhoodTable';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { AiWhatIfExplorer } from './components/AiWhatIfExplorer';
import { HowWeCalculatedModal } from './components/HowWeCalculatedModal';
import { TenantResourcesModal } from './components/TenantResourcesModal';
import { PERSONA_PRESETS } from './data/neighbourhoods';
import { calculateNeighbourhoodCosts } from './services/calculator';
import {
  CalculatedCost,
  PersonaPreset,
  UserPreferences,
} from './types';

export default function App() {
  // Default preferences (defaults to Hospital Support Worker scenario)
  const [preferences, setPreferences] = useState<UserPreferences>({
    workplaceId: 'downtown-hospital',
    annualIncome: 40000,
    householdMembers: 1,
    bedrooms: '1bed',
    commuteMode: 'transit',
    hybridRemoteDaysPerWeek: 0,
    timeValuationRate: 0.5,
  });

  const [activePersonaId, setActivePersonaId] = useState<string | null>(
    'hospital-worker'
  );

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedBorough, setSelectedBorough] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trueCost' | 'rent' | 'commuteTime' | 'carbon'>('trueCost');

  // Comparison State
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  // Modals state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isTenantResourcesOpen, setIsTenantResourcesOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<{
    headline: string;
    body: string;
    cheapestRentNeighbourhood?: string;
    cheapestTrueNeighbourhood?: string;
    monthlyDifference?: number;
    timeDifferenceHours?: number;
    tenantRightsNotice?: string;
    isAiGenerated?: boolean;
  } | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Calculate costs deterministically (instant and consistent)
  const calculatedResults = useMemo(() => {
    return calculateNeighbourhoodCosts(preferences);
  }, [preferences]);

  // Fetch AI explanation whenever preferences change
  const fetchAiExplanation = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setAiExplanation(data);
    } catch (err) {
      console.warn('Using client-side fallback summary:', err);
      // Fallback is handled gracefully by server or KeyFindingBanner
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAiExplanation();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    preferences.workplaceId,
    preferences.annualIncome,
    preferences.bedrooms,
    preferences.commuteMode,
    preferences.hybridRemoteDaysPerWeek,
  ]);

  // Persona handler
  const handleSelectPersona = (persona: PersonaPreset) => {
    setActivePersonaId(persona.id);
    setPreferences((prev) => ({
      ...prev,
      workplaceId: persona.workplaceId,
      annualIncome: persona.income,
      householdMembers: persona.householdMembers,
      bedrooms: persona.bedrooms,
      commuteMode: persona.commuteMode,
      hybridRemoteDaysPerWeek: persona.hybridDays,
    }));
  };

  // Preference update handler
  const handlePreferenceChange = (updated: Partial<UserPreferences>) => {
    setActivePersonaId(null); // Clear persona highlight if user customizes
    setPreferences((prev) => ({ ...prev, ...updated }));
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

    if (selectedBorough !== 'all') {
      list = list.filter((item) => item.neighbourhood.borough === selectedBorough);
    }

    if (sortBy === 'rent') {
      list.sort((a, b) => a.stickerRent - b.stickerRent);
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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        preferences={preferences}
        onSelectPersona={handleSelectPersona}
        activePersonaId={activePersonaId}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenTenantResources={() => setIsTenantResourcesOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
      />

      {/* 3 User Inputs Bar */}
      <UserInputBar
        preferences={preferences}
        onChange={handlePreferenceChange}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Persona Story Alert if active */}
        {activePersonaId && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">
                {PERSONA_PRESETS.find((p) => p.id === activePersonaId)?.avatar}
              </span>
              <div>
                <strong className="font-bold text-emerald-900 block sm:inline mr-1">
                  Persona View: {PERSONA_PRESETS.find((p) => p.id === activePersonaId)?.title}
                </strong>
                <span>
                  {PERSONA_PRESETS.find((p) => p.id === activePersonaId)?.story}
                </span>
                <p className="mt-1 font-medium text-emerald-800">
                  💡 <em>Key Insight:</em> {PERSONA_PRESETS.find((p) => p.id === activePersonaId)?.insight}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePersonaId(null)}
              className="text-emerald-800 hover:text-emerald-950 text-xs font-semibold underline shrink-0 cursor-pointer"
            >
              Reset to custom
            </button>
          </div>
        )}

        {/* Key Finding Banner (Sticker rent vs True cost reveal + Gemini explanation) */}
        <KeyFindingBanner
          results={calculatedResults}
          preferences={preferences}
          aiExplanation={aiExplanation}
          isLoadingAi={isLoadingAi}
          onRefreshAi={fetchAiExplanation}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
        />

        {/* View Controls & Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Borough:
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedBorough === b.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <label htmlFor="sort-select" className="font-medium">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="trueCost">True Monthly Cost (Cheapest)</option>
                <option value="rent">Sticker Rent Only</option>
                <option value="commuteTime">Commute Travel Time</option>
                <option value="carbon">Lowest Carbon Footprint</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg border border-stone-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Table Comparison Matrix"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Container */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredResults.map((cost) => (
              <NeighbourhoodCard
                key={cost.neighbourhood.id}
                cost={cost}
                preferences={preferences}
                isCompared={comparedIds.includes(cost.neighbourhood.id)}
                onToggleCompare={handleToggleCompare}
                onSelectForDetails={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="mb-16">
            <NeighbourhoodTable
              results={filteredResults}
              preferences={preferences}
              comparedIds={comparedIds}
              onToggleCompare={handleToggleCompare}
            />
          </div>
        )}

        {/* Educational Callout: Anti-AI-Slop & Civic Fairness Pledge */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs mb-12">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">
                Built for Civic Honesty &amp; Fairness
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-4xl">
                This app is intentionally built for renters on tight budgets. All calculations use fixed, publicly cited data formulas from the City of Toronto and CMHC. Google Gemini is utilized solely as a natural language explainer—it never calculates math, invents rental pricing, or predicts tenant eviction. When public sensor records are missing, we explicitly label &ldquo;no data&rdquo; rather than fabricate metrics.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-emerald-800">
                <button
                  onClick={() => setIsMethodologyOpen(true)}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  Read full methodology and calculations
                </button>
                <button
                  onClick={() => setIsTenantResourcesOpen(true)}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  View Tenant Advocacy &amp; FMTA Hotlines
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Comparison Drawer (if user selected cards) */}
      <ComparisonDrawer
        comparedCosts={comparedCosts}
        preferences={preferences}
        onRemove={handleToggleCompare}
        onClear={() => setComparedIds([])}
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

      {/* How We Calculated This Modal */}
      <HowWeCalculatedModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Tenant Resources & Legal Rights Modal */}
      <TenantResourcesModal
        isOpen={isTenantResourcesOpen}
        onClose={() => setIsTenantResourcesOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 px-4 sm:px-6 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-stone-200">TrueRent Toronto</span>
            <span>&bull; Hackathon Civic Housing Edition</span>
          </div>
          <div className="text-stone-400 text-center md:text-right">
            <span>CMHC Rental Market Survey &bull; City of Toronto Open Data &bull; TRCA Floodplain Maps &bull; TTC Schedules</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
