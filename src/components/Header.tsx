import React from 'react';
import {
  Compass,
  HelpCircle,
  ShieldCheck,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import { PERSONA_PRESETS } from '../data/neighbourhoods';
import { PersonaPreset, UserPreferences } from '../types';

interface HeaderProps {
  preferences: UserPreferences;
  onSelectPersona: (persona: PersonaPreset) => void;
  activePersonaId: string | null;
  onOpenMethodology: () => void;
  onOpenTenantResources: () => void;
  onOpenWhatIf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPersona,
  activePersonaId,
  onOpenMethodology,
  onOpenTenantResources,
  onOpenWhatIf,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner: Civic & Ethical Commitment */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Civic Hackathon Edition
            </span>
            <span>
              Real Toronto open data (CMHC, City of Toronto, TRCA, TTC). No estimated rents invented.
            </span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={onOpenMethodology}
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How we calculate this</span>
            </button>
            <span className="text-stone-700">|</span>
            <button
              onClick={onOpenTenantResources}
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tenant Rights & FMTA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                TrueRent Toronto
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                10 Neighbourhoods
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Rent + Commute + Utilities + Time Cost + Climate Risk
            </p>
          </div>
        </div>

        {/* Persona Quick Selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            Try a Persona:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PERSONA_PRESETS.map((persona) => {
              const isActive = activePersonaId === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/30'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80'
                  }`}
                  title={persona.story}
                >
                  <span>{persona.avatar}</span>
                  <span>{persona.title}</span>
                </button>
              );
            })}
            <button
              onClick={onOpenWhatIf}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI What-If</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
