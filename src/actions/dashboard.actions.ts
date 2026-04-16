'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import type { ScoreStatus, Severidade, CategoriaChecklist, Papel } from '@prisma/client'
import { subDays, startOfDay, endOfDay, format, differenceInDays } from 'date-fns'

// ─── Tipos exportados ─────────────────────────────────────────

export type KPIsDashboard = {
  scoreMedio: number
  scoreMedioPeriodoAnterior: number
  tendenciaScore: number
  tendenciaScorePositiva: boolean
  totalInspecoes: number
  totalInspecoesPeriodoAnterior: number
  tendenciaInspecoes: number
  tendenciaInspecoesPositiva: boolean
  totalEscolas: number
  escolasComInspecaoNoPeriodo: number
  escolasSemInspecao: number
  ncsAbertas: number
  ncsVencidas: number
  ncsResolvidasNoPeriodo: number
  tempMedioResolucaoDias: number
  taxaExecucao: number
}

export type PontoTemporal = {
  data: string
  scoreMedio: number
  totalInspecoes: number
  conformes: number
  naoConformes: number
}

export type HeatmapData = {
  diaSemana: number
  hora: number
  contagem: number
  intensidade: number
}

export type EscolaRanking = {
  id: string
  nome: string
  scoreMedio: number
  scoreStatus: ScoreStatus | null
  totalInspecoes: number
  ncsAbertas: number
  tendencia: number
  historico: { data: string; score: number }[]
}

export type DistribuicaoNCs = {
  porSeveridade: { severidade: Severidade; total: number; percentual: number }[]
  porCategoria: { categoria: CategoriaChecklist; total: number }[]
  porEscola: { escola: string; total: number }[]
  evolucao: { data: string; abertas: number; resolvidas: number }[]
}

export type ItemMaisReprovado = {
  pergunta: string
  checklistNome: string
  categoria: CategoriaChecklist
  totalReprovacoes: number
  percentualReprovacao: number
  isCritico: boolean
}

export type AtividadeMembro = {
  usuario: { id: string; nome: string; papel: Papel }
  totalInspecoes: number
  scoreMedio: number
  ultimaAtividade: Date | null
}

// ─── Helpers ──────────────────────────────────────────────────

type Periodo = '7d' | '30d' | '60d' | '90d'

function getPeriodoRange(periodo: Periodo): { inicio: Date; fim: Date; inicioPrev: Date; fimPrev: Date } {
  const dias = parseInt(periodo)
  const fim = endOfDay(new Date())
  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fimPrev = startOfDay(subDays(new Date(), dias))
  const inicioPrev = startOfDay(subDays(new Date(), dias * 2 - 1))
  return { inicio, fim, inicioPrev, fimPrev }
}

// ─── KPIs PRINCIPAIS ──────────────────────────────────────────

