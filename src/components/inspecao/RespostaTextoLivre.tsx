'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  valor: string | null | undefined
  onChange: (v: string, conforme: boolean) => void
  disabled?: boolean
}

export function RespostaTextoLivre({ valor, onChange, disabled }: Props) {
  const [texto, setTexto] = useState(valor ?? '')

  function handleChange(v: string) {
    setTexto(v)
    onChange(v, v.trim().length > 0)
  }

  return (
    <div className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        placeholder="Digite a resposta..."
        rows={4}
        maxLength={1000}
        className={cn(
          'w-full px-4 py-3 text-sm border-2 border-[#D5E3F0] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] transition-all',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      <div className="flex justify-end">
        <span className="text-xs text-[#5A7089]">{texto.length}/1000</span>
      </div>
    </div>
  )
}
