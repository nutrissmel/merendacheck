'use client'

import { cn } from '@/lib/utils'

interface Props {
  opcoes: string[]
  valor: string | null | undefined
  onChange: (v: string, conforme: boolean) => void
  disabled?: boolean
}

export function RespostaMultiplaEscolha({ opcoes, valor, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      {opcoes.map((opcao) => {
        const selecionada = valor === opcao
        return (
          <button
            key={opcao}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opcao, true)}
            className={cn(
              'w-full px-4 py-3 text-left text-sm font-medium rounded-xl border-2 transition-all',
              selecionada
                ? 'border-[#0E2E60] bg-[#EEF4FD] text-[#0E2E60]'
                : 'border-neutral-200 text-[#0F1B2D] hover:border-[#0E2E60]/40 hover:bg-[#F8FAFD]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                selecionada ? 'border-[#0E2E60] bg-[#0E2E60]' : 'border-neutral-300'
              )}>
                {selecionada && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              {opcao}
            </div>
          </button>
        )
      })}
    </div>
  )
}
