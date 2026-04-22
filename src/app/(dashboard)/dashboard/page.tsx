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

type SearchParams = Promise<{ periodo?: string; escola?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const periodo = (params.periodo as '7d' | '30d' | '60d' | '90d') ?? '30d'
  const escolaId = params.escola

  // eslint-disable-next-line prefer-const
  let user = {} as Awaited<ReturnType<typeof getServerUser>>
  let escolas: { id: string; nome: string }[] = []
  let tenant: { nome: string; estado: string } | null = null
  let kpis: Awaited<ReturnType<typeof buscarKPIsDashboard>> | null = null
  let conformidadeHistorica: Awaited<ReturnType<typeof buscarConformidadeHistorica>> = []
  let rankingEscolas: Awaited<ReturnType<typeof buscarRankingEscolas>> = []
  let distribuicaoNCs: Awaited<ReturnType<typeof buscarDistribuicaoNCs>> = { porSeveridade: [], porCategoria: [], porEscola: [], evolucao: [] }
  let itensMaisReprovados: Awaited<ReturnType<typeof buscarItensMaisReprovados>> = []

  try {
    user = await getServerUser()
  } catch (e) {
    return <div className="p-8 text-red-600 font-mono text-sm whitespace-pre-wrap">Erro getServerUser: {String(e)}</div>
  }

  try {
    const [escolasData, tenantData] = await Promise.all([
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
    escolas = escolasData
    tenant = tenantData
  } catch (e) {
    return <div className="p-8 text-red-600 font-mono text-sm whitespace-pre-wrap">Erro ao buscar escola/tenant: {String(e)}</div>
  }

  try {
    const [kpisData, conformidadeData, rankingData, distribuicaoData, itensMaisData] =
      await Promise.all([
        buscarKPIsDashboard({ periodo, escolaId }),
        buscarConformidadeHistorica({ periodo, escolaId }),
        buscarRankingEscolas({ periodo: periodo === '60d' ? '30d' : periodo }),
        buscarDistribuicaoNCs({ periodo: periodo === '7d' || periodo === '60d' ? '30d' : (periodo as '30d' | '90d') }),
        buscarItensMaisReprovados({ periodo: periodo === '7d' || periodo === '60d' ? '30d' : (periodo as '30d' | '90d'), escolaId }),
      ])
    kpis = kpisData
    conformidadeHistorica = conformidadeData
    rankingEscolas = rankingData
    distribuicaoNCs = distribuicaoData
    itensMaisReprovados = itensMaisData
  } catch (e) {
    return <div className="p-8 text-red-600 font-mono text-sm whitespace-pre-wrap">Erro nas actions do dashboard: {String(e)}{e instanceof Error && e.stack ? '\n\nStack:\n' + e.stack : ''}</div>
  }

  const podVerEquipe = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        user={user}
        tenant={tenant}
        periodo={periodo}
        escolaId={escolaId}
        escolas={escolas}
      />

      <Suspense fallback={<KPIsSkeleton />}>
        <SecaoKPIs kpis={kpis} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<GraficoConformidadeSkeleton />}>
            <GraficoConformidade dados={conformidadeHistorica} periodo={periodo} />
          </Suspense>
        </div>
        <div>
          <GraficoNCSeveridade
            dadosSeveridade={distribuicaoNCs.porSeveridade}
            dadosCategoria={distribuicaoNCs.porCategoria}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<RankingEscolasSkeleton />}>
          <RankingEscolas escolas={rankingEscolas} />
        </Suspense>
        <Suspense fallback={<HeatmapSkeleton />}>
          <HeatmapInspecoes periodo={periodo === '7d' || periodo === '60d' ? '30d' : (periodo as '30d' | '90d')} escolaId={escolaId} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoEvolucaoNCs dados={distribuicaoNCs.evolucao} />
        <ItensMaisReprovados itens={itensMaisReprovados} totalInspecoes={kpis?.totalInspecoes ?? 0} />
      </div>

      <Suspense fallback={null}>
        <ProximasInspecoes />
      </Suspense>

      {podVerEquipe && (
        <AtividadeEquipe periodo="30d" escolaId={escolaId} />
      )}
    </div>
  )
}
