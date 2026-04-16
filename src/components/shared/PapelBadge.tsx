import { Shield, Building2, Apple, GraduationCap, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Papel } from '@prisma/client'

const PAPEL_CONFIG: Record<
  Papel,
  { label: string; classes: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    classes: 'bg-purple-100 text-purple-800 border border-purple-300',
    Icon: Shield,
  },
  ADMIN_MUNICIPAL: {
    label: 'Administrador',
    classes: 'bg-blue-100 text-blue-800 border border-blue-300',
    Icon: Building2,
  },
  NUTRICIONISTA: {
    label: 'Nutricionista',
    classes: 'bg-green-100 text-green-800 border border-green-300',
    Icon: Apple,
  },
  DIRETOR_ESCOLA: {
    label: 'Diretor',
    classes: 'bg-amber-100 text-amber-700 border border-amber-300',
    Icon: GraduationCap,
  },
  MERENDEIRA: {
    label: 'Merendeira',
    classes: 'bg-sky-100 text-sky-800 border border-sky-300',
    Icon: ChefHat,
  },
}

interface PapelBadgeProps {
  papel: Papel
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function PapelBadge({ papel, size = 'md', showIcon = true, className }: PapelBadgeProps) {
  const config = PAPEL_CONFIG[papel]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        config.classes,
        className
      )}
    >
      {showIcon && <config.Icon size={size === 'sm' ? 11 : 13} />}
      {config.label}
    </span>
  )
}

// Converte o enum Papel para o label em português
export function papelLabel(papel: Papel): string {
  return PAPEL_CONFIG[papel]?.label ?? papel
}

// Cor de avatar por papel
export const PAPEL_AVATAR_COLOR: Record<Papel, string> = {
  SUPER_ADMIN: '#7c3aed',
  ADMIN_MUNICIPAL: '#0E2E60',
  NUTRICIONISTA: '#00963A',
  DIRETOR_ESCOLA: '#F59E0B',
  MERENDEIRA: '#7AAAE3',
}
