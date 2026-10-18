import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Compass,
  ArrowUpDown,
  LayoutGrid,
  ShieldCheck,
  Table as TableIcon,
} from 'lucide-react';
import { HousingStep, IncomeStep, Overture, ReviewStep, WorkStep } from './steps';
import { KeyFindingBanner } from '../components/KeyFindingBanner';
import { ResultsLedger } from '../components/ResultsLedger';
import { NeighbourhoodTable } from '../components/NeighbourhoodTable';
import { CostBarChart } from '../components/CostBarChart';
import { ComparisonDrawer } from '../components/ComparisonDrawer';
import { AiWhatIfExplorer } from '../components/AiWhatIfExplorer';
import { HowWeCalculatedModal } from '../components/HowWeCalculatedModal';
import { TenantResourcesModal } from '../components/TenantResourcesModal';
import { LivePostingsModal } from '../components/LivePostingsModal';
import { AnalysisNeighbourhoodMap } from '../components/AnalysisNeighbourhoodMap';
import { calculateNeighbourhoodCosts } from '../services/calculator';
import { CalculatedCost, UserPreferences } from '../types';
import './journey.css';

type Stage = 'overture' | 'work' | 'housing' | 'income' | 'review' | 'processing' | 'results';

const STAGE_META: Array<{ id: Stage; label: string; action: string }> = [
  { id: 'overture', label: 'Overture', action: 'Begin' },
  { id: 'work', label: 'Work & travel', action: 'Continue' },
  { id: 'housing', label: 'Housing & rent', action: 'Continue' },
  { id: 'income', label: 'Income & time', action: 'Continue' },
  { id: 'review', label: 'Review', action: 'Analyze my options' },
  { id: 'processing', label: 'Analysis', action: '' },
  { id: 'results', label: 'Results', action: '' },
];

