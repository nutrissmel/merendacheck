import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { listarInspecoes } from '@/actions/inspecao.actions'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusInspecao } from '@prisma/client'

function formatGroupLabel(date: Date) {
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

function groupByDate<T extends { iniciadaEm: Date }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const label = formatGroupLabel(new Date(item.iniciadaEm))
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries())
}

const statusIcon: Record<StatusInspecao, typeof CheckCircle2> = {
  FINALIZADA: CheckCircle2,
  EM_ANDAMENTO: Clock,
  CANCELADA: XCircle,
}

const statusColor: Record<StatusInspecao, string> = {
  FINALIZADA: 'text-[#00963A]',
  EM_ANDAMENTO: 'text-amber-500',
  CANCELADA: 'text-neutral-400',
}

export default async function MobileListaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await getServerUser()
  const { page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  const { lista } = await listarInspecoes({ page, limit: 30 })

  const groups = groupByDate(lista)

  const TAP: React.CSSProperties = {
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div className="min-h-screen bg-[#F5F9FD] pb-24">
      {/* Header */}
      <div className="bg-[#0E2E60] flex items-center gap-3 px-4 h-14 sticky top-0 z-10">
        <Link href="/home-mobile" className="text-white/80" aria-label="Voltar" style={TAP}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-white font-bold text-base flex-1 text-center">Histórico</h1>
        <div className="w-8" />
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <CheckCircle2 size={40} className="text-neutral-300 mb-3" />
          <p className="text-neutral-400 font-medium">Nenhuma inspeção realizada ainda.</p>
          <Link
            href="/inspecoes/nova"
            className="mt-4 text-sm font-semibold text-[#0E2E60] underline"
            style={TAP}
          >
            Iniciar primeira inspeção →
          </Link>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-5" role="list">
          {groups.map(([groupLabel, items]) => (
            <section key={groupLabel}>
              <h2 className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-2">
                {groupLabel}
              </h2>
              <div className="bg-white rounded-xl border border-[#D5E3F0] divide-y divide-neutral-100" role="list">
                {items.map((insp) => {
                  const Icon = statusIcon[insp.status]
                  const href = insp.status === 'EM_ANDAMENTO'
                    ? `/inspecoes/${insp.id}/responder`
                    : `/inspecoes/${insp.id}`

                  return (
                    <Link
                      key={insp.id}
                      href={href}
                      role="listitem"
                      className="flex items-center gap-3 px-4 py-3.5 active:bg-[#EEF4FD] transition-colors"
                      style={TAP}
                      aria-label={`Inspeção ${insp.checklist.nome} em ${insp.escola.nome}`}
                    >
                      <Icon
                        size={18}
                        className={cn('shrink-0', statusColor[insp.status])}
                        aria-hidden="true"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F1B2D] truncate">
                          {insp.checklist.nome}
                        </p>
                        <p className="text-xs text-[#5A7089] truncate">
                          {insp.escola.nome} · {format(new Date(insp.iniciadaEm), 'HH:mm')}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {insp.score !== null && insp.scoreStatus ? (
                          <span className={cn(
                            'text-sm font-bold',
                            insp.scoreStatus === 'CONFORME' ? 'text-[#00963A]' :
                            insp.scoreStatus === 'ATENCAO' ? 'text-amber-500' : 'text-red-600'
                          )}>
                            {Math.round(insp.score)}%
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">Em andamento</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Load more */}
          <Link
            href={`?page=${page + 1}`}
            className="flex items-center justify-center w-full border border-[#D5E3F0] bg-white text-[#0E2E60] font-medium rounded-xl text-sm"
            style={{ height: 44, ...TAP }}
          >
            Carregar mais →
          </Link>
        </div>
      )}

      <MobileTabBar />
    </div>
  )
}
