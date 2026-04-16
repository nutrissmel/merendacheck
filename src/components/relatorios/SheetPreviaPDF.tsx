'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface SheetPreviaPDFProps {
  open: boolean
  onClose: () => void
  url: string | null
  downloadUrl: string | null
  titulo: string
}

export function SheetPreviaPDF({ open, onClose, url, downloadUrl, titulo }: SheetPreviaPDFProps) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (open && url) {
      setCarregando(true)
      setErro(false)
    }
  }, [open, url])

  function handleLoad() {
    setCarregando(false)
  }

  function handleError() {
    setCarregando(false)
    setErro(true)
  }

  // Fechar com Esc
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Sheet lateral */}
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl z-50 flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5E3F0] bg-white shrink-0">
          <div>
            <p className="text-xs text-[#5A7089] uppercase tracking-wider font-bold mb-0.5">Pré-visualização</p>
            <h2 className="font-semibold text-[#0F1B2D] font-heading">{titulo}</h2>
          </div>
          <div className="flex items-center gap-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E60] text-white text-xs font-semibold hover:bg-[#133878] transition-colors"
              >
                <Download size={13} />
                Baixar PDF
              </a>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-xs font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
              >
                <ExternalLink size={12} />
                Abrir
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 relative bg-[#F5F9FD]">
          {carregando && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F5F9FD] z-10">
              <Loader2 size={32} className="text-[#0E2E60] animate-spin" />
              <p className="text-sm text-[#5A7089]">Gerando relatório...</p>
            </div>
          )}

          {erro && !carregando && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <AlertCircle size={32} className="text-[#DC2626]" />
              <p className="text-sm font-semibold text-[#0F1B2D]">Erro ao carregar o relatório</p>
              <p className="text-xs text-[#5A7089]">Tente novamente ou baixe diretamente.</p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
                >
                  <Download size={14} />
                  Baixar PDF
                </a>
              )}
            </div>
          )}

          {url && (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              title={titulo}
            />
          )}
        </div>
      </div>
    </>
  )
}
