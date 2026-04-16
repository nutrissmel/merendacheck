'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Dot,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy } from 'lucide-react'
import type { ScoreStatus } from '@prisma/client'
import type { PeriodoDetalhes } from '@/actions/escola-detalhe.actions'

// ─── Cores ────────────────────────────────────────────────────

function corPorScore(score: number): string {
  if (score >= 90) return '#00963A'
  if (score >= 70) return '#F59E0B'
  return '#DC2626'
}

function corPorStatus(status: ScoreStatus | null): string {
  if (!status) return '#A8BDD4'
  if (status === 'CONFORME') return '#00963A'
  if (status === 'ATENCAO') return '#F59E0B'
  return '#DC2626'
}

// ─── Tooltip do gráfico com link para inspeção ───────────────

function TooltipEvolucao({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div
      style={{
        background: 'white', border: '1px solid #D5E3F0', borderRadius: 8,
        padding: '10px 14px', boxShadow: '0 4px 12px rgba(14,46,96,0.12)', fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>{item.dataFormatada}</p>
      <p style={{ color: corPorScore(item.score), fontWeight: 600 }}>{item.score}%</p>
      <p style={{ color: '#5A7089', marginTop: 2 }}>{item.checklistNome}</p>
      <Link
        href={`/inspecoes/${item.id}`}
        className="mt-3 inline-block text-xs font-semibold text-[#0E2E60] hover:underline"
      >
        Ver inspeção →
      </Link>
    </div>
  )
}

// ─── Dot colorido por score ───────────────────────────────────

function DotColorido(props: any) {
  const { cx, cy, payload } = props
  if (!payload) return null
  return (
    <circle
      cx={cx} cy={cy} r={5}
      fill={corPorScore(payload.score)}
      stroke="white" strokeWidth={2}
    />
  )
}

// ─── Gráfico de Evolução ──────────────────────────────────────

function GraficoEvolucao({ dados, periodo }: { dados: any[]; periodo: PeriodoDetalhes }) {
  if (dados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-[#5A7089]">
        Nenhuma inspeção finalizada no período
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="#EEF4FD" />
          <XAxis
            dataKey="data"
            tickFormatter={(d) => { try { return format(parseISO(d), 'dd/MM', { locale: ptBR }) } catch { return d } }}
            tick={{ fontSize: 11, fill: '#5A7089' }}
            axisLine={false} tickLine={false}
            interval={dados.length > 20 ? 4 : dados.length > 10 ? 2 : 0}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#5A7089' }}
            axisLine={false} tickLine={false} width={38}
          />
          <Tooltip content={<TooltipEvolucao />} />
          <ReferenceLine
            y={90} stroke="#00963A" strokeDasharray="5 3"
            label={{ value: 'meta', position: 'insideTopRight', fontSize: 10, fill: '#00963A' }}
          />
          <Line
            type="monotone" dataKey="score"
            stroke="#0E2E60" strokeWidth={2}
            dot={<DotColorido />}
            activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Calendário do mês ────────────────────────────────────────

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function CalendarioInspecoes({ calendario }: { calendario: any }) {
  if (!calendario) return null

  const { mes, ano, primeiroDiaSemana, dias } = calendario
  const celulas: (null | typeof dias[0])[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...dias,
  ]

  return (
    <div>
      <p className="text-xs font-bold text-[#5A7089] uppercase tracking-wider mb-3">
        {MESES_PT[mes]} {ano}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[#A8BDD4] pb-1">{d}</div>
        ))}
        {celulas.map((cel, idx) => {
          if (!cel) return <div key={idx} />
          const cor = cel.temInspecao ? corPorStatus(cel.scoreStatus) : undefined
          return (
            <div
              key={idx}
              title={cel.temInspecao ? `${cel.contagem} inspeção(ões)` : undefined}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-transform ${
                cel.temInspecao ? 'cursor-default hover:scale-110' : 'text-[#A8BDD4]'
              }`}
              style={
                cel.temInspecao
                  ? { backgroundColor: cor + '22', color: cor, border: `1.5px solid ${cor}` }
                  : { color: '#A8BDD4' }
              }
            >
              {cel.dia}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-[#5A7089]">
        {[
          { cor: '#00963A', label: 'Conforme' },
          { cor: '#F59E0B', label: 'Atenção' },
          { cor: '#DC2626', label: 'NC' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.cor }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Comparativo entre escolas ────────────────────────────────

function CardComparativo({ comparativo }: { comparativo: any }) {
  if (!comparativo) return null
  const { posicao, total } = comparativo

  const emoji = posicao === 1 ? '🏆' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : '📊'
  const texto =
    posicao === 1
      ? `1ª de ${total} escolas`
      : `${posicao}ª de ${total} escolas`

  return (
    <div className="bg-[#EEF4FD] rounded-xl p-4 text-center">
      <p className="text-3xl mb-1">{emoji}</p>
      <p className="text-lg font-bold text-[#0E2E60] font-heading">{texto}</p>
      <p className="text-xs text-[#5A7089] mt-1">no ranking do município</p>
      <div className="mt-3 space-y-1.5">
        {comparativo.scores.slice(0, 5).map((e: any, idx: number) => (
          <div key={e.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${e.id === comparativo.scores[posicao - 1]?.id ? 'text-[#0E2E60]' : 'text-[#A8BDD4]'}`}>
                #{idx + 1}
              </span>
              <span className={`truncate max-w-[100px] ${e.score === comparativo.minhaScore ? 'font-bold text-[#0F1B2D]' : 'text-[#5A7089]'}`}>
                {e.nome.split(' ').slice(-2).join(' ')}
              </span>
            </div>
            <span className="font-bold" style={{ color: corPorScore(e.score) }}>{e.score}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Comparativo de checklists ────────────────────────────────

function ComparativoChecklists({ dados }: { dados: any[] }) {
  if (dados.length === 0) return null

  return (
    <div>
      <p className="text-xs font-bold text-[#5A7089] uppercase tracking-wider mb-3">
        Por tipo de checklist
      </p>
      <div className="space-y-2.5">
        {dados.map((item) => {
          const cor = corPorScore(item.scoreMedio)
          return (
            <div key={item.categoria}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#5A7089] truncate max-w-[160px]">{item.nome}</span>
                <span className="font-bold shrink-0 ml-2" style={{ color: cor }}>
                  {item.scoreMedio}%
                </span>
              </div>
              <div className="h-2 bg-[#EEF4FD] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.scoreMedio}%`, backgroundColor: cor }}
                />
              </div>
              <p className="text-[10px] text-[#A8BDD4] mt-0.5">{item.totalInspecoes} inspeç{item.totalInspecoes !== 1 ? 'ões' : 'ão'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AbaVisaoGeral ────────────────────────────────────────────

interface AbaVisaoGeralProps {
  escolaId: string
  evolucao: any[]
  calendario: any
  comparativo: any
  comparativoChecklists: any[]
  periodo: PeriodoDetalhes
}

export function AbaVisaoGeral({
  evolucao, calendario, comparativo, comparativoChecklists, periodo,
}: AbaVisaoGeralProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna principal: gráfico */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0F1B2D] font-heading">Evolução do score</h3>
            <p className="text-xs text-[#5A7089]">Últimos {periodo}</p>
          </div>
          <GraficoEvolucao dados={evolucao} periodo={periodo} />
          <p className="text-xs text-[#A8BDD4] mt-3">
            Clique nos pontos para ver detalhes da inspeção
          </p>
        </div>

        {/* Comparativo de checklists */}
        {comparativoChecklists.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
            <h3 className="font-semibold text-[#0F1B2D] font-heading mb-4">Desempenho por checklist</h3>
            <ComparativoChecklists dados={comparativoChecklists} />
          </div>
        )}
      </div>

      {/* Coluna lateral: calendário + ranking */}
      <div className="space-y-6">
        {calendario && (
          <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
            <h3 className="font-semibold text-[#0F1B2D] font-heading mb-4">Inspeções no mês</h3>
            <CalendarioInspecoes calendario={calendario} />
          </div>
        )}

        {comparativo && (
          <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
            <h3 className="font-semibold text-[#0F1B2D] font-heading mb-3">Ranking municipal</h3>
            <CardComparativo comparativo={comparativo} />
          </div>
        )}
      </div>
    </div>
  )
}
