'use client'

import { useState, useEffect } from 'react'
import { X, CalendarPlus, Clock, Loader2 } from 'lucide-react'
import { criarAgendamento } from '@/actions/agendamentos.actions'
import { descricaoFrequencia, calcularProximaExecucao } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Frequencia } from '@prisma/client'

interface Escola { id: string; nome: string }
interface Checklist { id: string; nome: string; categoria: string }

interface Props {
  open: boolean
  onClose: () => void
  escolas: Escola[]
  checklists: Checklist[]
  onCriado: () => void
}

const FREQUENCIAS: { value: Frequencia; label: string }[] = [
  { value: 'DIARIO', label: 'Diário' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'SOB_DEMANDA', label: 'Sob demanda' },
]

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export function ModalCriarAgendamento({ open, onClose, escolas, checklists, onCriado }: Props) {
  const [escolaId, setEscolaId] = useState('')
  const [checklistId, setChecklistId] = useState('')
  const [frequencia, setFrequencia] = useState<Frequencia>('SEMANAL')
  const [diaSemana, setDiaSemana] = useState(2) // Terça-feira
  const [diaMes, setDiaMes] = useState(1)
  const [horario, setHorario] = useState('08:00')
  const [salvando, setSalvando] = useState(false)

  // Preview dinâmico
  const descricao = descricaoFrequencia(frequencia, diaSemana, diaMes, horario)
  const proxima = frequencia !== 'SOB_DEMANDA'
    ? calcularProximaExecucao(frequencia, diaSemana, diaMes, horario)
    : null

  // Fechar com Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setEscolaId('')
      setChecklistId('')
      setFrequencia('SEMANAL')
      setDiaSemana(2)
      setDiaMes(1)
      setHorario('08:00')
    }
  }, [open])

  async function handleSalvar() {
    if (!escolaId || !checklistId) {
      toast.error('Selecione a escola e o checklist.')
      return
    }
    setSalvando(true)
    const res = await criarAgendamento({
      escolaId,
      checklistId,
      frequencia,
      diaSemana: frequencia === 'SEMANAL' || frequencia === 'QUINZENAL' ? diaSemana : undefined,
      diaMes: frequencia === 'MENSAL' ? diaMes : undefined,
      horario,
    })
    setSalvando(false)

    if (res.sucesso) {
      toast.success('Agendamento criado!')
      onCriado()
      onClose()
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao criar agendamento')
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5E3F0]">
            <div className="flex items-center gap-2">
              <CalendarPlus size={18} className="text-[#0E2E60]" />
              <h2 className="font-bold text-[#0F1B2D] font-heading">Novo Agendamento</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Escola */}
            <div>
              <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Escola</label>
              <select
                value={escolaId}
                onChange={(e) => setEscolaId(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
              >
                <option value="">Selecione a escola...</option>
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Checklist */}
            <div>
              <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Checklist</label>
              <select
                value={checklistId}
                onChange={(e) => setChecklistId(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
              >
                <option value="">Selecione o checklist...</option>
                {checklists.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Frequência */}
            <div>
              <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Frequência</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIAS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFrequencia(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      frequencia === f.value
                        ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                        : 'bg-white text-[#5A7089] border-[#D5E3F0] hover:border-[#0E2E60] hover:text-[#0E2E60]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dia da semana (Semanal / Quinzenal) */}
            {(frequencia === 'SEMANAL' || frequencia === 'QUINZENAL') && (
              <div>
                <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Dia da semana</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIAS_SEMANA.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDiaSemana(d.value)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        diaSemana === d.value
                          ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                          : 'bg-white text-[#5A7089] border-[#D5E3F0] hover:border-[#0E2E60]'
                      }`}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dia do mês (Mensal) */}
            {frequencia === 'MENSAL' && (
              <div>
                <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Dia do mês</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={diaMes}
                    onChange={(e) => setDiaMes(Math.min(28, Math.max(1, Number(e.target.value))))}
                    className="w-20 h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-center text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
                  />
                  <span className="text-sm text-[#5A7089]">de cada mês (1–28)</span>
                </div>
              </div>
            )}

            {/* Horário */}
            {frequencia !== 'SOB_DEMANDA' && (
              <div>
                <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Horário</label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#5A7089]" />
                  <input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {frequencia !== 'SOB_DEMANDA' && (
              <div className="bg-[#EEF4FD] rounded-xl p-4">
                <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wider mb-2">Preview</p>
                <p className="text-sm font-semibold text-[#0F1B2D]">{descricao}</p>
                {proxima && (
                  <p className="text-xs text-[#5A7089] mt-1">
                    Próxima execução:{' '}
                    <span className="font-semibold text-[#0E2E60]">
                      {format(proxima, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EEF4FD] bg-[#F5F9FD]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D5E3F0] text-sm font-medium text-[#5A7089] hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando || !escolaId || !checklistId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
              Salvar agendamento
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
