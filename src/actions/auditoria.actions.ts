'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LogAuditoriaCompleto {
  id: string
  usuarioId: string
  usuarioNome: string | null
  usuarioEmail: string | null
  acao: string
  alvoId: string | null
  alvoTipo: string | null
  alvoNome: string | null
  detalhes: Record<string, unknown> | null
  ip: string | null
  userAgent: string | null
  createdAt: Date
}

// ─── Listar logs de auditoria ─────────────────────────────────────────────────

export async function listarAuditoriaAction(filtros?: {
  usuarioId?: string
  acao?: string
  dataInicio?: Date
  dataFim?: Date
  pagina?: number
}): Promise<{
  logs: LogAuditoriaCompleto[]
  total: number
  paginas: number
}> {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) {
    return { logs: [], total: 0, paginas: 0 }
  }

  const porPagina = 20
  const pagina = filtros?.pagina ?? 1
  const skip = (pagina - 1) * porPagina

  const where: any = { tenantId: user.tenantId }

  if (filtros?.usuarioId) where.usuarioId = filtros.usuarioId
  if (filtros?.acao) where.acao = filtros.acao
  if (filtros?.dataInicio || filtros?.dataFim) {
    where.createdAt = {}
    if (filtros?.dataInicio) where.createdAt.gte = filtros.dataInicio
    if (filtros?.dataFim) where.createdAt.lte = filtros.dataFim
  }

  const [logs, total] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: porPagina,
    }),
    prisma.logAuditoria.count({ where }),
  ])

  // Buscar dados dos usuários separadamente
  const usuarioIds = [...new Set(logs.map((l) => l.usuarioId).filter(Boolean))]
  const usuarios = usuarioIds.length
    ? await prisma.usuario.findMany({
        where: { id: { in: usuarioIds } },
        select: { id: true, nome: true, email: true },
      })
    : []

  const usuarioMap = new Map(usuarios.map((u) => [u.id, u]))

  return {
    logs: logs.map((l) => {
      const u = usuarioMap.get(l.usuarioId)
      return {
        id: l.id,
        usuarioId: l.usuarioId,
        usuarioNome: u?.nome ?? null,
        usuarioEmail: u?.email ?? null,
        acao: l.acao,
        alvoId: l.alvoId,
        alvoTipo: l.alvoTipo,
        alvoNome: l.alvoNome,
        detalhes: l.detalhes as Record<string, unknown> | null,
        ip: l.ip,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
      }
    }),
    total,
    paginas: Math.ceil(total / porPagina),
  }
}

// ─── Listar usuários do tenant (para filtro) ──────────────────────────────────

export async function listarUsuariosAuditoriaAction() {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) return []

  return prisma.usuario.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: 'asc' },
  })
}

// ─── Listar ações únicas do tenant (para filtro) ──────────────────────────────

export async function listarAcoesUnicasAction(): Promise<string[]> {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) return []

  const resultado = await prisma.logAuditoria.findMany({
    where: { tenantId: user.tenantId },
    select: { acao: true },
    distinct: ['acao'],
    orderBy: { acao: 'asc' },
  })

  return resultado.map((r) => r.acao)
}
