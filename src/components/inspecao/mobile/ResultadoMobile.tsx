'use client'

import Link from 'next/link'
import { CheckCircle2, XCircle, ClipboardList, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  inspecaoId: string
  escolaNome: string
  checklistNome: string
  score: number
  scoreStatus: string
  totalConformes: number
  totalNaoConformes: number
  totalNCs: number
  finalizadaEm: Date
}

const scoreStatusConfig: Record<string, { label: string; cor: string; headerBg: string }> = {
  CONFORME: { label: 'Conforme', cor: 'text-[#00963A]', headerBg: 'bg-[#00963A]' },
  ATENCAO: { label: 'Atenção', cor: 'text-amber-500', headerBg: 'bg-amber-500' },
  NAO_CONFORME: { label: 'Não Conforme', cor: 'text-red-600', headerBg: 'bg-red-600' },
  REPROVADO: { label: 'Reprovado', cor: 'text-red-800', headerBg: 'bg-red-800' },
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function ResultadoMobile({
  inspecaoId,
  escolaNome,
  checklistNome,
  score,
  scoreStatus,
  totalConformes,
  totalNaoConformes,
  totalNCs,
  finalizadaEm,
}: Props) {
  const config = scoreStatusConfig[scoreStatus] ?? scoreStatusConfig.NAO_CONFORME

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex flex-col">
      {/* Header */}
      <div className={cn('px-4 py-5 text-center text-white', config.headerBg)}>
        <CheckCircle2 size={36} className="mx-auto mb-2 opacity-90" />
        <h1 className="text-lg font-bold">Inspeção Finalizada!</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Score */}
        <div className="bg-white border-b border-[#D5E3F0] px-4 py-8 text-center">
          <div className={cn('text-6xl font-bold mb-1', config.cor)} aria-live="polite">
            {score}%
          </div>
          <div className={cn('text-xl font-bold mb-4', config.cor)}>
            {config.label}
          </div>

          <div className="text-sm text-[#5A7089] space-y-1">
            <p className="font-semibold text-[#0F1B2D]">{escolaNome}</p>
            <p>{checklistNome}</p>
            <p>{format(new Date(finalizadaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mx-4 mt-4 bg-white rounded-xl border border-[#D5E3F0] divide-y divide-neutral-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <CheckCircle2 size={18} className="text-[#00963A] shrink-0" />
            <span className="text-sm text-[#0F1B2D]">
              <span className="font-bold text-[#00963A]">{totalConformes}</span> ite{totalConformes !== 1 ? 'ns conformes' : 'm conforme'}
            </span>
          </div>

          {totalNaoConformes > 0 && (
            <div className="flex items-center gap-3 px-4 py-3">
              <XCircle size={18} className="text-red-500 shrink-0" />
              <span className="text-sm text-[#0F1B2D]">
                <span className="font-bold text-red-600">{totalNaoConformes}</span> não conforme{totalNaoConformes !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {totalNCs > 0 && (
            <div className="flex items-center gap-3 px-4 py-3">
              <ClipboardList size={18} className="text-amber-500 shrink-0" />
              <span className="text-sm text-[#0F1B2D]">
                <span className="font-bold text-amber-600">{totalNCs}</span> NC{totalNCs !== 1 ? 's' : ''} gerada{totalNCs !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mx-4 mt-4 space-y-3">
          <Link
            href="/inspecoes/nova"
            className="flex items-center justify-center gap-2 w-full bg-[#0E2E60] text-white font-bold rounded-xl"
            style={{ height: 56, fontSize: 16, ...TAP }}
          >
            <Plus size={20} /> Nova inspeção
          </Link>

          <Link
            href={`/inspecoes/${inspecaoId}`}
            className="flex items-center justify-center w-full border-2 border-[#0E2E60] text-[#0E2E60] font-bold rounded-xl"
            style={{ height: 56, fontSize: 16, ...TAP }}
          >
            Ver resultado completo
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
