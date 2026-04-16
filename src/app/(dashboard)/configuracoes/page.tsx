import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { buscarDadosTenantAction } from '@/actions/configuracoes.actions'
import { buscarUsuariosParaAnonimizarAction } from '@/actions/lgpd.actions'
import { listarUsuariosAuditoriaAction, listarAcoesUnicasAction } from '@/actions/auditoria.actions'
import { buscarAuditoria } from '@/lib/auditoria'
import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) {
    redirect('/dashboard')
  }

  const [tenant, usuariosLGPD, usuariosAuditoria, acoesUnicas, logAcessos] = await Promise.all([
    buscarDadosTenantAction(),
    buscarUsuariosParaAnonimizarAction(),
    listarUsuariosAuditoriaAction(),
    listarAcoesUnicasAction(),
    buscarAuditoria(user.tenantId, 5),
  ])

  // Dados do usuário atual para 2FA
  const usuario2FAAtivo = (user as any).doisFatoresAtivo ?? false

  return (
    <ConfiguracoesClient
      tenant={tenant}
      usuario2FAAtivo={usuario2FAAtivo}
      usuariosLGPD={usuariosLGPD}
      usuariosAuditoria={usuariosAuditoria}
      acoesUnicas={acoesUnicas}
      logAcessos={logAcessos.map((l: any) => ({
        acao: l.acao,
        ip: l.ip,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
      }))}
      nomeTenant={tenant.nome}
    />
  )
}
