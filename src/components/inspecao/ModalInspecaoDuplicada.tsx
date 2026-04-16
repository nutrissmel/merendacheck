'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Plus } from 'lucide-react'

interface Props {
  inspecaoExistenteId: string
  escolaNome: string
  checklistNome: string
  onContinuar: () => void
  onNovaInspecao: () => void
}

export function ModalInspecaoDuplicada({
  inspecaoExistenteId,
  escolaNome,
  checklistNome,
  onContinuar,
  onNovaInspecao,
}: Props) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F1B2D] text-lg font-heading leading-snug">
              Inspeção em andamento
            </h2>
            <p className="text-sm text-[#5A7089] mt-1">
              Você já tem uma inspeção em andamento para{' '}
              <span className="font-semibold text-[#0F1B2D]">{escolaNome}</span>{' '}
              com o checklist{' '}
              <span className="font-semibold text-[#0F1B2D]">{checklistNome}</span>.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onContinuar}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-[#0E2E60] text-white rounded-xl hover:bg-[#133878] transition-colors"
          >
            <div>
              <p className="font-semibold text-sm">Continuar inspeção existente</p>
              <p className="text-xs text-white/70 mt-0.5">Retomar de onde parou</p>
            </div>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onNovaInspecao}
            className="w-full flex items-center justify-between px-4 py-3.5 border border-[#D5E3F0] text-[#0E2E60] rounded-xl hover:bg-[#EEF4FD] transition-colors"
          >
            <div>
              <p className="font-semibold text-sm">Iniciar nova inspeção</p>
              <p className="text-xs text-[#5A7089] mt-0.5">A inspeção anterior será cancelada</p>
            </div>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
