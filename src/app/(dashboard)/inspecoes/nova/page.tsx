import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NovaInspecaoClient } from './NovaInspecaoClient'

export default async function NovaInspecaoPage({
  searchParams,
}: {
  searchParams: Promise<{ checklistId?: string; escolaId?: string }>
}) {
  const user = await getServerUser()
  const { checklistId, escolaId } = await searchParams

  // Fetch available schools for the tenant
  const escolas = await prisma.escola.findMany({
    where: { tenantId: user.tenantId, ativa: true },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, cidade: true, bairro: true },
  })

  // Fetch active checklists
  const checklists = await prisma.checklistModelo.findMany({
    where: {
      OR: [{ tenantId: user.tenantId }, { isTemplate: true }],
      ativo: true,
    },
    orderBy: [{ isTemplate: 'asc' }, { nome: 'asc' }],
    select: {
      id: true,
      nome: true,
      categoria: true,
      frequencia: true,
      isTemplate: true,
      _count: { select: { itens: true } },
    },
  })

  if (escolas.length === 0) {
    redirect('/escolas?avisoSemEscola=1')
  }

  return (
    <NovaInspecaoClient
      escolas={escolas}
      checklists={checklists.map((c) => ({
        id: c.id,
        nome: c.nome,
        categoria: c.categoria,
        frequencia: c.frequencia,
        isTemplate: c.isTemplate,
        totalItens: c._count.itens,
      }))}
      escolaIdInicial={escolaId}
      checklistIdInicial={checklistId}
    />
  )
}
