'use client'

import { useEffect, useState } from 'react'
import { buscarHeatmapInspecoes, type HeatmapData } from '@/actions/dashboard.actions'

interface HeatmapInspecoesProps {
  periodo: '30d' | '90d'
  escolaId?: string
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORA_INICIO = 6
const HORA_FIM = 18

function getCorCelula(intensidade: number): string {
  if (intensidade === 0) return '#F5F9FD'
  if (intensidade <= 0.25) return '#D9E8FA'
  if (intensidade <= 0.5) return '#7AAAE3'
  if (intensidade <= 0.75) return '#1A4A9E'
  return '#0E2E60'
}

export function HeatmapInspecoes({ periodo, escolaId }: HeatmapInspecoesProps) {
  const [matriz, setMatriz] = useState<HeatmapData[][] | null>(null)
  const [tooltip, setTooltip] = useState<{ dia: number; hora: number; contagem: number; x: number; y: number } | null>(null)

  useEffect(() => {
    buscarHeatmapInspecoes({ periodo, escolaId }).then(setMatriz)
  }, [periodo, escolaId])

  if (!matriz) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)] h-full">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#EEF4FD] rounded w-48" />
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${HORA_FIM - HORA_INICIO + 1}, 28px)` }}>
            {Array.from({ length: 7 * (HORA_FIM - HORA_INICIO + 1) }).map((_, i) => (
              <div key={i} className="w-7 h-7 bg-[#EEF4FD] rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calcular pico e concentração
  let picoDia = 0, picoHora = 6, picoContagem = 0
  let totalInspecoes = 0
  let inspecoesPico = 0

  matriz.forEach((horas, dia) => {
    horas.forEach((cell, hora) => {
      totalInspecoes += cell.contagem
      if (cell.contagem > picoContagem) {
        picoContagem = cell.contagem
        picoDia = dia
        picoHora = hora
      }
      if (hora >= 7 && hora <= 10) {
        inspecoesPico += cell.contagem
      }
    })
  })

  const pctPico = totalInspecoes > 0 ? Math.round((inspecoesPico / totalInspecoes) * 100) : 0
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => i + HORA_INICIO)

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <h3 className="font-semibold text-[#0F1B2D] font-heading">Quando as inspeções acontecem</h3>
      <p className="text-xs text-[#5A7089] mt-0.5 mb-4">Últimos {periodo === '30d' ? '30' : '90'} dias</p>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Cabeçalho de horas */}
          <div className="flex items-center gap-[3px] mb-1 ml-[36px]">
            {horas.map((h) => (
              <div key={h} className="w-7 text-center text-[10px] text-[#5A7089]">
                {h}h
              </div>
            ))}
          </div>

          {/* Linhas de dias */}
          {DIAS.map((dia, diaIdx) => (
            <div key={diaIdx} className="flex items-center gap-[3px] mb-[3px]">
              <div className="w-8 text-[11px] text-[#5A7089] font-medium shrink-0">{dia}</div>
              {horas.map((hora) => {
                const cell = matriz[diaIdx]?.[hora]
                const intensidade = cell?.intensidade ?? 0
                const contagem = cell?.contagem ?? 0
                return (
                  <div
                    key={hora}
                    className="w-7 h-7 rounded cursor-pointer transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: getCorCelula(intensidade) }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ dia: diaIdx, hora, contagem, x: rect.left, y: rect.top })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-[#5A7089]">
        <span>Menos</span>
        {['#F5F9FD', '#D9E8FA', '#7AAAE3', '#1A4A9E', '#0E2E60'].map((cor) => (
          <div key={cor} className="w-4 h-4 rounded" style={{ backgroundColor: cor }} />
        ))}
        <span>Mais</span>
      </div>

      {/* Observações dinâmicas */}
      {picoContagem > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-[#5A7089]">
            Pico: <span className="font-semibold text-[#0F1B2D]">{DIAS[picoDia]} às {picoHora}h ({picoContagem} inspeções)</span>
          </p>
          {pctPico > 0 && (
            <p className="text-xs text-[#5A7089]">
              <span className="font-semibold text-[#0F1B2D]">{pctPico}%</span> das inspeções ocorrem entre 07h e 10h
            </p>
          )}
        </div>
      )}

      {/* Tooltip flutuante */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-[#D5E3F0] rounded-lg px-3 py-2 shadow-lg text-xs"
          style={{ top: tooltip.y - 44, left: tooltip.x + 14 }}
        >
          <span className="font-semibold text-[#0F1B2D]">
            {DIAS[tooltip.dia]}-feira {tooltip.hora}h
          </span>
          : {tooltip.contagem} inspeç{tooltip.contagem !== 1 ? 'ões' : 'ão'}
        </div>
      )}
    </div>
  )
}
