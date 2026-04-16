import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { AgendamentosClient } from '@/components/agendamentos/AgendamentosClient'
import { listarAgendamentos, buscarEscolasEChecklists } from '@/actions/agendamentos.actions'

const PODE_EDITAR = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN']

export default async function AgendamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!usuario || !usuario.ativo) redirect('/login')

  const [agendamentos, { escolas, checklists }] = await Promise.all([
    listarAgendamentos(),
    buscarEscolasEChecklists(),
  ])

  const podeEditar = PODE_EDITAR.includes(usuario.papel)

  return (
    <div>
      <PageHeader
        titulo="Agendamentos"
        subtitulo="Programe inspeções recorrentes nas escolas"
      />
      <AgendamentosClient
        agendamentos={agendamentos}
        escolas={escolas}
        checklists={checklists}
        podeEditar={podeEditar}
      />
    </div>
  )
}
