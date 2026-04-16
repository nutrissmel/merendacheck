'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PontoTemporal } from '@/actions/dashboard.actions'

interface GraficoConformidadeProps {
  dados: PontoTemporal[]
  periodo: string
}

function formatarData(dataStr: string): string {
  try {
    return format(parseISO(dataStr), 'dd/MM', { locale: ptBR })
  } catch {
    return dataStr
  }
}

function getCorPorScore(score: number): string {
  if (score >= 90) return '#00963A'
  if (score >= 70) return '#F59E0B'
  return '#DC2626'
}

function TooltipConformidade({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const score = payload.find((p: any) => p.dataKey === 'scoreMedio')?.value ?? 0
  const inspecoes = payload.find((p: any) => p.dataKey === 'totalInspecoes')?.value ?? 0
  const conformes = payload.find((p: any) => p.dataKey === 'conformes')?.value ?? 0
  const naoConformes = payload.find((p: any) => p.dataKey === 'naoConformes')?.value ?? 0

  const status = score >= 90 ? '✓ Conforme' : score >= 70 ? '⚠ Atenção' : '✗ Não Conforme'
  const corStatus = score >= 90 ? '#00963A' : score >= 70 ? '#F59E0B' : '#DC2626'

  let labelFormatado = label
  try { labelFormatado = format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR }) } catch {}

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #D5E3F0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(14,46,96,0.12)',
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>{labelFormatado}</p>
      <div style={{ borderTop: '1px solid #D5E3F0', paddingTop: 6 }}>
        <p style={{ color: corStatus, fontWeight: 600 }}>
          Score: {score}% {status}
        </p>
        {inspecoes > 0 && (
          <>
            <p style={{ color: '#5A7089', marginTop: 3 }}>Inspeções: {inspecoes}</p>
            {(conformes > 0 || naoConformes > 0) && (
              <p style={{ color: '#5A7089', marginTop: 2 }}>
                Conformes: {conformes} · NCs: {naoConformes}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function GraficoConformidade({ dados, periodo }: GraficoConformidadeProps) {
  const [modo, setModo] = useState<'area' | 'barras'>('area')

  // Filtrar apenas pontos com dados para o modo de barras
  const dadosComDados = dados.filter((d) => d.totalInspecoes > 0)
  const dadosGrafico = modo === 'area' ? dados : dadosComDados

  const intervaloLabel = dados.length > 30 ? 6 : dados.length > 14 ? 2 : 1

  const diasLabel: Record<string, string> = {
    '7d': '7 dias',
    '30d': '30 dias',
    '60d': '60 dias',
    '90d': '90 dias',
  }

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-[#0F1B2D] font-heading">Score de Conformidade</h3>
          <p className="text-xs text-[#5A7089] mt-0.5">Últimos {diasLabel[periodo] ?? periodo}</p>
        </div>
        <div className="flex items-center gap-1 bg-[#EEF4FD] rounded-lg p-1">
          <button
            onClick={() => setModo('area')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              modo === 'area'
                ? 'bg-white text-[#0E2E60] shadow-sm'
                : 'text-[#5A7089] hover:text-[#0E2E60]'
            }`}
          >
            Área
          </button>
          <button
            onClick={() => setModo('barras')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              modo === 'barras'
                ? 'bg-white text-[#0E2E60] shadow-sm'
                : 'text-[#5A7089] hover:text-[#0E2E60]'
            }`}
          >
            Barras
          </button>
        </div>
      </div>

      <div className="h-[280px] mt-4">
        {modo === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D9E8FA" stopOpacity={1} />
                  <stop offset="95%" stopColor="#D9E8FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="#EEF4FD" />
              <XAxis
                dataKey="data"
                tickFormatter={formatarData}
                interval={intervaloLabel}
                tick={{ fontSize: 11, fill: '#5A7089' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="score"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#5A7089' }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <YAxis
                yAxisId="inspecoes"
                orientation="right"
                tick={{ fontSize: 11, fill: '#5A7089' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<TooltipConformidade />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#5A7089', paddingTop: 8 }}
                formatter={(value) =>
                  value === 'scoreMedio' ? 'Score médio' : 'Inspeções realizadas'
                }
              />
              <ReferenceLine
                yAxisId="score"
                y={90}
                stroke="#00963A"
                strokeDasharray="5 3"
                label={{ value: 'meta 90%', position: 'insideTopRight', fontSize: 10, fill: '#00963A' }}
              />
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="scoreMedio"
                stroke="#0E2E60"
                strokeWidth={2.5}
                fill="url(#gradScore)"
                dot={false}
                activeDot={{ r: 4, fill: '#0E2E60', strokeWidth: 0 }}
              />
              <Bar
                yAxisId="inspecoes"
                dataKey="totalInspecoes"
                fill="#00963A"
                fillOpacity={0.45}
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="#EEF4FD" />
              <XAxis
                dataKey="data"
                tickFormatter={formatarData}
                tick={{ fontSize: 11, fill: '#5A7089' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#5A7089' }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<TooltipConformidade />} />
              <ReferenceLine
                y={90}
                stroke="#00963A"
                strokeDasharray="5 3"
                label={{ value: 'meta 90%', position: 'insideTopRight', fontSize: 10, fill: '#00963A' }}
              />
              <Bar dataKey="scoreMedio" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {dadosGrafico.map((entry, idx) => (
                  <Cell key={idx} fill={getCorPorScore(entry.scoreMedio)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
