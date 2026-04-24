'use server'

import prisma from '@/lib/prisma'
import { requirePapel, getServerUser, tenantWhere } from '@/lib/auth'
import { escolaSchema, escolaUpdateSchema } from '@/lib/validations'
import { podeAdicionarEscola } from '@/lib/plano'
import { revalidatePath } from 'next/cache'
import type { EscolaComMetricas, EscolaDetalhada, CriarEscolaInput, AtualizarEscolaInput, UsuarioSimples } from '@/types/escola'
import type { ScoreStatus, Turno } from '@prisma/client'

function calcularScoreStatus(score: number): ScoreStatus {
  if (score >= 90) return 'CONFORME'
  if (score >= 70) return 'ATENCAO'
  if (score >= 50) return 'NAO_CONFORME'
  return 'REPROVADO'
}

// ─── LISTAR ───────────────────────────────────────────────────

export async function listarEscolas(filtros?: {
  busca?: string
  turno?: Turno
  ativa?: boolean
  ordenarPor?: 'nome' | 'score' | 'ultimaInspecao'
}): Promise<EscolaComMetricas[]> {
  const user = await getServerUser()

  const escolas = await prisma.escola.findMany({
    where: {
      ...tenantWhere(user),
      ...(filtros?.ativa !== undefined ? { ativa: filtros.ativa } : {}),
      ...(filtros?.busca ? { nome: { contains: filtros.busca, mode: 'insensitive' } } : {}),
      ...(filtros?.turno ? { turnos: { has: filtros.turno } } : {}),
    },
    include: {
      inspecoes: {
        where: { status: 'FINALIZADA', score: { not: null } },
        orderBy: { finalizadaEm: 'desc' },
        take: 1,
        select: { finalizadaEm: true, score: true, scoreStatus: true },
      },
      _count: { select: { usuariosEscola: true } },
    },
    orderBy: { nome: 'asc' },
  })

  const escolaIds = escolas.map((e) => e.id)
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [scoreMedioData, ncsData] = await Promise.all([
    prisma.inspecao.groupBy({
      by: ['escolaId'],
      where: {
        escolaId: { in: escolaIds },
        status: 'FINALIZADA',
        score: { not: null },
        finalizadaEm: { gte: inicioMes },
      },
      _avg: { score: true },
    }),
    prisma.naoConformidade.groupBy({
      by: ['inspecaoId'],
      where: {
        tenantId: user.tenantId,
        status: 'ABERTA',
        inspecao: { escolaId: { in: escolaIds } },
      },
      _count: true,
    }),
  ])

  const scoreMap = new Map(scoreMedioData.map((s) => [s.escolaId, s._avg.score]))

  const ncsMap = new Map<string, number>()
  if (ncsData.length > 0) {
    const inspecaoIds = ncsData.map((nc) => nc.inspecaoId)
    const inspecoesEscolas = await prisma.inspecao.findMany({
      where: { id: { in: inspecaoIds } },
      select: { id: true, escolaId: true },
    })
    const inspecaoEscolaMap = new Map(inspecoesEscolas.map((i) => [i.id, i.escolaId]))
    for (const nc of ncsData) {
      const escolaId = inspecaoEscolaMap.get(nc.inspecaoId)
      if (escolaId) {
        ncsMap.set(escolaId, (ncsMap.get(escolaId) ?? 0) + nc._count)
      }
    }
  }

  let resultado: EscolaComMetricas[] = escolas.map((escola) => ({
    id: escola.id,
    nome: escola.nome,
    codigoInep: escola.codigoInep,
    cidade: escola.cidade,
    turnos: escola.turnos as Turno[],
    numeroAlunos: escola.numeroAlunos,
    ativa: escola.ativa,
    ultimaInspecao: escola.inspecoes[0]
      ? {
          data: escola.inspecoes[0].finalizadaEm!,
          score: escola.inspecoes[0].score!,
          scoreStatus: (escola.inspecoes[0].scoreStatus ?? calcularScoreStatus(escola.inspecoes[0].score!)) as ScoreStatus,
        }
      : null,
    scoreMedioMes: scoreMap.get(escola.id) ?? null,
    ncsAbertas: ncsMap.get(escola.id) ?? 0,
    totalUsuarios: escola._count.usuariosEscola,
  }))

  if (filtros?.ordenarPor === 'score') {
    resultado.sort((a, b) => (b.scoreMedioMes ?? -1) - (a.scoreMedioMes ?? -1))
  } else if (filtros?.ordenarPor === 'ultimaInspecao') {
    resultado.sort((a, b) => {
      const da = a.ultimaInspecao?.data.getTime() ?? 0
      const db = b.ultimaInspecao?.data.getTime() ?? 0
      return db - da
    })
  }

  return resultado
}

// ─── BUSCAR ESCOLA PELO ID ────────────────────────────────────

