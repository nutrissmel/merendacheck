'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Severidade, CategoriaChecklist } from '@prisma/client'
import { CATEGORIA_CONFIG } from '@/components/checklists/CategoriaConfig'

const CORES_SEVERIDADE: Record<Severidade, string> = {
  CRITICA: '#B91C1C',
  ALTA: '#DC2626',
  MEDIA: '#F59E0B',
  BAIXA: '#A8BDD4',
}

const LABELS_SEVERIDADE: Record<Severidade, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
}

const GRAFICO_CORES = [
  '#0E2E60', '#00963A', '#F59E0B', '#DC2626',
  '#7C3AED', '#0369A1', '#059669',
]

interface GraficoNCSeveridadeProps {
  dadosSeveridade: { severidade: Severidade; total: number; percentual: number }[]
  dadosCategoria: { categoria: CategoriaChecklist; total: number }[]
}

function CentroDonut({ total, label }: { total: number; label: string }) {
  return (
    <text textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-8" fontSize={22} fontWeight={700} fill="#0F1B2D">
        {total}
      </tspan>
      <tspan x="50%" dy={22} fontSize={11} fill="#5A7089">
        {label}
      </tspan>
    </text>
  )
}

function TooltipNC({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #D5E3F0',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(14,46,96,0.12)',
        fontSize: 12,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.payload.fill }} />
        <span className="font-semibold text-[#0F1B2D]">{item.name}</span>
      </div>
      <p className="text-[#5A7089] mt-1">
        {item.value} ({item.payload.percentual}%)
      </p>
    </div>
  )
}

export function GraficoNCSeveridade({ dadosSeveridade, dadosCategoria }: GraficoNCSeveridadeProps) {
  const [modo, setModo] = useState<'severidade' | 'categoria'>('severidade')

  const dadosSev = dadosSeveridade
    .filter((d) => d.total > 0)
    .map((d) => ({
      name: LABELS_SEVERIDADE[d.severidade],
      value: d.total,
      percentual: d.percentual,
      fill: CORES_SEVERIDADE[d.severidade],
    }))

  const dadosCat = dadosCategoria.slice(0, 7).map((d, i) => ({
    name: CATEGORIA_CONFIG[d.categoria]?.label ?? d.categoria,
    value: d.total,
    percentual: 0,
    fill: GRAFICO_CORES[i % GRAFICO_CORES.length],
  }))

  const dados = modo === 'severidade' ? dadosSev : dadosCat
  const total = dados.reduce((s, d) => s + d.value, 0)
  const totalSev = dadosSeveridade.reduce((s, d) => s + d.total, 0)

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1B2D] font-heading">NCs por {modo === 'severidade' ? 'Severidade' : 'Categoria'}</h3>
        <div className="flex items-center gap-1 bg-[#EEF4FD] rounded-lg p-1">
          <button
            onClick={() => setModo('severidade')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
              modo === 'severidade' ? 'bg-white text-[#0E2E60] shadow-sm' : 'text-[#5A7089]'
            }`}
          >
            Severidade
          </button>
          <button
            onClick={() => setModo('categoria')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
              modo === 'categoria' ? 'bg-white text-[#0E2E60] shadow-sm' : 'text-[#5A7089]'
            }`}
          >
            Categoria
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#00963A]">0</p>
            <p className="text-sm text-[#5A7089] mt-1">Nenhuma NC no período ✓</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={600}
                >
                  {dados.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} stroke="white" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipNC />} />
                <CentroDonut total={totalSev} label="Total" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div className="mt-2 space-y-2">
            {dados.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-[#5A7089] truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[#0F1B2D]">{item.value}</span>
                  {item.percentual > 0 && (
                    <span className="text-[#A8BDD4]">({item.percentual}%)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
