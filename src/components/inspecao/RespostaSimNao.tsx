'use client'

import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  valor: boolean | null | undefined
  onChange: (v: boolean | null) => void
  disabled?: boolean
}

export function RespostaSimNao({ valor, onChange, disabled }: Props) {
  const isNA = valor === null

  return (
    <div className="flex gap-2">
      {/* Sim */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all',
          valor === true
            ? 'bg-[#D1F7E2] border-[#00963A] text-[#005C25]'
            : 'border-neutral-200 text-neutral-500 hover:border-[#00963A] hover:text-[#00963A] hover:bg-green-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ThumbsUp size={18} /> Sim
      </button>

      {/* Não */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all',
          valor === false
            ? 'bg-red-50 border-red-500 text-red-700'
            : 'border-neutral-200 text-neutral-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ThumbsDown size={18} /> Não
      </button>

      {/* N/A */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(isNA ? undefined as any : null)}
        className={cn(
          'px-4 flex items-center justify-center rounded-xl border-2 font-bold text-xs transition-all',
          isNA
            ? 'bg-neutral-100 border-neutral-400 text-neutral-700'
            : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Não se aplica"
      >
        N/A
      </button>
    </div>
  )
}
