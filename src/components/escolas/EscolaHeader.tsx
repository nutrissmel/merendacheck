'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  School, MapPin, Users, Pencil, PowerOff, Power,
  TrendingUp, TrendingDown, Minus, ClipboardCheck, AlertTriangle,
} from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { desativarEscolaAction, reativarEscolaAction } from '@/actions/escola.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { EscolaDetalhada } from '@/types/escola'

const TURNO_LABEL: Record<string, string> = {
  MATUTINO: 'Matutino', VESPERTINO: 'Vespertino', NOTURNO: 'Noturno', INTEGRAL: 'Integral',
}

interface EscolaHeaderProps {
  escola: EscolaDetalhada
  kpis: {
    scoreMedio: number
    tendenciaScore: number
    tendenciaScorePositiva: boolean
    totalInspecoes: number
    tendenciaInspecoes: number
    tendenciaInspecoesPositiva: boolean
    ncsAbertas: number
    ncsVencidas: number
  }
  podeEditar: boolean
  podeDesativar: boolean
}

function KPICard({
  label, valor, sub, tendencia, tendenciaPositiva, corValor,
}: {
  label: string
  valor: string | number
  sub?: string
  tendencia?: number
  tendenciaPositiva?: boolean
  corValor?: string
}) {
  const TendIcon =
    tendencia === undefined ? null
    : tendencia > 0 ? TrendingUp
    : tendencia < 0 ? TrendingDown
    : Minus
  const corTend = tendenciaPositiva ? 'text-[#00963A]' : 'text-[#DC2626]'

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-heading ${corValor ?? 'text-[#0F1B2D]'}`}>{valor}</p>
      {TendIcon && tendencia !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${corTend}`}>
          <TendIcon size={11} />
          {tendencia > 0 ? '+' : ''}{tendencia} vs anterior
        </div>
      )}
      {sub && !TendIcon && (
        <p className="text-xs text-[#5A7089] mt-1">{sub}</p>
      )}
    </div>
  )
}

export function EscolaHeader({ escola, kpis, podeEditar, podeDesativar }: EscolaHeaderProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)

  async function toggleAtiva() {
    setToggling(true)
    const res = escola.ativa
      ? await desativarEscolaAction(escola.id)
      : await reativarEscolaAction(escola.id)
    setToggling(false)
    if (res.sucesso) {
      toast.success(escola.ativa ? 'Escola desativada.' : 'Escola reativada.')
      router.refresh()
    } else {
      toast.error((res as any).erro ?? 'Erro ao alterar status.')
    }
  }

  const corScore =
    kpis.scoreMedio >= 90 ? 'text-[#00963A]'
    : kpis.scoreMedio >= 70 ? 'text-[#F59E0B]'
    : 'text-[#DC2626]'

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-6 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      {/* Topo: ícone + nome + ações */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF4FD] flex items-center justify-center shrink-0">
            <School size={28} className="text-[#0E2E60]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">{escola.nome}</h1>
              {!escola.ativa && (
                <span className="px-2 py-0.5 bg-neutral-200 text-neutral-500 text-xs font-semibold rounded-full">
                  Inativa
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-[#5A7089]">
              {escola.cidade && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {escola.cidade}{escola.bairro ? ` · ${escola.bairro}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={12} /> {escola.numeroAlunos} alunos
              </span>
              {escola.turnos.length > 0 && (
                <span>{escola.turnos.map((t) => TURNO_LABEL[t as string] ?? t).join(' · ')}</span>
              )}
              {escola.codigoInep && (
                <span className="text-xs bg-[#EEF4FD] text-[#0E2E60] px-2 py-0.5 rounded-md font-mono">
                  INEP {escola.codigoInep}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score em destaque */}
        <div className="flex items-center gap-4">
          {kpis.scoreMedio > 0 && (
            <div className="text-right">
              <p className="text-xs font-bold text-[#5A7089] uppercase tracking-wider mb-0.5">Score</p>
              <p className={`text-4xl font-bold font-heading ${corScore}`}>{kpis.scoreMedio}%</p>
              {escola.ultimaInspecao?.scoreStatus && (
                <ScoreBadge
                  scoreStatus={escola.ultimaInspecao.scoreStatus}
                  size="sm"
                  className="mt-1"
                />
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            {podeEditar && (
              <Link
                href={`/escolas/${escola.id}/editar`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-xs font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
              >
                <Pencil size={12} /> Editar
              </Link>
            )}
            {podeDesativar && (
              <button
                onClick={toggleAtiva}
                disabled={toggling}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
                  escola.ativa
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {escola.ativa ? <PowerOff size={12} /> : <Power size={12} />}
                {escola.ativa ? 'Desativar' : 'Reativar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#EEF4FD]">
        <KPICard
          label="Score médio"
          valor={kpis.scoreMedio > 0 ? `${kpis.scoreMedio}%` : '—'}
          tendencia={kpis.tendenciaScore}
          tendenciaPositiva={kpis.tendenciaScorePositiva}
          corValor={corScore}
        />
        <KPICard
          label="Inspeções"
          valor={kpis.totalInspecoes}
          tendencia={kpis.tendenciaInspecoes}
          tendenciaPositiva={kpis.tendenciaInspecoesPositiva}
        />
        <KPICard
          label="NCs Abertas"
          valor={kpis.ncsAbertas}
          sub={kpis.ncsVencidas > 0 ? `${kpis.ncsVencidas} vencida${kpis.ncsVencidas !== 1 ? 's' : ''}` : 'Tudo em dia'}
          corValor={kpis.ncsAbertas > 0 ? 'text-[#DC2626]' : 'text-[#00963A]'}
        />
        <KPICard
          label="Usuários"
          valor={escola.totalUsuarios}
          sub="atribuídos à escola"
        />
      </div>
    </div>
  )
}
