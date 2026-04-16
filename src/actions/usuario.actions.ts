'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerUser, requirePapel } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/auditoria'
import type { Papel } from '@prisma/client'
import type { UsuarioComMetricas, UsuarioDetalhado } from '@/types/usuario'
import type { ScoreStatus } from '@prisma/client'

const nomeSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100),
})

const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Inclua pelo menos um número'),
    confirmarNovaSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarNovaSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarNovaSenha'],
  })

// ─── LISTAR ───────────────────────────────────────────────────

export async function listarUsuarios(filtros?: {
  busca?: string
  papel?: Papel
  ativo?: boolean
  escolaId?: string
  ordenarPor?: 'nome' | 'papel' | 'inspecoes'
}): Promise<UsuarioComMetricas[]> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN', 'NUTRICIONISTA'])

  const usuarios = await prisma.usuario.findMany({
    where: {
      tenantId: user.tenantId,
      ...(filtros?.ativo !== undefined ? { ativo: filtros.ativo } : {}),
      ...(filtros?.papel ? { papel: filtros.papel } : {}),
      ...(filtros?.busca
        ? {
            OR: [
              { nome: { contains: filtros.busca, mode: 'insensitive' } },
              { email: { contains: filtros.busca, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filtros?.escolaId
        ? { escolas: { some: { escolaId: filtros.escolaId } } }
        : {}),
    },
    include: {
      escolas: { include: { escola: { select: { id: true, nome: true } } } },
    },
    orderBy: { nome: 'asc' },
  })

  const usuarioIds = usuarios.map((u) => u.id)
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [totalPorUsuario, mesPorUsuario, ultimaPorUsuario] = await Promise.all([
    prisma.inspecao.groupBy({
      by: ['inspetorId'],
      where: { inspetorId: { in: usuarioIds } },
      _count: true,
    }),
    prisma.inspecao.groupBy({
      by: ['inspetorId'],
      where: { inspetorId: { in: usuarioIds }, iniciadaEm: { gte: inicioMes } },
      _count: true,
    }),
    prisma.inspecao.findMany({
      where: { inspetorId: { in: usuarioIds } },
      orderBy: { iniciadaEm: 'desc' },
      distinct: ['inspetorId'],
      select: { inspetorId: true, iniciadaEm: true },
    }),
  ])

  const totalMap = new Map(totalPorUsuario.map((r) => [r.inspetorId, r._count]))
  const mesMap = new Map(mesPorUsuario.map((r) => [r.inspetorId, r._count]))
  const ultimaMap = new Map(ultimaPorUsuario.map((r) => [r.inspetorId, r.iniciadaEm]))

  let resultado: UsuarioComMetricas[] = usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    ativo: u.ativo,
    primeiroAcesso: u.primeiroAcesso,
    createdAt: u.createdAt,
    escolas: u.escolas.map((ue) => ({ id: ue.escola.id, nome: ue.escola.nome })),
    totalInspecoes: totalMap.get(u.id) ?? 0,
    inspecoesMes: mesMap.get(u.id) ?? 0,
    ultimaInspecao: ultimaMap.get(u.id) ?? null,
  }))

  if (filtros?.ordenarPor === 'inspecoes') {
    resultado.sort((a, b) => b.inspecoesMes - a.inspecoesMes)
  } else if (filtros?.ordenarPor === 'papel') {
    resultado.sort((a, b) => a.papel.localeCompare(b.papel))
  }

  return resultado
}

// ─── BUSCAR POR ID ────────────────────────────────────────────

