'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FiltroRelatorio {
  inicio: string // ISO date string
  fim: string    // ISO date string
  escolaId?: string
}

export interface DadosRelatorioInspecoes {
  tenant: { nome: string; nomeSecretaria: string | null; codigoIbge: string; estado: string }
  periodo: { inicio: string; fim: string }
  resumo: {
    totalInspecoes: number
    totalEscolas: number
    scoreMedio: number
    totalNCs: number
    ncsResolvidas: number
    conformidade: number
  }
  porEscola: {
    id: string
    nome: string
    totalInspecoes: number
    scoreMedio: number
    ncsAbertas: number
  }[]
  inspecoes: {
    id: string
    escola: string
    checklist: string
    inspetor: string
    data: string
    score: number | null
    status: string
    totalNCs: number
  }[]
}

export interface DadosRelatorioNCs {
  tenant: { nome: string }
  periodo: { inicio: string; fim: string }
  resumo: {
    total: number
    abertas: number
    resolvidas: number
    vencidas: number
    taxaResolucao: number
  }
  porSeveridade: { severidade: string; total: number; resolvidas: number }[]
  ncs: {
    id: string
    titulo: string
    escola: string
    severidade: string
    status: string
    prazo: string | null
    criacao: string
    checklistNome: string
  }[]
}

export interface DadosFNDE {
  tenant: { nome: string; nomeSecretaria: string | null; codigoIbge: string; estado: string }
  periodo: { inicio: string; fim: string }
  responsavel: { nome: string; email: string }
  escolas: {
    id: string
    nome: string
    codigoInep: string | null
    certificada: boolean
    scoreMedio: number
    totalInspecoes: number
    conformidade: string
  }[]
  totalEscolas: number
  escolasCertificadas: number
}

// ─── Helper de autenticação ───────────────────────────────────────────────────

async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const usuario = await prisma.usuario.findUnique({
    where: { supabaseUserId: user.id },
    include: { tenant: true },
  })
  return usuario
}

// ─── Ações ────────────────────────────────────────────────────────────────────

export async function buscarDadosRelatorioInspecoes(
  filtro: FiltroRelatorio
): Promise<DadosRelatorioInspecoes | null> {
  const usuario = await getUsuarioAutenticado()
  if (!usuario) return null

  const inicio = startOfDay(new Date(filtro.inicio))
  const fim = endOfDay(new Date(filtro.fim))

  const whereBase = {
    tenantId: usuario.tenantId,
    status: 'FINALIZADA' as const,
    finalizadaEm: { gte: inicio, lte: fim },
    ...(filtro.escolaId ? { escolaId: filtro.escolaId } : {}),
  }

  const [inspecoes, escolas] = await Promise.all([
    prisma.inspecao.findMany({
      where: whereBase,
      include: {
        escola: { select: { nome: true } },
        inspetor: { select: { nome: true } },
        checklist: { select: { nome: true } },
        naoConformidades: {
          where: { status: { in: ['ABERTA', 'EM_ANDAMENTO', 'VENCIDA'] } },
          select: { id: true },
        },
        _count: { select: { naoConformidades: true } },
      },
      orderBy: { finalizadaEm: 'desc' },
    }),
    prisma.escola.findMany({
      where: { tenantId: usuario.tenantId, ativa: true },
      select: { id: true, nome: true },
    }),
  ])

  const scores = inspecoes.filter((i) => i.score !== null).map((i) => i.score as number)
  const scoreMedio = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  const totalNCs = inspecoes.reduce((sum, i) => sum + i._count.naoConformidades, 0)
  const ncsResolvidas = await prisma.naoConformidade.count({
    where: {
      tenantId: usuario.tenantId,
      status: 'RESOLVIDA',
      createdAt: { gte: inicio, lte: fim },
    },
  })

  const escolasComInspecoes = new Set(inspecoes.map((i) => i.escolaId))

  const porEscola = escolas
    .filter((e) => escolasComInspecoes.has(e.id))
    .map((escola) => {
      const inspecoesEscola = inspecoes.filter((i) => i.escolaId === escola.id)
      const scoresEscola = inspecoesEscola.filter((i) => i.score !== null).map((i) => i.score as number)
      const ncsAbertas = inspecoesEscola.reduce((sum, i) => sum + i.naoConformidades.length, 0)
      return {
        id: escola.id,
        nome: escola.nome,
        totalInspecoes: inspecoesEscola.length,
        scoreMedio: scoresEscola.length > 0 ? Math.round(scoresEscola.reduce((a, b) => a + b, 0) / scoresEscola.length) : 0,
        ncsAbertas,
      }
    })
    .sort((a, b) => b.scoreMedio - a.scoreMedio)

  return {
    tenant: {
      nome: usuario.tenant.nome,
      nomeSecretaria: usuario.tenant.nomeSecretaria,
      codigoIbge: usuario.tenant.codigoIbge,
      estado: usuario.tenant.estado,
    },
    periodo: { inicio: filtro.inicio, fim: filtro.fim },
    resumo: {
      totalInspecoes: inspecoes.length,
      totalEscolas: escolasComInspecoes.size,
      scoreMedio,
      totalNCs,
      ncsResolvidas,
      conformidade: scores.filter((s) => s >= 70).length > 0
        ? Math.round((scores.filter((s) => s >= 70).length / scores.length) * 100)
        : 0,
    },
    porEscola,
    inspecoes: inspecoes.map((i) => ({
      id: i.id,
      escola: i.escola.nome,
      checklist: i.checklist.nome,
      inspetor: i.inspetor.nome,
      data: i.finalizadaEm?.toISOString() ?? '',
      score: i.score,
      status: i.status,
      totalNCs: i._count.naoConformidades,
    })),
  }
}

