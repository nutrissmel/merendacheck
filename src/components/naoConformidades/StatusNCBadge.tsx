import { Circle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { StatusNC } from '@prisma/client'

const CONFIG = {
  ABERTA: {
    label: 'Aberta',
    cor: '#DC2626',
    fundo: '#FEE2E2',
    borda: '#FCA5A5',
    Icon: Circle,
  },
  EM_ANDAMENTO: {
    label: 'Em andamento',
    cor: '#D97706',
    fundo: '#FEF3C7',
    borda: '#F59E0B',
    Icon: Clock,
  },
  RESOLVIDA: {
    label: 'Resolvida',
    cor: '#00963A',
    fundo: '#D1F7E2',
    borda: '#00963A',
    Icon: CheckCircle2,
  },
  VENCIDA: {
    label: 'Vencida',
    cor: '#FFFFFF',
    fundo: '#DC2626',
    borda: '#B91C1C',
    Icon: XCircle,
  },
} as const

interface StatusNCBadgeProps {
  status: StatusNC
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function StatusNCBadge({ status, showIcon = true, size = 'md' }: StatusNCBadgeProps) {
  const cfg = CONFIG[status]
  const { Icon } = cfg

  const padding = size === 'sm' ? '1px 8px' : '3px 10px'
  const fontSize = size === 'sm' ? '11px' : '12px'
  const iconSize = size === 'sm' ? 11 : 13

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.02em',
        borderRadius: 20,
        border: `1px solid ${cfg.borda}`,
        backgroundColor: cfg.fundo,
        color: cfg.cor,
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && <Icon size={iconSize} aria-hidden="true" />}
      {cfg.label}
    </span>
  )
}
