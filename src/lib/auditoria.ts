import prisma from '@/lib/prisma'

// ─── Tipos de ação ────────────────────────────────────────────────────────────

export type AcaoAuditoria =
  // Usuários
  | 'LOGIN_REALIZADO' | 'LOGIN_FALHOU' | 'LOGOUT_REALIZADO'
  | 'SENHA_ALTERADA' | 'SENHA_REDEFINIDA'
  | 'USUARIO_CRIADO' | 'USUARIO_DESATIVADO' | 'USUARIO_REATIVADO'
  | 'PAPEL_ALTERADO' | 'ESCOLAS_USUARIO_ALTERADAS'
  // Conteúdo
  | 'ESCOLA_CRIADA' | 'ESCOLA_ATUALIZADA' | 'ESCOLA_DESATIVADA'
  | 'CHECKLIST_CRIADO' | 'CHECKLIST_ATUALIZADO' | 'CHECKLIST_DESATIVADO'
  | 'INSPECAO_INICIADA' | 'INSPECAO_FINALIZADA' | 'INSPECAO_CANCELADA'
  // Conformidade
  | 'NC_GERADA' | 'NC_RESOLVIDA' | 'NC_REABERTA' | 'NC_VENCIDA'
  | 'ACAO_CRIADA' | 'ACAO_CONCLUIDA'
  // Admin
  | 'CONVITE_ENVIADO' | 'CONVITE_ACEITO' | 'CONVITE_REVOGADO'
  | 'CONFIGURACOES_ALTERADAS' | 'LOGO_ATUALIZADO'
  // Billing
  | 'ASSINATURA_ATIVADA' | 'ASSINATURA_CANCELADA' | 'PLANO_ALTERADO'
  | 'PAGAMENTO_FALHOU' | 'PAGAMENTO_RECEBIDO'
  // LGPD
  | 'DADOS_EXPORTADOS' | 'USUARIO_ANONIMIZADO' | 'EXCLUSAO_SOLICITADA'
  // Sistema
  | 'RELATORIO_GERADO' | 'AGENDAMENTO_CRIADO' | 'AGENDAMENTO_REMOVIDO'
  | '2FA_ATIVADO' | '2FA_DESATIVADO'
  | 'API_KEY_GERADA' | 'WEBHOOK_CONFIGURADO'

// ─── Registrar auditoria ──────────────────────────────────────────────────────

interface RegistrarAuditoriaParams {
  tenantId: string
  usuarioId: string
  acao: AcaoAuditoria | string
  alvoId?: string
  alvoTipo?: string
  alvoNome?: string
  detalhes?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

/**
 * Registra uma entrada no log de auditoria.
 * Falha silenciosamente para não impactar o fluxo principal.
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<void> {
  try {
    await prisma.logAuditoria.create({
      data: {
        tenantId: params.tenantId,
        usuarioId: params.usuarioId,
        acao: params.acao,
        alvoId: params.alvoId,
        alvoTipo: params.alvoTipo,
        alvoNome: params.alvoNome,
        detalhes: params.detalhes as any ?? undefined,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    })
  } catch {
    // Silently ignore audit failures
  }
}

// ─── Buscar auditoria (uso interno) ──────────────────────────────────────────

export async function buscarAuditoria(tenantId: string, limite = 50) {
  try {
    return await prisma.logAuditoria.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limite,
    })
  } catch {
    return []
  }
}
