import { cn } from '@/lib/utils'
import type { Papel } from '@prisma/client'

const COR_POR_PAPEL: Record<string, string> = {
  SUPER_ADMIN: '#7C3AED',
  ADMIN_MUNICIPAL: '#0E2E60',
  NUTRICIONISTA: '#00963A',
  DIRETOR_ESCOLA: '#D97706',
  MERENDEIRA: '#0369A1',
}

const TAMANHOS = {
  xs: { container: 'w-6 h-6 text-[10px]', img: 'w-6 h-6' },
  sm: { container: 'w-8 h-8 text-xs', img: 'w-8 h-8' },
  md: { container: 'w-10 h-10 text-sm', img: 'w-10 h-10' },
  lg: { container: 'w-14 h-14 text-lg', img: 'w-14 h-14' },
  xl: { container: 'w-20 h-20 text-2xl', img: 'w-20 h-20' },
}

interface AvatarProps {
  nome: string
  size?: keyof typeof TAMANHOS
  papel?: Papel | string
  fotoUrl?: string | null
  className?: string
}

export function Avatar({ nome, size = 'md', papel, fotoUrl, className }: AvatarProps) {
  const cor = papel ? (COR_POR_PAPEL[papel] ?? '#5A7089') : '#5A7089'
  const { container, img } = TAMANHOS[size]
  const inicial = nome.charAt(0).toUpperCase()

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        className={cn('rounded-full object-cover shrink-0', img, className)}
        onError={(e) => {
          // fallback: hide img and let the parent show inicial
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none',
        container,
        className
      )}
      style={{ backgroundColor: cor }}
      aria-label={nome}
      title={nome}
    >
      {inicial}
    </div>
  )
}

// ─── Avatar Group ─────────────────────────────────────────────

interface AvatarGroupProps {
  usuarios: { nome: string; papel?: Papel | string }[]
  max?: number
  size?: keyof typeof TAMANHOS
  className?: string
}

export function AvatarGroup({ usuarios, max = 3, size = 'sm', className }: AvatarGroupProps) {
  const visiveis = usuarios.slice(0, max)
  const extras = usuarios.length - visiveis.length
  const { container } = TAMANHOS[size]

  return (
    <div className={cn('flex items-center', className)}>
      {visiveis.map((u, i) => (
        <div key={i} className={cn('-ml-1.5 first:ml-0 ring-2 ring-white rounded-full', i > 0 && 'z-0')}>
          <Avatar nome={u.nome} papel={u.papel} size={size} />
        </div>
      ))}
      {extras > 0 && (
        <div
          className={cn(
            '-ml-1.5 rounded-full ring-2 ring-white bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold',
            container,
            'text-[10px]'
          )}
        >
          +{extras}
        </div>
      )}
    </div>
  )
}