export async function buscarUsuarioById(usuarioId: string): Promise<UsuarioDetalhado | null> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN', 'NUTRICIONISTA'])

  const u = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
    include: {
      escolas: { include: { escola: { select: { id: true, nome: true } } } },
      inspecoesRealizadas: {
        orderBy: { iniciadaEm: 'desc' },
        take: 5,
        include: { checklist: { select: { nome: true, categoria: true } } },
      },
    },
  })

  if (!u) return null

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [total, mes, scoreData, ncs] = await Promise.all([
    prisma.inspecao.count({ where: { inspetorId: usuarioId } }),
    prisma.inspecao.count({ where: { inspetorId: usuarioId, iniciadaEm: { gte: inicioMes } } }),
    prisma.inspecao.aggregate({
      where: { inspetorId: usuarioId, status: 'FINALIZADA', score: { not: null } },
      _avg: { score: true },
    }),
    prisma.naoConformidade.count({ where: { tenantId: user.tenantId, inspecao: { inspetorId: usuarioId } } }),
  ])

  const ultimaInspecao = u.inspecoesRealizadas[0]?.iniciadaEm ?? null

  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    ativo: u.ativo,
    primeiroAcesso: u.primeiroAcesso,
    createdAt: u.createdAt,
    escolas: u.escolas.map((ue) => ({ id: ue.escola.id, nome: ue.escola.nome })),
    totalInspecoes: total,
    inspecoesMes: mes,
    ultimaInspecao,
    mediascore: scoreData._avg.score,
    ncsGeradas: ncs,
    inspecoesRecentes: u.inspecoesRealizadas.map((i) => ({
      id: i.id,
      iniciadaEm: i.iniciadaEm,
      finalizadaEm: i.finalizadaEm,
      score: i.score,
      scoreStatus: i.scoreStatus as ScoreStatus | null,
      checklist: { nome: i.checklist.nome, categoria: i.checklist.categoria },
    })),
  }
}

// ─── ALTERAR NOME ─────────────────────────────────────────────

export async function alterarNomeAction(
  data: { nome: string }
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const parsed = nomeSchema.safeParse(data)
  if (!parsed.success) {
    return { sucesso: false, erro: parsed.error.issues[0].message }
  }

  const user = await getServerUser()

  await prisma.usuario.update({
    where: { id: user.id },
    data: { nome: parsed.data.nome.trim() },
  })

  revalidatePath('/perfil')
  revalidatePath('/configuracoes/usuarios')

  return { sucesso: true }
}

// ─── ALTERAR SENHA ────────────────────────────────────────────

export async function alterarSenhaAction(data: {
  senhaAtual: string
  novaSenha: string
  confirmarNovaSenha: string
}): Promise<{ sucesso: true } | { sucesso: false; erro: string; campo?: string }> {
  const parsed = senhaSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { sucesso: false, erro: first.message, campo: first.path[0] as string }
  }

  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user?.email) {
    return { sucesso: false, erro: 'Sessão inválida. Faça login novamente.' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: parsed.data.senhaAtual,
  })

  if (signInError) {
    return { sucesso: false, erro: 'Senha atual incorreta.', campo: 'senhaAtual' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.novaSenha,
  })

  if (updateError) {
    return { sucesso: false, erro: 'Erro ao atualizar senha. Tente novamente.' }
  }

  const currentUser = await getServerUser()
  await registrarAuditoria({
    tenantId: currentUser.tenantId,
    usuarioId: currentUser.id,
    acao: 'ALTERAR_SENHA',
  })

  return { sucesso: true }
}

// ─── ALTERAR PAPEL ────────────────────────────────────────────

export async function alterarPapelAction(
  usuarioId: string,
  novoPapel: Papel
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  if (user.id === usuarioId) {
    return { sucesso: false, erro: 'Você não pode alterar o seu próprio papel.' }
  }

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
  })

  if (!alvo) return { sucesso: false, erro: 'Usuário não encontrado.' }

  // ADMIN_MUNICIPAL não pode rebaixar outro ADMIN_MUNICIPAL
  if (user.papel === 'ADMIN_MUNICIPAL' && alvo.papel === 'ADMIN_MUNICIPAL') {
    return { sucesso: false, erro: 'Você não pode alterar o papel de outro administrador.' }
  }

  // Não pode promover para SUPER_ADMIN via UI
  if (novoPapel === 'SUPER_ADMIN' as Papel) {
    return { sucesso: false, erro: 'Não é possível atribuir o papel Super Admin via interface.' }
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { papel: novoPapel } })
  revalidatePath('/configuracoes/usuarios')

  await registrarAuditoria({
    tenantId: user.tenantId,
    usuarioId: user.id,
    acao: 'ALTERAR_PAPEL',
    alvoId: usuarioId,
    detalhes: { papelAnterior: alvo.papel, novoPapel },
  })

  return { sucesso: true }
}

