'use client'

import { Loader2, Check, AlertTriangle } from 'lucide-react'
import type { AutoSaveStatus } from '@/hooks/useAutoSave'

interface SaveIndicatorProps {
  status: AutoSaveStatus
  onRetry?: () => void
}

export function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#5A7089]">
        <Loader2 size={12} className="animate-spin" />
        Salvando...
      </span>
    )
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#00963A]">
        <Check size={12} />
        Salvo
      </span>
    )
  }

  // erro
  return (
    <span className="flex items-center gap-2 text-xs text-[#DC2626]">
      <AlertTriangle size={12} />
      Erro ao salvar
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline font-semibold"
        >
          Tentar novamente
        </button>
      )}
    </span>
  )
}