const CLEAN_PREFS: UserPreferences = {
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
  customFixedRent: null,
  customNeighbourhoodRents: {},
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface AiError {
  status: number | string;
  code: string;
  message: string;
}

interface AiExplanation {
  headline: string;
  body: string;
  cheapestRentNeighbourhood?: string;
  cheapestTrueNeighbourhood?: string;
  cheapestTrueMonthlyCost?: number;
  cheapestTrueRent?: number | null;
  monthlyDifference?: number;
  timeDifferenceHours?: number;
  tenantRightsNotice?: string;
  isAiGenerated?: boolean;
}

export const Journey: React.FC = () => {
  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const [stage, setStage] = useState<Stage>('overture');
  const [prefs, setPrefs] = useState<UserPreferences>(CLEAN_PREFS);
  const [analyzed, setAnalyzed] = useState<UserPreferences | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
  const [aiError, setAiError] = useState<AiError | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'chart'>('grid');
  const [sortBy, setSortBy] = useState<'totalImpact' | 'trueCost' | 'rent' | 'transport' | 'utilities' | 'commuteTime' | 'carbon'>('totalImpact');
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isPostingsOpen, setIsPostingsOpen] = useState(false);
  const [postingsId, setPostingsId] = useState<string | null>(null);

  const sceneRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<1 | -1>(1);
  const navBusy = useRef(false);
  const runToken = useRef(0);
  const liveRef = useRef<HTMLDivElement>(null);

  const stageIdx = STAGE_META.findIndex((s) => s.id === stage);
  const patch = useCallback(
    (p: Partial<UserPreferences>) => setPrefs((prev) => ({ ...prev, ...p })),
    []
  );

  /* ---------- scene transitions ---------- */
  const go = useCallback(
    (to: Stage) => {
      if (navBusy.current || to === stage) return;
      const fromIdx = STAGE_META.findIndex((s) => s.id === stage);
      const toIdx = STAGE_META.findIndex((s) => s.id === to);
      dirRef.current = toIdx >= fromIdx ? 1 : -1;
      const scene = sceneRef.current;
      if (!scene || reduceMotion) {
        setStage(to);
        return;
      }
      navBusy.current = true;
      gsap.to(scene, {
        autoAlpha: 0,
        x: -26 * dirRef.current,
        duration: 0.28,
        ease: 'power3.in',
        onComplete: () => {
          setStage(to);
          navBusy.current = false;
        },
      });
    },
    [stage, reduceMotion]
  );

  useEffect(() => {
    const scene = sceneRef.current;
    if (liveRef.current) liveRef.current.textContent = `Stage ${stageIdx + 1} of ${STAGE_META.length}: ${STAGE_META[stageIdx].label}`;
    const heading = scene?.querySelector('h1, h2');
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });
    if (!scene || reduceMotion) return;
    gsap.fromTo(
      scene,
      { autoAlpha: 0, x: 30 * dirRef.current },
      { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power4.out' }
    );
    const items = scene.querySelectorAll('[data-scene-item]');
    if (items.length) {
      gsap.fromTo(
        items,
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power4.out', stagger: 0.07, delay: 0.08 }
      );
    }
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        scaleX: stageIdx / (STAGE_META.length - 1),
        duration: 0.6,
        ease: 'power3.out',
      });
    }
  }, [stage, stageIdx, reduceMotion]);

  /* ---------- derived results ---------- */
  const results: CalculatedCost[] = useMemo(
    () => (analyzed ? calculateNeighbourhoodCosts(analyzed) : []),
    [analyzed]
  );
  const currentLivingCost = useMemo(() => {
    if (!analyzed?.currentNeighbourhoodId || analyzed.currentMonthlyRent == null || analyzed.currentMonthlyRent < 0) return null;
    const profile: UserPreferences = {
      ...analyzed,
      bedrooms: analyzed.currentBedrooms || analyzed.bedrooms,
      commuteMode: analyzed.currentCommuteMode || analyzed.commuteMode,
      rentMode: 'cmhc_benchmark',
      customFixedRent: null,
      customNeighbourhoodRents: {
        ...(analyzed.customNeighbourhoodRents || {}),
        [analyzed.currentNeighbourhoodId]: analyzed.currentMonthlyRent,
      },
      customUtilitiesMonthly: analyzed.currentUtilitiesMonthly ?? null,
    };
    return calculateNeighbourhoodCosts(profile).find((i) => i.neighbourhood.id === analyzed.currentNeighbourhoodId) || null;
  }, [analyzed]);
  const filtered = useMemo(() => {
    const list = [...results];
    const out = list;
    const key = sortBy;
    out.sort((a, b) =>
      key === 'totalImpact' ? a.totalImpactMonthly - b.totalImpactMonthly
      : key === 'rent' ? (a.effectiveRent ?? 0) - (b.effectiveRent ?? 0)
      : key === 'transport' ? a.commuteBreakdown.totalMonthlyCommuteCost - b.commuteBreakdown.totalMonthlyCommuteCost
      : key === 'utilities' ? a.utilitiesCost - b.utilitiesCost
      : key === 'commuteTime' ? a.monthlyCommuteHours - b.monthlyCommuteHours
      : key === 'carbon' ? a.carbonFootprintKg.total - b.carbonFootprintKg.total
      : a.trueMonthlyCost - b.trueMonthlyCost
    );
    return out;
  }, [results, sortBy]);
  const compared = useMemo(() => results.filter((i) => comparedIds.includes(i.neighbourhood.id)), [results, comparedIds]);

  const toggleCompare = useCallback((id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);
  const updateRent = useCallback((id: string, rent: number | null) => {
    const applyRent = (prev: UserPreferences | null) => {
      if (!prev) return prev;
      const next = { ...(prev.customNeighbourhoodRents || {}) };
      if (rent === null || rent <= 0) delete next[id];
      else next[id] = rent;
      return { ...prev, customNeighbourhoodRents: next };
    };
    setPrefs((prev) => applyRent(prev)!);
    setAnalyzed((prev) => applyRent(prev));
  }, []);
  const openPostings = useCallback(
    (id?: string) => {
      setPostingsId(id || results[0]?.neighbourhood.id || null);
      setIsPostingsOpen(true);
    },
    [results]
  );

  /* ---------- honest processing: each phase is a real operation ---------- */
  const runAnalysis = useCallback(async () => {
    const token = ++runToken.current;
    const dwell = reduceMotion ? 0 : 620;
    const snapshot: UserPreferences = {
      ...prefs,
      customNeighbourhoodRents: { ...prefs.customNeighbourhoodRents },
      routeEstimates: undefined,
    };
    setPhaseIdx(0);
    setStage('processing');
    // Phase 1 · routes (real network call, TTC fallback on failure)
    setPhaseIdx(1);
    try {
      const res = await fetch('/api/routes/driving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplaceId: snapshot.workplaceId }),
      });
      if (token !== runToken.current) return;
      if (res.ok) {
        const data = await res.json();
        snapshot.routeEstimates = data.estimates;
      }
    } catch {
      /* published estimates stand in */
    }
    if (dwell) await delay(dwell);
    if (token !== runToken.current) return;
    // Phase 2 · engine
    setPhaseIdx(2);
    calculateNeighbourhoodCosts(snapshot);
    setAnalyzed(snapshot);
    if (dwell) await delay(dwell);
    if (token !== runToken.current) return;
    // Phase 3 · explain (live Gemini call; the API returns a calculated
    // fallback when narration is unavailable)
    setPhaseIdx(3);
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: snapshot }),
      });
      if (token !== runToken.current) return;
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setAiExplanation(data);
        setAiError(null);
      } else {
        setAiExplanation(null);
        setAiError(
          data?.error ?? {
            status: res.status,
            code: `HTTP_${res.status}`,
            message: 'Gemini narration request failed',
          }
        );
      }
    } catch (err) {
      if (token === runToken.current) {
        setAiExplanation(null);
        setAiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Could not reach the analysis server',
        });
      }
    } finally {
      if (token === runToken.current) setIsLoadingAi(false);
    }
    if (dwell) await delay(dwell);
    if (token !== runToken.current) return;
    setPhaseIdx(4);
    if (dwell) await delay(Math.round(dwell * 0.7));
    if (token !== runToken.current) return;
    setStage('results');
  }, [prefs, reduceMotion]);

  const primaryAction = () => {
    if (stage === 'overture') go('work');
    else if (stage === 'work') go('housing');
    else if (stage === 'housing') go('income');
    else if (stage === 'income') go('review');
    else if (stage === 'review') void runAnalysis();
  };
  const goBack = () => {
    if (stage === 'work') go('overture');
    else if (stage === 'housing') go('work');
    else if (stage === 'income') go('housing');
    else if (stage === 'review') go('income');
    else if (stage === 'results') go('review');
  };

  const showChrome = stage !== 'overture' && stage !== 'processing';
  const meta = STAGE_META[stageIdx];

  return (
    <div className={`journey${stage === 'overture' ? ' is-overture' : ''}${stage === 'processing' ? ' is-processing' : ''}`}>
      <div ref={liveRef} className="j-sr" aria-live="polite" />
      {/* top bar */}
      <header className="j-topbar">
        <span className="j-brand">
          <Compass aria-hidden="true" /> TrueRent <em>Toronto</em>
        </span>
        {showChrome && (
          <div className="j-progress" role="group" aria-label="Journey progress">
            <span className="j-progress-label">
              Stage {String(stageIdx).padStart(2, '0')} · {meta.label}
            </span>
            <span className="j-progress-track" aria-hidden="true">
              <span ref={progressRef} className="j-progress-fill" />
            </span>
            <span className="j-progress-segs" aria-hidden="true">
              {STAGE_META.map((s, i) => (
                <i key={s.id} className={i < stageIdx ? 'is-done' : i === stageIdx ? 'is-now' : ''} />
              ))}
            </span>
          </div>
        )}
        <nav className="j-top-actions" aria-label="Resources">
          <button type="button" onClick={() => setIsMethodologyOpen(true)}>Methodology</button>
          <button type="button" onClick={() => setIsTenantOpen(true)}>Tenant resources</button>
        </nav>
      </header>

      {/* scene */}
      <main className="j-stage" ref={sceneRef}>
        {stage === 'overture' && <Overture onBegin={() => go('work')} />}
        {stage === 'work' && <WorkStep prefs={prefs} onChange={patch} />}
        {stage === 'housing' && <HousingStep prefs={prefs} onChange={patch} />}
        {stage === 'income' && <IncomeStep prefs={prefs} onChange={patch} />}
        {stage === 'review' && (
          <ReviewStep
            prefs={prefs}
            onChange={patch}
            onEdit={(s) => go(s)}
          />
        )}
        {stage === 'processing' && <ProcessingScene phaseIdx={phaseIdx} reduceMotion={reduceMotion} />}
        {stage === 'results' && analyzed && (
          <ResultsScene
            results={results}
            filtered={filtered}
            preferences={analyzed}
            currentLivingCost={currentLivingCost}
            aiExplanation={aiExplanation}
            aiError={aiError}
            isLoadingAi={isLoadingAi}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            comparedIds={comparedIds}
            onToggleCompare={toggleCompare}
            onUpdateRent={updateRent}
            onOpenPostings={openPostings}
            onOpenWhatIf={() => setIsWhatIfOpen(true)}
            onRefreshAi={() => {
              setIsLoadingAi(true);
              fetch('/api/gemini/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: analyzed }),
              })
                .then(async (r) => {
                  const d = await r.json().catch(() => null);
                  if (r.ok) {
                    setAiExplanation(d);
                    setAiError(null);
                  } else {
                    setAiExplanation(null);
                    setAiError(
                      d?.error ?? {
                        status: r.status,
                        code: `HTTP_${r.status}`,
                        message: 'Gemini narration request failed',
                      }
                    );
                  }
                })
                .catch((err) => {
                  setAiExplanation(null);
                  setAiError({
                    status: 0,
                    code: 'NETWORK_ERROR',
                    message: err instanceof Error ? err.message : 'Could not reach the analysis server',
                  });
                })
                .finally(() => setIsLoadingAi(false));
            }}
            onOpenMethodology={() => setIsMethodologyOpen(true)}
            onOpenTenants={() => setIsTenantOpen(true)}
            onAdjust={() => go('review')}
            onRestart={() => { setAnalyzed(null); setAiExplanation(null); setAiError(null); setComparedIds([]); setViewMode('grid'); go('overture'); }}
          />
        )}
      </main>

      {/* nav chrome */}
      {showChrome && stage !== 'results' && (
        <footer className="j-nav">
          <button type="button" className="j-btn-ghost" onClick={goBack}>
            <ArrowLeft aria-hidden="true" /> Back
          </button>
          <button type="button" className="j-btn-primary" onClick={primaryAction} data-magnetic>
            {meta.action} <ArrowRight aria-hidden="true" />
          </button>
        </footer>
      )}
      {stage === 'results' && (
        <ComparisonDrawer
          comparedCosts={compared}
          preferences={prefs}
          onRemove={toggleCompare}
          onClear={() => setComparedIds([])}
          onOpenPostingsModal={openPostings}
        />
      )}

      <AiWhatIfExplorer
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        currentPreferences={prefs}
        onApplyScenario={(p) => patch(p)}
      />
      <LivePostingsModal
        isOpen={isPostingsOpen}
        onClose={() => setIsPostingsOpen(false)}
        preferences={prefs}
        selectedNeighbourhoodId={postingsId}
        onApplyNeighbourhoodRent={updateRent}
      />
      <HowWeCalculatedModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
      <TenantResourcesModal isOpen={isTenantOpen} onClose={() => setIsTenantOpen(false)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Processing scene — every phase names a real operation                */
/* ------------------------------------------------------------------ */

const PHASES = [
  { id: 'receive', label: 'Preparing your comparison', sub: 'Using the work, housing, and income details you provided.' },
  { id: 'routes', label: 'Estimating your commute', sub: 'Comparing travel routes and available transit information.' },
  { id: 'engine', label: 'Calculating monthly costs', sub: 'Comparing rent, travel, and utilities across 10 neighbourhoods.' },
  { id: 'narrate', label: 'Preparing your summary', sub: 'Summarizing the key costs and trade-offs.' },
  { id: 'ready', label: 'Comparison ready', sub: 'Opening your neighbourhood results.' },
];

const ProcessingScene: React.FC<{ phaseIdx: number; reduceMotion: boolean }> = ({ phaseIdx, reduceMotion }) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barRef.current || reduceMotion) return;
    gsap.to(barRef.current, { scaleX: Math.min(1, phaseIdx / (PHASES.length - 1)), duration: 0.5, ease: 'power3.out' });
  }, [phaseIdx, reduceMotion]);
  return (
    <section className="j-process" aria-label="Analyzing your information" aria-busy="true">
      <p className="j-stage-kicker" data-scene-item>Stage 05 — Analysis</p>
      <h2 className="j-process-title" data-scene-item tabIndex={-1}>
        Analyzing your information.
      </h2>
      <div className="j-process-track" data-scene-item aria-hidden="true">
        <div
          ref={barRef}
          className="j-process-fill"
          style={reduceMotion ? { transform: `scaleX(${Math.min(1, phaseIdx / (PHASES.length - 1))})` } : undefined}
        />
      </div>
      <ol className="j-phases" data-scene-item>
        {PHASES.map((p, i) => (
          <li key={p.id} className={i < phaseIdx ? 'is-done' : i === phaseIdx ? 'is-now' : ''} aria-current={i === phaseIdx ? 'step' : undefined}>
            <span className="j-phase-mark" aria-hidden="true">{i < phaseIdx ? '✓' : `0${i + 1}`}</span>
            <span>
              <strong>{p.label}</strong>
              <small>{p.sub}</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="j-sr" role="status">{PHASES[Math.min(phaseIdx, PHASES.length - 1)].label}</p>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Results scene — the full ledger, recomposed as a final act           */
/* ------------------------------------------------------------------ */

interface ResultsSceneProps {
  results: CalculatedCost[];
  filtered: CalculatedCost[];
  preferences: UserPreferences;
  currentLivingCost: CalculatedCost | null;
  aiExplanation: AiExplanation | null;
  aiError: AiError | null;
  isLoadingAi: boolean;
  viewMode: 'grid' | 'table' | 'chart';
  setViewMode: (v: 'grid' | 'table' | 'chart') => void;
  sortBy: 'totalImpact' | 'trueCost' | 'rent' | 'transport' | 'utilities' | 'commuteTime' | 'carbon';
  setSortBy: (s: 'totalImpact' | 'trueCost' | 'rent' | 'transport' | 'utilities' | 'commuteTime' | 'carbon') => void;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onUpdateRent: (id: string, rent: number | null) => void;
  onOpenPostings: (id?: string) => void;
  onOpenWhatIf: () => void;
  onRefreshAi: () => void;
  onOpenMethodology: () => void;
  onOpenTenants: () => void;
  onAdjust: () => void;
  onRestart: () => void;
}

const ResultsScene: React.FC<ResultsSceneProps> = (props) => {
  const {
    results, filtered, preferences, currentLivingCost, aiExplanation, aiError, isLoadingAi,
    viewMode, setViewMode, sortBy, setSortBy,
    comparedIds, onToggleCompare, onUpdateRent, onOpenPostings,
  } = props;
  return (
    <div className="j-results">
      <p className="j-stage-kicker" data-scene-item>Stage 06 — Results</p>
      <div data-scene-item>
        <KeyFindingBanner
          results={results}
          preferences={preferences}
          currentLivingCost={currentLivingCost}
          aiExplanation={aiExplanation}
          aiError={aiError}
          isLoadingAi={isLoadingAi}
          onRefreshAi={props.onRefreshAi}
          onOpenWhatIf={props.onOpenWhatIf}
        />
      </div>
      <div data-scene-item>
        <AnalysisNeighbourhoodMap results={results} preferences={preferences} />
      </div>
      <div className="j-result-tools" data-scene-item>
        <div className="j-sortviews">
          <label className="j-sort">
            <ArrowUpDown aria-hidden="true" /> Sort
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="totalImpact">Personalized total incl. time</option>
              <option value="trueCost">Out-of-pocket cost</option>
              <option value="rent">Rent</option>
              <option value="transport">Travel</option>
              <option value="utilities">Utilities</option>
              <option value="commuteTime">Travel time</option>
              <option value="carbon">Emissions</option>
            </select>
          </label>
          <div className="j-views" role="tablist" aria-label="Result views">
            {(
              [
                ['grid', 'Cost comparison', LayoutGrid],
                ['table', 'Table', TableIcon],
                ['chart', 'Chart', BarChart3],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={viewMode === v}
                onClick={() => setViewMode(v)}
                className={`j-view${viewMode === v ? ' is-active' : ''}`}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div data-scene-item>
        {viewMode === 'grid' && (
          <ResultsLedger
            results={filtered}
            preferences={preferences}
            comparedIds={comparedIds}
            onToggleCompare={onToggleCompare}
            onUpdateNeighbourhoodRent={onUpdateRent}
            onOpenPostingsModal={onOpenPostings}
          />
        )}
        {viewMode === 'table' && (
          <NeighbourhoodTable
            results={filtered}
            preferences={preferences}
            comparedIds={comparedIds}
            onToggleCompare={onToggleCompare}
            onUpdateNeighbourhoodRent={onUpdateRent}
            onOpenPostingsModal={onOpenPostings}
          />
        )}
        {viewMode === 'chart' && <CostBarChart results={filtered} maxDisplay={10} />}
      </div>
      <div className="j-result-actions" data-scene-item>
        <button type="button" className="j-btn-primary" onClick={props.onOpenWhatIf}>Explore a scenario</button>
        <button type="button" className="j-btn-ghost" onClick={() => onOpenPostings()}>
          <Building2 aria-hidden="true" /> Rental listings
        </button>
        <button type="button" className="j-btn-ghost" onClick={props.onAdjust}>Adjust answers</button>
        <button type="button" className="j-btn-ghost" onClick={props.onRestart}>Start over</button>
      </div>
      <section className="j-civic" data-scene-item>
        <ShieldCheck aria-hidden="true" />
        <p>
          Rent references use CMHC survey-zone data from October 2024. Commute figures combine route estimates and stored baselines; they are not live transit itineraries. Utilities are planning estimates.
        </p>
        <div>
          <button type="button" onClick={props.onOpenMethodology}>Formulas &amp; sources</button>
          <button type="button" onClick={props.onOpenTenants}>Tenant resources</button>
        </div>
      </section>
    </div>
  );
};