export async function buscarKPIsDashboard(filtros: {
  periodo: Periodo
  escolaId?: string
}): Promise<KPIsDashboard> {
  const user = await getServerUser()
  const { inicio, fim, inicioPrev, fimPrev } = getPeriodoRange(filtros.periodo)

  const whereBase = {
    tenantId: user.tenantId,
    ...(filtros.escolaId ? { escolaId: filtros.escolaId } : {}),
  }

  const [
    inspecoesPeriodo,
    inspecoesPeriodoAnterior,
    totalEscolas,
    ncsAbertas,
    ncsVencidas,
    ncsResolvidas,
    ncsResolvidasComData,
  ] = await Promise.all([
    prisma.inspecao.findMany({
      where: { ...whereBase, status: 'FINALIZADA', finalizadaEm: { gte: inicio, lte: fim } },
      select: { id: true, score: true, scoreStatus: true, escolaId: true },
    }),
    prisma.inspecao.findMany({
      where: { ...whereBase, status: 'FINALIZADA', finalizadaEm: { gte: inicioPrev, lte: fimPrev } },
      select: { score: true },
    }),
    prisma.escola.count({ where: { tenantId: user.tenantId, ativa: true } }),
    prisma.naoConformidade.count({
      where: { tenantId: user.tenantId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
    }),
    prisma.naoConformidade.count({
      where: { tenantId: user.tenantId, status: 'VENCIDA' },
    }),
    prisma.naoConformidade.count({
      where: {
        tenantId: user.tenantId,
        status: 'RESOLVIDA',
        resolvidaEm: { gte: inicio, lte: fim },
      },
    }),
    prisma.naoConformidade.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'RESOLVIDA',
        resolvidaEm: { not: null },
        createdAt: { gte: subDays(new Date(), 90) },
      },
      select: { createdAt: true, resolvidaEm: true },
    }),
  ])

  const scoreMedio =
    inspecoesPeriodo.length > 0
      ? inspecoesPeriodo.reduce((s, i) => s + (i.score ?? 0), 0) / inspecoesPeriodo.length
      : 0

  const scoreMedioPeriodoAnterior =
    inspecoesPeriodoAnterior.length > 0
      ? inspecoesPeriodoAnterior.reduce((s, i) => s + (i.score ?? 0), 0) /
        inspecoesPeriodoAnterior.length
      : 0

  const tendenciaScore = Math.round(scoreMedio - scoreMedioPeriodoAnterior)
  const tendenciaInspecoes = inspecoesPeriodo.length - inspecoesPeriodoAnterior.length

  const escolasComInspecao = new Set(inspecoesPeriodo.map((i) => i.escolaId)).size

  let tempMedioResolucaoDias = 0
  if (ncsResolvidasComData.length > 0) {
    const totalDias = ncsResolvidasComData.reduce((s, nc) => {
      if (!nc.resolvidaEm) return s
      return s + differenceInDays(nc.resolvidaEm, nc.createdAt)
    }, 0)
    tempMedioResolucaoDias = Math.round((totalDias / ncsResolvidasComData.length) * 10) / 10
  }

  return {
    scoreMedio: Math.round(scoreMedio),
    scoreMedioPeriodoAnterior: Math.round(scoreMedioPeriodoAnterior),
    tendenciaScore,
    tendenciaScorePositiva: tendenciaScore >= 0,
    totalInspecoes: inspecoesPeriodo.length,
    totalInspecoesPeriodoAnterior: inspecoesPeriodoAnterior.length,
    tendenciaInspecoes,
    tendenciaInspecoesPositiva: tendenciaInspecoes >= 0,
    totalEscolas,
    escolasComInspecaoNoPeriodo: escolasComInspecao,
    escolasSemInspecao: totalEscolas - escolasComInspecao,
    ncsAbertas,
    ncsVencidas,
    ncsResolvidasNoPeriodo: ncsResolvidas,
    tempMedioResolucaoDias,
    taxaExecucao:
      totalEscolas > 0 ? Math.round((escolasComInspecao / totalEscolas) * 100) : 0,
  }
}

// ─── CONFORMIDADE AO LONGO DO TEMPO ───────────────────────────

export async function buscarConformidadeHistorica(filtros: {
  periodo: Periodo
  escolaId?: string
  agrupamento?: 'dia' | 'semana'
}): Promise<PontoTemporal[]> {
  const user = await getServerUser()
  const { inicio, fim } = getPeriodoRange(filtros.periodo)

  const inspecoes = await prisma.inspecao.findMany({
    where: {
      tenantId: user.tenantId,
      status: 'FINALIZADA',
      finalizadaEm: { gte: inicio, lte: fim },
      ...(filtros.escolaId ? { escolaId: filtros.escolaId } : {}),
    },
    select: { finalizadaEm: true, score: true, scoreStatus: true },
    orderBy: { finalizadaEm: 'asc' },
  })

  // Agrupar por dia
  const mapa = new Map<string, { scores: number[]; conformes: number; naoConformes: number }>()
  inspecoes.forEach((insp) => {
    if (!insp.finalizadaEm) return
    const chave = format(insp.finalizadaEm, 'yyyy-MM-dd')
    const atual = mapa.get(chave) ?? { scores: [], conformes: 0, naoConformes: 0 }
    if (insp.score !== null) atual.scores.push(insp.score)
    if (insp.scoreStatus === 'CONFORME') atual.conformes++
    else atual.naoConformes++
    mapa.set(chave, atual)
  })

  // Preencher dias sem inspeção com 0 para continuidade do gráfico
  const dias = parseInt(filtros.periodo)
  const resultado: PontoTemporal[] = []
  for (let i = 0; i < dias; i++) {
    const d = format(subDays(new Date(), dias - 1 - i), 'yyyy-MM-dd')
    const dados = mapa.get(d)
    resultado.push({
      data: d,
      scoreMedio: dados
        ? Math.round(dados.scores.reduce((s, v) => s + v, 0) / (dados.scores.length || 1))
        : 0,
      totalInspecoes: dados ? dados.conformes + dados.naoConformes : 0,
      conformes: dados?.conformes ?? 0,
      naoConformes: dados?.naoConformes ?? 0,
    })
  }

  return resultado
}

