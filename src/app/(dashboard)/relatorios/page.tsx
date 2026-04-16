import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { RelatoriosClient } from '@/components/relatorios/RelatoriosClient'
import { buscarEscolasDoTenant, buscarDadosRelatorioInspecoes } from '@/actions/relatorios.actions'
import { Lock } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const PAPEIS_PERMITIDOS = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN']

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { supabaseUserId: user.id },
  })

  if (!usuario || !usuario.ativo) redirect('/login')

  if (!PAPEIS_PERMITIDOS.includes(usuario.papel)) {
    return (
      <div className="p-4 md:p-0">
        <PageHeader titulo="Relatórios" subtitulo="Análises e relatórios de conformidade" />
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Lock size={36} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-neutral-900">Acesso restrito</p>
          <p className="text-sm text-neutral-500 mt-1">
            Os relatórios estão disponíveis apenas para nutricionistas e administradores.
          </p>
        </div>
      </div>
    )
  }

  const agora = new Date()
  const inicio = format(startOfMonth(agora), 'yyyy-MM-dd')
  const fim    = format(endOfMonth(agora),   'yyyy-MM-dd')

  const [escolas, kpisMes] = await Promise.all([
    buscarEscolasDoTenant(),
    buscarDadosRelatorioInspecoes({ inicio, fim }),
  ])

  return (
    <div className="p-4 md:p-0 space-y-6">
      <PageHeader
        titulo="Relatórios"
        subtitulo="Análises, exportações PDF e Excel"
      />
      <RelatoriosClient escolas={escolas} kpisMes={kpisMes?.resumo ?? null} />
    </div>
  )
}
