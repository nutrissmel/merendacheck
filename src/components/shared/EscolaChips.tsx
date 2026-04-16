import { School, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EscolaChipsProps {
  escolas: { id: string; nome: string }[]
  max?: number
  size?: 'sm' | 'md'
  onRemove?: (escolaId: string) => void
  className?: string
}

export function EscolaChips({ escolas, max = 999, size = 'md', onRemove, className }: EscolaChipsProps) {
  if (escolas.length === 0) {
    return <span className="text-xs text-neutral-400 italic">Sem escolas</span>
  }

  const visiveis = escolas.slice(0, max)
  const extras = escolas.length - visiveis.length

  const chipClass = cn(
    'inline-flex items-center gap-1 rounded-full border border-[#D9E8FA] bg-[#EEF4FD] text-[#0E2E60] font-medium whitespace-nowrap',
    size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs'
  )

  const iconSize = size === 'sm' ? 10 : 12

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visiveis.map((escola) => (
        <span key={escola.id} className={chipClass}>
          <School size={iconSize} className="shrink-0 opacity-70" />
          <span className="truncate max-w-[120px]">{escola.nome}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(escola.id)}
              className="ml-0.5 hover:text-red-500 transition-colors"
              aria-label={`Remover ${escola.nome}`}
            >
              <X size={iconSize} />
            </button>
          )}
        </span>
      ))}
      {extras > 0 && (
        <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#D9E8FA] text-[#1A4A9E] text-xs font-bold">
          +{extras} mais
        </span>
      )}
    </div>
  )
}
