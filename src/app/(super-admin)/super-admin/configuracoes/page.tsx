import { buscarConfigsGlobaisAction, listarUsuariosSuperAdmin } from '@/actions/super-admin.actions'
import { ConfiguracoesGlobaisClient } from '@/components/super-admin/ConfiguracoesGlobaisClient'

export default async function ConfiguracoesGlobaisPage() {
  const [config, usuarios] = await Promise.all([
    buscarConfigsGlobaisAction(),
    listarUsuariosSuperAdmin(),
  ])
  const superAdmins = usuarios.filter((u) => u.papel === 'SUPER_ADMIN')
  return <ConfiguracoesGlobaisClient config={config} superAdmins={superAdmins as any} />
}
