import type { Prioridade } from '@prisma/client'

const CONFIG = {
  BAIXA:   { label: 'Baixa',   cor: '#5A7089', fundo: '#F5F9FD', borda: '#D5E3F0' },
  MEDIA:   { label: 'Média',   cor: '#D97706', fundo: '#FEF3C7', borda: '#F59E0B' },
  ALTA:    { label: 'Alta',    cor: '#DC2626', fundo: '#FEE2E2', borda: '#FCA5A5' },
  URGENTE: { label: 'Urgente', cor: '#FFFFFF', fundo: '#DC2626', borda: '#B91C1C' },
} as const

interface PrioridadeBadgeProps {
  prioridade: Prioridade
  size?: 'sm' | 'md'
}

export function PrioridadeBadge({ prioridade, size = 'md' }: PrioridadeBadgeProps) {
  const cfg = CONFIG[prioridade]

  const padding = size === 'sm' ? '1px 8px' : '3px 10px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
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
      {cfg.label}
    </span>
  )
}
