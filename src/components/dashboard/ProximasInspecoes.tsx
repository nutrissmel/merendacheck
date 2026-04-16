import Link from 'next/link'
import { Calendar, Clock, AlertTriangle, ChevronRight, School } from 'lucide-react'
import { differenceInDays, format, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import { buscarProximasInspecoes } from '@/actions/agendamentos.actions'
import type { CategoriaChecklist } from '@prisma/client'

const FREQUENCIA_LABEL: Record<string, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
}

function StatusPrazo({ proxima }: { proxima: Date | null }) {
  if (!proxima) return <span className="text-xs text-[#A8BDD4]">Sem data</span>

  const agora = new Date()
  const atrasado = isBefore(new Date(proxima), agora)
  const dias = differenceInDays(new Date(proxima), agora)

  if (atrasado) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-[#DC2626]">
        <AlertTriangle size={11} />
        Atrasada {Math.abs(dias)}d
      </span>
    )
  }

  if (dias === 0) return <span className="text-xs font-bold text-[#F59E0B]">Hoje</span>
  if (dias <= 2) return <span className="text-xs font-bold text-[#F59E0B]">Em {dias}d</span>

  return (
    <span className="text-xs text-[#5A7089]">
      {format(new Date(proxima), 'dd/MM', { locale: ptBR })}
    </span>
  )
}

export async function ProximasInspecoes() {
  const agendamentos = await buscarProximasInspecoes(6)

  if (agendamentos.length === 0) return null

  const agora = new Date()
  const atrasados = agendamentos.filter(
    (a) => a.proximaExecucao && isBefore(new Date(a.proximaExecucao), agora),
  )
  const emDia = agendamentos.filter(
    (a) => !a.proximaExecucao || !isBefore(new Date(a.proximaExecucao), agora),
  )

  // Sort: atrasados first, then by date
  const ordenados = [
    ...atrasados.sort((a, b) => {
      const da = a.proximaExecucao ? new Date(a.proximaExecucao).getTime() : 0
      const db = b.proximaExecucao ? new Date(b.proximaExecucao).getTime() : 0
      return da - db
    }),
    ...emDia.sort((a, b) => {
      const da = a.proximaExecucao ? new Date(a.proximaExecucao).getTime() : Infinity
      const db = b.proximaExecucao ? new Date(b.proximaExecucao).getTime() : Infinity
      return da - db
    }),
  ]

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF4FD]">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#0E2E60]" />
          <h3 className="font-semibold text-[#0F1B2D] font-heading">Próximas inspeções</h3>
          {atrasados.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
              <AlertTriangle size={9} />
              {atrasados.length} atrasada{atrasados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link
          href="/agendamentos"
          className="flex items-center gap-1 text-xs font-semibold text-[#0E2E60] hover:underline"
        >
          Ver todos <ChevronRight size={12} />
        </Link>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#EEF4FD]">
        {ordenados.map((ag) => {
          const atrasado = ag.proximaExecucao && isBefore(new Date(ag.proximaExecucao), agora)
          return (
            <div
              key={ag.id}
              className={`flex items-center gap-3 px-5 py-3 ${atrasado ? 'bg-[#FFF5F5]' : 'hover:bg-[#F5F9FD]'} transition-colors`}
            >
              {/* Ícone */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${atrasado ? 'bg-[#FEE2E2]' : 'bg-[#EEF4FD]'}`}>
                <School size={14} className={atrasado ? 'text-[#DC2626]' : 'text-[#0E2E60]'} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${atrasado ? 'text-[#DC2626]' : 'text-[#0F1B2D]'}`}>
                  {ag.escola.nome}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[#5A7089] truncate">{ag.checklist.nome}</p>
                  <CategoriaBadge categoria={ag.checklist.categoria as CategoriaChecklist} size="sm" />
                </div>
              </div>

              {/* Prazo + Frequência */}
              <div className="text-right shrink-0">
                <StatusPrazo proxima={ag.proximaExecucao ? new Date(ag.proximaExecucao) : null} />
                <p className="text-[10px] text-[#A8BDD4] mt-0.5">
                  {FREQUENCIA_LABEL[ag.frequencia] ?? ag.frequencia}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={`/inspecoes/nova?escola=${ag.escolaId}&checklist=${ag.checklistId}`}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E2E60] text-white text-[10px] font-bold hover:bg-[#133878] transition-colors"
              >
                Iniciar
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
