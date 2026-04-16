'use client'

import { useState } from 'react'
import { School, Clock, AlertTriangle, Power, PowerOff, Trash2, Loader2, CalendarCheck } from 'lucide-react'
import { toggleAgendamento, excluirAgendamento } from '@/actions/agendamentos.actions'
import { descricaoFrequencia } from '@/lib/utils'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import { toast } from 'sonner'
import { format, differenceInDays, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AgendamentoCompleto } from '@/actions/agendamentos.actions'
import type { CategoriaChecklist } from '@prisma/client'

interface Props {
  agendamento: AgendamentoCompleto
  onAtualizado: () => void
}

const FREQUENCIA_LABEL: Record<string, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  SOB_DEMANDA: 'Sob demanda',
}

export function CardAgendamento({ agendamento: ag, onAtualizado }: Props) {
  const [toggling, setToggling] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const descricao = descricaoFrequencia(ag.frequencia, ag.diaSemana, ag.diaMes, ag.horario)
  const atrasado = ag.atrasado

  async function handleToggle() {
    setToggling(true)
    const res = await toggleAgendamento(ag.id)
    setToggling(false)
    if (res.sucesso) {
      toast.success(ag.ativo ? 'Agendamento pausado.' : 'Agendamento reativado!')
      onAtualizado()
    } else {
      toast.error(res.erro ?? 'Erro ao alterar agendamento.')
    }
  }

  async function handleExcluir() {
    if (!confirm('Excluir este agendamento?')) return
    setExcluindo(true)
    const res = await excluirAgendamento(ag.id)
    setExcluindo(false)
    if (res.sucesso) {
      toast.success('Agendamento excluído.')
      onAtualizado()
    } else {
      toast.error(res.erro ?? 'Erro ao excluir.')
    }
  }

  const borderColor = atrasado ? 'border-[#DC2626]/40' : ag.ativo ? 'border-[#D5E3F0]' : 'border-[#D5E3F0]'
  const bgColor = atrasado ? 'bg-[#FFF5F5]' : 'bg-white'

  return (
    <div className={`rounded-xl border p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] ${bgColor} ${borderColor}`}>
      {/* Header do card */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${atrasado ? 'bg-[#FEE2E2]' : 'bg-[#EEF4FD]'}`}>
            <School size={15} className={atrasado ? 'text-[#DC2626]' : 'text-[#0E2E60]'} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F1B2D] truncate">{ag.escola.nome}</p>
            <p className="text-xs text-[#5A7089] truncate mt-0.5">{ag.checklist.nome}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1 shrink-0">
          {atrasado && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} /> ATRASADO
            </span>
          )}
          {!ag.ativo && (
            <span className="text-[10px] font-bold text-[#A8BDD4] bg-[#F5F9FD] px-2 py-0.5 rounded-full border border-[#D5E3F0]">
              PAUSADO
            </span>
          )}
          {ag.ativo && !atrasado && (
            <span className="text-[10px] font-bold text-[#00963A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
              ATIVO
            </span>
          )}
        </div>
      </div>

      {/* Categoria + Frequência */}
      <div className="flex items-center gap-2 mb-3">
        <CategoriaBadge categoria={ag.checklist.categoria as CategoriaChecklist} size="sm" />
        <span className="text-xs text-[#5A7089] bg-[#F5F9FD] px-2 py-0.5 rounded-md border border-[#D5E3F0]">
          {FREQUENCIA_LABEL[ag.frequencia]}
        </span>
      </div>

      {/* Descrição */}
      <p className="text-xs text-[#5A7089] mb-3">{descricao}</p>

      {/* Próxima execução */}
      {ag.proximaExecucao && ag.frequencia !== 'SOB_DEMANDA' && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 ${atrasado ? 'text-[#DC2626] font-semibold' : 'text-[#5A7089]'}`}>
          <Clock size={11} />
          {atrasado
            ? `Atrasado ${Math.abs(differenceInDays(ag.proximaExecucao, new Date()))}d`
            : `Próxima: ${format(new Date(ag.proximaExecucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
          }
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#EEF4FD]">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            ag.ativo
              ? 'border-[#D5E3F0] text-[#5A7089] hover:bg-[#F5F9FD]'
              : 'border-[#00963A]/30 text-[#00963A] hover:bg-[#F0FDF4]'
          }`}
        >
          {toggling ? <Loader2 size={12} className="animate-spin" /> : ag.ativo ? <PowerOff size={12} /> : <Power size={12} />}
          {ag.ativo ? 'Pausar' : 'Reativar'}
        </button>
        <button
          onClick={handleExcluir}
          disabled={excluindo}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-red-50 hover:text-[#DC2626] hover:border-red-200 transition-colors"
        >
          {excluindo ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  )
}