export async function buscarEscolaById(escolaId: string): Promise<EscolaDetalhada | null> {
  const user = await getServerUser()

  const escola = await prisma.escola.findFirst({
    where: { id: escolaId, tenantId: user.tenantId },
    include: {
      usuariosEscola: {
        include: { usuario: { select: { id: true, nome: true, email: true, papel: true } } },
      },
      inspecoes: {
        where: { status: 'FINALIZADA' },
        orderBy: { finalizadaEm: 'desc' },
        take: 5,
        include: { checklist: { select: { nome: true, categoria: true } } },
      },
      _count: { select: { usuariosEscola: true } },
    },
  })

  if (!escola) return null

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const [scoreData, ncsAbertas] = await Promise.all([
    prisma.inspecao.aggregate({
      where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicioMes } },
      _avg: { score: true },
    }),
    prisma.naoConformidade.count({
      where: { tenantId: user.tenantId, status: 'ABERTA', inspecao: { escolaId } },
    }),
  ])

  const ultimaInspecao = escola.inspecoes[0]

  return {
    id: escola.id,
    nome: escola.nome,
    codigoInep: escola.codigoInep,
    cidade: escola.cidade,
    endereco: escola.endereco,
    bairro: escola.bairro,
    cep: escola.cep,
    turnos: escola.turnos as Turno[],
    numeroAlunos: escola.numeroAlunos,
    ativa: escola.ativa,
    ultimaInspecao: ultimaInspecao
      ? {
          data: ultimaInspecao.finalizadaEm!,
          score: ultimaInspecao.score!,
          scoreStatus: (ultimaInspecao.scoreStatus ?? calcularScoreStatus(ultimaInspecao.score!)) as ScoreStatus,
        }
      : null,
    scoreMedioMes: scoreData._avg.score,
    ncsAbertas,
    totalUsuarios: escola._count.usuariosEscola,
    usuarios: escola.usuariosEscola.map((ue) => ({
      id: ue.usuario.id,
      nome: ue.usuario.nome,
      email: ue.usuario.email,
      papel: ue.usuario.papel,
    })),
    inspecoesRecentes: escola.inspecoes.map((i) => ({
      id: i.id,
      iniciadaEm: i.iniciadaEm,
      finalizadaEm: i.finalizadaEm,
      score: i.score,
      scoreStatus: i.scoreStatus as ScoreStatus | null,
      checklist: { nome: i.checklist.nome, categoria: i.checklist.categoria },
    })),
    createdAt: escola.createdAt,
    updatedAt: escola.updatedAt,
  }
}

// ─── CRIAR ────────────────────────────────────────────────────

export async function criarEscolaAction(data: CriarEscolaInput) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const validado = escolaSchema.safeParse(data)
  if (!validado.success) {
    const primeiro = validado.error.issues[0]
    return { sucesso: false as const, erro: primeiro.message, campo: String(primeiro.path[0] ?? '') }
  }

  const { pode, atual, limite } = await podeAdicionarEscola(user.tenantId)
  if (!pode) {
    return {
      sucesso: false as const,
      erro: `Limite de ${limite} escola(s) atingido no seu plano. Você tem ${atual} escolas cadastradas.`,
    }
  }

  try {
    const escola = await prisma.escola.create({
      data: {
        tenantId: user.tenantId,
        nome: validado.data.nome,
        codigoInep: validado.data.codigoInep || null,
        endereco: validado.data.endereco || null,
        bairro: validado.data.bairro || null,
        cidade: validado.data.cidade || null,
        cep: validado.data.cep || null,
        numeroAlunos: validado.data.numeroAlunos,
        turnos: validado.data.turnos,
      },
    })
    revalidatePath('/escolas')
    revalidatePath('/dashboard')
    return { sucesso: true as const, escola }
  } catch {
    return { sucesso: false as const, erro: 'Erro ao criar escola. Tente novamente.' }
  }
}

// ─── ATUALIZAR ────────────────────────────────────────────────

export async function atualizarEscolaAction(escolaId: string, data: AtualizarEscolaInput) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) return { sucesso: false as const, erro: 'Escola não encontrada.' }

  const validado = escolaUpdateSchema.safeParse(data)
  if (!validado.success) {
    const primeiro = validado.error.issues[0]
    return { sucesso: false as const, erro: primeiro.message, campo: String(primeiro.path[0] ?? '') }
  }

  try {
    await prisma.escola.update({
      where: { id: escolaId },
      data: {
        ...(validado.data.nome !== undefined ? { nome: validado.data.nome } : {}),
        ...(validado.data.codigoInep !== undefined ? { codigoInep: validado.data.codigoInep || null } : {}),
        ...(validado.data.endereco !== undefined ? { endereco: validado.data.endereco || null } : {}),
        ...(validado.data.bairro !== undefined ? { bairro: validado.data.bairro || null } : {}),
        ...(validado.data.cidade !== undefined ? { cidade: validado.data.cidade || null } : {}),
        ...(validado.data.cep !== undefined ? { cep: validado.data.cep || null } : {}),
        ...(validado.data.numeroAlunos !== undefined ? { numeroAlunos: validado.data.numeroAlunos } : {}),
        ...(validado.data.turnos !== undefined ? { turnos: validado.data.turnos } : {}),
      },
    })
    revalidatePath('/escolas')
    revalidatePath(`/escolas/${escolaId}`)
    return { sucesso: true as const }
  } catch {
    return { sucesso: false as const, erro: 'Erro ao atualizar escola. Tente novamente.' }
  }
}

