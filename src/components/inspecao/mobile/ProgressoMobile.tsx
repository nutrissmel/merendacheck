'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  itemAtual: number
  totalItens: number
  escola: string
  percentual: number
  onCancelar: () => void
}

export function ProgressoMobile({ itemAtual, totalItens, escola, percentual, onCancelar }: Props) {
  const [confirmando, setConfirmando] = useState(false)

  function getBarColor() {
    if (percentual < 30) return '#D9E8FA'
    if (percentual < 70) return '#F59E0B'
    return '#00963A'
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 h-14 bg-[#0E2E60]">
          <button
            onClick={() => setConfirmando(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white/80 hover:text-white active:bg-white/10 transition-colors"
            aria-label="Cancelar inspeção"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          >
            <X size={20} />
          </button>

          <p className="text-white text-sm font-semibold truncate mx-3 flex-1 text-center" aria-live="polite">
            {escola}
          </p>

          <span className="text-white/80 text-sm font-medium whitespace-nowrap">
            {itemAtual}/{totalItens}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#0E2E60]/30">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${percentual}%`, backgroundColor: getBarColor() }}
            role="progressbar"
            aria-valuenow={percentual}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentual}% respondido`}
          />
        </div>
      </div>

      {/* Cancel confirmation bottom sheet */}
      {confirmando && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setConfirmando(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-[#0F1B2D] text-center">Cancelar inspeção?</h3>
            <p className="text-sm text-[#5A7089] text-center leading-relaxed">
              As respostas já salvas serão mantidas. Você poderá retomar depois.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setConfirmando(false)}
                className="w-full h-14 bg-[#0E2E60] text-white font-semibold text-base rounded-xl"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
              >
                Continuar inspeção
              </button>
              <button
                onClick={onCancelar}
                className="w-full h-12 border border-red-300 text-red-600 font-medium text-base rounded-xl"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
              >
                Cancelar inspeção
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
