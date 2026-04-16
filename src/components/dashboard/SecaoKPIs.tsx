'use client'

import { TrendingUp, TrendingDown, Minus, ClipboardCheck, School, AlertTriangle } from 'lucide-react'
import { useContadorAnimado } from '@/hooks/useContadorAnimado'
import type { KPIsDashboard } from '@/actions/dashboard.actions'

interface SecaoKPIsProps {
  kpis: KPIsDashboard
}

export function SecaoKPIs({ kpis }: SecaoKPIsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      <CardScoreMedio kpis={kpis} />
      <CardInspecoes kpis={kpis} />
      <CardEscolas kpis={kpis} />
      <CardNCs kpis={kpis} />
    </div>
  )
}

// ─── Card Score Médio ─────────────────────────────────────────

function CardScoreMedio({ kpis }: { kpis: KPIsDashboard }) {
  const score = useContadorAnimado(kpis.scoreMedio, 800)

  const corScore =
    kpis.scoreMedio >= 90
      ? 'text-[#00963A]'
      : kpis.scoreMedio >= 70
      ? 'text-[#F59E0B]'
      : 'text-[#DC2626]'

  const TendenciaIcon =
    kpis.tendenciaScore > 0
      ? TrendingUp
      : kpis.tendenciaScore < 0
      ? TrendingDown
      : Minus

  const corTendencia =
    kpis.tendenciaScorePositiva ? 'text-[#00963A]' : 'text-[#DC2626]'

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5A7089] uppercase tracking-wider">Score Médio</p>
          <p className={`text-4xl font-bold font-heading mt-1 ${corScore}`}>
            {score}%
          </p>
        </div>
        <div className={`p-2 rounded-lg bg-[#EEF4FD]`}>
          <TendenciaIcon size={20} className={corScore} />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${corTendencia}`}>
        <TendenciaIcon size={12} />
        {kpis.tendenciaScore > 0 ? '+' : ''}{kpis.tendenciaScore}% vs período anterior
      </div>
    </div>
  )
}

// ─── Card Inspeções ───────────────────────────────────────────

function CardInspecoes({ kpis }: { kpis: KPIsDashboard }) {
  const total = useContadorAnimado(kpis.totalInspecoes, 700)
  const corTendencia = kpis.tendenciaInspecoesPositiva ? 'text-[#00963A]' : 'text-[#DC2626]'
  const TendenciaIcon = kpis.tendenciaInspecoes >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5A7089] uppercase tracking-wider">Inspeções</p>
          <p className="text-4xl font-bold font-heading mt-1 text-[#0F1B2D]">{total}</p>
        </div>
        <div className="p-2 rounded-lg bg-[#EEF4FD]">
          <ClipboardCheck size={20} className="text-[#0E2E60]" />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${corTendencia}`}>
        <TendenciaIcon size={12} />
        {kpis.tendenciaInspecoes >= 0 ? '+' : ''}{kpis.tendenciaInspecoes} vs período anterior
      </div>
      <p className="text-xs text-[#5A7089] mt-1">
        Taxa de execução: <span className="font-bold text-[#0F1B2D]">{kpis.taxaExecucao}%</span>
      </p>
    </div>
  )
}

// ─── Card Escolas ─────────────────────────────────────────────

function CardEscolas({ kpis }: { kpis: KPIsDashboard }) {
  const comInspecao = useContadorAnimado(kpis.escolasComInspecaoNoPeriodo, 600)

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5A7089] uppercase tracking-wider">Escolas</p>
          <p className="text-4xl font-bold font-heading mt-1 text-[#0F1B2D]">
            {comInspecao}
            <span className="text-xl text-[#5A7089] font-normal">/{kpis.totalEscolas}</span>
          </p>
        </div>
        <div className="p-2 rounded-lg bg-[#EEF4FD]">
          <School size={20} className="text-[#0E2E60]" />
        </div>
      </div>
      {kpis.escolasSemInspecao > 0 ? (
        <p className="text-xs font-semibold text-[#DC2626] mt-3">
          {kpis.escolasSemInspecao} escola{kpis.escolasSemInspecao !== 1 ? 's' : ''} sem inspeção
        </p>
      ) : (
        <p className="text-xs font-semibold text-[#00963A] mt-3">Todas monitoradas ✓</p>
      )}
      <p className="text-xs text-[#5A7089] mt-1">com inspeção no período</p>
    </div>
  )
}

// ─── Card NCs ─────────────────────────────────────────────────

function CardNCs({ kpis }: { kpis: KPIsDashboard }) {
  const ncs = useContadorAnimado(kpis.ncsAbertas, 600)

  const corValor = kpis.ncsAbertas > 0 ? 'text-[#DC2626]' : 'text-[#00963A]'
  const corIcone = kpis.ncsAbertas > 0 ? 'text-[#DC2626]' : 'text-[#00963A]'

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5A7089] uppercase tracking-wider">NCs Abertas</p>
          <p className={`text-4xl font-bold font-heading mt-1 ${corValor}`}>{ncs}</p>
        </div>
        <div className="p-2 rounded-lg bg-[#EEF4FD]">
          <AlertTriangle size={20} className={corIcone} />
        </div>
      </div>
      {kpis.ncsVencidas > 0 && (
        <p className="text-xs font-semibold text-[#DC2626] mt-3">
          {kpis.ncsVencidas} vencida{kpis.ncsVencidas !== 1 ? 's' : ''}
        </p>
      )}
      {kpis.tempMedioResolucaoDias > 0 && (
        <p className="text-xs text-[#5A7089] mt-1">
          Média: <span className="font-bold text-[#0F1B2D]">{kpis.tempMedioResolucaoDias}d</span> para resolver
        </p>
      )}
      {kpis.ncsAbertas === 0 && (
        <p className="text-xs font-semibold text-[#00963A] mt-3">Nenhuma pendente ✓</p>
      )}
    </div>
  )
}
