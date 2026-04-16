'use client'

import { Camera } from 'lucide-react'
import { FotoItem } from './FotoItem'

interface Props {
  inspecaoId: string
  itemId: string
  fotoUrl?: string | null
  onFotoSalva: (url: string) => void
  disabled?: boolean
}

export function RespostaFoto({ inspecaoId, itemId, fotoUrl, onFotoSalva, disabled }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[#5A7089]">
        <Camera size={15} />
        <span>Este item requer registro fotográfico</span>
      </div>
      <FotoItem
        inspecaoId={inspecaoId}
        itemId={itemId}
        fotoUrlInicial={fotoUrl}
        onFotoSalva={onFotoSalva}
        disabled={disabled}
      />
    </div>
  )
}
