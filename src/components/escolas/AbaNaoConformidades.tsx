import Link from 'next/link'
import { AlertTriangle, Flame, CheckCircle2, ChevronRight, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeveridadeBadge } from '@/components/naoConformidades/SeveridadeBadge'
import type { Severidade, StatusNC } from '@prisma/client'

interface NC {
  id: string
  titulo: string
  descricao: string | null
  severidade: Severidade
  status: StatusNC
  prazoResolucao: Date | null
  createdAt: Date
  checklistNome: string
  vencida: boolean
}

const COR_SEVERIDADE: Record<Severidade, { bg: string; border: string }> = {
  CRITICA: { bg: '#FFF5F5', border: '#B91C1C' },
  ALTA: { bg: '#FFF5F5', border: '#DC2626' },
  MEDIA: { bg: '#FFFBEB', border: '#F59E0B' },
  BAIXA: { bg: '#F5F9FD', border: '#D5E3F0' },
}

function PrazoBadge({ prazo, vencida }: { prazo: Date | null; vencida: boolean }) {
  if (!prazo) return <span className="text-[10px] text-[#A8BDD4]">Sem prazo</span>

  const agora = new Date()
  const dias = differenceInDays(new Date(prazo), agora)

  if (vencida) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-[#DC2626]">
        <Clock size={10} /> Vencida há {Math.abs(dias)}d
      </span>
    )
  }
  if (dias === 0) {
    return <span className="text-[10px] font-bold text-[#F59E0B]">Vence hoje</span>
  }
  if (dias <= 2) {
    return <span className="text-[10px] font-bold text-[#F59E0B]">Vence em {dias}d</span>
  }
  return (
    <span className="text-[10px] text-[#5A7089]">
      Prazo: {format(new Date(prazo), 'dd/MM', { locale: ptBR })}
    </span>
  )
}

interface AbaNaoConformidadesProps {
  ncs: NC[]
}

export function AbaNaoConformidades({ ncs }: AbaNaoConformidadesProps) {
  if (ncs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E3F0] p-12 text-center shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
        <CheckCircle2 size={40} className="text-[#00963A] mx-auto mb-3" />
        <p className="text-lg font-bold text-[#0F1B2D] font-heading">Nenhuma NC aberta</p>
        <p className="text-sm text-[#5A7089] mt-1">Tudo em dia nesta escola!</p>
      </div>
    )
  }

  const vencidas = ncs.filter((nc) => nc.vencida)
  const naoVencidas = ncs.filter((nc) => !nc.vencida)

  function renderGrupo(grupo: NC[], titulo?: string) {
    return (
      <div>
        {titulo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FEE2E2] rounded-t-lg">
            <Flame size={12} className="text-[#DC2626]" />
            <p className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">{titulo} ({grupo.length})</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grupo.map((nc) => {
            const estilo = COR_SEVERIDADE[nc.severidade]
            return (
              <div
                key={nc.id}
                className="rounded-xl border p-4"
                style={{ backgroundColor: estilo.bg, borderColor: estilo.border + '66' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {nc.severidade === 'CRITICA' ? (
                        <Flame size={13} className="text-[#DC2626] shrink-0" />
                      ) : (
                        <AlertTriangle size={13} className="text-[#F59E0B] shrink-0" />
                      )}
                      <SeveridadeBadge severidade={nc.severidade} size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F1B2D] leading-tight">{nc.titulo}</p>
                    <p className="text-xs text-[#5A7089] mt-0.5">{nc.checklistNome}</p>
                  </div>
                </div>

                {nc.descricao && (
                  <p className="text-xs text-[#5A7089] mt-2 line-clamp-2">{nc.descricao}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#D5E3F0]/50">
                  <PrazoBadge prazo={nc.prazoResolucao} vencida={nc.vencida} />
                  <Link
                    href={`/nao-conformidades/${nc.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0E2E60] hover:underline"
                  >
                    Ver e resolver <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {vencidas.length > 0 && renderGrupo(vencidas, 'Vencidas e Críticas')}
      {naoVencidas.length > 0 && renderGrupo(naoVencidas)}
    </div>
  )
}
