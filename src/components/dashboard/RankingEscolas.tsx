'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import type { EscolaRanking } from '@/actions/dashboard.actions'

interface RankingEscolasProps {
  escolas: EscolaRanking[]
}

type Ordem = 'score_desc' | 'score_asc'

function MiniSparkline({ historico }: { historico: { data: string; score: number }[] }) {
  if (historico.length < 2) {
    return <div className="w-20 h-6 flex items-center justify-center text-xs text-[#A8BDD4]">—</div>
  }

  const valores = historico.map((h) => h.score)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const range = max - min || 1
  const w = 80
  const h = 24
  const pontos = valores.map((v, i) => ({
    x: (i / (valores.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))
  const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const ultimo = valores[valores.length - 1]
  const cor = ultimo >= 90 ? '#00963A' : ultimo >= 70 ? '#F59E0B' : '#DC2626'

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={d} stroke={cor} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <circle
        cx={pontos[pontos.length - 1].x}
        cy={pontos[pontos.length - 1].y}
        r={2.5}
        fill={cor}
      />
    </svg>
  )
}

function BadgeRank({ posicao }: { posicao: number }) {
  const estilos: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    2: { bg: '#F1F5F9', text: '#475569', border: '#A8BDD4' },
    3: { bg: '#FEF3C7', text: '#92400E', border: '#D97706' },
  }
  const estilo = estilos[posicao] ?? { bg: '#EEF4FD', text: '#5A7089', border: '#D5E3F0' }

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
      style={{ backgroundColor: estilo.bg, color: estilo.text, borderColor: estilo.border }}
    >
      {posicao}
    </div>
  )
}

function BgPorScore({ scoreStatus, children }: { scoreStatus: string | null; children: React.ReactNode }) {
  const bg =
    scoreStatus === 'CONFORME'
      ? 'bg-white'
      : scoreStatus === 'ATENCAO'
      ? 'bg-[#FFFBEB]'
      : scoreStatus === 'NAO_CONFORME' || scoreStatus === 'REPROVADO'
      ? 'bg-[#FFF5F5]'
      : 'bg-white'

  return <div className={bg}>{children}</div>
}

export function RankingEscolas({ escolas }: RankingEscolasProps) {
  const [ordem, setOrdem] = useState<Ordem>('score_desc')

  const ordenadas = [...escolas].sort((a, b) => {
    if (a.totalInspecoes === 0 && b.totalInspecoes > 0) return 1
    if (b.totalInspecoes === 0 && a.totalInspecoes > 0) return -1
    if (ordem === 'score_desc') return b.scoreMedio - a.scoreMedio
    return a.scoreMedio - b.scoreMedio
  })

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#D5E3F0] flex items-center justify-between">
        <h3 className="font-semibold text-[#0F1B2D] font-heading">Ranking de Escolas</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOrdem('score_desc')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              ordem === 'score_desc'
                ? 'bg-[#0E2E60] text-white'
                : 'text-[#5A7089] hover:bg-[#EEF4FD]'
            }`}
          >
            ↑ Score
          </button>
          <button
            onClick={() => setOrdem('score_asc')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              ordem === 'score_asc'
                ? 'bg-[#0E2E60] text-white'
                : 'text-[#5A7089] hover:bg-[#EEF4FD]'
            }`}
          >
            ↓ Score
          </button>
        </div>
      </div>

      {/* Cabeçalho da tabela */}
      <div className="px-4 py-2 bg-[#EEF4FD] grid grid-cols-[28px_1fr_auto_auto_auto] gap-3 items-center text-[10px] font-bold text-[#0E2E60] uppercase tracking-wider">
        <span>#</span>
        <span>Escola</span>
        <span className="text-right">Score</span>
        <span className="text-right hidden sm:block">Tendência</span>
        <span className="text-right hidden md:block">Histórico</span>
      </div>

      <div className="divide-y divide-[#EEF4FD]">
        {ordenadas.map((escola, idx) => {
          const semDados = escola.totalInspecoes === 0
          const TendIcon =
            escola.tendencia > 0 ? TrendingUp : escola.tendencia < 0 ? TrendingDown : Minus
          const corTend =
            escola.tendencia > 0
              ? 'text-[#00963A]'
              : escola.tendencia < 0
              ? 'text-[#DC2626]'
              : 'text-[#5A7089]'

          return (
            <BgPorScore key={escola.id} scoreStatus={escola.scoreStatus}>
              <div className="px-4 py-3 grid grid-cols-[28px_1fr_auto_auto_auto] gap-3 items-center">
                <BadgeRank posicao={idx + 1} />

                <div className="min-w-0">
                  <Link
                    href={`/escolas/${escola.id}`}
                    className="text-sm font-semibold text-[#0F1B2D] hover:text-[#0E2E60] truncate block transition-colors"
                  >
                    {escola.nome}
                  </Link>
                  <p className="text-xs text-[#5A7089]">
                    {escola.totalInspecoes} inspeç{escola.totalInspecoes !== 1 ? 'ões' : 'ão'}
                    {escola.ncsAbertas > 0 && (
                      <span className="text-[#DC2626] ml-2">· {escola.ncsAbertas} NC{escola.ncsAbertas !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>

                <div className="shrink-0">
                  {semDados ? (
                    <span className="text-xs text-[#A8BDD4] font-semibold px-2 py-0.5 bg-[#EEF4FD] rounded-full">
                      Sem dados
                    </span>
                  ) : escola.scoreStatus ? (
                    <ScoreBadge scoreStatus={escola.scoreStatus} score={escola.scoreMedio} showScore size="sm" />
                  ) : (
                    <span className="text-sm font-bold text-[#A8BDD4]">—</span>
                  )}
                </div>

                <div className={`shrink-0 hidden sm:flex items-center gap-1 text-xs font-semibold ${corTend}`}>
                  {!semDados && (
                    <>
                      <TendIcon size={12} />
                      {escola.tendencia > 0 ? '+' : ''}{escola.tendencia}%
                    </>
                  )}
                </div>

                <div className="shrink-0 hidden md:block">
                  {!semDados && escola.historico.length > 0 && (
                    <MiniSparkline historico={escola.historico} />
                  )}
                </div>
              </div>
            </BgPorScore>
          )
        })}

        {escolas.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-[#5A7089]">
            Nenhuma escola encontrada
          </div>
        )}
      </div>
    </div>
  )
}
