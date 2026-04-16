import { CATEGORIA_CONFIG } from './CategoriaConfig'
import type { CategoriaChecklist } from '@prisma/client'

interface CategoriaBadgeProps {
  categoria: CategoriaChecklist
  size?: 'sm' | 'md'
}

export function CategoriaBadge({ categoria, size = 'md' }: CategoriaBadgeProps) {
  const config = CATEGORIA_CONFIG[categoria]
  const Icone = config.icone

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5'

  const iconSize = size === 'sm' ? 10 : 12

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md ${sizeClasses}`}
      style={{ color: config.cor, backgroundColor: config.corFundo }}
      title={config.descricao}
    >
      <Icone size={iconSize} />
      {config.label}
    </span>
  )
}
