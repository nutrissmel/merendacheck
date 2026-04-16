import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icone: LucideIcon
  titulo: string
  descricao?: string
  acao?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icone: Icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EEF4FD] flex items-center justify-center mb-4">
        <Icone size={32} className="text-[#A8BDD4]" />
      </div>
      <h3 className="text-lg font-semibold text-[#0F1B2D] font-heading mb-2">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-[#5A7089] max-w-sm mb-6">{descricao}</p>
      )}
      {acao && (
        acao.href ? (
          <Link
            href={acao.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
          >
            {acao.label}
          </Link>
        ) : (
          <button
            onClick={acao.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
          >
            {acao.label}
          </button>
        )
      )}
    </div>
  )
}
