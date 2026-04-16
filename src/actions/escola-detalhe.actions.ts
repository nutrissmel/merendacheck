'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { subDays, startOfDay, endOfDay, format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns'
import type { ScoreStatus } from '@prisma/client'

export type PeriodoDetalhes = '30d' | '60d' | '90d'

function diasDoPeriodo(periodo: PeriodoDetalhes): number {
  return parseInt(periodo)
}

// ─── CONTROLE DE ACESSO ───────────────────────────────────────

export async function verificarAcessoEscolaDetalhes(escolaId: string): Promise<boolean> {
  const user = await getServerUser()

  const escola = await prisma.escola.findFirst({
    where: { id: escolaId, tenantId: user.tenantId },
  })
  if (!escola) return false

  if (['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
    return true
  }

  const vinculo = await prisma.usuarioEscola.findFirst({
    where: { usuarioId: user.id, escolaId },
  })
  return !!vinculo
}

// ─── KPIs COM TENDÊNCIA ───────────────────────────────────────

export async function buscarKPIsEscola(escolaId: string, periodo: PeriodoDetalhes = '30d') {
  const user = await getServerUser()
  const dias = diasDoPeriodo(periodo)
  const fim = endOfDay(new Date())
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const inicioPrev = startOfDay(subDays(new Date(), dias * 2 - 1))
  const fimPrev = startOfDay(subDays(new Date(), dias))

  const [insp, inspPrev, ncsAbertas, ncsVencidas, scoreAgg, scorePrevAgg] = await Promise.all([
    prisma.inspecao.count({ where: { escolaId, status: 'FINALIZADA', finalizadaEm: { gte: inicio, lte: fim } } }),
    prisma.inspecao.count({ where: { escolaId, status: 'FINALIZADA', finalizadaEm: { gte: inicioPrev, lte: fimPrev } } }),
    prisma.naoConformidade.count({
      where: { tenantId: user.tenantId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] }, inspecao: { escolaId } },
    }),
    prisma.naoConformidade.count({
      where: { tenantId: user.tenantId, status: 'VENCIDA', inspecao: { escolaId } },
    }),
    prisma.inspecao.aggregate({
      where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicio, lte: fim } },
      _avg: { score: true },
    }),
    prisma.inspecao.aggregate({
      where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicioPrev, lte: fimPrev } },
      _avg: { score: true },
    }),
  ])

  const scoreMedio = Math.round(scoreAgg._avg.score ?? 0)
  const scoreMedioPrev = Math.round(scorePrevAgg._avg.score ?? scoreMedio)

  return {
    scoreMedio,
    tendenciaScore: scoreMedio - scoreMedioPrev,
    tendenciaScorePositiva: scoreMedio >= scoreMedioPrev,
    totalInspecoes: insp,
    tendenciaInspecoes: insp - inspPrev,
    tendenciaInspecoesPositiva: insp >= inspPrev,
    ncsAbertas,
    ncsVencidas,
  }
}

// ─── EVOLUÇÃO DO SCORE (gráfico com pontos clicáveis) ─────────

export async function buscarEvolucaoEscola(escolaId: string, periodo: PeriodoDetalhes = '30d') {
  const dias = diasDoPeriodo(periodo)
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fim = endOfDay(new Date())

  const inspecoes = await prisma.inspecao.findMany({
    where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicio, lte: fim } },
    select: {
      id: true, finalizadaEm: true, score: true, scoreStatus: true,
      checklist: { select: { nome: true } },
      inspetor: { select: { nome: true } },
    },
    orderBy: { finalizadaEm: 'asc' },
  })

  return inspecoes.map((i) => ({
    id: i.id,
    data: format(i.finalizadaEm!, 'yyyy-MM-dd'),
    dataFormatada: format(i.finalizadaEm!, 'dd/MM/yyyy'),
    score: Math.round(i.score!),
    scoreStatus: i.scoreStatus as ScoreStatus,
    checklistNome: i.checklist.nome,
    inspetorNome: i.inspetor.nome,
  }))
}

// ─── CALENDÁRIO DO MÊS ───────────────────────────────────────

export async function buscarCalendarioInspecoes(escolaId: string, mes?: number, ano?: number) {
  const agora = new Date()
  const m = mes ?? agora.getMonth()
  const a = ano ?? agora.getFullYear()
  const inicio = startOfMonth(new Date(a, m, 1))
  const fim = endOfMonth(new Date(a, m, 1))

  const inspecoes = await prisma.inspecao.findMany({
    where: { escolaId, iniciadaEm: { gte: inicio, lte: fim } },
    select: { iniciadaEm: true, score: true, scoreStatus: true, status: true },
  })

  const totalDias = getDaysInMonth(inicio)
  const dias = Array.from({ length: totalDias }, (_, idx) => {
    const dia = idx + 1
    const insDia = inspecoes.filter((i) => new Date(i.iniciadaEm).getDate() === dia)
    const finalizada = insDia.find((i) => i.status === 'FINALIZADA')
    return {
      dia,
      temInspecao: insDia.length > 0,
      scoreStatus: (finalizada?.scoreStatus as ScoreStatus | null) ?? null,
      contagem: insDia.length,
    }
  })

  return {
    mes: m,
    ano: a,
    primeiroDiaSemana: new Date(a, m, 1).getDay(),
    dias,
  }
}

// ─── COMPARATIVO ENTRE ESCOLAS ────────────────────────────────

