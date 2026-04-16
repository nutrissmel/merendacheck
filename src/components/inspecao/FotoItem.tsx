'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, Upload, X, Loader2, ZoomIn } from 'lucide-react'
import { uploadFotoItemAction } from '@/actions/inspecao.actions'
import { comprimirImagem, gerarThumbnail } from '@/lib/imageUtils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  inspecaoId: string
  itemId: string
  fotoUrlInicial?: string | null
  onFotoSalva: (url: string) => void
  disabled?: boolean
}

export function FotoItem({ inspecaoId, itemId, fotoUrlInicial, onFotoSalva, disabled }: Props) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(fotoUrlInicial ?? null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são aceitas')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 20 MB)')
      return
    }

    startTransition(async () => {
      try {
        // Generate thumbnail locally for instant feedback
        const thumb = await gerarThumbnail(file)
        setThumbnail(thumb)

        // Compress before upload
        const compressed = await comprimirImagem(file)
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' })

        const formData = new FormData()
        formData.append('file', compressedFile)
        formData.append('inspecaoId', inspecaoId)
        formData.append('itemId', itemId)

        const result = await uploadFotoItemAction(formData)

        if ('erro' in result) {
          toast.error(result.erro)
          setThumbnail(null)
          return
        }

        setFotoUrl(result.fotoUrl)
        setThumbnail(null)
        onFotoSalva(result.fotoUrl)
        toast.success('Foto salva!')
      } catch {
        toast.error('Erro ao processar foto')
        setThumbnail(null)
      }
    })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const displayUrl = thumbnail ?? fotoUrl

  if (displayUrl) {
    return (
      <div className="space-y-2">
        <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Foto do item"
            className={cn('w-full h-48 object-cover', isPending && 'opacity-60')}
          />
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 size={24} className="animate-spin text-[#0E2E60]" />
            </div>
          )}
          {!isPending && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              {fotoUrl && (
                <button
                  onClick={() => setPreview(true)}
                  className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              )}
              {!disabled && (
                <button
                  onClick={() => { setFotoUrl(null); setThumbnail(null) }}
                  className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {!disabled && !isPending && (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-[#0E2E60] hover:underline"
          >
            Trocar foto
          </button>
        )}

        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />

        {/* Preview modal */}
        {preview && fotoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreview(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt="Preview" className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
            <button
              className="absolute top-4 right-4 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              onClick={() => setPreview(false)}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled || isPending}
        className={cn(
          'w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl transition-all',
          disabled
            ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
            : 'border-[#D5E3F0] text-[#5A7089] hover:border-[#0E2E60] hover:text-[#0E2E60] hover:bg-[#F8FAFD] cursor-pointer'
        )}
      >
        {isPending ? (
          <Loader2 size={28} className="animate-spin" />
        ) : (
          <>
            <Camera size={28} />
            <div className="text-center">
              <p className="text-sm font-medium">Tirar foto ou selecionar</p>
              <p className="text-xs text-neutral-400 mt-0.5">JPG, PNG até 20 MB</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Camera size={13} /> Câmera
              <span className="text-neutral-300">·</span>
              <Upload size={13} /> Galeria
            </div>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
