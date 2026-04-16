import { Suspense } from 'react'
import { getServerUser } from '@/lib/auth'
import { listarEscolas } from '@/actions/escola.actions'
import { podeAdicionarEscola } from '@/lib/plano'
import { PageHeader } from '@/components/shared/PageHeader'
import { EscolaListaClient } from '@/components/escolas/EscolaListaClient'
import { EscolaCardSkeleton } from '@/components/shared/LoadingSkeleton'

import type { Turno } from '@prisma/client'

interface SearchParams {
  busca?: string
  turno?: string
  status?: string
  ordem?: string
}

async function EscolaLista({ searchParams }: { searchParams: SearchParams }) {
  const user = await getServerUser()

  const ativa =
    searchParams.status === 'inativa' ? false
    : searchParams.status === 'todas' ? undefined
    : true

  const turno =
    searchParams.turno && searchParams.turno !== 'todos'
      ? (searchParams.turno as Turno)
      : undefined

  const ordenarPor =
    searchParams.ordem === 'score' || searchParams.ordem === 'ultimaInspecao'
      ? (searchParams.ordem as 'score' | 'ultimaInspecao')
      : 'nome'

  const [escolas, { pode: podeAdicionar }] = await Promise.all([
    listarEscolas({ busca: searchParams.busca, turno, ativa, ordenarPor }),
    podeAdicionarEscola(user.tenantId),
  ])

  const podeEditar = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)
  const podeDesativar = ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)

  return (
    <EscolaListaClient
      escolas={escolas}
      podeEditar={podeEditar}
      podeDesativar={podeDesativar}
      podeAdicionarEscola={podeAdicionar && podeEditar}
    />
  )
}

export default async function EscolasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <div className="space-y-0 max-w-7xl mx-auto">
      <PageHeader
        titulo="Escolas"
        subtitulo="Gerencie as escolas do município"
      />
      <Suspense fallback={<EscolaCardSkeleton />}>
        <EscolaLista searchParams={params} />
      </Suspense>
    </div>
  )
}
