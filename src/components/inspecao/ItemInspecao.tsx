'use client'

import { useState } from 'react'
import { AlertCircle, Camera, ChevronDown, ChevronUp, MessageSquare, Ban } from 'lucide-react'
import { RespostaSimNao } from './RespostaSimNao'
import { RespostaNumerica } from './RespostaNumerica'
import { RespostaTextoLivre } from './RespostaTextoLivre'
import { RespostaMultiplaEscolha } from './RespostaMultiplaEscolha'
import { RespostaFoto } from './RespostaFoto'
import { RespostaEscala } from './RespostaEscala'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@prisma/client'
import type { RespostaLocal } from '@/hooks/useInspecao'

// Marcador interno para N/A em tipos não-SIM_NAO
const NA_MARKER = '__NA__'

interface Props {
  item: ChecklistItem
  resposta?: RespostaLocal
  inspecaoId: string
  onResponder: (resposta: RespostaLocal) => void
  onAtualizarFoto: (fotoUrl: string | null) => void
  onAtualizarObservacao: (observacao: string) => void
  disabled?: boolean
}

export function ItemInspecao({
  item,
  resposta,
  inspecaoId,
  onResponder,
  onAtualizarFoto,
  onAtualizarObservacao,
  disabled,
}: Props) {
  const [mostrarObs, setMostrarObs] = useState(!!resposta?.observacao)
  const [observacao, setObservacao] = useState(resposta?.observacao ?? '')

  const conforme = resposta?.conforme

  // Detecta N/A: para SIM_NAO, respostaSimNao === null; para outros, respostaTexto === '__NA__'
  const isNA =
    resposta !== undefined &&
    resposta.conforme === null &&
    (item.tipoResposta === 'SIM_NAO'
      ? resposta.respostaSimNao === null
      : resposta.respostaTexto === NA_MARKER)

  function handleNaoAplica() {
    if (isNA) {
      // Desfaz N/A — limpa marcador, item volta a estado sem resposta definida
      onResponder({
        conforme: null,
        respostaTexto: null,
        respostaSimNao: undefined,
        respostaNumerica: null,
        observacao: resposta?.observacao,
        fotoUrl: resposta?.fotoUrl,
      })
    } else {
      // Marca como N/A
      onResponder({
        conforme: null,
        respostaTexto: item.tipoResposta !== 'SIM_NAO' ? NA_MARKER : null,
        respostaSimNao: item.tipoResposta === 'SIM_NAO' ? null : undefined,
        respostaNumerica: null,
        observacao: resposta?.observacao,
        fotoUrl: resposta?.fotoUrl,
      })
    }
  }

  function handleObservacaoBlur() {
    onAtualizarObservacao(observacao)
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho da pergunta */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 flex-wrap">
          {item.isCritico && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
              <AlertCircle size={9} /> Crítico
            </span>
          )}
          {item.fotoObrigatoria && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
              <Camera size={9} /> Foto obrigatória
            </span>
          )}
          {item.obrigatorio && (
            <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
              Obrigatório
            </span>
          )}
          {isNA && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
              <Ban size={9} /> Não se aplica
            </span>
          )}
        </div>

        <h2 className="text-lg font-bold text-[#0F1B2D] leading-snug">
          {item.pergunta}
          {item.obrigatorio && <span className="text-red-400 ml-1">*</span>}
        </h2>

        {item.descricao && (
          <p className="text-sm text-[#5A7089] leading-relaxed">{item.descricao}</p>
        )}
      </div>

      {/* Controle de resposta — oculto quando N/A ativo (exceto SIM_NAO que tem N/A embutido) */}
      <div className={cn(isNA && item.tipoResposta !== 'SIM_NAO' && 'opacity-30 pointer-events-none select-none')}>
        {item.tipoResposta === 'SIM_NAO' && (
          <RespostaSimNao
            valor={resposta?.respostaSimNao}
            onChange={(v) =>
              onResponder({
                respostaSimNao: v,
                conforme: v,
                observacao: resposta?.observacao,
                fotoUrl: resposta?.fotoUrl,
              })
            }
            disabled={disabled}
          />
        )}

        {item.tipoResposta === 'NUMERICO' && (
          <RespostaNumerica
            valor={resposta?.respostaNumerica}
            valorMinimo={item.valorMinimo}
            valorMaximo={item.valorMaximo}
            unidade={item.unidade}
            onChange={(v, conf) =>
              onResponder({
                respostaNumerica: v,
                conforme: conf,
                observacao: resposta?.observacao,
                fotoUrl: resposta?.fotoUrl,
              })
            }
            disabled={disabled}
          />
        )}

        {item.tipoResposta === 'TEXTO_LIVRE' && (
          <RespostaTextoLivre
            valor={resposta?.respostaTexto === NA_MARKER ? null : resposta?.respostaTexto}
            onChange={(v, conf) =>
              onResponder({
                respostaTexto: v,
                conforme: conf,
                observacao: resposta?.observacao,
                fotoUrl: resposta?.fotoUrl,
              })
            }
            disabled={disabled}
          />
        )}

        {item.tipoResposta === 'MULTIPLA_ESCOLHA' && (
          <RespostaMultiplaEscolha
            opcoes={item.opcoes}
            valor={resposta?.respostaTexto === NA_MARKER ? null : resposta?.respostaTexto}
            onChange={(v, conf) =>
              onResponder({
                respostaTexto: v,
                conforme: conf,
                observacao: resposta?.observacao,
                fotoUrl: resposta?.fotoUrl,
              })
            }
            disabled={disabled}
          />
        )}

        {item.tipoResposta === 'FOTO' && (
          <RespostaFoto
            inspecaoId={inspecaoId}
            itemId={item.id}
            fotoUrl={resposta?.fotoUrl}
            onFotoSalva={(url) => {
              onAtualizarFoto(url)
              if (!resposta?.conforme) {
                onResponder({ conforme: true, fotoUrl: url, observacao: resposta?.observacao })
              }
            }}
            disabled={disabled}
          />
        )}

        {item.tipoResposta === 'ESCALA' && (
          <RespostaEscala
            valor={resposta?.respostaNumerica}
            min={item.valorMinimo ?? 1}
            max={item.valorMaximo ?? 5}
            onChange={(v, conf) =>
              onResponder({
                respostaNumerica: v,
                conforme: conf,
                observacao: resposta?.observacao,
                fotoUrl: resposta?.fotoUrl,
              })
            }
            disabled={disabled}
          />
        )}
      </div>

      {/* Botão N/A — disponível para todos os tipos */}
      {!disabled && (
        <button
          type="button"
          onClick={handleNaoAplica}
          className={cn(
            'flex items-center gap-1.5 text-xs transition-colors rounded-lg px-2.5 py-1.5 border',
            isNA
              ? 'border-neutral-300 bg-neutral-100 text-neutral-600 font-semibold'
              : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
          )}
        >
          <Ban size={12} />
          {isNA ? 'Desfazer N/A — Responder item' : 'N/A — Não se aplica'}
        </button>
      )}

      {/* Observação */}
      {item.tipoResposta !== 'FOTO' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMostrarObs((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-[#5A7089] hover:text-[#0E2E60] transition-colors"
          >
            <MessageSquare size={13} />
            {mostrarObs ? 'Ocultar observação' : 'Adicionar observação'}
            {mostrarObs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {mostrarObs && (
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              onBlur={handleObservacaoBlur}
              disabled={disabled}
              placeholder="Observação opcional..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm border border-[#D5E3F0] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] transition-all"
            />
          )}
        </div>
      )}

      {/* Foto obrigatória para tipos não-FOTO */}
      {item.fotoObrigatoria && item.tipoResposta !== 'FOTO' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#0F1B2D] flex items-center gap-1.5">
            <Camera size={14} className="text-blue-600" /> Foto obrigatória
          </p>
          <RespostaFoto
            inspecaoId={inspecaoId}
            itemId={item.id}
            fotoUrl={resposta?.fotoUrl}
            onFotoSalva={onAtualizarFoto}
            disabled={disabled}
          />
        </div>
      )}

      {/* Badge de conformidade */}
      {isNA ? (
        <div className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-neutral-100 text-neutral-600">
          <Ban size={14} /> Item marcado como não aplicável — não conta no score
        </div>
      ) : conforme !== undefined && conforme !== null ? (
        <div className={cn(
          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
          conforme ? 'bg-[#D1F7E2] text-[#005C25]' : 'bg-red-50 text-red-700'
        )}>
          {conforme ? '✓ Conforme' : '✗ Não conforme'}
          {!conforme && item.isCritico && (
            <span className="text-xs font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
              CRÍTICO — Gera NC prioritária
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