// ─── DESATIVAR ────────────────────────────────────────────────

export async function desativarUsuarioAction(
  usuarioId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  if (user.id === usuarioId) {
    return { sucesso: false, erro: 'Você não pode desativar sua própria conta.' }
  }

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
  })

  if (!alvo) return { sucesso: false, erro: 'Usuário não encontrado.' }

  // Não desativar o único ADMIN_MUNICIPAL
  if (alvo.papel === 'ADMIN_MUNICIPAL') {
    const totalAdmins = await prisma.usuario.count({
      where: { tenantId: user.tenantId, papel: 'ADMIN_MUNICIPAL', ativo: true },
    })
    if (totalAdmins <= 1) {
      return { sucesso: false, erro: 'Não é possível desativar o único administrador municipal.' }
    }
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: false } })
  revalidatePath('/configuracoes/usuarios')

  await registrarAuditoria({
    tenantId: user.tenantId,
    usuarioId: user.id,
    acao: 'DESATIVAR_USUARIO',
    alvoId: usuarioId,
    detalhes: { nome: alvo.nome, papel: alvo.papel },
  })

  return { sucesso: true }
}

// ─── REATIVAR ─────────────────────────────────────────────────

export async function reativarUsuarioAction(
  usuarioId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
  })

  if (!alvo) return { sucesso: false, erro: 'Usuário não encontrado.' }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: true } })
  revalidatePath('/configuracoes/usuarios')

  return { sucesso: true }
}

// ─── ATUALIZAR ESCOLAS DO USUÁRIO ─────────────────────────────

export async function atualizarEscolasUsuarioAction(
  usuarioId: string,
  escolasIds: string[]
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN', 'NUTRICIONISTA'])

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
  })

  if (!alvo) return { sucesso: false, erro: 'Usuário não encontrado.' }

  // Validate all escolasIds belong to the tenant
  if (escolasIds.length > 0) {
    const escolas = await prisma.escola.findMany({
      where: { id: { in: escolasIds }, tenantId: user.tenantId },
      select: { id: true },
    })
    if (escolas.length !== escolasIds.length) {
      return { sucesso: false, erro: 'Uma ou mais escolas não encontradas.' }
    }
  }

  await prisma.$transaction([
    prisma.usuarioEscola.deleteMany({ where: { usuarioId } }),
    ...(escolasIds.length > 0
      ? [prisma.usuarioEscola.createMany({
          data: escolasIds.map((escolaId) => ({ usuarioId, escolaId })),
        })]
      : []),
  ])

  revalidatePath('/configuracoes/usuarios')
  revalidatePath(`/configuracoes/usuarios/${usuarioId}`)

  return { sucesso: true }
}

// ─── RESET DE SENHA (ADMIN) ───────────────────────────────────

