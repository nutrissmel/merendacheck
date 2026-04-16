'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AgendamentoCompleto } from '@/actions/agendamentos.actions'

interface Props {
  agendamentos: AgendamentoCompleto[]
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface DiaInfo {
  date: Date
  temInspecao: boolean    // inspecão real realizada
  temAgendamento: boolean // agendamento programado neste dia
  atrasado: boolean       // agendamento vencido
}

export function CalendarioAgendamentos({ agendamentos }: Props) {
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const diasDoMes = useMemo(() => {
    const inicio = startOfMonth(hoje)
    const fim = endOfMonth(hoje)
    return eachDayOfInterval({ start: inicio, end: fim })
  }, [])

  const primeiroDiaSemana = getDay(startOfMonth(hoje)) // 0=Dom

  // Mapear agendamentos para dias do mês
  const agendamentosAtivos = agendamentos.filter((a) => a.ativo && a.frequencia !== 'SOB_DEMANDA')

  function agendamentosNoDia(date: Date) {
    return agendamentosAtivos.filter((ag) => {
      const diaSem = getDay(date)
      const diaMesNum = date.getDate()

      if (ag.frequencia === 'DIARIO') return true
      if (ag.frequencia === 'SEMANAL' && ag.diaSemana === diaSem) return true
      if (ag.frequencia === 'QUINZENAL' && ag.diaSemana === diaSem) return true
      if (ag.frequencia === 'MENSAL' && ag.diaMes === diaMesNum) return true
      return false
    })
  }

  function proximaExecucaoNoDia(date: Date) {
    return agendamentosAtivos.filter((ag) => {
      if (!ag.proximaExecucao) return false
      return isSameDay(new Date(ag.proximaExecucao), date)
    })
  }

  const celulas: (null | Date)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...diasDoMes,
  ]

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1B2D] font-heading">
          {MESES_PT[mesAtual]} {anoAtual}
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-[#5A7089]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#0E2E60]/20 border-2 border-[#0E2E60] border-dashed" />
            Programado
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#DC2626]/20 border border-[#DC2626]" />
            Atrasado
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#EEF4FD] border-2 border-[#0E2E60]" />
            Hoje
          </div>
        </div>
      </div>

      {/* Grade de dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[#A8BDD4] py-1">{d}</div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1">
        {celulas.map((date, idx) => {
          if (!date) return <div key={idx} />

          const eHoje = isSameDay(date, hoje)
          const agsDia = agendamentosNoDia(date)
          const proxDia = proximaExecucaoNoDia(date)
          const temAgendamento = agsDia.length > 0
          const temProxima = proxDia.length > 0
          const atrasadosDia = proxDia.filter((a) => a.atrasado)
          const temAtrasado = atrasadosDia.length > 0

          return (
            <div
              key={idx}
              title={
                temAgendamento
                  ? `${agsDia.length} agendamento(s) neste dia`
                  : undefined
              }
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold relative transition-all
                ${eHoje ? 'ring-2 ring-[#0E2E60] bg-[#EEF4FD]' : ''}
                ${!temAgendamento && !eHoje ? 'text-[#A8BDD4]' : ''}
                ${temAtrasado ? 'bg-[#FFF5F5] text-[#DC2626]' : ''}
                ${temAgendamento && !temAtrasado && !eHoje ? 'bg-[#EEF4FD]/60 text-[#0E2E60]' : ''}
              `}
            >
              <span className={`
                ${eHoje ? 'text-[#0E2E60]' : ''}
                ${temAtrasado ? 'text-[#DC2626]' : ''}
              `}>
                {date.getDate()}
              </span>

              {/* Indicadores */}
              {(temAgendamento || temProxima) && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {temAtrasado && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  )}
                  {temAgendamento && !temAtrasado && (
                    <div className="w-1.5 h-1.5 rounded-full border border-[#0E2E60] border-dashed" />
                  )}
                  {temProxima && !temAtrasado && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0E2E60]" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumo */}
      <div className="mt-4 pt-4 border-t border-[#EEF4FD] grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-[#0E2E60] font-heading">{agendamentos.filter(a => a.ativo).length}</p>
          <p className="text-[10px] text-[#5A7089] uppercase tracking-wider">Ativos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#DC2626] font-heading">{agendamentos.filter(a => a.atrasado).length}</p>
          <p className="text-[10px] text-[#5A7089] uppercase tracking-wider">Atrasados</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#5A7089] font-heading">{agendamentos.filter(a => !a.ativo).length}</p>
          <p className="text-[10px] text-[#5A7089] uppercase tracking-wider">Pausados</p>
        </div>
      </div>
    </div>
  )
}