export async function buscarDadosRelatorioNCs(
  filtro: FiltroRelatorio
): Promise<DadosRelatorioNCs | null> {
  const usuario = await getUsuarioAutenticado()
  if (!usuario) return null

  const inicio = startOfDay(new Date(filtro.inicio))
  const fim = endOfDay(new Date(filtro.fim))

  const ncs = await prisma.naoConformidade.findMany({
    where: {
      tenantId: usuario.tenantId,
      createdAt: { gte: inicio, lte: fim },
    },
    include: {
      inspecao: {
        include: {
          escola: { select: { nome: true } },
          checklist: { select: { nome: true } },
        },
      },
    },
    orderBy: [{ severidade: 'asc' }, { createdAt: 'desc' }],
  })

  const abertas = ncs.filter((nc) => nc.status === 'ABERTA' || nc.status === 'EM_ANDAMENTO').length
  const resolvidas = ncs.filter((nc) => nc.status === 'RESOLVIDA').length
  const vencidas = ncs.filter((nc) => nc.status === 'VENCIDA').length

  const severidades = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as const
  const porSeveridade = severidades.map((sev) => {
    const grupo = ncs.filter((nc) => nc.severidade === sev)
    return {
      severidade: sev,
      total: grupo.length,
      resolvidas: grupo.filter((nc) => nc.status === 'RESOLVIDA').length,
    }
  }).filter((g) => g.total > 0)

  return {
    tenant: { nome: usuario.tenant.nome },
    periodo: { inicio: filtro.inicio, fim: filtro.fim },
    resumo: {
      total: ncs.length,
      abertas,
      resolvidas,
      vencidas,
      taxaResolucao: ncs.length > 0 ? Math.round((resolvidas / ncs.length) * 100) : 0,
    },
    porSeveridade,
    ncs: ncs.map((nc) => ({
      id: nc.id,
      titulo: nc.titulo,
      escola: nc.inspecao.escola.nome,
      severidade: nc.severidade,
      status: nc.status,
      prazo: nc.prazoResolucao?.toISOString() ?? null,
      criacao: nc.createdAt.toISOString(),
      checklistNome: nc.inspecao.checklist.nome,
    })),
  }
}

export async function buscarDadosFNDE(
  filtro: FiltroRelatorio
): Promise<DadosFNDE | null> {
  const usuario = await getUsuarioAutenticado()
  if (!usuario) return null

  const inicio = startOfDay(new Date(filtro.inicio))
  const fim = endOfDay(new Date(filtro.fim))

  const escolas = await prisma.escola.findMany({
    where: { tenantId: usuario.tenantId, ativa: true },
    include: {
      inspecoes: {
        where: { status: 'FINALIZADA', finalizadaEm: { gte: inicio, lte: fim } },
        select: { score: true, scoreStatus: true },
      },
    },
    orderBy: { nome: 'asc' },
  })

  const escolasFormatadas = escolas.map((escola) => {
    const scores = escola.inspecoes.filter((i) => i.score !== null).map((i) => i.score as number)
    const scoreMedio = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const certificada = scoreMedio >= 70 && escola.inspecoes.length > 0
    return {
      id: escola.id,
      nome: escola.nome,
      codigoInep: escola.codigoInep,
      certificada,
      scoreMedio,
      totalInspecoes: escola.inspecoes.length,
      conformidade: scoreMedio >= 90 ? 'CONFORME' : scoreMedio >= 70 ? 'ATENÇÃO' : scoreMedio > 0 ? 'NÃO CONFORME' : 'SEM DADOS',
    }
  })

  return {
    tenant: {
      nome: usuario.tenant.nome,
      nomeSecretaria: usuario.tenant.nomeSecretaria,
      codigoIbge: usuario.tenant.codigoIbge,
      estado: usuario.tenant.estado,
    },
    periodo: { inicio: filtro.inicio, fim: filtro.fim },
    responsavel: { nome: usuario.nome, email: usuario.email },
    escolas: escolasFormatadas,
    totalEscolas: escolasFormatadas.length,
    escolasCertificadas: escolasFormatadas.filter((e) => e.certificada).length,
  }
}

export async function enviarEmailTesteRelatorio(filtro: FiltroRelatorio): Promise<{ sucesso: boolean; erro?: string }> {
  const usuario = await getUsuarioAutenticado()
  if (!usuario) return { sucesso: false, erro: 'Não autenticado' }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'MerendaCheck <relatorios@merendacheck.com.br>',
      to: [usuario.email],
      subject: `[TESTE] Relatório Mensal — ${usuario.tenant.nome}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0E2E60;">Relatório de Teste</h2>
          <p>Este é um email de teste do relatório automático do <strong>MerendaCheck</strong>.</p>
          <p>Quando ativo, você receberá este email todo dia 1º do mês com o relatório completo em PDF em anexo.</p>
          <p><strong>Período testado:</strong> ${filtro.inicio} a ${filtro.fim}</p>
          <p style="color: #5A7089; font-size: 12px; margin-top: 24px;">
            Este email foi enviado para ${usuario.email} a pedido de ${usuario.nome}.
          </p>
        </div>
      `,
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao enviar email' }
  }
}

export async function buscarEscolasDoTenant() {
  const usuario = await getUsuarioAutenticado()
  if (!usuario) return []

  return prisma.escola.findMany({
    where: { tenantId: usuario.tenantId, ativa: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
}
