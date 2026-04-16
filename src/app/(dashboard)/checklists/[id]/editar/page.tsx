import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { buscarChecklistById } from '@/actions/checklist.actions'
import { BuilderClient } from './BuilderClient'

export default async function EditarChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
    redirect(`/checklists/${id}`)
  }

  const checklist = await buscarChecklistById(id)
  if (!checklist) notFound()

  // Templates can be viewed but not edited — redirect to detail
  if (checklist.isTemplate) redirect(`/checklists/${id}`)

  return <BuilderClient checklist={checklist} />
}
