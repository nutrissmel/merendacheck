import { listarMunicipiosSuperAdmin } from '@/actions/super-admin.actions'
import { MunicipiosClient } from '@/components/super-admin/MunicipiosClient'

export default async function MunicipiosPage() {
  const municipios = await listarMunicipiosSuperAdmin()
  return <MunicipiosClient municipios={municipios} />
}
