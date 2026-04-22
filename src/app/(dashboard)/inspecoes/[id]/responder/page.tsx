import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { buscarInspecaoParaResponder } from '@/actions/inspecao.actions'
import { ResponderClient } from './ResponderClient'

export default async function ResponderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  const inspecao = await buscarInspecaoParaResponder(id)
  if (!inspecao) notFound()

  if (inspecao.status === 'FINALIZADA') {
    redirect(`/inspecoes/${id}`)
  }
  if (inspecao.status === 'CANCELADA') {
    redirect('/inspecoes')
  }

  return (
    <ResponderClient
      inspecao={inspecao as any}
      usuarioId={user.id}
    />
  )
}