// ─── DESATIVAR / REATIVAR ─────────────────────────────────────

export async function desativarEscolaAction(escolaId: string) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) return { sucesso: false as const, erro: 'Escola não encontrada.' }

  const inspecoesAtivas = await prisma.inspecao.count({ where: { escolaId, status: 'EM_ANDAMENTO' } })
  if (inspecoesAtivas > 0) {
    return { sucesso: false as const, erro: 'Não é possível desativar escola com inspeções em andamento.' }
  }

  await prisma.escola.update({ where: { id: escolaId }, data: { ativa: false } })
  revalidatePath('/escolas')
  revalidatePath('/dashboard')
  return { sucesso: true as const }
}

export async function reativarEscolaAction(escolaId: string) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'SUPER_ADMIN'])

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) return { sucesso: false as const, erro: 'Escola não encontrada.' }

  await prisma.escola.update({ where: { id: escolaId }, data: { ativa: true } })
  revalidatePath('/escolas')
  return { sucesso: true as const }
}

// ─── USUÁRIOS DA ESCOLA ───────────────────────────────────────

export async function atribuirUsuarioEscolaAction(escolaId: string, usuarioId: string) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) return { sucesso: false as const, erro: 'Escola não encontrada.' }

  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, tenantId: user.tenantId } })
  if (!usuario) return { sucesso: false as const, erro: 'Usuário não encontrado.' }

  try {
    await prisma.usuarioEscola.create({ data: { usuarioId, escolaId } })
    revalidatePath(`/escolas/${escolaId}`)
    return { sucesso: true as const }
  } catch {
    return { sucesso: false as const, erro: 'Usuário já está atribuído a esta escola.' }
  }
}

export async function removerUsuarioEscolaAction(escolaId: string, usuarioId: string) {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) return { sucesso: false as const, erro: 'Escola não encontrada.' }

  await prisma.usuarioEscola.deleteMany({ where: { escolaId, usuarioId } })
  revalidatePath(`/escolas/${escolaId}`)
  return { sucesso: true as const }
}

export async function buscarUsuariosDisponiveisAction(escolaId: string): Promise<UsuarioSimples[]> {
  const user = await getServerUser()

  const jaAtribuidos = await prisma.usuarioEscola.findMany({
    where: { escolaId },
    select: { usuarioId: true },
  })
  const jaAtribuidosIds = jaAtribuidos.map((u) => u.usuarioId)

  const usuarios = await prisma.usuario.findMany({
    where: {
      tenantId: user.tenantId,
      ativo: true,
      id: { notIn: jaAtribuidosIds },
    },
    select: { id: true, nome: true, email: true, papel: true },
    orderBy: { nome: 'asc' },
  })

  return usuarios.map((u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel }))
}

// ─── MÉTRICAS ─────────────────────────────────────────────────

export async function buscarMetricasEscola(escolaId: string) {
  const user = await getServerUser()

  const escola = await prisma.escola.findFirst({ where: { id: escolaId, tenantId: user.tenantId } })
  if (!escola) throw new Error('Escola não encontrada')

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const inicio30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)

  const [totalInspecoes, inspecoesMes, ncsAbertas, scoreAtual, scoreAnterior, historico] =
    await Promise.all([
      prisma.inspecao.count({ where: { escolaId } }),
      prisma.inspecao.count({ where: { escolaId, iniciadaEm: { gte: inicioMes } } }),
      prisma.naoConformidade.count({ where: { tenantId: user.tenantId, status: 'ABERTA', inspecao: { escolaId } } }),
      prisma.inspecao.aggregate({
        where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicio30d } },
        _avg: { score: true },
      }),
      prisma.inspecao.aggregate({
        where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicioMesAnterior, lt: inicioMes } },
        _avg: { score: true },
      }),
      prisma.inspecao.findMany({
        where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicio30d } },
        orderBy: { finalizadaEm: 'asc' },
        select: { finalizadaEm: true, score: true },
      }),
    ])

  const scoreMedio = scoreAtual._avg.score ?? 0
  const scoreMedioAnterior = scoreAnterior._avg.score ?? scoreMedio
  const tendencia = Math.round(scoreMedio - scoreMedioAnterior)

  return {
    scoreMedio: Math.round(scoreMedio),
    scoreStatus: calcularScoreStatus(scoreMedio),
    totalInspecoes,
    inspecoesMes,
    ncsAbertas,
    tendencia,
    historico: historico.map((i) => ({ data: i.finalizadaEm!, score: Math.round(i.score!) })),
  }
}

// ─── BUSCAR ESCOLAS COM ATENÇÃO (para dashboard) ──────────────

export async function buscarEscolasAtencao(): Promise<EscolaComMetricas[]> {
  const escolas = await listarEscolas({ ativa: true })
  return escolas
    .filter((e) => e.scoreMedioMes !== null && e.scoreMedioMes < 90)
    .sort((a, b) => (a.scoreMedioMes ?? 100) - (b.scoreMedioMes ?? 100))
    .slice(0, 3)
}
