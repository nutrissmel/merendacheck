import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { buscarInspecaoParaResponder } from '@/actions/inspecao.actions'
import { FinalizarClient } from './FinalizarClient'

export default async function FinalizarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await getServerUser()

  const inspecao = await buscarInspecaoParaResponder(id)
  if (!inspecao) notFound()

  if (inspecao.status !== 'EM_ANDAMENTO') {
    redirect(`/inspecoes/${id}`)
  }

  const itensPendentes = inspecao.checklist.itens.filter((item) => {
    if (!item.obrigatorio) return false
    const resp = inspecao.respostas.find((r) => r.itemId === item.id)
    return !resp || resp.conforme === null
  })

  return (
    <FinalizarClient
      inspecaoId={id}
      escolaNome={inspecao.escola.nome}
      checklistNome={inspecao.checklist.nome}
      totalItens={inspecao.checklist.itens.length}
      totalRespondidos={inspecao.respostas.length}
      itensPendentes={itensPendentes.map((i) => ({ id: i.id, pergunta: i.pergunta }))}
    />
  )
}
