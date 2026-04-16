import { buscarAuditoriaGlobalAction } from '@/actions/super-admin.actions'
import { AuditoriaGlobalClient } from '@/components/super-admin/AuditoriaGlobalClient'

export default async function AuditoriaGlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const { pagina } = await searchParams
  const paginaNum = Number(pagina ?? 1)
  const data = await buscarAuditoriaGlobalAction(paginaNum, 30)

  return <AuditoriaGlobalClient {...data} paginaAtual={paginaNum} />
}
