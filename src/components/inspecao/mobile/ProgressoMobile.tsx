'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
  itemAtual: number
  totalItens: number
  escola: string
  percentual: number
  onCancelar: () => void
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function ProgressoMobile({ itemAtual, totalItens, escola, percentual, onCancelar }: Props) {
  const [confirmando, setConfirmando] = useState(false)

  const barColor = percentual < 30 ? '#F59E0B' : percentual < 70 ? '#3B82F6' : '#00963A'

  return (
    <>
      {/* ── Fixed header ───────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{ background: 'linear-gradient(145deg, #0B2550 0%, #0E2E60 60%, #133878 100%)' }}
      >
        <div className="flex items-center gap-3 px-3 h-[54px]">
          {/* Cancel button */}
          <button
            onClick={() => setConfirmando(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors active:bg-white/15"
            style={{ background: 'rgba(255,255,255,0.10)', ...TAP }}
            aria-label="Cancelar inspeção"
          >
            <X size={18} className="text-white/80" />
          </button>

          {/* School name */}
          <p
            className="flex-1 text-white font-semibold text-sm truncate text-center"
            aria-live="polite"
          >
            {escola}
          </p>

          {/* Progress pill */}
          <div
            className="shrink-0 rounded-xl px-3 h-9 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', minWidth: 52 }}
          >
            <span className="text-white font-bold text-xs tabular-nums">{itemAtual}<span className="text-white/45">/{totalItens}</span></span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-white/10">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${percentual}%`, backgroundColor: barColor }}
            role="progressbar"
            aria-valuenow={percentual}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentual}% respondido`}
          />
        </div>
      </div>

      {/* ── Cancel confirmation bottom sheet ───────────────────── */}
      {confirmando && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setConfirmando(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden"
            style={{ boxShadow: '0 -8px 40px rgba(14,46,96,0.18)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {/* Icon + text */}
            <div className="px-6 pt-3 pb-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1B2D] mb-2">Cancelar inspeção?</h3>
              <p className="text-sm text-[#5A7089] leading-relaxed">
                As respostas já salvas serão mantidas.{'\n'}Você poderá retomar esta inspeção depois.
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2.5">
              <button
                onClick={() => setConfirmando(false)}
                className="w-full h-[52px] rounded-2xl text-white font-semibold text-[15px]"
                style={{
                  background: 'linear-gradient(135deg, #0B2550 0%, #0E2E60 50%, #133878 100%)',
                  boxShadow: '0 4px 16px rgba(14,46,96,0.30)',
                  ...TAP,
                }}
              >
                Continuar inspeção
              </button>
              <button
                onClick={onCancelar}
                className="w-full h-[48px] rounded-2xl font-medium text-[15px] border border-red-200 text-red-600 bg-red-50"
                style={TAP}
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
