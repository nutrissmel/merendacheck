import { listarInspecoesSuperAdmin, listarMunicipiosSuperAdmin } from '@/actions/super-admin.actions'
import { InspecoesGlobalClient } from '@/components/super-admin/InspecoesGlobalClient'

export default async function InspecoesGlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; tenantId?: string; status?: string; scoreStatus?: string }>
}) {
  const sp = await searchParams
  const pagina = Number(sp.pagina ?? 1)

  const [{ inspecoes, total, totalPaginas }, municipios] = await Promise.all([
    listarInspecoesSuperAdmin(pagina, 30, {
      tenantId: sp.tenantId,
      status: sp.status,
      scoreStatus: sp.scoreStatus,
    }),
    listarMunicipiosSuperAdmin(),
  ])

  return (
    <InspecoesGlobalClient
      inspecoes={inspecoes as any}
      total={total}
      totalPaginas={totalPaginas}
      paginaAtual={pagina}
      municipios={municipios}
      filtros={{ tenantId: sp.tenantId, status: sp.status, scoreStatus: sp.scoreStatus }}
    />
  )
}
