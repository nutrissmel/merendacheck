import Link from 'next/link'
import { School, CheckCircle2, AlertTriangle, History, ChevronRight, Plus, Clock } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

function getSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function ultimaLabel(date: Date | null) {
  if (!date) return { text: 'Nunca inspecionada', urgent: true }
  if (isToday(date)) return { text: 'Hoje', urgent: false }
  if (isYesterday(date)) return { text: 'Ontem', urgent: true }
  return { text: format(date, 'dd/MM', { locale: ptBR }), urgent: true }
}

const PAPEL_LABEL: Record<string, string> = {
  NUTRICIONISTA:  'Nutricionista',
  MERENDEIRA:     'Merendeira',
  DIRETOR_ESCOLA: 'Diretor(a)',
  ADMIN_MUNICIPAL:'Administrador',
  SUPER_ADMIN:    'Super Admin',
}

const SCORE_STATUS: Record<string, { color: string; bg: string }> = {
  CONFORME:     { color: '#00963A', bg: '#D1F7E2' },
  ATENCAO:      { color: '#D97706', bg: '#FEF3C7' },
  NAO_CONFORME: { color: '#DC2626', bg: '#FEE2E2' },
  REPROVADO:    { color: '#991B1B', bg: '#FEE2E2' },
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export default async function HomeMobilePage() {
  const user = await getServerUser()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const escolas = await prisma.escola.findMany({
    where: { tenantId: user.tenantId, ativa: true },
    orderBy: { nome: 'asc' },
    take: 10,
    select: {
      id: true,
      nome: true,
      inspecoes: {
        orderBy: { iniciadaEm: 'desc' },
        take: 1,
        select: { iniciadaEm: true, status: true, score: true, scoreStatus: true },
      },
    },
  })

  const inspecoesHoje = await prisma.inspecao.findMany({
    where: {
      tenantId: user.tenantId,
      inspetorId: user.id,
      iniciadaEm: { gte: hoje },
    },
    orderBy: { iniciadaEm: 'desc' },
    take: 5,
    select: {
      id: true,
      iniciadaEm: true,
      status: true,
      score: true,
      scoreStatus: true,
      escola: { select: { nome: true } },
      checklist: { select: { nome: true } },
    },
  })

  const iniciais = user.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
  const primeiroNome = user.nome.split(' ')[0]
  const papel = PAPEL_LABEL[user.papel] ?? user.papel
  const finalizadas = inspecoesHoje.filter((i) => i.status === 'FINALIZADA').length
  const emAndamento = inspecoesHoje.filter((i) => i.status === 'EM_ANDAMENTO').length

  return (
    <div className="bg-[#EEF4FD] pb-28">

      {/* ── Header premium ─────────────────────────────────────── */}
      <div
        className="relative px-5 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0B2550 0%, #0E2E60 55%, #143980 100%)',
          paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)',
          paddingBottom: '1.75rem',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Avatar + greeting */}
        <div className="relative flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/25"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-white font-bold text-base tracking-tight">{iniciais}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/55 text-xs font-medium leading-none mb-0.5">{papel}</p>
            <p className="text-white font-bold text-[17px] leading-snug truncate">
              {getSaudacao()}, {primeiroNome}!
            </p>
          </div>
          <span className="text-[22px] leading-none shrink-0" aria-hidden="true">🍽</span>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-2.5">
          {/* Finalizadas */}
          <div
            className="flex-1 rounded-2xl px-3 py-3 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider mb-0.5">Hoje</p>
            <p className="text-white font-bold text-2xl leading-none">{finalizadas}</p>
            <p className="text-white/50 text-[9px] mt-0.5">finalizada{finalizadas !== 1 ? 's' : ''}</p>
          </div>

          {/* Em andamento */}
          <div
            className="flex-1 rounded-2xl px-3 py-3 border border-amber-400/20"
            style={{ background: emAndamento > 0 ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)' }}
          >
            <p className={cn('text-[9px] font-bold uppercase tracking-wider mb-0.5', emAndamento > 0 ? 'text-amber-300' : 'text-white/50')}>
              Andamento
            </p>
            <p className="text-white font-bold text-2xl leading-none">{emAndamento}</p>
            <p className={cn('text-[9px] mt-0.5', emAndamento > 0 ? 'text-amber-300' : 'text-white/50')}>
              em andamento
            </p>
          </div>

          {/* Escolas */}
          <div
            className="flex-1 rounded-2xl px-3 py-3 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider mb-0.5">Escolas</p>
            <p className="text-white font-bold text-2xl leading-none">{escolas.length}</p>
            <p className="text-white/50 text-[9px] mt-0.5">ativa{escolas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* ── Inspeções de hoje ───────────────────────────────── */}
        {inspecoesHoje.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-[#5A7089] uppercase tracking-widest">Hoje</h2>
              <span className="text-[11px] text-[#9DAFC4]">
                {inspecoesHoje.length} inspeç{inspecoesHoje.length !== 1 ? 'ões' : 'ão'}
              </span>
            </div>

            <div
              className="bg-white rounded-2xl border border-[#D5E3F0]"
              style={{ boxShadow: '0 2px 16px rgba(14,46,96,0.08)' }}
              role="list"
            >
              {inspecoesHoje.map((insp, i) => {
                const isEM = insp.status === 'EM_ANDAMENTO'
                const sc = insp.scoreStatus ? SCORE_STATUS[insp.scoreStatus] : null
                return (
                  <Link
                    key={insp.id}
                    href={isEM ? `/inspecoes/${insp.id}/responder` : `/inspecoes/${insp.id}`}
                    role="listitem"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 active:bg-[#EEF4FD] transition-colors',
                      i === 0 && 'rounded-t-2xl',
                      i === inspecoesHoje.length - 1 && 'rounded-b-2xl',
                      i > 0 && 'border-t border-[#EEF4FD]',
                    )}
                    style={TAP}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isEM ? '#FEF3C7' : (sc?.bg ?? '#EEF4FD') }}
                    >
                      {isEM ? (
                        <Clock size={16} className="text-amber-500" aria-hidden="true" />
                      ) : insp.scoreStatus === 'CONFORME' ? (
                        <CheckCircle2 size={16} className="text-[#00963A]" aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1B2D] truncate">{insp.checklist.nome}</p>
                      <p className="text-xs text-[#9DAFC4] mt-0.5">
                        {insp.escola.nome} · {format(new Date(insp.iniciadaEm), 'HH:mm')}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isEM ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Em andamento
                        </span>
                      ) : insp.score !== null ? (
                        <span
                          className="text-sm font-bold"
                          style={{ color: sc?.color ?? '#5A7089' }}
                        >
                          {Math.round(insp.score)}%
                        </span>
                      ) : null}
                      <ChevronRight size={13} className="text-[#C8D9EC]" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Suas escolas ────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold text-[#5A7089] uppercase tracking-widest">Suas Escolas</h2>
            <span className="text-[11px] text-[#9DAFC4]">{escolas.length} escola{escolas.length !== 1 ? 's' : ''}</span>
          </div>

          {escolas.length === 0 ? (
            <div
              className="bg-white rounded-2xl border border-[#D5E3F0] p-8 text-center"
              style={{ boxShadow: '0 2px 16px rgba(14,46,96,0.08)' }}
            >
              <School size={36} className="text-[#C8D9EC] mx-auto mb-2" />
              <p className="text-sm text-[#9DAFC4]">Nenhuma escola cadastrada</p>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {escolas.map((escola) => {
                const ultima = escola.inspecoes[0]
                const { text, urgent } = ultimaLabel(ultima?.iniciadaEm ?? null)
                const sc = ultima?.scoreStatus ? SCORE_STATUS[ultima.scoreStatus] : null
                const accentColor = urgent ? (ultima ? '#F59E0B' : '#D5E3F0') : '#00963A'

                return (
                  <div
                    key={escola.id}
                    role="listitem"
                    className="bg-white rounded-2xl border border-[#D5E3F0]"
                    style={{
                      boxShadow: '0 2px 16px rgba(14,46,96,0.08)',
                      borderTop: `3px solid ${accentColor}`,
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-[#EEF4FD] flex items-center justify-center shrink-0">
                          <School size={18} className="text-[#0E2E60]" aria-hidden="true" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0F1B2D] text-sm leading-snug">{escola.nome}</p>
                          <p className={cn('text-xs mt-1 font-medium', urgent ? 'text-amber-600' : 'text-[#00963A]')}>
                            {urgent ? '⚠ ' : '✓ '}Última: {text}
                          </p>
                        </div>

                        {/* Score badge */}
                        {sc && ultima?.score != null && (
                          <div
                            className="shrink-0 w-[46px] h-[46px] rounded-xl flex items-center justify-center border"
                            style={{
                              backgroundColor: sc.bg,
                              borderColor: sc.color + '40',
                            }}
                          >
                            <span className="text-xs font-bold leading-none" style={{ color: sc.color }}>
                              {Math.round(ultima.score)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/inspecoes/nova?escolaId=${escola.id}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl text-white font-semibold text-sm"
                        style={{
                          height: 46,
                          background: 'linear-gradient(135deg, #0B2550 0%, #0E2E60 50%, #133878 100%)',
                          boxShadow: '0 4px 12px rgba(14,46,96,0.25)',
                          ...TAP,
                        } as React.CSSProperties}
                        aria-label={`Inspecionar ${escola.nome}`}
                      >
                        <Plus size={16} /> Inspecionar
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Ver histórico ───────────────────────────────────── */}
        <Link
          href="/inspecoes"
          className="flex items-center justify-center gap-2 w-full border border-[#D5E3F0] bg-white text-[#0E2E60] font-semibold rounded-2xl text-sm"
          style={{
            height: 50,
            boxShadow: '0 1px 6px rgba(14,46,96,0.06)',
            ...TAP,
          } as React.CSSProperties}
        >
          <History size={16} /> Ver histórico completo
        </Link>

      </div>
    </div>
  )
}
