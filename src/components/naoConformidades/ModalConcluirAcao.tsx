'use client'

import { useState, useTransition, useRef } from 'react'
import { concluirAcaoAction, uploadEvidenciaAcaoAction } from '@/actions/naoConformidade.actions'
import { X, Camera, Loader2, CheckCircle2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ModalConcluirAcaoProps {
  acaoId: string
  descricaoAcao: string
  ncId: string
  onClose: () => void
  onConcluido: (ncResolvida: boolean) => void
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function ModalConcluirAcao({ acaoId, descricaoAcao, onClose, onConcluido }: ModalConcluirAcaoProps) {
  const [observacao, setObservacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleConcluir = () => {
    if (observacao.trim().length < 10) {
      toast.error('Descreva o que foi feito com pelo menos 10 caracteres')
      return
    }

    startTransition(async () => {
      let evidenciaUrl: string | undefined

      // Upload photo if selected
      if (fotoFile) {
        const fd = new FormData()
        fd.append('file', fotoFile)
        const uploadResult = await uploadEvidenciaAcaoAction(acaoId, fd)

        if ('erro' in uploadResult) {
          toast.error(`Erro no upload da foto: ${uploadResult.erro}`)
          return
        }

        evidenciaUrl = uploadResult.evidenciaUrl
      }

      const result = await concluirAcaoAction({
        acaoId,
        observacaoConclusao: observacao.trim(),
        evidenciaUrl,
      })

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      if (result.ncResolvida) {
        toast.success('NC resolvida! Todas as ações foram concluídas. 🎉', {
          style: { background: '#D1F7E2', color: '#00963A', border: '1px solid #00963A' },
        })
      } else {
        toast.success('Ação marcada como concluída ✓')
      }

      onConcluido(result.ncResolvida)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-concluir-titulo"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#D5E3F0] flex items-start justify-between">
            <div>
              <h2 id="modal-concluir-titulo" className="text-base font-bold text-[#0F1B2D]">
                Concluir ação
              </h2>
              <p className="text-xs text-[#5A7089] mt-0.5 truncate max-w-xs">
                "{descricaoAcao}"
              </p>
            </div>
            <button onClick={onClose} className="text-[#5A7089] hover:text-[#0F1B2D] ml-4 shrink-0" style={TAP} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Observação */}
            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                O que foi feito? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva detalhadamente o que foi realizado para resolver esta não conformidade..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border border-[#D5E3F0] bg-[#F5F9FD] px-3 py-2.5 text-sm text-[#0F1B2D] placeholder:text-[#A8BDD4] focus:outline-none focus:ring-2 focus:ring-[#00963A]/20 focus:border-[#00963A] resize-none"
              />
              <p className="text-xs text-[#A8BDD4] text-right mt-1">{observacao.length}/1000</p>
            </div>

            {/* Evidência fotográfica */}
            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                Evidência fotográfica <span className="text-[#5A7089] font-normal">(opcional)</span>
              </label>

              {fotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#D5E3F0]">
                  <div className="relative h-40 w-full">
                    <Image
                      src={fotoPreview}
                      alt="Evidência selecionada"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                      className="bg-white/90 rounded-full p-1.5 shadow text-red-500 hover:bg-red-50"
                      style={TAP}
                      aria-label="Remover foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="px-3 py-2 bg-white border-t border-[#D5E3F0]">
                    <p className="text-xs text-[#5A7089] truncate">{fotoFile?.name}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#D5E3F0] rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
                  style={TAP}
                >
                  <Camera size={24} className="text-[#7AAAE3]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#0E2E60]">Adicionar foto</p>
                  <p className="text-xs text-[#5A7089]">Tire uma foto como comprovante da resolução</p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#D5E3F0] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-[#D5E3F0] text-sm font-semibold text-[#5A7089] hover:bg-[#F5F9FD] transition-colors"
              style={TAP}
            >
              Cancelar
            </button>
            <button
              onClick={handleConcluir}
              disabled={isPending || observacao.trim().length < 10}
              className="flex-1 h-11 rounded-xl bg-[#00963A] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#007A30] disabled:opacity-50 transition-colors"
              style={TAP}
            >
              {isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle2 size={15} />
              }
              {isPending ? 'Salvando...' : 'Marcar como feito'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
