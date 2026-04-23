'use client'

import Link from 'next/link'
import { CheckCircle2, XCircle, ClipboardList, Plus, ArrowRight, Star } from 'lucide-react'
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

const STATUS_CONFIG: Record<string, {
  label: string
  gradient: string
  ring: string
  scoreColor: string
  icon: React.ReactNode
}> = {
  CONFORME: {
    label: 'Conforme',
    gradient: 'linear-gradient(145deg, #064E3B 0%, #065F46 55%, #047857 100%)',
    ring: '#34D399',
    scoreColor: '#D1FAE5',
    icon: <Star size={22} className="text-emerald-300" fill="currentColor" />,
  },
  ATENCAO: {
    label: 'Atenção',
    gradient: 'linear-gradient(145deg, #78350F 0%, #92400E 55%, #B45309 100%)',
    ring: '#FCD34D',
    scoreColor: '#FEF3C7',
    icon: <CheckCircle2 size={22} className="text-amber-300" />,
  },
  NAO_CONFORME: {
    label: 'Não Conforme',
    gradient: 'linear-gradient(145deg, #7F1D1D 0%, #991B1B 55%, #B91C1C 100%)',
    ring: '#FCA5A5',
    scoreColor: '#FEE2E2',
    icon: <XCircle size={22} className="text-red-300" />,
  },
  REPROVADO: {
    label: 'Reprovado',
    gradient: 'linear-gradient(145deg, #450A0A 0%, #7F1D1D 55%, #991B1B 100%)',
    ring: '#F87171',
    scoreColor: '#FEE2E2',
    icon: <XCircle size={22} className="text-red-400" />,
  },
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

const CIRCUNF = 2 * Math.PI * 52

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
  const cfg = STATUS_CONFIG[scoreStatus] ?? STATUS_CONFIG.NAO_CONFORME
  const dashOffset = CIRCUNF - (score / 100) * CIRCUNF

  return (
    <div className="min-h-screen bg-[#EEF4FD] pb-8 flex flex-col">

      {/* ── Hero header ────────────────────────────────────────── */}
      <div
        className="relative px-4 pt-12 pb-10 overflow-hidden text-center"
        style={{ background: cfg.gradient }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Status icon pill */}
        <div className="relative inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1 mb-5">
          {cfg.icon}
          <span className="text-white font-bold text-sm">{cfg.label}</span>
        </div>

        {/* Circular score ring */}
        <div className="relative flex items-center justify-center mx-auto mb-4" style={{ width: 124, height: 124 }}>
          <svg width="124" height="124" viewBox="0 0 124 124" className="absolute inset-0 -rotate-90">
            <circle cx="62" cy="62" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
            <circle
              cx="62" cy="62" r="52"
              fill="none"
              stroke={cfg.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUNF}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="relative text-center">
            <p className="text-white font-bold leading-none" style={{ fontSize: 36 }}>{score}%</p>
            <p className="text-white/60 text-[10px] font-medium mt-0.5 uppercase tracking-wider">score</p>
          </div>
        </div>

        {/* Meta */}
        <p className="text-white font-bold text-base leading-snug">{escolaNome}</p>
        <p className="text-white/60 text-xs mt-1">{checklistNome}</p>
        <p className="text-white/45 text-xs mt-0.5">
          {format(new Date(finalizadaEm), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="px-4 -mt-5 grid grid-cols-3 gap-3">
        {/* Conformes */}
        <div
          className="bg-white rounded-2xl p-3 text-center border border-[#D5E3F0]"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.08)' }}
        >
          <CheckCircle2 size={16} className="text-[#00963A] mx-auto mb-1" />
          <p className="text-xl font-bold text-[#00963A] leading-none">{totalConformes}</p>
          <p className="text-[9px] text-[#9DAFC4] font-medium mt-0.5 uppercase tracking-wide">Conforme{totalConformes !== 1 ? 's' : ''}</p>
        </div>

        {/* Não conformes */}
        <div
          className="bg-white rounded-2xl p-3 text-center border border-[#D5E3F0]"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.08)' }}
        >
          <XCircle size={16} className={totalNaoConformes > 0 ? 'text-red-500 mx-auto mb-1' : 'text-[#9DAFC4] mx-auto mb-1'} />
          <p className={`text-xl font-bold leading-none ${totalNaoConformes > 0 ? 'text-red-600' : 'text-[#9DAFC4]'}`}>{totalNaoConformes}</p>
          <p className="text-[9px] text-[#9DAFC4] font-medium mt-0.5 uppercase tracking-wide">Não conforme{totalNaoConformes !== 1 ? 's' : ''}</p>
        </div>

        {/* NCs geradas */}
        <div
          className="bg-white rounded-2xl p-3 text-center border border-[#D5E3F0]"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.08)' }}
        >
          <ClipboardList size={16} className={totalNCs > 0 ? 'text-amber-500 mx-auto mb-1' : 'text-[#9DAFC4] mx-auto mb-1'} />
          <p className={`text-xl font-bold leading-none ${totalNCs > 0 ? 'text-amber-600' : 'text-[#9DAFC4]'}`}>{totalNCs}</p>
          <p className="text-[9px] text-[#9DAFC4] font-medium mt-0.5 uppercase tracking-wide">NC{totalNCs !== 1 ? 's' : ''} gerada{totalNCs !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Congratulations message (only for CONFORME) ────────── */}
      {scoreStatus === 'CONFORME' && (
        <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Star size={18} className="text-emerald-500 shrink-0" fill="currentColor" />
          <p className="text-sm text-emerald-700 font-medium leading-snug">
            Excelente! Esta escola está em conformidade com os padrões PNAE.
          </p>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="px-4 mt-5 space-y-3">
        <Link
          href="/inspecoes/nova"
          className="flex items-center justify-center gap-2 w-full rounded-2xl text-white font-semibold text-[15px]"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #0B2550 0%, #0E2E60 50%, #133878 100%)',
            boxShadow: '0 4px 16px rgba(14,46,96,0.30)',
            ...TAP,
          } as React.CSSProperties}
        >
          <Plus size={18} />
          Nova inspeção
        </Link>

        <Link
          href={`/inspecoes/${inspecaoId}`}
          className="flex items-center justify-center gap-2 w-full rounded-2xl font-semibold text-[15px] bg-white border border-[#D5E3F0] text-[#0E2E60]"
          style={{
            height: 52,
            boxShadow: '0 2px 8px rgba(14,46,96,0.08)',
            ...TAP,
          } as React.CSSProperties}
        >
          Ver resultado completo
          <ArrowRight size={16} className="text-[#9DAFC4]" />
        </Link>
      </div>

    </div>
  )
}
