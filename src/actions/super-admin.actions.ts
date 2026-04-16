'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { registrarAuditoria } from '@/lib/auditoria'

// ─── Guard ────────────────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const user = await getServerUser()
  if (user.papel !== 'SUPER_ADMIN') throw new Error('Acesso restrito ao Super Admin')
  return user
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function buscarOverviewSuperAdmin() {
  await requireSuperAdmin()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [
    totalMunicipios,
    totalUsuarios,
    totalInspecoes,
    totalNCs,
    inspecoesMes,
    ncsCriticas,
    municipiosAtivos,
    municipios,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.usuario.count(),
    prisma.inspecao.count(),
    prisma.naoConformidade.count({ where: { status: { notIn: ['RESOLVIDA'] } } }),
    prisma.inspecao.count({ where: { iniciadaEm: { gte: inicioMes } } }),
    prisma.naoConformidade.count({ where: { severidade: 'CRITICA', status: { notIn: ['RESOLVIDA'] } } }),
    prisma.tenant.count({ where: { ativo: true } }),
    prisma.tenant.findMany({
      select: {
        id: true, nome: true, estado: true, plano: true,
        planoStatus: true, ativo: true, createdAt: true,
        _count: { select: { usuarios: true, escolas: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    totalMunicipios, totalUsuarios, totalInspecoes, totalNCs,
    inspecoesMes, ncsCriticas, municipiosAtivos,
    municipiosRecentes: municipios,
  }
}

// ─── Municípios ───────────────────────────────────────────────────────────────

export async function listarMunicipiosSuperAdmin() {
  await requireSuperAdmin()

  return prisma.tenant.findMany({
    select: {
      id: true, nome: true, estado: true, codigoIbge: true,
      plano: true, planoStatus: true, ativo: true,
      createdAt: true, trialExpiresAt: true,
      _count: { select: { usuarios: true, escolas: true } },
    },
    orderBy: { nome: 'asc' },
  })
}

export async function criarMunicipioAction(data: {
  nome: string; estado: string; codigoIbge: string
  nomeSecretaria?: string; emailInstitucional?: string; plano?: string
}): Promise<{ sucesso: true; id: string } | { sucesso: false; erro: string }> {
  try {
    const user = await requireSuperAdmin()
    const tenant = await prisma.tenant.create({
      data: {
        nome: data.nome, estado: data.estado, codigoIbge: data.codigoIbge,
        nomeSecretaria: data.nomeSecretaria ?? null,
        emailInstitucional: data.emailInstitucional ?? null,
        plano: (data.plano as any) ?? 'MUNICIPAL',
        trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    revalidatePath('/super-admin')
    return { sucesso: true, id: tenant.id }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao criar município' }
  }
}

export async function toggleMunicipioAction(tenantId: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { sucesso: false, erro: 'Município não encontrado' }
    await prisma.tenant.update({ where: { id: tenantId }, data: { ativo: !tenant.ativo } })
    revalidatePath('/super-admin/municipios')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro' }
  }
}

export async function alterarPlanoMunicipioAction(
  tenantId: string, plano: string, status: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plano: plano as any,
        planoStatus: status as any,
        trialExpiresAt: status === 'TRIAL' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    })
    revalidatePath('/super-admin/municipios')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro' }
  }
}

export async function buscarStatsMunicipioAction(tenantId: string) {
  await requireSuperAdmin()
  const [usuarios, escolas, inspecoes, ncs, logs] = await Promise.all([
    prisma.usuario.count({ where: { tenantId } }),
    prisma.escola.count({ where: { tenantId } }),
    prisma.inspecao.count({ where: { tenantId } }),
    prisma.naoConformidade.count({ where: { tenantId, status: { notIn: ['RESOLVIDA'] } } }),
    prisma.logAuditoria.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { acao: true, createdAt: true, usuario: { select: { nome: true } } },
    }),
  ])
  return { usuarios, escolas, inspecoes, ncs, ultimosLogs: logs }
}

// ─── Usuários globais ─────────────────────────────────────────────────────────

export async function listarUsuariosSuperAdmin() {
  await requireSuperAdmin()
  return prisma.usuario.findMany({
    select: {
      id: true, nome: true, email: true, papel: true,
      ativo: true, primeiroAcesso: true, createdAt: true,
      tenant: { select: { id: true, nome: true, estado: true } },
    },
    orderBy: [{ papel: 'asc' }, { nome: 'asc' }],
  })
}

export async function criarSuperAdminAction(data: {
  nome: string; email: string; senha: string
}): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const me = await requireSuperAdmin()
    const supabase = getSupabaseAdmin()
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email, password: data.senha, email_confirm: true,
    })
    if (error) return { sucesso: false, erro: error.message }
    await prisma.usuario.create({
      data: {
        tenantId: me.tenantId,
        supabaseUserId: authData.user.id,
        nome: data.nome, email: data.email,
        papel: 'SUPER_ADMIN', primeiroAcesso: false, ativo: true,
      },
    })
    revalidatePath('/super-admin/usuarios')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao criar super admin' }
  }
}