export async function enviarResetSenhaAdminAction(
  usuarioId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
    select: { email: true },
  })

  if (!alvo) return { sucesso: false, erro: 'Usuário não encontrado.' }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.resetPasswordForEmail(alvo.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nova-senha`,
  })

  if (error) {
    return { sucesso: false, erro: 'Erro ao enviar e-mail de reset. Tente novamente.' }
  }

  return { sucesso: true }
}

// ─── ATIVIDADE DO USUÁRIO ─────────────────────────────────────

export async function buscarAtividadeUsuario(usuarioId: string): Promise<{
  totalInspecoes: number
  inspecoesMes: number
  ultimaInspecao: Date | null
  mediascore: number | null
  ncsGeradas: number
  diasAtivo: number
}> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN', 'NUTRICIONISTA'])

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId: user.tenantId },
    select: { createdAt: true },
  })

  if (!alvo) throw new Error('Usuário não encontrado')

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [total, mes, scoreData, ncs, ultima] = await Promise.all([
    prisma.inspecao.count({ where: { inspetorId: usuarioId } }),
    prisma.inspecao.count({ where: { inspetorId: usuarioId, iniciadaEm: { gte: inicioMes } } }),
    prisma.inspecao.aggregate({
      where: { inspetorId: usuarioId, status: 'FINALIZADA', score: { not: null } },
      _avg: { score: true },
    }),
    prisma.naoConformidade.count({ where: { tenantId: user.tenantId, inspecao: { inspetorId: usuarioId } } }),
    prisma.inspecao.findFirst({
      where: { inspetorId: usuarioId },
      orderBy: { iniciadaEm: 'desc' },
      select: { iniciadaEm: true },
    }),
  ])

  const diasAtivo = Math.floor((agora.getTime() - alvo.createdAt.getTime()) / (1000 * 60 * 60 * 24))

  return {
    totalInspecoes: total,
    inspecoesMes: mes,
    ultimaInspecao: ultima?.iniciadaEm ?? null,
    mediascore: scoreData._avg.score,
    ncsGeradas: ncs,
    diasAtivo,
  }
}

// ─── EXPORTAR CSV ─────────────────────────────────────────────

export async function exportarUsuariosCSV(): Promise<{
  cabecalho: string[]
  linhas: string[][]
}> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: user.tenantId },
    include: {
      escolas: { include: { escola: { select: { nome: true } } } },
    },
    orderBy: { nome: 'asc' },
  })

  const usuarioIds = usuarios.map((u) => u.id)
  const mesPorUsuario = await prisma.inspecao.groupBy({
    by: ['inspetorId'],
    where: { inspetorId: { in: usuarioIds }, iniciadaEm: { gte: inicioMes } },
    _count: true,
  })
  const mesMap = new Map(mesPorUsuario.map((r) => [r.inspetorId, r._count]))

  const PAPEL_PT: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_MUNICIPAL: 'Administrador',
    NUTRICIONISTA: 'Nutricionista',
    DIRETOR_ESCOLA: 'Diretor',
    MERENDEIRA: 'Merendeira',
  }

  const cabecalho = ['Nome', 'E-mail', 'Papel', 'Escolas', 'Status', 'Inspeções (mês)', 'Cadastro']
  const linhas = usuarios.map((u) => [
    u.nome,
    u.email,
    PAPEL_PT[u.papel] ?? u.papel,
    u.escolas.map((ue) => ue.escola.nome).join('; '),
    u.ativo ? 'Ativo' : 'Inativo',
    String(mesMap.get(u.id) ?? 0),
    u.createdAt.toLocaleDateString('pt-BR'),
  ])

  return { cabecalho, linhas }
}

// ─── RANKING EQUIPE (para dashboard) ──────────────────────────

export async function buscarRankingEquipe(): Promise<{
  id: string
  nome: string
  papel: Papel
  inspecoesMes: number
}[]> {
  const user = await getServerUser()

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const ranking = await prisma.inspecao.groupBy({
    by: ['inspetorId'],
    where: {
      tenantId: user.tenantId,
      iniciadaEm: { gte: inicioMes },
      inspetor: {
        papel: { in: ['NUTRICIONISTA', 'MERENDEIRA'] },
        ativo: true,
      },
    },
    _count: true,
    orderBy: { _count: { inspetorId: 'desc' } },
    take: 3,
  })

  if (ranking.length === 0) return []

  const ids = ranking.map((r) => r.inspetorId)
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true, papel: true },
  })

  const userMap = new Map(usuarios.map((u) => [u.id, u]))

  return ranking
    .map((r) => {
      const u = userMap.get(r.inspetorId)
      if (!u) return null
      return { id: u.id, nome: u.nome, papel: u.papel, inspecoesMes: r._count }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}
