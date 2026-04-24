'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarCheck, Clock, School, X, ChevronRight, Bell } from 'lucide-react'

export type AgendamentoHoje = {
  id: string
  escola: { id: string; nome: string }
  checklist: { id: string; nome: string; categoria: string }
  horario: string | null
  proximaExecucao: Date | null
}

interface Props {
  agendamentos: AgendamentoHoje[]
}

const STORAGE_KEY = `agendamentos_hoje_${new Date().toISOString().slice(0, 10)}`

export function AgendamentosHojeModal({ agendamentos }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (agendamentos.length === 0) return
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch { /* ignore */ }
    // Pequeno delay para a página carregar antes de "explodir"
    const t = setTimeout(() => setAberto(true), 600)
    return () => clearTimeout(t)
  }, [agendamentos.length])

  function fechar() {
    setAberto(false)
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
  }

  function irParaInspecao(escolaId: string, checklistId: string) {
    fechar()
    router.push(`/inspecoes/nova?escolaId=${escolaId}&checklistId=${checklistId}`)
  }

  const total = agendamentos.length

  return (
    <AnimatePresence>
      {aberto && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={fechar}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.4, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md pointer-events-auto rounded-2xl overflow-hidden shadow-2xl"
              style={{ boxShadow: '0 24px 80px rgba(14,46,96,0.30)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div
                className="px-5 pt-6 pb-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0B2550 0%, #0E2E60 60%, #133878 100%)' }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />

                <button
                  onClick={fechar}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.15 }}
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3"
                >
                  <Bell size={24} className="text-yellow-300" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
                    Hoje · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h2 className="text-white text-xl font-bold leading-tight">
                    {total === 1
                      ? '1 inspeção agendada para hoje'
                      : `${total} inspeções agendadas para hoje`}
                  </h2>
                  <p className="text-white/50 text-sm mt-1">
                    {total === 1 ? 'Não esqueça de realizá-la!' : 'Não esqueça de realizá-las!'}
                  </p>
                </motion.div>
              </div>

              {/* Body */}
              <div className="bg-white divide-y divide-[#EEF4FD] max-h-[320px] overflow-y-auto">
                {agendamentos.map((ag, i) => (
                  <motion.button
                    key={ag.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    onClick={() => irParaInspecao(ag.escola.id, ag.checklist.id)}
                    className="w-full text-left px-5 py-4 hover:bg-[#EEF4FD] transition-colors group flex items-center gap-3"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-[#EEF4FD] group-hover:bg-white flex items-center justify-center transition-colors">
                      <School size={16} className="text-[#0E2E60]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1B2D] truncate">{ag.escola.nome}</p>
                      <p className="text-xs text-[#5A7089] truncate">{ag.checklist.nome}</p>
                      {ag.horario && (
                        <p className="flex items-center gap-1 text-xs text-[#0E2E60] font-medium mt-0.5">
                          <Clock size={10} /> {ag.horario}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#0E2E60] opacity-0 group-hover:opacity-100 transition-opacity">
                      Iniciar <ChevronRight size={14} />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-[#EEF4FD] px-5 py-4 flex gap-3">
                <button
                  onClick={fechar}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm font-semibold text-[#5A7089] hover:bg-[#EEF4FD] transition-colors"
                >
                  Ver depois
                </button>
                <button
                  onClick={() => { fechar(); router.push('/agendamentos') }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}
                >
                  <CalendarCheck size={15} /> Ver agendamentos
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
