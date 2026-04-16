'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GraficoEvolucaoNCsProps {
  dados: { data: string; abertas: number; resolvidas: number }[]
}

function TooltipEvolucao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const abertas = payload.find((p: any) => p.dataKey === 'abertas')?.value ?? 0
  const resolvidas = payload.find((p: any) => p.dataKey === 'resolvidas')?.value ?? 0
  let labelFmt = label
  try { labelFmt = format(parseISO(label), 'dd/MM', { locale: ptBR }) } catch {}

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
      <p style={{ fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>{labelFmt}</p>
      <div style={{ borderTop: '1px solid #D5E3F0', paddingTop: 6, display: 'flex', gap: 12 }}>
        <span style={{ color: '#DC2626' }}>● {abertas} abertas</span>
        <span style={{ color: '#00963A' }}>● {resolvidas} resolvidas</span>
      </div>
    </div>
  )
}

export function GraficoEvolucaoNCs({ dados }: GraficoEvolucaoNCsProps) {
  // Calcular tendência: comparar acumulado da 1ª metade com 2ª metade
  const meio = Math.floor(dados.length / 2)
  const abertasPrimeira = dados.slice(0, meio).reduce((s, d) => s + d.abertas, 0)
  const abertasSegunda = dados.slice(meio).reduce((s, d) => s + d.abertas, 0)
  const tendenciaPositiva = abertasSegunda < abertasPrimeira

  const intervalo = dados.length > 30 ? 6 : dados.length > 14 ? 3 : 1

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <h3 className="font-semibold text-[#0F1B2D] font-heading mb-1">Evolução de Não Conformidades</h3>

      <div className="h-[240px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAbertas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradResolvidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00963A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00963A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="#EEF4FD" />
            <XAxis
              dataKey="data"
              tickFormatter={(d) => {
                try { return format(parseISO(d), 'dd/MM', { locale: ptBR }) } catch { return d }
              }}
              interval={intervalo}
              tick={{ fontSize: 11, fill: '#5A7089' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#5A7089' }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip content={<TooltipEvolucao />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#5A7089', paddingTop: 8 }}
              formatter={(value) => (value === 'abertas' ? 'NCs abertas' : 'NCs resolvidas')}
            />
            <Area
              type="monotone"
              dataKey="abertas"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#gradAbertas)"
              dot={false}
              activeDot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="resolvidas"
              stroke="#00963A"
              strokeWidth={2}
              fill="url(#gradResolvidas)"
              dot={false}
              activeDot={{ r: 3, fill: '#00963A', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight dinâmico */}
      <div
        className={`mt-3 rounded-lg px-4 py-2.5 text-xs font-semibold ${
          tendenciaPositiva
            ? 'bg-[#D1F7E2] text-[#005C25]'
            : 'bg-[#FEF3C7] text-[#92400E]'
        }`}
      >
        {tendenciaPositiva
          ? '✓ NCs estão sendo resolvidas — tendência positiva no período'
          : '⚠ Tendência de aumento de NCs — atenção recomendada'}
      </div>
    </div>
  )
}