export async function toggleUsuarioGlobalAction(usuarioId: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) return { sucesso: false, erro: 'Usuário não encontrado' }
    if (usuario.papel === 'SUPER_ADMIN') return { sucesso: false, erro: 'Não é possível desativar um Super Admin' }
    await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: !usuario.ativo } })
    revalidatePath('/super-admin/usuarios')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro' }
  }
}

// ─── Inspeções global ─────────────────────────────────────────────────────────

export async function listarInspecoesSuperAdmin(pagina = 1, limite = 30, filtros?: {
  tenantId?: string; status?: string; scoreStatus?: string
}) {
  await requireSuperAdmin()
  const skip = (pagina - 1) * limite
  const where: any = {}
  if (filtros?.tenantId) where.tenantId = filtros.tenantId
  if (filtros?.status) where.status = filtros.status
  if (filtros?.scoreStatus) where.scoreStatus = filtros.scoreStatus

  const [inspecoes, total] = await Promise.all([
    prisma.inspecao.findMany({
      where,
      orderBy: { iniciadaEm: 'desc' },
      take: limite,
      skip,
      select: {
        id: true, status: true, score: true, scoreStatus: true,
        iniciadaEm: true, finalizadaEm: true, tenantId: true,
        escola: { select: { nome: true, tenant: { select: { nome: true, estado: true } } } },
        checklist: { select: { nome: true, categoria: true } },
        inspetor: { select: { nome: true } },
        _count: { select: { naoConformidades: true } },
      },
    }),
    prisma.inspecao.count({ where }),
  ])

  return { inspecoes, total, totalPaginas: Math.ceil(total / limite) }
}

// ─── Não Conformidades global ─────────────────────────────────────────────────

export async function listarNCsSuperAdmin(pagina = 1, limite = 30, filtros?: {
  tenantId?: string; status?: string; severidade?: string
}) {
  await requireSuperAdmin()
  const skip = (pagina - 1) * limite
  const where: any = {}
  if (filtros?.tenantId) where.tenantId = filtros.tenantId
  if (filtros?.status) where.status = filtros.status
  if (filtros?.severidade) where.severidade = filtros.severidade

  const [ncs, total] = await Promise.all([
    prisma.naoConformidade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite,
      skip,
      select: {
        id: true, titulo: true, severidade: true, status: true,
        prazoResolucao: true, createdAt: true, tenantId: true,
        inspecao: {
          select: {
            escola: { select: { nome: true, tenant: { select: { nome: true, estado: true } } } },
            inspetor: { select: { nome: true } },
          },
        },
        _count: { select: { acoes: true } },
      },
    }),
    prisma.naoConformidade.count({ where }),
  ])

  return { ncs, total, totalPaginas: Math.ceil(total / limite) }
}

