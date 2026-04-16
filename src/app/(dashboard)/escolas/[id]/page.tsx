import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { buscarEscolaById } from '@/actions/escola.actions'
import {
  verificarAcessoEscolaDetalhes,
  buscarKPIsEscola,
  buscarEvolucaoEscola,
  buscarCalendarioInspecoes,
  buscarComparativoEscolas,
  buscarComparativoChecklists,
  buscarNCsEscola,
  buscarInspecoesEscola,
} from '@/actions/escola-detalhe.actions'
import { EscolaDetalheClient } from '@/components/escolas/EscolaDetalheClient'
import type { PeriodoDetalhes } from '@/actions/escola-detalhe.actions'
import type { ScoreStatus } from '@prisma/client'

type SearchParams = Promise<{ aba?: string; periodo?: string; scoreStatus?: string }>

export default async function EscolaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: SearchParams
}) {
  const { id } = await params
  const sp = await searchParams

  const user = await getServerUser()

  // Verificar acesso (MERENDEIRA/DIRETOR sem vínculo → redirecionar)
  const temAcesso = await verificarAcessoEscolaDetalhes(id)
  if (!temAcesso) {
    if (['MERENDEIRA', 'DIRETOR_ESCOLA'].includes(user.papel)) {
      redirect('/escolas')
    }
    notFound()
  }

  const escola = await buscarEscolaById(id)
  if (!escola) notFound()

  const periodo = (['30d', '60d', '90d'].includes(sp.periodo ?? '') ? sp.periodo : '30d') as PeriodoDetalhes
  const aba = sp.aba ?? 'visao-geral'
  const scoreStatusFiltro = sp.scoreStatus as ScoreStatus | undefined

  const podeEditar = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)
  const podeDesativar = ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)

  // Carregar dados em paralelo baseado na aba ativa
  const [kpis, evolucao, calendario, comparativo, comparativoChecklists, ncs, inspecoes] =
    await Promise.all([
      buscarKPIsEscola(id, periodo),
      aba === 'visao-geral' ? buscarEvolucaoEscola(id, periodo) : Promise.resolve([]),
      aba === 'visao-geral' ? buscarCalendarioInspecoes(id) : Promise.resolve(null),
      aba === 'visao-geral' ? buscarComparativoEscolas(id, periodo) : Promise.resolve(null),
      aba === 'visao-geral' ? buscarComparativoChecklists(id, periodo) : Promise.resolve([]),
      aba === 'nao-conformidades' ? buscarNCsEscola(id) : Promise.resolve([]),
      aba === 'inspecoes' ? buscarInspecoesEscola(id, { periodo, scoreStatus: scoreStatusFiltro }) : Promise.resolve(null),
    ])

  return (
    <EscolaDetalheClient
      escola={escola}
      user={user}
      periodo={periodo}
      abaAtiva={aba}
      podeEditar={podeEditar}
      podeDesativar={podeDesativar}
      kpis={kpis}
      evolucao={evolucao as any[]}
      calendario={calendario as any}
      comparativo={comparativo as any}
      comparativoChecklists={comparativoChecklists as any[]}
      ncs={ncs as any[]}
      inspecoes={inspecoes as any}
    />
  )
}
