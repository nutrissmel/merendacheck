'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SparklineProps {
  dados: { data: Date; valor: number }[]
  cor?: string
  altura?: number
  mostrarTooltip?: boolean
  valorMin?: number
  valorMax?: number
}

function getCorPorScore(dados: { valor: number }[]): string {
  if (dados.length === 0) return '#00963A'
  const media = dados.reduce((s, d) => s + d.valor, 0) / dados.length
  if (media >= 90) return '#00963A'
  if (media >= 70) return '#F59E0B'
  return '#DC2626'
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; valor: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-neutral-500">{d.label}</p>
      <p className="font-bold text-neutral-900">{d.valor}%</p>
    </div>
  )
}

export function Sparkline({
  dados,
  cor,
  altura = 60,
  mostrarTooltip = true,
  valorMin = 0,
  valorMax = 100,
}: SparklineProps) {
  if (dados.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-neutral-400"
        style={{ height: altura }}
      >
        Sem dados
      </div>
    )
  }

  const corFinal = cor ?? getCorPorScore(dados)

  const chartData = dados.map((d) => ({
    label: format(new Date(d.data), 'dd/MM', { locale: ptBR }),
    valor: d.valor,
  }))

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id={`grad-${corFinal.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={corFinal} stopOpacity={0.12} />
            <stop offset="95%" stopColor={corFinal} stopOpacity={0} />
          </linearGradient>
        </defs>
        {mostrarTooltip && <Tooltip content={<CustomTooltip />} />}
        <Area
          type="monotone"
          dataKey="valor"
          stroke={corFinal}
          strokeWidth={2}
          fill={`url(#grad-${corFinal.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 3, fill: corFinal }}
          domain={[valorMin, valorMax]}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
