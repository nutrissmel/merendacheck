'use client'

import { cn } from '@/lib/utils'

interface Props {
  valor: number | null | undefined
  min?: number
  max?: number
  onChange: (v: number, conforme: boolean) => void
  disabled?: boolean
}

const EMOJIS_5 = ['😞', '🙁', '😐', '🙂', '😊']
const LABELS_5 = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']

const CORES_5 = [
  { ativo: 'bg-red-500 border-red-500 text-white',     hover: 'hover:border-red-400 hover:bg-red-50'    },
  { ativo: 'bg-orange-400 border-orange-400 text-white', hover: 'hover:border-orange-400 hover:bg-orange-50' },
  { ativo: 'bg-amber-400 border-amber-400 text-white', hover: 'hover:border-amber-400 hover:bg-amber-50' },
  { ativo: 'bg-lime-500 border-lime-500 text-white',   hover: 'hover:border-lime-500 hover:bg-lime-50'  },
  { ativo: 'bg-[#00963A] border-[#00963A] text-white', hover: 'hover:border-[#00963A] hover:bg-green-50' },
]

const STATUS_LABEL: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
}

const STATUS_COLOR: Record<number, string> = {
  1: 'text-red-700 bg-red-50',
  2: 'text-orange-700 bg-orange-50',
  3: 'text-amber-700 bg-amber-50',
  4: 'text-lime-700 bg-lime-50',
  5: 'text-[#005C25] bg-green-50',
}

export function RespostaEscala({ valor, min = 1, max = 5, onChange, disabled }: Props) {
  const pontos = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const metade = (max - min) / 2
  const tamanho = pontos.length

  // Escolhe emojis e cores baseado no tamanho da escala
  function getEmoji(v: number): string {
    const pos = (v - min) / Math.max(max - min, 1)
    const idx = Math.round(pos * (EMOJIS_5.length - 1))
    return EMOJIS_5[idx] ?? '😐'
  }

  function getLabel(v: number): string {
    const pos = (v - min) / Math.max(max - min, 1)
    const idx = Math.round(pos * (LABELS_5.length - 1))
    return LABELS_5[idx] ?? ''
  }

  function getCor(v: number) {
    const pos = (v - min) / Math.max(max - min, 1)
    const idx = Math.round(pos * (CORES_5.length - 1))
    return CORES_5[idx] ?? CORES_5[2]
  }

  return (
    <div className="space-y-3">
      {/* Botões de emoji */}
      <div className={cn('flex gap-2', tamanho > 5 && 'flex-wrap')}>
        {pontos.map((v) => {
          const selecionado = valor === v
          const cor = getCor(v)
          const emoji = getEmoji(v)
          const label = getLabel(v)

          return (
            <div key={v} className="flex flex-col items-center gap-1 flex-1 min-w-[52px]">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(v, v > min + metade)}
                title={label}
                className={cn(
                  'w-full py-3 rounded-xl border-2 text-2xl transition-all select-none',
                  selecionado
                    ? cor.ativo
                    : `border-neutral-200 bg-white ${cor.hover}`,
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {emoji}
              </button>
              <span className={cn(
                'text-[10px] font-medium text-center leading-tight',
                selecionado ? 'text-[#0F1B2D]' : 'text-[#9BAFC0]'
              )}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Badge de resultado */}
      {valor != null && (
        <div className={cn(
          'px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2',
          STATUS_COLOR[valor] ?? 'text-neutral-700 bg-neutral-50'
        )}>
          <span className="text-lg">{getEmoji(valor)}</span>
          {STATUS_LABEL[valor] ?? `Nota ${valor}/${max}`}
          <span className="ml-auto text-xs font-normal opacity-70">{valor}/{max}</span>
        </div>
      )}
    </div>
  )
}