// ─── Planos & Billing ─────────────────────────────────────────────────────────

export async function buscarDadosBillingSuperAdmin() {
  await requireSuperAdmin()

  const [porPlano, porStatus, trials, inadimplentes] = await Promise.all([
    prisma.tenant.groupBy({ by: ['plano'], _count: true }),
    prisma.tenant.groupBy({ by: ['planoStatus'], _count: true }),
    prisma.tenant.findMany({
      where: { planoStatus: 'TRIAL' },
      select: { id: true, nome: true, estado: true, trialExpiresAt: true, plano: true, _count: { select: { usuarios: true } } },
      orderBy: { trialExpiresAt: 'asc' },
    }),
    prisma.tenant.findMany({
      where: { planoStatus: 'INADIMPLENTE' },
      select: { id: true, nome: true, estado: true, plano: true, _count: { select: { usuarios: true } } },
    }),
  ])

  return { porPlano, porStatus, trials, inadimplentes }
}

export async function estenderTrialAction(
  tenantId: string, dias: number,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        trialExpiresAt: new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
        planoStatus: 'TRIAL',
      },
    })
    revalidatePath('/super-admin/billing')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message }
  }
}

export async function ativarPlanoAction(
  tenantId: string, plano: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plano: plano as any, planoStatus: 'ATIVO', trialExpiresAt: null },
    })
    revalidatePath('/super-admin/billing')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message }
  }
}

// ─── Configurações globais ─────────────────────────────────────────────────────

export async function buscarConfigsGlobaisAction() {
  await requireSuperAdmin()
  // Retorna estatísticas do sistema + configurações relevantes
  const [totalTenants, totalUsuarios, totalInspecoes, versaoSchema] = await Promise.all([
    prisma.tenant.count(),
    prisma.usuario.count(),
    prisma.inspecao.count(),
    Promise.resolve('2.0.0'),
  ])
  return { totalTenants, totalUsuarios, totalInspecoes, versaoSchema }
}

export async function resetarSenhaUsuarioAction(
  usuarioId: string, novaSenha: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await requireSuperAdmin()
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) return { sucesso: false, erro: 'Usuário não encontrado' }
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.updateUserById(
      usuario.supabaseUserId, { password: novaSenha }
    )
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message }
  }
}

// ─── Audit log global ─────────────────────────────────────────────────────────

export async function buscarAuditoriaGlobalAction(pagina = 1, limite = 30) {
  await requireSuperAdmin()
  const skip = (pagina - 1) * limite
  const [rawLogs, total] = await Promise.all([
    prisma.logAuditoria.findMany({
      orderBy: { createdAt: 'desc' },
      take: limite,
      skip,
      select: {
        id: true, acao: true, createdAt: true,
        ip: true, alvoTipo: true, alvoNome: true,
        tenantId: true, usuarioId: true,
      },
    }),
    prisma.logAuditoria.count(),
  ])

  const tenantIds = [...new Set(rawLogs.map((l) => l.tenantId).filter(Boolean))] as string[]
  const usuarioIds = [...new Set(rawLogs.map((l) => l.usuarioId).filter(Boolean))] as string[]

  const [tenants, usuarios] = await Promise.all([
    tenantIds.length
      ? prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, nome: true, estado: true } })
      : [],
    usuarioIds.length
      ? prisma.usuario.findMany({ where: { id: { in: usuarioIds } }, select: { id: true, nome: true, email: true, papel: true } })
      : [],
  ])

  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t]))
  const usuarioMap = Object.fromEntries(usuarios.map((u) => [u.id, u]))

  const logs = rawLogs.map((l) => ({
    ...l,
    tenant: l.tenantId ? (tenantMap[l.tenantId] ?? null) : null,
    usuario: l.usuarioId ? (usuarioMap[l.usuarioId] ?? null) : null,
  }))

  return { logs, total, totalPaginas: Math.ceil(total / limite) }
}
