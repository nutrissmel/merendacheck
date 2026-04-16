import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import type { ItemMaisReprovado } from '@/actions/dashboard.actions'

interface ItensMaisReprovadosProps {
  itens: ItemMaisReprovado[]
  totalInspecoes: number
}

export function ItensMaisReprovados({ itens, totalInspecoes }: ItensMaisReprovadosProps) {
  if (itens.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)] flex items-center justify-center">
        <div className="text-center py-6">
          <p className="text-2xl mb-1">✓</p>
          <p className="text-sm font-semibold text-[#00963A]">Nenhum item reprovado no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#D5E3F0]">
        <h3 className="font-semibold text-[#0F1B2D] font-heading">Itens Mais Reprovados</h3>
      </div>

      <div className="divide-y divide-[#EEF4FD]">
        {itens.map((item, idx) => {
          const corBarra = item.isCritico ? '#DC2626' : '#F59E0B'
          const pct = Math.min(item.percentualReprovacao, 100)

          return (
            <div key={idx} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-xs font-bold text-[#A8BDD4] shrink-0 mt-0.5 w-4">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F1B2D] leading-tight truncate">
                      {item.pergunta}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <CategoriaBadge categoria={item.categoria} size="sm" />
                      {item.isCritico && (
                        <span className="text-[10px] font-bold text-white bg-[#DC2626] px-1.5 py-0.5 rounded-full">
                          Crítico
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className="text-xs font-bold shrink-0 mt-0.5"
                  style={{ color: corBarra }}
                >
                  {item.percentualReprovacao}%
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="flex items-center gap-2 ml-6">
                <div className="flex-1 h-1.5 bg-[#EEF4FD] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: corBarra }}
                  />
                </div>
                <span className="text-[10px] text-[#5A7089] shrink-0 w-12 text-right">
                  {item.totalReprovacoes}×
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {totalInspecoes > 0 && (
        <div className="px-5 py-3 border-t border-[#EEF4FD] bg-[#F5F9FD]">
          <p className="text-xs text-[#5A7089]">
            Baseado em <span className="font-bold text-[#0F1B2D]">{totalInspecoes}</span> inspeç{totalInspecoes !== 1 ? 'ões' : 'ão'} no período
          </p>
        </div>
      )}
    </div>
  )
}