// ─── HEATMAP DE INSPEÇÕES ─────────────────────────────────────

export async function buscarHeatmapInspecoes(filtros: {
  periodo: '30d' | '90d'
  escolaId?: string
}): Promise<HeatmapData[][]> {
  const user = await getServerUser()
  const { inicio, fim } = getPeriodoRange(filtros.periodo as Periodo)

  const inspecoes = await prisma.inspecao.findMany({
    where: {
      tenantId: user.tenantId,
      iniciadaEm: { gte: inicio, lte: fim },
      ...(filtros.escolaId ? { escolaId: filtros.escolaId } : {}),
    },
    select: { iniciadaEm: true },
  })

  // Matriz [diaSemana 0-6][hora 0-23]
  const matriz: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  inspecoes.forEach((insp) => {
    const d = new Date(insp.iniciadaEm)
    const dia = d.getDay()
    const hora = d.getHours()
    matriz[dia][hora]++
  })

  const maxContagem = Math.max(...matriz.flat())

  const resultado: HeatmapData[][] = matriz.map((horas, dia) =>
    horas.map((contagem, hora) => ({
      diaSemana: dia,
      hora,
      contagem,
      intensidade: maxContagem > 0 ? contagem / maxContagem : 0,
    }))
  )

  return resultado
}

// ─── RANKING DE ESCOLAS ───────────────────────────────────────

export async function buscarRankingEscolas(filtros: {
  periodo: '7d' | '30d' | '90d'
  limite?: number
  ordenar?: 'score_asc' | 'score_desc' | 'nome'
}): Promise<EscolaRanking[]> {
  const user = await getServerUser()
  const { inicio, fim, inicioPrev, fimPrev } = getPeriodoRange(filtros.periodo as Periodo)

  const escolas = await prisma.escola.findMany({
    where: { tenantId: user.tenantId, ativa: true },
    select: {
      id: true,
      nome: true,
      inspecoes: {
        where: { status: 'FINALIZADA', finalizadaEm: { gte: inicio, lte: fim } },
        select: { score: true, scoreStatus: true, finalizadaEm: true },
        orderBy: { finalizadaEm: 'asc' },
      },
      _count: { select: { inspecoes: true } },
    },
  })

  const escolasPrev = await prisma.inspecao.groupBy({
    by: ['escolaId'],
    where: {
      tenantId: user.tenantId,
      status: 'FINALIZADA',
      finalizadaEm: { gte: inicioPrev, lte: fimPrev },
    },
    _avg: { score: true },
  })

  const ncsAbertas = await prisma.naoConformidade.groupBy({
    by: ['inspecaoId'],
    where: { tenantId: user.tenantId, status: { in: ['ABERTA', 'EM_ANDAMENTO', 'VENCIDA'] } },
    _count: true,
  })

  // Mapear NCs por escola via inspecoes
  const ncsInspecoesMapa = new Map<string, number>()
  ncsAbertas.forEach((nc) => {
    ncsInspecoesMapa.set(nc.inspecaoId, (ncsInspecoesMapa.get(nc.inspecaoId) ?? 0) + nc._count)
  })

  const ranking: EscolaRanking[] = escolas.map((escola) => {
    const inspecoesComScore = escola.inspecoes.filter((i) => i.score !== null)
    const scoreMedio =
      inspecoesComScore.length > 0
        ? inspecoesComScore.reduce((s, i) => s + (i.score ?? 0), 0) / inspecoesComScore.length
        : 0

    const scoreMediaAnterior =
      escolasPrev.find((ep) => ep.escolaId === escola.id)?._avg.score ?? scoreMedio

    let scoreStatus: ScoreStatus | null = null
    if (scoreMedio >= 90) scoreStatus = 'CONFORME'
    else if (scoreMedio >= 70) scoreStatus = 'ATENCAO'
    else if (scoreMedio > 0) scoreStatus = 'NAO_CONFORME'

    const totalNCs = Array.from(ncsInspecoesMapa.entries())
      .filter(([inspecaoId]) =>
        escola.inspecoes.some((i) => (i as any).id === inspecaoId)
      )
      .reduce((s, [, count]) => s + count, 0)

    const historico = escola.inspecoes
      .filter((i) => i.finalizadaEm && i.score !== null)
      .slice(-7)
      .map((i) => ({
        data: format(i.finalizadaEm!, 'yyyy-MM-dd'),
        score: Math.round(i.score!),
      }))

    return {
      id: escola.id,
      nome: escola.nome,
      scoreMedio: Math.round(scoreMedio),
      scoreStatus,
      totalInspecoes: escola.inspecoes.length,
      ncsAbertas: totalNCs,
      tendencia: Math.round(scoreMedio - scoreMediaAnterior),
      historico,
    }
  })

  const ordenar = filtros.ordenar ?? 'score_desc'
  ranking.sort((a, b) => {
    if (ordenar === 'nome') return a.nome.localeCompare(b.nome)
    if (ordenar === 'score_asc') return a.scoreMedio - b.scoreMedio
    return b.scoreMedio - a.scoreMedio
  })

  return filtros.limite ? ranking.slice(0, filtros.limite) : ranking
}

