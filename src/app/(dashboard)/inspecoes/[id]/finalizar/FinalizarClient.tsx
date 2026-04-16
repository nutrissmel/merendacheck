'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, AlertCircle, MapPin, PenLine,
  Loader2, X,
} from 'lucide-react'
import { finalizarInspecaoAction } from '@/actions/inspecao.actions'
import { AssinaturaCanvas } from '@/components/inspecao/AssinaturaCanvas'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  inspecaoId: string
  escolaNome: string
  checklistNome: string
  totalItens: number
  totalRespondidos: number
  itensPendentes: { id: string; pergunta: string }[]
}

export function FinalizarClient({
  inspecaoId,
  escolaNome,
  checklistNome,
  totalItens,
  totalRespondidos,
  itensPendentes,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null)
  const [assinado, setAssinado] = useState(false)
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false)
  const [capturandoLoc, setCapturandoLoc] = useState(false)
  const [latLng, setLatLng] = useState<string | null>(null)
  const [locErroCodigo, setLocErroCodigo] = useState<number | null>(null)

  const podeFinalizar = itensPendentes.length === 0

  function handleAssinado(dataUrl: string) {
    setAssinaturaUrl(dataUrl)
    setAssinado(true)
    setMostrarAssinatura(false)
    toast.success('Assinatura capturada!')
  }

  async function capturarLocalizacao() {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização')
      return
    }
    setCapturandoLoc(true)

    function onSuccess(pos: GeolocationPosition) {
      setLatLng(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`)
      setLocErroCodigo(null)
      setCapturandoLoc(false)
      toast.success('Localização capturada!')
    }

    function onErrorFallback(err: GeolocationPositionError) {
      setCapturandoLoc(false)
      setLocErroCodigo(err.code)
    }

    // Tenta primeiro com alta precisão; se falhar, tenta com baixa precisão (funciona em desktops)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onErrorFallback,
          { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
        )
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  function finalizar() {
    startTransition(async () => {
      const result = await finalizarInspecaoAction({
        inspecaoId,
        assinaturaUrl: assinaturaUrl ?? undefined,
        latLng: latLng ?? undefined,
      })

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      router.push(`/inspecoes/${inspecaoId}`)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
      >
        <ArrowLeft size={14} /> Voltar à inspeção
      </button>

      <div className="bg-white border border-[#D5E3F0] rounded-xl p-5 space-y-1">
        <h1 className="text-xl font-bold text-[#0F1B2D] font-heading">Finalizar Inspeção</h1>
        <p className="text-sm text-[#5A7089]">{escolaNome} · {checklistNome}</p>
        <p className="text-sm text-[#5A7089]">
          {totalRespondidos} de {totalItens} itens respondidos
        </p>
      </div>

      {/* Pending items warning */}
      {itensPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertCircle size={16} />
            {itensPendentes.length} item(ns) obrigatório(s) sem resposta
          </div>
          <ul className="space-y-1">
            {itensPendentes.slice(0, 5).map((item) => (
              <li key={item.id} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="shrink-0">·</span>
                <span className="line-clamp-1">{item.pergunta}</span>
              </li>
            ))}
            {itensPendentes.length > 5 && (
              <li className="text-xs text-amber-600 font-medium">
                +{itensPendentes.length - 5} mais...
              </li>
            )}
          </ul>
          <button
            onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
            className="text-xs font-semibold text-amber-800 underline"
          >
            Voltar e responder
          </button>
        </div>
      )}

      {/* Optional: Location */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <MapPin size={15} className="text-blue-800" /> Localização (opcional)
        </h3>
        {latLng ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded">
              {latLng}
            </span>
            <button onClick={() => setLatLng(null)} className="text-neutral-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ) : locErroCodigo === 1 /* PERMISSION_DENIED */ ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Permissão de localização bloqueada</p>
                <p className="text-amber-700">Clique no ícone 🔒 na barra de endereço do navegador → <strong>Permissões do site</strong> → <strong>Localização</strong> → <strong>Permitir</strong> e recarregue a página.</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500">A localização é opcional — você pode finalizar sem ela.</p>
          </div>
        ) : locErroCodigo !== null ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {locErroCodigo === 2 ? 'Localização indisponível no dispositivo.' : 'Tempo esgotado ao obter localização.'}
            </div>
            <button
              onClick={capturarLocalizacao}
              disabled={capturandoLoc}
              className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {capturandoLoc ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              Tentar novamente
            </button>
          </div>
        ) : (
          <button
            onClick={capturarLocalizacao}
            disabled={capturandoLoc}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {capturandoLoc ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            {capturandoLoc ? 'Capturando...' : 'Capturar localização'}
          </button>
        )}
      </div>

      {/* Optional: Signature */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0F1B2D] flex items-center gap-2">
          <PenLine size={15} className="text-[#0E2E60]" /> Assinatura (opcional)
        </h3>

        {assinado ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-[#00963A] font-medium">
              <CheckCircle2 size={15} /> Assinatura capturada
            </span>
            <button
              onClick={() => { setAssinado(false); setAssinaturaUrl(null) }}
              className="text-xs text-[#5A7089] hover:text-red-500 underline"
            >
              Refazer
            </button>
          </div>
        ) : mostrarAssinatura ? (
          <div className="space-y-2">
            <AssinaturaCanvas onAssinado={handleAssinado} />
            <button
              onClick={() => setMostrarAssinatura(false)}
              className="text-xs text-[#5A7089] hover:text-[#0E2E60]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMostrarAssinatura(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[#D5E3F0] rounded-lg text-sm text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
          >
            <PenLine size={14} /> Adicionar assinatura
          </button>
        )}
      </div>

      {/* Finalize button */}
      <button
        onClick={finalizar}
        disabled={!podeFinalizar || isPending}
        className={cn(
          'w-full py-3.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2',
          podeFinalizar
            ? 'bg-[#00963A] text-white hover:bg-[#007830]'
            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
        )}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Finalizando...</>
        ) : (
          <><CheckCircle2 size={16} /> Finalizar Inspeção</>
        )}
      </button>

      {!podeFinalizar && (
        <p className="text-center text-xs text-[#5A7089]">
          Responda todos os itens obrigatórios para finalizar.
        </p>
      )}
    </div>
  )
}
