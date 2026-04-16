'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, XCircle, Ban } from 'lucide-react'
import type { ScoreStatus } from '@prisma/client'

const VARIANTS = {
  CONFORME: {
    bg: 'bg-[#D1F7E2]',
    text: 'text-[#005C25]',
    border: 'border-[#00963A]',
    Icon: CheckCircle2,
    label: 'Conforme',
  },
  ATENCAO: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#F59E0B]',
    Icon: AlertCircle,
    label: 'Atenção',
  },
  NAO_CONFORME: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    border: 'border-[#DC2626]',
    Icon: XCircle,
    label: 'Não Conforme',
  },
  REPROVADO: {
    bg: 'bg-[#DC2626]',
    text: 'text-white',
    border: 'border-[#B91C1C]',
    Icon: Ban,
    label: 'Reprovado',
  },
}

const SIZES = {
  sm: { wrap: 'px-2 py-0.5 text-xs gap-1 rounded-full', iconSize: 12 },
  md: { wrap: 'px-3 py-1 text-sm gap-1.5 rounded-full', iconSize: 14 },
  lg: { wrap: 'px-4 py-1.5 text-base gap-2 rounded-full', iconSize: 16 },
}

interface ScoreBadgeProps {
  scoreStatus: ScoreStatus
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

export function ScoreBadge({
  scoreStatus,
  score,
  size = 'md',
  showScore = false,
  className,
}: ScoreBadgeProps) {
  const v = VARIANTS[scoreStatus]
  const s = SIZES[size]
  const { Icon } = v

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border',
        v.bg,
        v.text,
        v.border,
        s.wrap,
        className
      )}
    >
      <Icon size={s.iconSize} className="shrink-0" />
      {v.label}
      {showScore && score !== undefined && (
        <span className="ml-1 font-bold">{Math.round(score)}%</span>
      )}
    </span>
  )
}
