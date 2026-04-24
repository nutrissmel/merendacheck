'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'

interface Props {
  aberto: boolean
  titulo: string
  descricao: string
  placeholder?: string
  carregando?: boolean
  onFechar: () => void
  onConfirmar: (justificativa: string) => void
}

const MIN_CHARS = 10

export function ModalConfirmarExclusao({
  aberto,
  titulo,
  descricao,
  placeholder = 'Descreva o motivo da exclusão...',
  carregando = false,
  onFechar,
  onConfirmar,
}: Props) {
  const [justificativa, setJustificativa] = useState('')
  const valida = justificativa.trim().length >= MIN_CHARS

  function handleConfirmar() {
    if (!valida || carregando) return
    onConfirmar(justificativa.trim())
  }

  function handleFechar() {
    if (carregando) return
    setJustificativa('')
    onFechar()
  }

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleFechar}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={handleFechar}
                disabled={carregando}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100 disabled:opacity-40"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-neutral-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <Trash2 size={18} className="text-red-600" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F1B2D] leading-tight pr-8">{titulo}</h2>
                </div>
                <p className="text-sm text-[#5A7089] leading-relaxed">{descricao}</p>
              </div>

              {/* Justificativa */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  Esta ação é <strong>irreversível</strong>. Uma justificativa é obrigatória.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Justificativa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    disabled={carregando}
                    placeholder={placeholder}
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-[#0F1B2D] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors disabled:opacity-60"
                  />
                  <div className="flex items-center justify-between">
                    {!valida && justificativa.length > 0 ? (
                      <p className="text-xs text-red-500">Mínimo {MIN_CHARS} caracteres ({justificativa.trim().length}/{MIN_CHARS})</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-neutral-400 ml-auto">{justificativa.length}/500</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleFechar}
                  disabled={carregando}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-[#5A7089] hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={!valida || carregando}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {carregando ? (
                    <><Loader2 size={15} className="animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 size={15} /> Sim, excluir</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
