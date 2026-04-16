'use client'

import { useState } from 'react'
import {
  ClipboardList, AlertTriangle, Building2, History,
  Settings, TrendingUp, CheckCircle2, School, AlertCircle,
} from 'lucide-react'
import { AbaInspecoesRelatorio } from './AbaInspecoesRelatorio'
import { AbaNcsRelatorio } from './AbaNcsRelatorio'
import { AbaFNDE } from './AbaFNDE'
import { AbaHistorico } from './AbaHistorico'
import { ConfigAutoRelatorio } from './ConfigAutoRelatorio'
import { cn } from '@/lib/utils'

type Aba = 'inspecoes' | 'ncs' | 'fnde' | 'historico'

const ABAS: {
  id: Aba
  label: string
  icon: typeof ClipboardList
  descricao: string
  badge?: string
}[] = [
  {
    id: 'inspecoes',
    label: 'Inspeções',
    icon: ClipboardList,
    descricao: 'PDF + Excel com todas as inspeções do período',
  },
  {
    id: 'ncs',
    label: 'Não Conformidades',
    icon: AlertTriangle,
    descricao: 'Relatório analítico de NCs por severidade e escola',
  },
  {
    id: 'fnde',
    label: 'FNDE / PNAE',
    icon: Building2,
    descricao: 'Relatório formal para prestação de contas ao governo',
  },
  {
    id: 'historico',
    label: 'Histórico',
    icon: History,
    descricao: 'Relatórios gerados recentemente para re-download',
  },
]

interface KpisMes {
  totalInspecoes: number
  totalEscolas: number
  scoreMedio: number
  totalNCs: number
  ncsResolvidas: number
  conformidade: number
}

interface RelatoriosClientProps {
  escolas: { id: string; nome: string }[]
  kpisMes: KpisMes | null
}

export function RelatoriosClient({ escolas, kpisMes }: RelatoriosClientProps) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('inspecoes')

  const kpis = [
    {
      label: 'Inspeções este mês',
      valor: kpisMes?.totalInspecoes ?? '—',
      icon: ClipboardList,
      cor: 'text-blue-800',
      bg: 'bg-blue-50',
    },
    {
      label: 'Score médio',
      valor: kpisMes ? `${kpisMes.scoreMedio.toFixed(1)}%` : '—',
      icon: TrendingUp,
      cor: kpisMes && kpisMes.scoreMedio >= 90 ? 'text-green-600' : kpisMes && kpisMes.scoreMedio >= 70 ? 'text-amber-600' : 'text-red-500',
      bg: kpisMes && kpisMes.scoreMedio >= 90 ? 'bg-green-50' : kpisMes && kpisMes.scoreMedio >= 70 ? 'bg-amber-50' : 'bg-red-50',
    },
    {
      label: 'Escolas auditadas',
      valor: kpisMes?.totalEscolas ?? '—',
      icon: School,
      cor: 'text-blue-800',
      bg: 'bg-blue-50',
    },
    {
      label: 'NCs abertas',
      valor: kpisMes != null ? kpisMes.totalNCs - kpisMes.ncsResolvidas : '—',
      icon: AlertCircle,
      cor: (kpisMes?.totalNCs ?? 0) - (kpisMes?.ncsResolvidas ?? 0) > 0 ? 'text-red-500' : 'text-green-600',
      bg: (kpisMes?.totalNCs ?? 0) - (kpisMes?.ncsResolvidas ?? 0) > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      label: 'Conformidade',
      valor: kpisMes ? `${kpisMes.conformidade.toFixed(0)}%` : '—',
      icon: CheckCircle2,
      cor: kpisMes && kpisMes.conformidade >= 90 ? 'text-green-600' : 'text-amber-600',
      bg: kpisMes && kpisMes.conformidade >= 90 ? 'bg-green-50' : 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div
              key={k.label}
              className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3 shadow-sm"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', k.bg)}>
                <Icon size={16} className={k.cor} />
              </div>
              <div className="min-w-0">
                <p className={cn('text-lg font-bold leading-none', k.cor)}>{k.valor}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{k.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Layout principal: nav lateral + conteúdo ── */}
      <div className="flex gap-5 items-start">

        {/* Nav lateral — desktop */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1">
          {ABAS.map((a) => {
            const Icon = a.icon
            const ativo = a.id === abaAtiva
            return (
              <button
                key={a.id}
                onClick={() => setAbaAtiva(a.id)}
                className={cn(
                  'w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border transition-all duration-150',
                  ativo
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  ativo ? 'bg-blue-800 text-white' : 'bg-neutral-100 text-neutral-400'
                )}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    ativo ? 'text-blue-800' : 'text-neutral-700'
                  )}>
                    {a.label}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                    {a.descricao}
                  </p>
                </div>
              </button>
            )
          })}

          {/* Divisor + Config */}
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
              Configurações
            </p>
            <div className="px-3">
              <ConfigAutoRelatorio compact />
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Tabs mobile */}
          <div className="md:hidden flex overflow-x-auto gap-1 bg-white border border-neutral-200 rounded-xl p-1.5">
            {ABAS.map((a) => {
              const Icon = a.icon
              const ativo = a.id === abaAtiva
              return (
                <button
                  key={a.id}
                  onClick={() => setAbaAtiva(a.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                    ativo
                      ? 'bg-blue-800 text-white'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  )}
                >
                  <Icon size={13} />
                  {a.label}
                </button>
              )
            })}
          </div>

          {/* Header da aba ativa */}
          <div className="hidden md:flex items-center gap-2 pb-1">
            <div className="w-1 h-5 rounded-full bg-blue-800" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {ABAS.find(a => a.id === abaAtiva)?.label}
              </h2>
              <p className="text-xs text-neutral-400">
                {ABAS.find(a => a.id === abaAtiva)?.descricao}
              </p>
            </div>
          </div>

          {/* Conteúdo da aba */}
          {abaAtiva === 'inspecoes' && <AbaInspecoesRelatorio escolas={escolas} kpisMes={kpisMes} />}
          {abaAtiva === 'ncs'       && <AbaNcsRelatorio escolas={escolas} />}
          {abaAtiva === 'fnde'      && <AbaFNDE />}
          {abaAtiva === 'historico' && <AbaHistorico />}
        </div>
      </div>
    </div>
  )
}
