'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Calendar, List, AlertTriangle, CalendarCheck } from 'lucide-react'
import { CardAgendamento } from './CardAgendamento'
import { CalendarioAgendamentos } from './CalendarioAgendamentos'
import { ModalCriarAgendamento } from './ModalCriarAgendamento'
import { useRouter } from 'next/navigation'
import type { AgendamentoCompleto } from '@/actions/agendamentos.actions'

type Aba = 'lista' | 'calendario'

interface Props {
  agendamentos: AgendamentoCompleto[]
  escolas: { id: string; nome: string }[]
  checklists: { id: string; nome: string; categoria: string }[]
  podeEditar: boolean
}

export function AgendamentosClient({ agendamentos: inicial, escolas, checklists, podeEditar }: Props) {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('lista')
  const [modalAberto, setModalAberto] = useState(false)
  const [agendamentos, setAgendamentos] = useState(inicial)

  function atualizar() {
    router.refresh()
  }

  const atrasados = agendamentos.filter((a) => a.atrasado)
  const ativos = agendamentos.filter((a) => a.ativo && !a.atrasado)
  const pausados = agendamentos.filter((a) => !a.ativo)

  return (
    <>
      {/* Header com abas + botão */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center bg-white border border-[#D5E3F0] rounded-xl p-1 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
          {([
            { id: 'lista', label: 'Lista', icon: List },
            { id: 'calendario', label: 'Calendário', icon: Calendar },
          ] as { id: Aba; label: string; icon: typeof List }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                aba === id
                  ? 'bg-[#0E2E60] text-white'
                  : 'text-[#5A7089] hover:text-[#0F1B2D]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {podeEditar && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
          >
            <CalendarPlus size={15} />
            Novo agendamento
          </button>
        )}
      </div>

      {aba === 'lista' ? (
        <div className="space-y-6">
          {/* Atrasados */}
          {atrasados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <AlertTriangle size={14} className="text-[#DC2626]" />
                <h2 className="text-sm font-bold text-[#DC2626] uppercase tracking-wider">
                  Atrasados ({atrasados.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {atrasados.map((ag) => (
                  <CardAgendamento key={ag.id} agendamento={ag} onAtualizado={atualizar} />
                ))}
              </div>
            </div>
          )}

          {/* Ativos */}
          {ativos.length > 0 && (
            <div>
              {atrasados.length > 0 && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <CalendarCheck size={14} className="text-[#00963A]" />
                  <h2 className="text-sm font-bold text-[#5A7089] uppercase tracking-wider">
                    Em dia ({ativos.length})
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ativos.map((ag) => (
                  <CardAgendamento key={ag.id} agendamento={ag} onAtualizado={atualizar} />
                ))}
              </div>
            </div>
          )}

          {/* Pausados */}
          {pausados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className="text-sm font-bold text-[#A8BDD4] uppercase tracking-wider">
                  Pausados ({pausados.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {pausados.map((ag) => (
                  <CardAgendamento key={ag.id} agendamento={ag} onAtualizado={atualizar} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {agendamentos.length === 0 && (
            <div className="bg-white rounded-xl border border-[#D5E3F0] p-16 text-center shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
              <Calendar size={40} className="text-[#A8BDD4] mx-auto mb-3" />
              <p className="text-base font-semibold text-[#0F1B2D] font-heading">Nenhum agendamento</p>
              <p className="text-sm text-[#5A7089] mt-1">
                Programe inspeções recorrentes para manter a conformidade das escolas.
              </p>
              {podeEditar && (
                <button
                  onClick={() => setModalAberto(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
                >
                  <CalendarPlus size={14} />
                  Criar primeiro agendamento
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <CalendarioAgendamentos agendamentos={agendamentos} />
      )}

      <ModalCriarAgendamento
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        escolas={escolas}
        checklists={checklists}
        onCriado={atualizar}
      />
    </>
  )
}
