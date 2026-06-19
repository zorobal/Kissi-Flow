/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Filter, CheckCircle2 } from 'lucide-react';

export type DateFilterType = 'ALL' | 'TODAY' | 'WEEK' | 'SPECIFIC' | 'RANGE' | 'MONTHS';

export interface DateFilterState {
  type: DateFilterType;
  specificDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  selectedMonths: string[]; // ['01', '02', ..., '12']
  year: number;
}

// In our simulation dashboard, today is simulated as 2026-06-11
export const SIMULATED_TODAY = '2026-06-11';

export const initialDateFilterState: DateFilterState = {
  type: 'ALL',
  specificDate: SIMULATED_TODAY,
  startDate: '2026-06-01',
  endDate: SIMULATED_TODAY,
  selectedMonths: ['06'], // Default to current month (June)
  year: 2026
};

export function matchDateFilter(itemDate: string, state: DateFilterState): boolean {
  if (!itemDate) return false;
  
  // Extract just the YYYY-MM-DD if a full datetime is passed (e.g., YYYY-MM-DD HH:MM)
  const dateOnly = itemDate.split(' ')[0];
  
  switch (state.type) {
    case 'ALL':
      return true;
    case 'TODAY':
      return dateOnly === SIMULATED_TODAY || dateOnly === new Date().toISOString().split('T')[0];
    case 'WEEK': {
      // 7 days interval ending at simulated today
      const startLimit = '2026-06-05';
      const endLimit = SIMULATED_TODAY;
      // also handle dynamic date logic as a backup
      const today = new Date();
      const past7Days = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      const todayStr = today.toISOString().split('T')[0];
      const past7Str = past7Days.toISOString().split('T')[0];
      
      return (dateOnly >= startLimit && dateOnly <= endLimit) || (dateOnly >= past7Str && dateOnly <= todayStr);
    }
    case 'SPECIFIC':
      return dateOnly === state.specificDate;
    case 'RANGE':
      if (!state.startDate || !state.endDate) return true;
      return dateOnly >= state.startDate && dateOnly <= state.endDate;
    case 'MONTHS': {
      const yearPart = dateOnly.substring(0, 4);
      const monthPart = dateOnly.substring(5, 7);
      
      // Check if month matches selectedMonths, and optional year constraint
      const monthMatch = state.selectedMonths.includes(monthPart);
      const yearMatch = yearPart === String(state.year);
      return monthMatch && yearMatch;
    }
    default:
      return true;
  }
}

interface DateFilterComponentProps {
  idPrefix: string;
  state: DateFilterState;
  onChange: (newState: DateFilterState) => void;
}

export const MONTHS_LIST = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

export function getDateFilterLabel(state: DateFilterState): string {
  if (!state) return '';
  
  const formatDateFr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  switch (state.type) {
    case 'ALL':
      return "Toutes les dates";
    case 'TODAY':
      return `Aujourd'hui (${formatDateFr(state.specificDate)})`;
    case 'WEEK':
      return "Semaine glissante (Derniers 7 jours)";
    case 'SPECIFIC':
      return `Journée du ${formatDateFr(state.specificDate)}`;
    case 'RANGE':
      return `Du ${formatDateFr(state.startDate)} au ${formatDateFr(state.endDate)}`;
    case 'MONTHS': {
      const monthsNames = state.selectedMonths.map(m => {
        const found = MONTHS_LIST.find(item => item.value === m);
        return found ? found.label : m;
      }).join(', ');
      return `${monthsNames || 'Aucun mois'} ${state.year}`;
    }
    default:
      return 'Toutes les dates';
  }
}

export function getSavedBusinessYears(): number[] {
  try {
    const local = localStorage.getItem('erp-[#1E4E8C]-business-years') || localStorage.getItem('erp-business-years');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(Number).sort((a,b) => b - a);
      }
    }
  } catch (e) {
    console.error('Error reading business years', e);
  }
  return [2027, 2026, 2025];
}

