import { listarUsuariosSuperAdmin } from '@/actions/super-admin.actions'
import { UsuariosGlobaisClient } from '@/components/super-admin/UsuariosGlobaisClient'

export default async function UsuariosGlobaisPage() {
  const usuarios = await listarUsuariosSuperAdmin()
  return <UsuariosGlobaisClient usuarios={usuarios as any} />
}
