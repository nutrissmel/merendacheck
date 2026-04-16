import { Info, AlertCircle, AlertTriangle, Flame } from 'lucide-react'
import type { Severidade } from '@prisma/client'

const CONFIG = {
  BAIXA: {
    label: 'Baixa',
    cor: '#5A7089',
    fundo: '#F5F9FD',
    borda: '#D5E3F0',
    Icon: Info,
  },
  MEDIA: {
    label: 'Média',
    cor: '#D97706',
    fundo: '#FEF3C7',
    borda: '#F59E0B',
    Icon: AlertCircle,
  },
  ALTA: {
    label: 'Alta',
    cor: '#DC2626',
    fundo: '#FEE2E2',
    borda: '#DC2626',
    Icon: AlertTriangle,
  },
  CRITICA: {
    label: 'Crítica',
    cor: '#FFFFFF',
    fundo: '#DC2626',
    borda: '#B91C1C',
    Icon: Flame,
  },
} as const

interface SeveridadeBadgeProps {
  severidade: Severidade
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function SeveridadeBadge({ severidade, showIcon = true, size = 'md' }: SeveridadeBadgeProps) {
  const cfg = CONFIG[severidade]
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
