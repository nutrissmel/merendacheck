import Link from 'next/link'
import { Plus, ClipboardCheck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { listarInspecoes } from '@/actions/inspecao.actions'
import { PageHeader } from '@/components/shared/PageHeader'
import { CATEGORIA_CONFIG } from '@/components/checklists/CategoriaConfig'
import { InspecoesFiltros } from '@/components/inspecoes/InspecoesFiltros'
import { formatarScore } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import prisma from '@/lib/prisma'
import type { StatusInspecao, CategoriaChecklist } from '@prisma/client'

const STATUS_CONFIG: Record<StatusInspecao, { label: string; icon: typeof CheckCircle2; cor: string; bgCor: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', icon: Clock,         cor: 'text-amber-600',    bgCor: 'bg-amber-50'     },
  FINALIZADA:   { label: 'Finalizada',   icon: CheckCircle2,  cor: 'text-green-600',    bgCor: 'bg-green-100'    },
  CANCELADA:    { label: 'Cancelada',    icon: XCircle,       cor: 'text-red-500',      bgCor: 'bg-red-50'       },
}

export default async function InspecoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    escolaId?: string
    categoria?: string
    busca?: string
    dataInicio?: string
    dataFim?: string
    page?: string
  }>
}) {
  const user = await getServerUser()
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)

  const statusFiltro = (params.status && ['EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'].includes(params.status))
    ? (params.status as StatusInspecao)
    : undefined

  // Converte datas — adiciona 23:59:59 no fim para incluir o dia todo
  const dataInicio = params.dataInicio ? new Date(`${params.dataInicio}T00:00:00`) : undefined
  const dataFim    = params.dataFim    ? new Date(`${params.dataFim}T23:59:59`)    : undefined

  const [{ lista, total, paginas }, escolas] = await Promise.all([
    listarInspecoes({
      status: statusFiltro,
      escolaId: params.escolaId || undefined,
      categoria: params.categoria || undefined,
      busca: params.busca || undefined,
      dataInicio,
      dataFim,
      page,
      limit: 20,
    }),
    // Busca escolas ativas do tenant para o dropdown
    prisma.escola.findMany({
      where: { tenantId: user.tenantId, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const podeIniciar = ['SUPER_ADMIN', 'ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'MERENDEIRA'].includes(user.papel)

  // Monta href preservando filtros ativos na paginação
  function pageHref(p: number) {
    const q = new URLSearchParams()
    if (params.status)     q.set('status', params.status)
    if (params.escolaId)   q.set('escolaId', params.escolaId)
    if (params.categoria)  q.set('categoria', params.categoria)
    if (params.busca)      q.set('busca', params.busca)
    if (params.dataInicio) q.set('dataInicio', params.dataInicio)
    if (params.dataFim)    q.set('dataFim', params.dataFim)
    q.set('page', String(p))
    return `?${q.toString()}`
  }

  return (
    <div className="space-y-5 p-4 md:p-0">
      <PageHeader
        titulo="Inspeções"
        subtitulo={`${total} inspeç${total !== 1 ? 'ões' : 'ão'} encontrada${total !== 1 ? 's' : ''}`}
        acoes={
          podeIniciar ? (
            <Link
              href="/inspecoes/nova"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} /> Nova Inspeção
            </Link>
          ) : undefined
        }
      />

      {/* ── Filtro por status ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: undefined,      label: 'Todas'        },
          { value: 'EM_ANDAMENTO', label: 'Em andamento' },
          { value: 'FINALIZADA',   label: 'Finalizadas'  },
          { value: 'CANCELADA',    label: 'Canceladas'   },
        ].map(({ value, label }) => {
          const active = statusFiltro === value
          const q = new URLSearchParams(params as Record<string, string>)
          if (value) q.set('status', value); else q.delete('status')
          q.delete('page')
          return (
            <Link
              key={label}
              href={`?${q.toString()}`}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-800 text-white'
                  : 'border border-neutral-200 text-neutral-500 hover:border-blue-800 hover:text-blue-800'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* ── Filtros avançados ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <InspecoesFiltros escolas={escolas} />
      </div>

      {/* ── Lista ── */}
      {lista.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl py-16 flex flex-col items-center gap-3">
          <ClipboardCheck size={40} className="text-neutral-300" />
          <p className="text-sm text-neutral-400 font-medium">Nenhuma inspeção encontrada</p>
          {podeIniciar && (
            <Link href="/inspecoes/nova" className="text-sm font-semibold text-blue-800 hover:underline">
              Iniciar primeira inspeção →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((inspecao) => {
            const statusInfo = STATUS_CONFIG[inspecao.status]
            const StatusIcon = statusInfo.icon
            const scoreConfig = inspecao.score != null && inspecao.scoreStatus
              ? formatarScore(inspecao.score, inspecao.scoreStatus as any)
              : null
            const catConfig = CATEGORIA_CONFIG[inspecao.checklist.categoria as CategoriaChecklist]

            return (
              <Link
                key={inspecao.id}
                href={inspecao.status === 'EM_ANDAMENTO'
                  ? `/inspecoes/${inspecao.id}/responder`
                  : `/inspecoes/${inspecao.id}`
                }
                className="block bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ borderLeftWidth: 4, borderLeftColor: catConfig?.cor ?? '#D5E3F0' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                        statusInfo.cor, statusInfo.bgCor
                      )}>
                        <StatusIcon size={11} /> {statusInfo.label}
                      </span>
                      {scoreConfig && (
                        <span className={cn('text-xs font-bold', scoreConfig.cor)}>
                          {scoreConfig.valor}
                        </span>
                      )}
                      {inspecao.totalRespostas === 0 && inspecao.status === 'EM_ANDAMENTO' && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                          Não iniciada
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-neutral-900 text-sm">{inspecao.escola.nome}</p>
                    <p className="text-xs text-neutral-500">
                      {inspecao.checklist.nome}
                      {catConfig && <span className="ml-1.5" style={{ color: catConfig.cor }}>· {catConfig.label}</span>}
                    </p>
                    <p className="text-xs text-neutral-500">Inspetor: {inspecao.inspetor.nome}</p>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <p className="text-xs text-neutral-500">
                      {format(new Date(inspecao.iniciadaEm), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {inspecao.totalRespostas} resposta{inspecao.totalRespostas !== 1 ? 's' : ''}
                    </p>
                    {inspecao.status === 'EM_ANDAMENTO' && (
                      <span className="text-xs font-semibold text-blue-800">Continuar →</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Paginação ── */}
      {paginas > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="px-3 h-9 rounded-lg border border-neutral-200 text-sm text-neutral-500 hover:border-blue-800 flex items-center transition-colors">
              ← Anterior
            </Link>
          )}
          {Array.from({ length: paginas }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === paginas)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-neutral-300 text-sm">…</span>
                )}
                <Link
                  href={pageHref(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-blue-800 text-white'
                      : 'border border-neutral-200 text-neutral-500 hover:border-blue-800'
                  )}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < paginas && (
            <Link href={pageHref(page + 1)} className="px-3 h-9 rounded-lg border border-neutral-200 text-sm text-neutral-500 hover:border-blue-800 flex items-center transition-colors">
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
