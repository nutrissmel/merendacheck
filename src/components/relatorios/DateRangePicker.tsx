'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export interface RangeData {
  inicio: string
  fim: string
  label: string
}

const PRESETS: { label: string; short: string; get: () => Omit<RangeData, 'label'> }[] = [
  {
    label: 'Este mês',
    short: 'Este mês',
    get: () => {
      const now = new Date()
      return {
        inicio: startOfMonth(now).toISOString().split('T')[0],
        fim: endOfMonth(now).toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Mês passado',
    short: 'Mês ant.',
    get: () => {
      const prev = subMonths(new Date(), 1)
      return {
        inicio: startOfMonth(prev).toISOString().split('T')[0],
        fim: endOfMonth(prev).toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Últimos 30 dias',
    short: '30 dias',
    get: () => {
      const now = new Date()
      return {
        inicio: subDays(now, 29).toISOString().split('T')[0],
        fim: now.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Últimos 60 dias',
    short: '60 dias',
    get: () => {
      const now = new Date()
      return {
        inicio: subDays(now, 59).toISOString().split('T')[0],
        fim: now.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Últimos 90 dias',
    short: '90 dias',
    get: () => {
      const now = new Date()
      return {
        inicio: subDays(now, 89).toISOString().split('T')[0],
        fim: now.toISOString().split('T')[0],
      }
    },
  },
]

function fmtDate(iso: string) {
  try { return format(new Date(iso + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) } catch { return iso }
}

interface Props {
  value: RangeData
  onChange: (range: RangeData) => void
}

export function DateRangePicker({ value, onChange }: Props) {
  // Detecta se o label atual é um preset ou personalizado
  const presetAtivo = PRESETS.find(p => p.label === value.label) ?? null

  function selectPreset(preset: typeof PRESETS[0]) {
    const range = preset.get()
    onChange({ ...range, label: preset.label })
  }

  function handleDataInicio(val: string) {
    onChange({
      inicio: val,
      fim: value.fim,
      label: 'Personalizado',
    })
  }

  function handleDataFim(val: string) {
    onChange({
      inicio: value.inicio,
      fim: val,
      label: 'Personalizado',
    })
  }

  return (
    <div className="space-y-3">
      {/* Presets como pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const ativo = presetAtivo?.label === preset.label
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                ativo
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-800'
              )}
            >
              {preset.short}
            </button>
          )
        })}
      </div>

      {/* Campos de data diretamente visíveis */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <Calendar size={14} className="text-neutral-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide block mb-0.5">
              Data inicial
            </label>
            <input
              type="date"
              value={value.inicio}
              max={value.fim || undefined}
              onChange={(e) => handleDataInicio(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
            />
          </div>
        </div>

        <span className="text-neutral-300 font-light text-lg self-end pb-1">—</span>

        <div className="flex items-center gap-2 flex-1 min-w-36">
          <Calendar size={14} className="text-neutral-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide block mb-0.5">
              Data final
            </label>
            <input
              type="date"
              value={value.fim}
              min={value.inicio || undefined}
              onChange={(e) => handleDataFim(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Resumo do período selecionado */}
      {value.inicio && value.fim && (
        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
          <span className={cn(
            'inline-block w-1.5 h-1.5 rounded-full',
            presetAtivo ? 'bg-blue-800' : 'bg-amber-400'
          )} />
          {presetAtivo ? presetAtivo.label : 'Personalizado'}
          {' · '}
          <span className="font-medium text-neutral-600">
            {fmtDate(value.inicio)} até {fmtDate(value.fim)}
          </span>
        </p>
      )}
    </div>
  )
}
