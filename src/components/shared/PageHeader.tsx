import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  subtitulo?: string
  acoes?: ReactNode
}

export function PageHeader({ titulo, subtitulo, acoes }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">{titulo}</h1>
          {subtitulo && (
            <p className="text-sm text-[#5A7089] mt-1">{subtitulo}</p>
          )}
        </div>
        {acoes && <div className="flex items-center gap-3 shrink-0">{acoes}</div>}
      </div>
      <div className="mt-4 h-px bg-[#D5E3F0]" />
    </div>
  )
}