export async function buscarComparativoEscolas(escolaId: string, periodo: PeriodoDetalhes = '30d') {
  const user = await getServerUser()
  const dias = diasDoPeriodo(periodo)
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fim = endOfDay(new Date())

  const escolas = await prisma.escola.findMany({
    where: { tenantId: user.tenantId, ativa: true },
    select: { id: true, nome: true },
  })

  const scores = await Promise.all(
    escolas.map(async (e) => {
      const agg = await prisma.inspecao.aggregate({
        where: {
          escolaId: e.id, status: 'FINALIZADA', score: { not: null },
          finalizadaEm: { gte: inicio, lte: fim },
        },
        _avg: { score: true },
      })
      return { id: e.id, nome: e.nome, score: Math.round(agg._avg.score ?? 0) }
    })
  )

  scores.sort((a, b) => b.score - a.score)
  const posicao = scores.findIndex((e) => e.id === escolaId) + 1
  const minhaEscola = scores.find((e) => e.id === escolaId)

  return {
    posicao: posicao > 0 ? posicao : scores.length,
    total: scores.length,
    scores,
    minhaScore: minhaEscola?.score ?? 0,
  }
}

// ─── COMPARATIVO DE CHECKLISTS ────────────────────────────────

export async function buscarComparativoChecklists(escolaId: string, periodo: PeriodoDetalhes = '30d') {
  const dias = diasDoPeriodo(periodo)
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fim = endOfDay(new Date())

  const inspecoes = await prisma.inspecao.findMany({
    where: { escolaId, status: 'FINALIZADA', score: { not: null }, finalizadaEm: { gte: inicio, lte: fim } },
    select: { score: true, checklist: { select: { nome: true, categoria: true } } },
  })

  const mapa = new Map<string, { nome: string; scores: number[] }>()
  inspecoes.forEach((i) => {
    const cat = i.checklist.categoria
    const atual = mapa.get(cat) ?? { nome: i.checklist.nome, scores: [] }
    if (i.score !== null) atual.scores.push(i.score)
    mapa.set(cat, atual)
  })

  return Array.from(mapa.entries())
    .map(([categoria, dados]) => ({
      categoria,
      nome: dados.nome,
      scoreMedio: dados.scores.length > 0
        ? Math.round(dados.scores.reduce((s, v) => s + v, 0) / dados.scores.length)
        : 0,
      totalInspecoes: dados.scores.length,
    }))
    .sort((a, b) => b.scoreMedio - a.scoreMedio)
}

// ─── NCs DA ESCOLA (ordenadas) ────────────────────────────────

export async function buscarNCsEscola(escolaId: string) {
  const user = await getServerUser()

  const ncs = await prisma.naoConformidade.findMany({
    where: {
      tenantId: user.tenantId,
      status: { in: ['ABERTA', 'EM_ANDAMENTO', 'VENCIDA'] },
      inspecao: { escolaId },
    },
    include: {
      inspecao: { select: { id: true, checklist: { select: { nome: true } } } },
    },
  })

  const agora = new Date()

  // Ordenar: VENCIDA primeiro, depois por severidade, depois por prazo
  const ordemStatus: Record<string, number> = { VENCIDA: 0, ABERTA: 1, EM_ANDAMENTO: 2 }
  const ordemSeveridade: Record<string, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 }

  ncs.sort((a, b) => {
    const sStatus = (ordemStatus[a.status] ?? 9) - (ordemStatus[b.status] ?? 9)
    if (sStatus !== 0) return sStatus
    const sSev = (ordemSeveridade[a.severidade] ?? 9) - (ordemSeveridade[b.severidade] ?? 9)
    if (sSev !== 0) return sSev
    if (a.prazoResolucao && b.prazoResolucao) return a.prazoResolucao.getTime() - b.prazoResolucao.getTime()
    return 0
  })

  return ncs.map((nc) => ({
    id: nc.id,
    titulo: nc.titulo,
    descricao: nc.descricao,
    severidade: nc.severidade,
    status: nc.status,
    prazoResolucao: nc.prazoResolucao,
    createdAt: nc.createdAt,
    inspecaoId: nc.inspecaoId,
    checklistNome: nc.inspecao.checklist.nome,
    vencida: nc.prazoResolucao ? nc.prazoResolucao < agora && nc.status !== 'RESOLVIDA' : false,
  }))
}

// ─── INSPEÇÕES PAGINADAS COM FILTROS ─────────────────────────

export async function buscarInspecoesEscola(
  escolaId: string,
  filtros: { periodo?: PeriodoDetalhes; scoreStatus?: ScoreStatus; pagina?: number } = {}
) {
  const dias = diasDoPeriodo(filtros.periodo ?? '30d')
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fim = endOfDay(new Date())
  const pagina = filtros.pagina ?? 1
  const porPagina = 20

  const where = {
    escolaId,
    finalizadaEm: { gte: inicio, lte: fim },
    ...(filtros.scoreStatus ? { scoreStatus: filtros.scoreStatus } : {}),
  }

  const [inspecoes, total] = await Promise.all([
    prisma.inspecao.findMany({
      where,
      include: {
        inspetor: { select: { nome: true } },
        checklist: { select: { nome: true, categoria: true } },
        _count: { select: { naoConformidades: true } },
      },
      orderBy: { finalizadaEm: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.inspecao.count({ where }),
  ])

  return {
    inspecoes: inspecoes.map((i) => ({
      id: i.id,
      status: i.status,
      score: i.score,
      scoreStatus: i.scoreStatus as ScoreStatus | null,
      iniciadaEm: i.iniciadaEm,
      finalizadaEm: i.finalizadaEm,
      inspetorNome: i.inspetor.nome,
      checklistNome: i.checklist.nome,
      checklistCategoria: i.checklist.categoria,
      totalNCs: i._count.naoConformidades,
    })),
    total,
    paginas: Math.ceil(total / porPagina),
    pagina,
  }
}