// ─── DISTRIBUIÇÃO DE NCs ──────────────────────────────────────

export async function buscarDistribuicaoNCs(filtros: {
  periodo: '30d' | '90d'
  escolaId?: string
}): Promise<DistribuicaoNCs> {
  const user = await getServerUser()
  const { inicio, fim } = getPeriodoRange(filtros.periodo as Periodo)

  const whereNC = {
    tenantId: user.tenantId,
    createdAt: { gte: inicio, lte: fim },
    ...(filtros.escolaId
      ? { inspecao: { escolaId: filtros.escolaId } }
      : {}),
  }

  const [porSeveridade, porCategoria, porEscola, evolucaoRaw] = await Promise.all([
    prisma.naoConformidade.groupBy({
      by: ['severidade'],
      where: whereNC,
      _count: { _all: true },
    }),
    prisma.naoConformidade.findMany({
      where: whereNC,
      include: { inspecao: { include: { checklist: { select: { categoria: true } } } } },
    }),
    prisma.naoConformidade.findMany({
      where: whereNC,
      include: { inspecao: { include: { escola: { select: { nome: true } } } } },
    }),
    prisma.naoConformidade.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: inicio, lte: fim } },
      select: { createdAt: true, resolvidaEm: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const totalNCs = porSeveridade.reduce((s, p) => s + p._count._all, 0)

  const severidadeOrdem: Severidade[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']
  const sevResult = severidadeOrdem.map((sev) => {
    const encontrado = porSeveridade.find((p) => p.severidade === sev)
    const total = encontrado?._count._all ?? 0
    return {
      severidade: sev,
      total,
      percentual: totalNCs > 0 ? Math.round((total / totalNCs) * 100) : 0,
    }
  })

  // Por categoria
  const catMapa = new Map<CategoriaChecklist, number>()
  porCategoria.forEach((nc) => {
    const cat = nc.inspecao.checklist.categoria
    catMapa.set(cat, (catMapa.get(cat) ?? 0) + 1)
  })
  const catResult = Array.from(catMapa.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)

  // Por escola
  const escolaMapa = new Map<string, number>()
  porEscola.forEach((nc) => {
    const nome = nc.inspecao.escola.nome
    escolaMapa.set(nome, (escolaMapa.get(nome) ?? 0) + 1)
  })
  const escolaResult = Array.from(escolaMapa.entries())
    .map(([escola, total]) => ({ escola, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Evolução por dia
  const evolMapa = new Map<string, { abertas: number; resolvidas: number }>()
  const dias = parseInt(filtros.periodo)
  for (let i = 0; i < dias; i++) {
    const d = format(subDays(new Date(), dias - 1 - i), 'yyyy-MM-dd')
    evolMapa.set(d, { abertas: 0, resolvidas: 0 })
  }
  evolucaoRaw.forEach((nc) => {
    const dAberta = format(nc.createdAt, 'yyyy-MM-dd')
    const atual = evolMapa.get(dAberta)
    if (atual) atual.abertas++
    if (nc.resolvidaEm) {
      const dResolvida = format(nc.resolvidaEm, 'yyyy-MM-dd')
      const res = evolMapa.get(dResolvida)
      if (res) res.resolvidas++
    }
  })

  const evolucao = Array.from(evolMapa.entries()).map(([data, val]) => ({ data, ...val }))

  return {
    porSeveridade: sevResult,
    porCategoria: catResult,
    porEscola: escolaResult,
    evolucao,
  }
}

// ─── ITENS MAIS REPROVADOS ────────────────────────────────────

export async function buscarItensMaisReprovados(filtros: {
  periodo: '30d' | '90d'
  escolaId?: string
  limite?: number
}): Promise<ItemMaisReprovado[]> {
  const user = await getServerUser()
  const { inicio, fim } = getPeriodoRange(filtros.periodo as Periodo)

  const respostas = await prisma.respostaItem.findMany({
    where: {
      inspecao: {
        tenantId: user.tenantId,
        status: 'FINALIZADA',
        finalizadaEm: { gte: inicio, lte: fim },
        ...(filtros.escolaId ? { escolaId: filtros.escolaId } : {}),
      },
      conforme: { not: null },
    },
    include: {
      item: {
        include: {
          checklist: { select: { nome: true, categoria: true } },
        },
      },
    },
  })

  // Agrupar por item
  const itemMapa = new Map<
    string,
    {
      pergunta: string
      checklistNome: string
      categoria: CategoriaChecklist
      isCritico: boolean
      total: number
      reprovacoes: number
    }
  >()

  respostas.forEach((resp) => {
    const chave = resp.itemId
    const atual = itemMapa.get(chave) ?? {
      pergunta: resp.item.pergunta,
      checklistNome: resp.item.checklist.nome,
      categoria: resp.item.checklist.categoria,
      isCritico: resp.item.isCritico,
      total: 0,
      reprovacoes: 0,
    }
    atual.total++
    if (resp.conforme === false) atual.reprovacoes++
    itemMapa.set(chave, atual)
  })

  const limite = filtros.limite ?? 10
  return Array.from(itemMapa.values())
    .filter((i) => i.reprovacoes > 0)
    .sort((a, b) => b.reprovacoes - a.reprovacoes)
    .slice(0, limite)
    .map((i) => ({
      pergunta: i.pergunta,
      checklistNome: i.checklistNome,
      categoria: i.categoria,
      totalReprovacoes: i.reprovacoes,
      percentualReprovacao: i.total > 0 ? Math.round((i.reprovacoes / i.total) * 100) : 0,
      isCritico: i.isCritico,
    }))
}

// ─── ATIVIDADE DA EQUIPE ──────────────────────────────────────

export async function buscarAtividadeEquipe(filtros: {
  periodo: '30d'
  escolaId?: string
}): Promise<AtividadeMembro[]> {
  const user = await getServerUser()
  const { inicio, fim } = getPeriodoRange(filtros.periodo as Periodo)

  const inspecoes = await prisma.inspecao.findMany({
    where: {
      tenantId: user.tenantId,
      status: 'FINALIZADA',
      finalizadaEm: { gte: inicio, lte: fim },
      ...(filtros.escolaId ? { escolaId: filtros.escolaId } : {}),
    },
    include: {
      inspetor: { select: { id: true, nome: true, papel: true } },
    },
    orderBy: { finalizadaEm: 'desc' },
  })

  const membroMapa = new Map<
    string,
    {
      usuario: { id: string; nome: string; papel: Papel }
      scores: number[]
      count: number
      ultimaAtividade: Date | null
    }
  >()

  inspecoes.forEach((insp) => {
    const uid = insp.inspetor.id
    const atual = membroMapa.get(uid) ?? {
      usuario: insp.inspetor,
      scores: [],
      count: 0,
      ultimaAtividade: null,
    }
    atual.count++
    if (insp.score !== null) atual.scores.push(insp.score)
    if (!atual.ultimaAtividade && insp.finalizadaEm) {
      atual.ultimaAtividade = insp.finalizadaEm
    }
    membroMapa.set(uid, atual)
  })

  return Array.from(membroMapa.values())
    .map((m) => ({
      usuario: m.usuario,
      totalInspecoes: m.count,
      scoreMedio:
        m.scores.length > 0
          ? Math.round(m.scores.reduce((s, v) => s + v, 0) / m.scores.length)
          : 0,
      ultimaAtividade: m.ultimaAtividade,
    }))
    .sort((a, b) => b.totalInspecoes - a.totalInspecoes)
}
