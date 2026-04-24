'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, AlertCircle, MapPin, PenLine,
  Loader2, X, FileText, User, Stethoscope,
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

  // Localização
  const [capturandoLoc, setCapturandoLoc] = useState(false)
  const [latLng, setLatLng] = useState<string | null>(null)
  const [locErroCodigo, setLocErroCodigo] = useState<number | null>(null)

  // Relatório final
  const [relatorioFinal, setRelatorioFinal] = useState('')

  // Assinatura Diretor/Supervisor
  const [assinaturaDiretorUrl, setAssinaturaDiretorUrl] = useState<string | null>(null)
  const [assinaturaDiretorAssinado, setAssinaturaDiretorAssinado] = useState(false)
  const [mostrarAssinaturaDiretor, setMostrarAssinaturaDiretor] = useState(false)

  // Assinatura Nutricionista
  const [assinaturaNutricionistaUrl, setAssinaturaNutricionistaUrl] = useState<string | null>(null)
  const [assinaturaNutricionistaAssinado, setAssinaturaNutricionistaAssinado] = useState(false)
  const [mostrarAssinaturaNutricionista, setMostrarAssinaturaNutricionista] = useState(false)

  const podeFinalizar = itensPendentes.length === 0

  function handleAssinadoDiretor(dataUrl: string) {
    setAssinaturaDiretorUrl(dataUrl)
    setAssinaturaDiretorAssinado(true)
    setMostrarAssinaturaDiretor(false)
    toast.success('Assinatura do Diretor capturada!')
  }

  function handleAssinadoNutricionista(dataUrl: string) {
    setAssinaturaNutricionistaUrl(dataUrl)
    setAssinaturaNutricionistaAssinado(true)
    setMostrarAssinaturaNutricionista(false)
    toast.success('Assinatura da Nutricionista capturada!')
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
        assinaturaDiretorUrl: assinaturaDiretorUrl ?? undefined,
        assinaturaNutricionistaUrl: assinaturaNutricionistaUrl ?? undefined,
        relatorioFinal: relatorioFinal.trim() || undefined,
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

      {/* Header */}
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

      {/* Localização (opcional) */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <MapPin size={15} className="text-blue-800" /> Localização <span className="font-normal text-neutral-400">(opcional)</span>
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
        ) : locErroCodigo === 1 ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Permissão de localização bloqueada</p>
                <p className="text-amber-700">Clique no ícone 🔒 na barra de endereço → <strong>Permissões do site</strong> → <strong>Localização</strong> → <strong>Permitir</strong> e recarregue a página.</p>
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

      {/* Relatório Final */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0F1B2D] flex items-center gap-2">
          <FileText size={15} className="text-[#0E2E60]" /> Relatório Final <span className="font-normal text-neutral-400">(opcional)</span>
        </h3>
        <textarea
          value={relatorioFinal}
          onChange={(e) => setRelatorioFinal(e.target.value)}
          placeholder="Descreva as observações gerais da inspeção, condições encontradas, recomendações e quaisquer ocorrências relevantes..."
          maxLength={3000}
          rows={6}
          className="w-full resize-none rounded-lg border border-[#D5E3F0] bg-[#F8FBFF] px-3 py-2.5 text-sm text-[#0F1B2D] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] transition-colors"
        />
        <p className="text-right text-xs text-neutral-400">{relatorioFinal.length}/3000</p>
      </div>

      {/* Assinatura Diretor/Supervisor */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0F1B2D] flex items-center gap-2">
          <User size={15} className="text-[#0E2E60]" /> Assinatura Diretor/Supervisor <span className="font-normal text-neutral-400">(opcional)</span>
        </h3>
        {assinaturaDiretorAssinado ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-[#00963A] font-medium">
              <CheckCircle2 size={15} /> Assinatura capturada
            </span>
            <button
              onClick={() => { setAssinaturaDiretorAssinado(false); setAssinaturaDiretorUrl(null) }}
              className="text-xs text-[#5A7089] hover:text-red-500 underline"
            >
              Refazer
            </button>
          </div>
        ) : mostrarAssinaturaDiretor ? (
          <div className="space-y-2">
            <AssinaturaCanvas onAssinado={handleAssinadoDiretor} />
            <button
              onClick={() => setMostrarAssinaturaDiretor(false)}
              className="text-xs text-[#5A7089] hover:text-[#0E2E60]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMostrarAssinaturaDiretor(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[#D5E3F0] rounded-lg text-sm text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
          >
            <PenLine size={14} /> Adicionar assinatura
          </button>
        )}
      </div>

      {/* Assinatura Nutricionista */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0F1B2D] flex items-center gap-2">
          <Stethoscope size={15} className="text-[#0E2E60]" /> Assinatura Nutricionista <span className="font-normal text-neutral-400">(opcional)</span>
        </h3>
        {assinaturaNutricionistaAssinado ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-[#00963A] font-medium">
              <CheckCircle2 size={15} /> Assinatura capturada
            </span>
            <button
              onClick={() => { setAssinaturaNutricionistaAssinado(false); setAssinaturaNutricionistaUrl(null) }}
              className="text-xs text-[#5A7089] hover:text-red-500 underline"
            >
              Refazer
            </button>
          </div>
        ) : mostrarAssinaturaNutricionista ? (
          <div className="space-y-2">
            <AssinaturaCanvas onAssinado={handleAssinadoNutricionista} />
            <button
              onClick={() => setMostrarAssinaturaNutricionista(false)}
              className="text-xs text-[#5A7089] hover:text-[#0E2E60]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMostrarAssinaturaNutricionista(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[#D5E3F0] rounded-lg text-sm text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
          >
            <PenLine size={14} /> Adicionar assinatura
          </button>
        )}
      </div>

      {/* Finalizar */}
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
