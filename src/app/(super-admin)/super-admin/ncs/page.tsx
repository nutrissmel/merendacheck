import { listarNCsSuperAdmin, listarMunicipiosSuperAdmin } from '@/actions/super-admin.actions'
import { NCsGlobalClient } from '@/components/super-admin/NCsGlobalClient'

export default async function NCsGlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; tenantId?: string; status?: string; severidade?: string }>
}) {
  const sp = await searchParams
  const pagina = Number(sp.pagina ?? 1)

  const [{ ncs, total, totalPaginas }, municipios] = await Promise.all([
    listarNCsSuperAdmin(pagina, 30, {
      tenantId: sp.tenantId,
      status: sp.status,
      severidade: sp.severidade,
    }),
    listarMunicipiosSuperAdmin(),
  ])

  return (
    <NCsGlobalClient
      ncs={ncs as any}
      total={total}
      totalPaginas={totalPaginas}
      paginaAtual={pagina}
      municipios={municipios}
      filtros={{ tenantId: sp.tenantId, status: sp.status, severidade: sp.severidade }}
    />
  )
}
