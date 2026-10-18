import React, { useState } from 'react';
import {
  ArrowDown,
  BedDouble,
  Bike,
  Briefcase,
  Bus,
  Car,
  Check,
  Clock,
  DollarSign,
  Footprints,
  Home,
  Pencil,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { CALCULATION_ASSUMPTIONS, NEIGHBOURHOODS, WORKPLACES } from '../data/neighbourhoods';
import { BedroomType, CommuteMode, RentMode, UserPreferences } from '../types';

type PrefsPatch = Partial<UserPreferences>;

interface StepProps {
  prefs: UserPreferences;
  onChange: (patch: PrefsPatch) => void;
}

/* ------------------------------------------------------------------ */
/* 00 · Overture                                                        */
/* ------------------------------------------------------------------ */

export const Overture: React.FC<{ onBegin: () => void }> = ({ onBegin }) => (
  <section className="j-overture" aria-labelledby="overture-title">
    <svg className="j-overture-routes" viewBox="0 0 460 300" fill="none" aria-hidden="true">
      <path d="M43 244C112 220 126 168 190 182c50 11 64-48 110-52 44-4 62 39 117 16" />
      <path d="M72 67c41 31 42 76 91 91 53 17 77 1 104 51 22 40 62 34 118 47" />
      <circle cx="43" cy="244" r="5" />
      <circle cx="190" cy="182" r="4" />
      <circle cx="417" cy="146" r="6" />
      <circle cx="72" cy="67" r="4" />
      <circle cx="385" cy="256" r="5" />
    </svg>
    <div className="j-overture-inner">
      <p className="j-stage-kicker" data-scene-item>
        <span className="j-live-dot" aria-hidden="true" />
        Toronto &middot; Public data &middot; Personalized cost comparisons
      </p>
      <h1 id="overture-title" className="j-overture-title" data-scene-item>
        Compare the true cost of living across Toronto.
      </h1>
      <p className="j-overture-sub" data-scene-item>
        Compare estimated rent, commuting, utilities, and travel time across 10 Toronto
        neighbourhoods using your work, housing, and income details.
      </p>
      <div data-scene-item>
        <button type="button" onClick={onBegin} className="j-btn-primary j-btn-big" data-magnetic>
          Begin the comparison
          <ArrowDown aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Shared question shell                                                */
/* ------------------------------------------------------------------ */

const Question: React.FC<{
  index: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}> = ({ index, title, lede, children }) => (
  <div className="j-question">
    <p className="j-stage-kicker" data-scene-item>
      Stage {index}
    </p>
    <h2 className="j-question-title" data-scene-item tabIndex={-1}>
      {title}
    </h2>
    <p className="j-question-lede" data-scene-item>
      {lede}
    </p>
    <div className="j-question-body">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 01 · Work & travel                                                   */
/* ------------------------------------------------------------------ */

const MODES: Array<{ id: CommuteMode; label: string; Icon: typeof Bus }> = [
  { id: 'transit', label: 'Transit', Icon: Bus },
  { id: 'car', label: 'Car', Icon: Car },
  { id: 'hybrid', label: 'Mixed', Icon: SlidersHorizontal },
  { id: 'walking', label: 'Walking', Icon: Footprints },
  { id: 'cycling', label: 'Cycling', Icon: Bike },
];

export const WorkStep: React.FC<StepProps> = ({ prefs, onChange }) => {
  const workplace = WORKPLACES.find((w) => w.id === prefs.workplaceId) || WORKPLACES[0];
  const onSite = 5 - prefs.hybridRemoteDaysPerWeek;
  return (
    <Question
      index="01 — Work & travel"
      title="Where do you go, and how do you get there?"
      lede="Your destination and travel choices shape the commute estimates in your comparison."
    >
      <div data-scene-item>
        <label className="j-label" htmlFor="j-workplace">
          <Briefcase aria-hidden="true" /> Primary destination
        </label>
        <select
          id="j-workplace"
          className="j-select"
          value={prefs.workplaceId}
          onChange={(e) => onChange({ workplaceId: e.target.value })}
        >
          {WORKPLACES.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} — {w.district}
            </option>
          ))}
        </select>
        <p className="j-hint">
          {workplace.address} &middot;{' '}
          {workplace.parkingCostMonthly == null
            ? 'Parking cost not estimated (excluded)'
            : workplace.parkingCostMonthly > 0
              ? `$${workplace.parkingCostMonthly}/mo parking`
              : 'Free parking'}
          {workplace.transitEstimateAvailable === false && (
          <> &middot; Travel times are estimates; driving uses OpenRouteService where available</>
          )}
        </p>
      </div>
      <div data-scene-item>
        <span className="j-label" id="j-mode-label">
          Commute mode
        </span>
        <div className="j-modes" role="radiogroup" aria-labelledby="j-mode-label">
          {MODES.map(({ id, label, Icon }) => {
            const active = prefs.commuteMode === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ commuteMode: id })}
                className={`j-mode${active ? ' is-active' : ''}`}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {active && <Check aria-hidden="true" className="j-mode-tick" />}
              </button>
            );
          })}
        </div>
      </div>
      <div data-scene-item>
        <label className="j-label" htmlFor="j-remote">
          Remote days <span className="j-value">{prefs.hybridRemoteDaysPerWeek} remote · {onSite} on-site</span>
        </label>
        <input
          id="j-remote"
          type="range"
          min={0}
          max={5}
          step={1}
          value={prefs.hybridRemoteDaysPerWeek}
          onChange={(e) => onChange({ hybridRemoteDaysPerWeek: Number(e.target.value) })}
          className="j-range"
        />
        <div className="j-range-ends" aria-hidden="true">
          <span>Full on-site</span>
          <span>Fully remote</span>
        </div>
      </div>
    </Question>
  );
};