export default function DateFilterComponent({ idPrefix, state, onChange }: DateFilterComponentProps) {
  const years = getSavedBusinessYears();

  const handleTypeChange = (type: DateFilterType) => {
    onChange({ ...state, type });
  };

  const handleSpecificDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, specificDate: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, endDate: e.target.value });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...state, year: parseInt(e.target.value, 10) });
  };

  const toggleMonth = (monthVal: string) => {
    let updated: string[];
    if (state.selectedMonths.includes(monthVal)) {
      // Keep at least one month selected
      if (state.selectedMonths.length <= 1) return;
      updated = state.selectedMonths.filter(m => m !== monthVal);
    } else {
      updated = [...state.selectedMonths, monthVal];
    }
    onChange({ ...state, selectedMonths: updated });
  };

  return (
    <div id={`${idPrefix}-date-filter-wrapper`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 text-[#1E4E8C]" />
          <span className="font-extrabold text-gray-800 uppercase tracking-wide">Période d'Analyse</span>
          <span className="ml-1 sm:ml-2 px-2.5 py-1 bg-indigo-50 text-[#1E4E8C] border border-indigo-150 text-xs font-black rounded-lg">
            {getDateFilterLabel(state)}
          </span>
        </div>

        {/* Action Toggle Pills */}
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'TODAY', 'WEEK', 'SPECIFIC', 'RANGE', 'MONTHS'] as DateFilterType[]).map((t) => {
            let label = '';
            switch (t) {
              case 'ALL': label = 'Toutes les Dates'; break;
              case 'TODAY': label = "Aujourd'hui"; break;
              case 'WEEK': label = 'Semaine'; break;
              case 'SPECIFIC': label = 'Date spécifique'; break;
              case 'RANGE': label = 'Cumuler plusieurs jours'; break;
              case 'MONTHS': label = 'Cumuler plusieurs mois'; break;
            }

            const active = state.type === t;
            return (
              <button
                key={t}
                id={`${idPrefix}-btn-${t.toLowerCase()}`}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1E4E8C] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-655 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional Inputs Block */}
      {state.type === 'SPECIFIC' && (
        <div className="flex items-center gap-3 bg-blue-50/20 border border-blue-100/50 p-3 rounded-lg text-xs animate-fade-in">
          <span className="font-bold text-gray-700">Sélectionner un jour :</span>
          <input
            id={`${idPrefix}-input-specific`}
            type="date"
            value={state.specificDate}
            onChange={handleSpecificDateChange}
            className="p-2 border border-gray-250 bg-white rounded-lg font-mono focus:ring-1 focus:ring-[#1E4E8C] outline-none"
          />
        </div>
      )}

      {state.type === 'RANGE' && (
        <div className="flex flex-wrap items-center gap-2.5 bg-blue-50/20 border border-blue-100/50 p-3 rounded-lg text-xs animate-fade-in">
          <span className="font-bold text-gray-700">Du (Inclus) :</span>
          <input
            id={`${idPrefix}-input-start`}
            type="date"
            value={state.startDate}
            onChange={handleStartDateChange}
            className="p-2 border border-gray-250 bg-white rounded-lg font-mono focus:ring-1 focus:ring-[#1E4E8C] outline-none"
          />
          <span className="font-bold text-gray-700">Au (Inclus) :</span>
          <input
            id={`${idPrefix}-input-end`}
            type="date"
            value={state.endDate}
            onChange={handleEndDateChange}
            className="p-2 border border-gray-250 bg-white rounded-lg font-mono focus:ring-1 focus:ring-[#1E4E8C] outline-none"
          />
        </div>
      )}

      {state.type === 'MONTHS' && (
        <div className="bg-blue-50/20 border border-blue-100/50 p-4 rounded-lg space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-gray-800">Sélection et cumul des mois (Année {state.year}) :</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-semibold">Année d'affaires :</span>
              <select
                id={`${idPrefix}-select-year`}
                value={state.year}
                onChange={handleYearChange}
                className="p-1 px-2 border bg-white rounded-md font-bold text-gray-700 focus:outline-none"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {MONTHS_LIST.map((m) => {
              const selected = state.selectedMonths.includes(m.value);
              return (
                <button
                  key={m.value}
                  id={`${idPrefix}-month-opt-${m.value}`}
                  type="button"
                  onClick={() => toggleMonth(m.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold shadow-3xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-400 italic">
            * Vous pouvez cumuler plusieurs mois en cochant leurs boutons ci-dessus. Les graphiques comptabiliseront le total cumulé.
          </div>
        </div>
      )}
    </div>
  );
}
