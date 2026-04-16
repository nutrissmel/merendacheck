import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { HistoricoEvento } from '@/actions/naoConformidade.actions'

interface HistoricoNCProps {
  historico: HistoricoEvento[]
}

const TIPO_ICON: Record<HistoricoEvento['tipo'], string> = {
  NC_GERADA:     '🔴',
  PRAZO_DEFINIDO:'📅',
  ACAO_CRIADA:   '📋',
  ACAO_CONCLUIDA:'✅',
  NC_RESOLVIDA:  '🎉',
  NC_REABERTA:   '🔁',
}

export function HistoricoNC({ historico }: HistoricoNCProps) {
  if (historico.length === 0) {
    return (
      <p className="text-sm text-[#5A7089] py-2">Nenhum evento registrado ainda.</p>
    )
  }

  return (
    <ol className="relative space-y-0" aria-label="Histórico da NC">
      {historico.map((evento, idx) => {
        const isLast = idx === historico.length - 1
        const isUltimo = isLast

        return (
          <li key={evento.id} className="relative flex gap-4 pb-5 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-[#D9E8FA]"
                aria-hidden="true"
              />
            )}

            {/* Circle */}
            <div
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                evento.concluido
                  ? 'bg-[#0E2E60] border-[#0E2E60]'
                  : 'bg-white border-[#D9E8FA]'
              } ${isUltimo ? 'ring-2 ring-[#0E2E60]/20' : ''}`}
              aria-hidden="true"
            >
              {evento.concluido && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                  <circle cx="4" cy="4" r="3" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${isUltimo ? 'bg-[#EEF4FD] rounded-xl px-3 py-2 border border-[#D9E8FA]' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="mr-1.5">{TIPO_ICON[evento.tipo]}</span>
                  <span className="text-sm text-[#0F1B2D] font-medium">{evento.descricao}</span>
                </div>
                <time
                  dateTime={evento.timestamp.toISOString()}
                  className="shrink-0 text-xs text-[#5A7089] mt-0.5"
                >
                  {format(new Date(evento.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </time>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
