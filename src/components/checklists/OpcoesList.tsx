'use client'

import { useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

interface OpcoesListProps {
  opcoes: string[]
  onChange: (opcoes: string[]) => void
  maxOpcoes?: number
}

export function OpcoesList({ opcoes, onChange, maxOpcoes = 10 }: OpcoesListProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function atualizar(idx: number, valor: string) {
    const novo = [...opcoes]
    novo[idx] = valor
    onChange(novo)
  }

  function adicionar() {
    if (opcoes.length >= maxOpcoes) return
    const novo = [...opcoes, '']
    onChange(novo)
    // Focus new input on next tick
    setTimeout(() => {
      inputRefs.current[novo.length - 1]?.focus()
    }, 0)
  }

  function remover(idx: number) {
    if (opcoes.length <= 2) return
    const novo = opcoes.filter((_, i) => i !== idx)
    onChange(novo)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      adicionar()
    } else if (e.key === 'Backspace' && opcoes[idx] === '' && opcoes.length > 2) {
      e.preventDefault()
      remover(idx)
      setTimeout(() => {
        inputRefs.current[Math.max(0, idx - 1)]?.focus()
      }, 0)
    }
  }

  return (
    <div className="space-y-2">
      {opcoes.map((opcao, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            ref={(el) => { inputRefs.current[idx] = el }}
            value={opcao}
            onChange={(e) => atualizar(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            placeholder={`Opção ${idx + 1}`}
            className="flex-1 h-8 px-3 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
          />
          <button
            type="button"
            onClick={() => remover(idx)}
            disabled={opcoes.length <= 2}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={opcoes.length <= 2 ? 'Mínimo 2 opções' : 'Remover opção'}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {opcoes.length < maxOpcoes && (
        <button
          type="button"
          onClick={adicionar}
          className="flex items-center gap-1.5 text-sm text-[#0E2E60] hover:text-[#133878] font-medium transition-colors"
        >
          <Plus size={14} />
          Adicionar opção
        </button>
      )}

      {opcoes.length >= maxOpcoes && (
        <p className="text-xs text-neutral-400">Máximo de {maxOpcoes} opções atingido</p>
      )}
    </div>
  )
}
