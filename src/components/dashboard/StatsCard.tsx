import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const COR_ICONE = {
  blue:  { bg: 'bg-[#EEF4FD]', icon: 'text-[#0E2E60]' },
  green: { bg: 'bg-[#D1F7E2]', icon: 'text-[#00963A]' },
  amber: { bg: 'bg-[#FEF3C7]', icon: 'text-[#D97706]' },
  red:   { bg: 'bg-[#FEE2E2]', icon: 'text-[#DC2626]' },
}

interface StatsCardProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  icone: LucideIcon
  corIcone?: keyof typeof COR_ICONE
  tendencia?: { valor: number; positivo: boolean }
  loading?: boolean
}

export function StatsCard({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  corIcone = 'blue',
  tendencia,
  loading,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-20 h-8 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
      </div>
    )
  }

  const cor = COR_ICONE[corIcone]

  return (
    <div className="bg-white border border-[#D5E3F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(14,46,96,0.08)] hover:shadow-[0_4px_12px_rgba(14,46,96,0.12)] hover:border-[#A8BDD4] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cor.bg)}>
          <Icone size={20} className={cor.icon} />
        </div>
        {tendencia && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              tendencia.positivo
                ? 'bg-[#D1F7E2] text-[#005C25]'
                : 'bg-[#FEE2E2] text-[#991B1B]'
            )}
          >
            {tendencia.positivo ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {tendencia.positivo ? '+' : ''}{tendencia.valor}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[#0F1B2D] font-heading leading-none mb-1">
        {valor}
      </p>
      <p className="text-sm text-[#5A7089]">{titulo}</p>
      {subtitulo && <p className="text-xs text-[#A8BDD4] mt-0.5">{subtitulo}</p>}
    </div>
  )
}
