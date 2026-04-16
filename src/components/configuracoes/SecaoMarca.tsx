'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Loader2, ImageIcon, Palette } from 'lucide-react'
import { uploadLogoMunicipioAction, removerLogoAction } from '@/actions/configuracoes.actions'
import { toast } from 'sonner'
import Image from 'next/image'
import type { DadosTenant } from '@/actions/configuracoes.actions'

interface Props {
  tenant: DadosTenant
}

export function SecaoMarca({ tenant }: Props) {
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [corPrimaria, setCorPrimaria] = useState('#0E2E60')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo maior que 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Selecione um arquivo primeiro'); return }

    setUploading(true)
    const fd = new FormData()
    fd.append('logo', file)

    const res = await uploadLogoMunicipioAction(fd)
    setUploading(false)

    if (res.sucesso) {
      setLogoUrl(res.logoUrl)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Logo atualizado com sucesso!')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao fazer upload')
    }
  }

  async function handleRemover() {
    if (!confirm('Remover o logo do município?')) return
    setRemovendo(true)
    const res = await removerLogoAction()
    setRemovendo(false)
    if (res.sucesso) {
      setLogoUrl(null)
      setPreview(null)
      toast.success('Logo removido')
    } else {
      toast.error(res.erro ?? 'Erro ao remover logo')
    }
  }

  const imagemAtual = preview ?? logoUrl

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Palette size={16} className="text-[#0E2E60]" />
          Identidade Visual
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">Logo e cores usados em relatórios PDF e e-mails</p>
      </div>

      {/* Upload de logo */}
      <div>
        <label className="text-xs font-semibold text-[#5A7089] block mb-3">Logo do município</label>

        {/* Área de preview */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-64 h-32 border-2 border-dashed border-[#D5E3F0] rounded-xl flex items-center justify-center bg-[#F5F9FD] hover:bg-[#EEF4FD] hover:border-[#0E2E60] transition-all cursor-pointer overflow-hidden group"
        >
          {imagemAtual ? (
            <>
              <Image
                src={imagemAtual}
                alt="Logo do município"
                fill
                className="object-contain p-3"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-semibold">Trocar logo</span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon size={28} className="text-[#A8BDD4] mx-auto mb-1" />
              <p className="text-xs text-[#5A7089]">PNG ou SVG</p>
              <p className="text-[10px] text-[#A8BDD4]">máx. 2MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors"
          >
            <Upload size={13} />
            Selecionar arquivo
          </button>
          {preview && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00963A] text-white text-sm font-semibold hover:bg-[#007A30] transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Enviar logo
            </button>
          )}
          {logoUrl && !preview && (
            <button
              onClick={handleRemover}
              disabled={removendo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-[#DC2626] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {removendo ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Remover logo
            </button>
          )}
        </div>
      </div>

      {/* Preview da sidebar */}
      <div>
        <label className="text-xs font-semibold text-[#5A7089] block mb-3">Como aparece na sidebar</label>
        <div className="w-56 bg-[#0E2E60] rounded-xl p-4">
          <div className="flex items-center gap-2.5 mb-4">
            {imagemAtual ? (
              <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <Image src={imagemAtual} alt="" width={28} height={28} className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
            )}
            <div>
              <p className="text-white text-xs font-bold truncate">{tenant.nome.slice(0, 18)}</p>
              <p className="text-white/50 text-[10px]">MerendaCheck</p>
            </div>
          </div>
          <div className="space-y-1">
            {['Dashboard', 'Inspeções', 'Escolas'].map((item) => (
              <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/60 text-xs">
                <div className="w-3 h-3 bg-white/20 rounded" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cor primária */}
      <div>
        <label className="text-xs font-semibold text-[#5A7089] block mb-2">Cor primária do município (relatórios PDF)</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={corPrimaria}
            onChange={(e) => setCorPrimaria(e.target.value)}
            className="w-10 h-10 rounded-lg border border-[#D5E3F0] cursor-pointer p-1"
          />
          <span className="text-sm font-mono text-[#5A7089]">{corPrimaria.toUpperCase()}</span>
          <span className="text-xs text-[#A8BDD4]">Usado em cabeçalhos de PDFs e e-mails</span>
        </div>
        <p className="text-[11px] text-[#A8BDD4] mt-2">Personalização de cor por tenant será ativada em breve.</p>
      </div>
    </div>
  )
}