/* ------------------------------------------------------------------ */
/* 02 · Housing & rent                                                  */
/* ------------------------------------------------------------------ */

export const HousingStep: React.FC<StepProps> = ({ prefs, onChange }) => {
  const rentMode: RentMode =
    prefs.rentMode ||
    (prefs.rentInputMode === 'custom_fixed' ? 'user_entered' : 'cmhc_benchmark');
  const setMode = (mode: RentMode) =>
    onChange(
      mode === 'user_entered'
        ? { rentMode: mode, rentInputMode: 'custom_fixed' }
        : mode === 'cmhc_benchmark'
        ? { rentMode: mode, rentInputMode: 'market_median' }
        : { rentMode: mode }
    );
  const overrides = Object.keys(prefs.customNeighbourhoodRents || {}).length;
  return (
    <Question
      index="02 — Housing & rent"
      title="How should housing be counted?"
      lede="Use the historical area rent reference, enter a rent you verified, or exclude housing costs."
    >
      <div data-scene-item role="radiogroup" aria-label="Rent handling">
        {(
          [
            ['cmhc_benchmark', 'Historical area rent reference', 'CMHC survey-zone average by bedroom · Oct 2024; not a current listing'],
            ['user_entered', 'My actual rent', 'One figure applied across all 10 areas'],
            ['no_rent', 'Exclude rent', 'Commute + utilities only'],
          ] as Array<[RentMode, string, string]>
        ).map(([mode, label, sub]) => {
          const active = rentMode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(mode)}
              className={`j-radio${active ? ' is-active' : ''}`}
            >
              <span className="j-radio-dot" aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{sub}</small>
              </span>
            </button>
          );
        })}
      </div>
      {rentMode === 'user_entered' && (
        <div data-scene-item>
          <label className="j-label" htmlFor="j-fixed-rent">
            Your monthly rent <span className="j-optional">optional</span>
          </label>
          <div className="j-money">
            <span aria-hidden="true">$</span>
            <input
              id="j-fixed-rent"
              type="number"
              min={0}
              step={50}
              value={prefs.customFixedRent ?? ''}
              onChange={(e) =>
                onChange({
                  customFixedRent: e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                })
              }
              placeholder="Leave blank for unspecified"
            />
          </div>
        </div>
      )}
      <div className="j-split" data-scene-item>
        <div>
          <label className="j-label" htmlFor="j-beds">
            <BedDouble aria-hidden="true" /> Unit size
          </label>
          <select
            id="j-beds"
            className="j-select"
            value={prefs.bedrooms}
            onChange={(e) => onChange({ bedrooms: e.target.value as BedroomType })}
          >
            <option value="bachelor">Bachelor / Studio</option>
            <option value="1bed">1-Bedroom</option>
            <option value="2bed">2-Bedroom</option>
            <option value="3bed">3-Bedroom</option>
          </select>
        </div>
        <div>
          <label className="j-label" htmlFor="j-household">
            <Users aria-hidden="true" /> Household
          </label>
          <select
            id="j-household"
            className="j-select"
            value={prefs.householdMembers}
            onChange={(e) => onChange({ householdMembers: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 5 ? '5+ people' : `${n} ${n === 1 ? 'person' : 'people'}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {overrides > 0 && (
        <p className="j-hint" data-scene-item>
          {overrides} area rent override{overrides === 1 ? '' : 's'} active — set from live
          ads in the results. <button type="button" className="j-link" onClick={() => onChange({ customNeighbourhoodRents: {} })}>Clear</button>
        </p>
      )}
    </Question>
  );
};

/* ------------------------------------------------------------------ */
/* 03 · Income, time & current home                                     */
/* ------------------------------------------------------------------ */

export const IncomeStep: React.FC<StepProps> = ({ prefs, onChange }) => {
  const [showHome, setShowHome] = useState(Boolean(prefs.currentNeighbourhoodId));
  const hasIncome = typeof prefs.annualIncome === 'number' && prefs.annualIncome > 0;
  const hourly = hasIncome
    ? (prefs.annualIncome! / CALCULATION_ASSUMPTIONS.standardWorkHoursPerYear).toFixed(2)
    : null;
  return (
    <Question
      index="03 — Income & time"
      title="What is an hour of commuting worth?"
      lede="Income is optional. If provided, it helps estimate the value of your commute time and your rent-to-income ratio."
    >
      <div data-scene-item>
        <label className="j-label" htmlFor="j-income">
          <DollarSign aria-hidden="true" /> Gross annual income <span className="j-optional">optional</span>
        </label>
        <div className="j-money">
          <span aria-hidden="true">$</span>
          <input
            id="j-income"
            type="number"
            min={0}
            step={1000}
            value={hasIncome ? prefs.annualIncome! : ''}
            onChange={(e) =>
              onChange({ annualIncome: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
            }
            placeholder="Leave blank — ratios skipped"
          />
        </div>
        <p className="j-hint">
          {hasIncome ? (
            <>≈ ${Math.round(prefs.annualIncome! / 12).toLocaleString()}/mo · ${hourly}/hr</>
          ) : (
            <>Unspecified — rent-to-income ratios will not be calculated.</>
          )}
        </p>
      </div>
      <div data-scene-item>
        <label className="j-label" htmlFor="j-timeval">
          <Clock aria-hidden="true" /> Valuing commute time
        </label>
        <select
          id="j-timeval"
          className="j-select"
          value={
            prefs.timeValuationType === 'zero'
              ? 'zero'
              : prefs.timeValuationType === 'custom_rate'
              ? 'custom'
              : String(prefs.timeValuationRate ?? 0.5)
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'zero') onChange({ timeValuationType: 'zero', timeValuationRate: 0 });
            else if (v === 'custom')
              onChange({
                timeValuationType: 'custom_rate',
                customHourlyTimeValuation: prefs.customHourlyTimeValuation || 25,
              });
            else onChange({ timeValuationType: 'percent_of_wage', timeValuationRate: Number(v) });
          }}
        >
          <option value="0.5">50% of hourly wage — Metrolinx standard</option>
          <option value="1">100% of hourly wage</option>
          <option value="0.75">75% of hourly wage</option>
          <option value="custom">Custom hourly rate</option>
          <option value="zero">Hours only — don&apos;t monetize time</option>
        </select>
        {prefs.timeValuationType === 'custom_rate' && (
          <div className="j-money" style={{ marginTop: 10 }}>
            <span aria-hidden="true">$</span>
            <input
              type="number"
              min={0}
              step={5}
              aria-label="Custom hourly time value"
              value={prefs.customHourlyTimeValuation ?? 25}
              onChange={(e) =>
                onChange({ customHourlyTimeValuation: Math.max(0, Number(e.target.value)) })
              }
            />
          </div>
        )}
      </div>
      <div data-scene-item>
        <button
          type="button"
          onClick={() => setShowHome((v) => !v)}
          aria-expanded={showHome}
          className="j-disclosure"
        >
          <Home aria-hidden="true" />
          Compare against my current home
          <span className="j-optional">{showHome ? 'hide' : 'optional'}</span>
        </button>
        {showHome && (
          <div className="j-home-grid">
            <div>
              <label className="j-label" htmlFor="j-cur-area">Current area</label>
              <select
                id="j-cur-area"
                className="j-select"
                value={prefs.currentNeighbourhoodId || ''}
                onChange={(e) => onChange({ currentNeighbourhoodId: e.target.value })}
              >
                <option value="">Choose your current area</option>
                {NEIGHBOURHOODS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="j-label" htmlFor="j-cur-rent">Current rent ($)</label>
              <input
                id="j-cur-rent"
                type="number"
                min={0}
                step={50}
                className="j-select"
                value={prefs.currentMonthlyRent ?? ''}
                onChange={(e) =>
                  onChange({
                    currentMonthlyRent: e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                  })
                }
                placeholder="e.g. 1850"
              />
            </div>
          </div>
        )}
      </div>
    </Question>
  );
};

/* ------------------------------------------------------------------ */
/* 04 · Review                                                          */
/* ------------------------------------------------------------------ */

export const ReviewStep: React.FC<
  StepProps & { onEdit: (stage: 'work' | 'housing' | 'income') => void }
> = ({ prefs, onEdit }) => {
  const workplace = WORKPLACES.find((w) => w.id === prefs.workplaceId) || WORKPLACES[0];
  const rentSummary =
    (prefs.rentMode || 'cmhc_benchmark') === 'user_entered'
      ? prefs.customFixedRent
        ? `$${prefs.customFixedRent.toLocaleString()}/mo — your figure`
        : 'Rent not entered'
      : (prefs.rentMode || 'cmhc_benchmark') === 'no_rent'
      ? 'Rent excluded · commute and utilities only'
      : 'Historical CMHC area rent reference · Oct 2024';
  const rows: Array<[string, string, 'work' | 'housing' | 'income']> = [
    ['Destination', `${workplace.shortName} · ${5 - prefs.hybridRemoteDaysPerWeek}d/wk on-site`, 'work'],
    ['Travel', `${prefs.commuteMode.replace('_', ' / ')} · ${prefs.hybridRemoteDaysPerWeek} remote day(s)`, 'work'],
    ['Housing', `${rentSummary} · ${prefs.bedrooms.replace('bed', '-bed')} · ${prefs.householdMembers} person(s)`, 'housing'],
    [
      'Time & income',
      `${prefs.annualIncome ? `$${prefs.annualIncome.toLocaleString()}/yr` : 'Income not provided'} · ${
        prefs.timeValuationType === 'zero' ? 'hours only' : 'commute time valued'
      }${prefs.currentNeighbourhoodId ? ' · current home included' : ''}`,
      'income',
    ],
  ];
  return (
    <Question
      index="04 — Review"
      title="Review your information"
      lede="Confirm your details before comparing neighbourhood costs. Select Edit to make changes."
    >
      <ol className="j-review" data-scene-item>
        {rows.map(([label, value, stage]) => (
          <li key={label} className="j-review-row">
            <div>
              <p className="j-review-label">{label}</p>
              <p className="j-review-value">{value}</p>
            </div>
            <button type="button" className="j-edit" onClick={() => onEdit(stage)}>
              <Pencil aria-hidden="true" /> Edit
            </button>
          </li>
        ))}
      </ol>
    </Question>
  );
};
