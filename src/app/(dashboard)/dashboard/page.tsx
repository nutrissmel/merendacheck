import { Suspense } from 'react'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  buscarKPIsDashboard,
  buscarConformidadeHistorica,
  buscarRankingEscolas,
  buscarDistribuicaoNCs,
  buscarItensMaisReprovados,
} from '@/actions/dashboard.actions'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { SecaoKPIs } from '@/components/dashboard/SecaoKPIs'
import { GraficoConformidade } from '@/components/dashboard/GraficoConformidade'
import { GraficoNCSeveridade } from '@/components/dashboard/GraficoNCSeveridade'
import { RankingEscolas } from '@/components/dashboard/RankingEscolas'
import { GraficoEvolucaoNCs } from '@/components/dashboard/GraficoEvolucaoNCs'
import { ItensMaisReprovados } from '@/components/dashboard/ItensMaisReprovados'
import { AtividadeEquipe } from '@/components/dashboard/AtividadeEquipe'
import { HeatmapInspecoes } from '@/components/dashboard/HeatmapInspecoes'
import { ProximasInspecoes } from '@/components/dashboard/ProximasInspecoes'
import {
  KPIsSkeleton,
  GraficoConformidadeSkeleton,
  HeatmapSkeleton,
  RankingEscolasSkeleton,
} from '@/components/dashboard/DashboardSkeleton'

type Periodo = '7d' | '30d' | '60d' | '90d'
type PeriodoNCs = '30d' | '90d'
type PeriodoRanking = '7d' | '30d' | '90d'

function normNC(p: Periodo): PeriodoNCs { return (p === '7d' || p === '60d') ? '30d' : p as PeriodoNCs }
function normRanking(p: Periodo): PeriodoRanking { return p === '60d' ? '30d' : p as PeriodoRanking }

// ─── Async Section Components — cada um faz seu próprio fetch ──
// O Next.js renderiza o shell imediatamente e streama cada seção à medida que resolve.

async function SectionKPIs({ periodo, escolaId }: { periodo: Periodo; escolaId?: string }) {
  const kpis = await buscarKPIsDashboard({ periodo, escolaId })
  return <SecaoKPIs kpis={kpis} />
}

async function SectionConformidade({ periodo, escolaId }: { periodo: Periodo; escolaId?: string }) {
  const dados = await buscarConformidadeHistorica({ periodo, escolaId })
  return <GraficoConformidade dados={dados} periodo={periodo} />
}

async function SectionNCSeveridade({ periodo, escolaId }: { periodo: PeriodoNCs; escolaId?: string }) {
  const dados = await buscarDistribuicaoNCs({ periodo, escolaId })
  return <GraficoNCSeveridade dadosSeveridade={dados.porSeveridade} dadosCategoria={dados.porCategoria} />
}

async function SectionRanking({ periodo }: { periodo: PeriodoRanking }) {
  const escolas = await buscarRankingEscolas({ periodo })
  return <RankingEscolas escolas={escolas} />
}

async function SectionEvolucaoItensMais({ periodo, escolaId, podVerKPIs }: {
  periodo: PeriodoNCs
  escolaId?: string
  podVerKPIs: boolean
}) {
  const [distribuicao, itensMais] = await Promise.all([
    buscarDistribuicaoNCs({ periodo, escolaId }),
    buscarItensMaisReprovados({ periodo, escolaId }),
  ])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GraficoEvolucaoNCs dados={distribuicao.evolucao} />
      <ItensMaisReprovados itens={itensMais} totalInspecoes={itensMais.reduce((s, i) => s + i.totalReprovacoes, 0)} />
    </div>
  )
}

const CardSkeleton = () => (
  <div className="bg-white border border-[#D5E3F0] rounded-xl h-72 animate-pulse" />
)

// ─── Page ─────────────────────────────────────────────────────

type SearchParams = Promise<{ periodo?: string; escola?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const periodo = (params.periodo as Periodo) ?? '30d'
  const escolaId = params.escola

  // Somente queries leves aqui — shell renderiza em ~100ms
  const user = await getServerUser()
  const [escolas, tenant] = await Promise.all([
    prisma.escola.findMany({
      where: { tenantId: user.tenantId, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { nome: true, estado: true },
    }),
  ])

  const podVerEquipe = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)
  const periodoNCs = normNC(periodo)
  const periodoRanking = normRanking(periodo)

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      <DashboardHeader
        user={user}
        tenant={tenant}
        periodo={periodo}
        escolaId={escolaId}
        escolas={escolas}
      />

      {/* KPIs — stream assim que resolver */}
      <Suspense fallback={<KPIsSkeleton />}>
        <SectionKPIs periodo={periodo} escolaId={escolaId} />
      </Suspense>

      {/* Gráfico de conformidade + NC por severidade — stream em paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<GraficoConformidadeSkeleton />}>
            <SectionConformidade periodo={periodo} escolaId={escolaId} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<CardSkeleton />}>
            <SectionNCSeveridade periodo={periodoNCs} escolaId={escolaId} />
          </Suspense>
        </div>
      </div>

      {/* Ranking + Heatmap — stream em paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<RankingEscolasSkeleton />}>
          <SectionRanking periodo={periodoRanking} />
        </Suspense>
        <Suspense fallback={<HeatmapSkeleton />}>
          <HeatmapInspecoes periodo={periodoNCs} escolaId={escolaId} />
        </Suspense>
      </div>

      {/* Evolução NCs + Itens mais reprovados — compartilham um fetch */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton /><CardSkeleton />
        </div>
      }>
        <SectionEvolucaoItensMais periodo={periodoNCs} escolaId={escolaId} podVerKPIs={podVerEquipe} />
      </Suspense>

      <Suspense fallback={null}>
        <ProximasInspecoes />
      </Suspense>

      {podVerEquipe && (
        <Suspense fallback={<CardSkeleton />}>
          <AtividadeEquipe periodo="30d" escolaId={escolaId} />
        </Suspense>
      )}
    </div>
  )
}
