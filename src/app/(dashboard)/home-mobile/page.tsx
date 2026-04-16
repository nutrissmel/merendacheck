import Link from 'next/link'
import { School, CheckCircle2, AlertTriangle, History, ChevronRight } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
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
  if (isToday(date)) return { text: 'Hoje ✓', urgent: false }
  if (isYesterday(date)) return { text: 'Ontem ⚠', urgent: true }
  return { text: format(date, "dd/MM", { locale: ptBR }) + ' ⚠', urgent: true }
}

export default async function HomeMobilePage() {
  const user = await getServerUser()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Escolas ligadas ao tenant
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

  // Inspeções de hoje
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

  return (
    <div className="min-h-screen bg-[#F5F9FD] pb-20">
      {/* Header */}
      <div className="bg-[#0E2E60] px-4 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🍽</span>
          <span className="text-white font-bold text-base">MerendaCheck</span>
        </div>
        <p className="text-white/90 text-lg font-semibold">
          {getSaudacao()}, {user.nome.split(' ')[0]}!
        </p>
      </div>

      <div className="px-4 space-y-5 mt-5">
        {/* Schools section */}
        <section>
          <h2 className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-3">
            Suas Escolas
          </h2>
          <div className="space-y-3" role="list">
            {escolas.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#D5E3F0] p-4 text-center text-sm text-neutral-400">
                Nenhuma escola cadastrada
              </div>
            ) : (
              escolas.map((escola) => {
                const ultima = escola.inspecoes[0]
                const { text, urgent } = ultimaLabel(ultima?.iniciadaEm ?? null)

                return (
                  <div
                    key={escola.id}
                    role="listitem"
                    className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF4FD] flex items-center justify-center shrink-0">
                        <School size={18} className="text-[#0E2E60]" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0F1B2D] text-base leading-snug">{escola.nome}</p>
                        <p className={cn('text-sm mt-0.5', urgent ? 'text-amber-600' : 'text-[#00963A]')}>
                          Última: {text}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/inspecoes/nova?escolaId=${escola.id}`}
                      className="flex items-center justify-center gap-2 w-full bg-[#0E2E60] text-white font-semibold rounded-xl"
                      style={{
                        height: 44,
                        fontSize: 14,
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      } as React.CSSProperties}
                      aria-label={`Inspecionar ${escola.nome}`}
                    >
                      Inspecionar <ChevronRight size={16} />
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Today's inspections */}
        {inspecoesHoje.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-3">
              Hoje
            </h2>
            <div className="bg-white rounded-xl border border-[#D5E3F0] divide-y divide-neutral-100" role="list">
              {inspecoesHoje.map((insp) => (
                <Link
                  key={insp.id}
                  href={insp.status === 'EM_ANDAMENTO' ? `/inspecoes/${insp.id}/responder` : `/inspecoes/${insp.id}`}
                  role="listitem"
                  className="flex items-center gap-3 px-4 py-3 active:bg-[#EEF4FD] transition-colors"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                >
                  {insp.scoreStatus === 'CONFORME' ? (
                    <CheckCircle2 size={18} className="text-[#00963A] shrink-0" aria-hidden="true" />
                  ) : insp.status === 'EM_ANDAMENTO' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1B2D] truncate">{insp.checklist.nome}</p>
                    <p className="text-xs text-[#5A7089]">
                      {insp.escola.nome} · {format(new Date(insp.iniciadaEm), 'HH:mm')}
                    </p>
                  </div>
                  {insp.score !== null && (
                    <span className={cn(
                      'text-sm font-bold shrink-0',
                      insp.scoreStatus === 'CONFORME' ? 'text-[#00963A]' :
                      insp.scoreStatus === 'ATENCAO' ? 'text-amber-500' : 'text-red-600'
                    )}>
                      {Math.round(insp.score)}%
                    </span>
                  )}
                  {insp.status === 'EM_ANDAMENTO' && (
                    <span className="text-xs font-medium text-amber-600 shrink-0">Em andamento</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* History link */}
        <Link
          href="/inspecoes"
          className="flex items-center justify-center gap-2 w-full border border-[#D5E3F0] bg-white text-[#0E2E60] font-semibold rounded-xl"
          style={{
            height: 48,
            fontSize: 14,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <History size={16} /> Ver histórico →
        </Link>
      </div>

      {/* Bottom tab bar */}
      <MobileTabBar />
    </div>
  )
}
