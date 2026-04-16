'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { registrarAuditoria } from '@/lib/auditoria'
import { createClient } from '@supabase/supabase-js'
import { differenceInDays, subDays } from 'date-fns'
import type { Severidade, StatusNC, Prioridade, StatusAcao } from '@prisma/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type NaoConformidadeResumo = {
  id: string
  titulo: string
  severidade: Severidade
  status: StatusNC
  prazoResolucao: Date | null
  resolvidaEm: Date | null
  createdAt: Date
  diasEmAberto: number
  estaVencida: boolean
  escola: { id: string; nome: string }
  inspecao: { id: string; checklist: { nome: string; categoria: string } }
  totalAcoes: number
  acoesConcluidas: number
  proximaAcao: { responsavel: string; prazo: Date | null } | null
}

export type AcaoCompletada = {
  id: string
  descricao: string
  prioridade: Prioridade
  status: StatusAcao
  prazo: Date | null
  estaVencida: boolean
  responsavel: { id: string; nome: string; email: string } | null
  evidenciaUrl: string | null
  observacaoConclusao: string | null
  concluidaEm: Date | null
  createdAt: Date
}

export type HistoricoEvento = {
  id: string
  tipo: 'NC_GERADA' | 'PRAZO_DEFINIDO' | 'ACAO_CRIADA' | 'ACAO_CONCLUIDA' | 'NC_RESOLVIDA' | 'NC_REABERTA'
  descricao: string
  timestamp: Date
  concluido: boolean
}

export type NaoConformidadeDetalhada = NaoConformidadeResumo & {
  descricao: string | null
  itemOrigem: { pergunta: string; isCritico: boolean }
  acoes: AcaoCompletada[]
  historico: HistoricoEvento[]
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const INCLUDE_NC_COMPLETA = {
  inspecao: {
    include: {
      escola: { select: { id: true, nome: true } },
      checklist: { select: { nome: true, categoria: true } },
    },
  },
  acoes: {
    include: {
      responsavel: { select: { id: true, nome: true, email: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

function mapNcResumo(nc: {
  id: string
  titulo: string
  severidade: Severidade
  status: StatusNC
  prazoResolucao: Date | null
  resolvidaEm: Date | null
  createdAt: Date
  inspecao: {
    id: string
    escola: { id: string; nome: string }
    checklist: { nome: string; categoria: string }
  }
  acoes: Array<{
    status: StatusAcao
    prazo: Date | null
    responsavel: { nome: string } | null
  }>
}): NaoConformidadeResumo {
  const agora = new Date()
  const estaVencida =
    nc.prazoResolucao !== null &&
    nc.prazoResolucao < agora &&
    nc.status !== 'RESOLVIDA'

  const acoesConcluidas = nc.acoes.filter((a) => a.status === 'CONCLUIDA').length
  const proximaAberta = nc.acoes.find(
    (a) => a.status !== 'CONCLUIDA' && a.status !== 'VENCIDA'
  )

  return {
    id: nc.id,
    titulo: nc.titulo,
    severidade: nc.severidade,
    status: nc.status,
    prazoResolucao: nc.prazoResolucao,
    resolvidaEm: nc.resolvidaEm,
    createdAt: nc.createdAt,
    diasEmAberto: differenceInDays(nc.resolvidaEm ?? agora, nc.createdAt),
    estaVencida,
    escola: nc.inspecao.escola,
    inspecao: {
      id: nc.inspecao.id,
      checklist: {
        nome: nc.inspecao.checklist.nome,
        categoria: nc.inspecao.checklist.categoria,
      },
    },
    totalAcoes: nc.acoes.length,
    acoesConcluidas,
    proximaAcao: proximaAberta
      ? {
          responsavel: proximaAberta.responsavel?.nome ?? 'Sem responsável',
          prazo: proximaAberta.prazo,
        }
      : null,
  }
}

async function getEscolasDoUsuario(userId: string): Promise<string[]> {
  const vinculos = await prisma.usuarioEscola.findMany({
    where: { usuarioId: userId },
    select: { escolaId: true },
  })
  return vinculos.map((v) => v.escolaId)
}

async function verificarResolucaoAutomaticaNC(ncId: string): Promise<boolean> {
  const nc = await prisma.naoConformidade.findUnique({
    where: { id: ncId },
    include: { acoes: { select: { status: true } } },
  })

  if (!nc || nc.status === 'RESOLVIDA') return false
  if (nc.acoes.length === 0) return false

  const todasConcluidas = nc.acoes.every((a) => a.status === 'CONCLUIDA')
  if (!todasConcluidas) return false

  await prisma.naoConformidade.update({
    where: { id: ncId },
    data: { status: 'RESOLVIDA', resolvidaEm: new Date() },
  })

  return true
}

// ─── Listar NCs ───────────────────────────────────────────────────────────────

export async function listarNaoConformidades(filtros?: {
  escolaId?: string
  severidade?: Severidade
  status?: StatusNC
  dataInicio?: Date
  dataFim?: Date
  apenasVencidas?: boolean
  apenasMinhas?: boolean
  busca?: string
  pagina?: number
  porPagina?: number
  ordenarPor?: 'createdAt' | 'prazoResolucao' | 'severidade'
  ordem?: 'asc' | 'desc'
}): Promise<{
  ncs: NaoConformidadeResumo[]
  total: number
  paginas: number
  totalAberta: number
  totalVencida: number
  totalResolvida: number
}> {
  const user = await getServerUser()
  const agora = new Date()

  // Permission-based escola filter
  let escolaIds: string[] | undefined
  if (user.papel === 'MERENDEIRA' || user.papel === 'DIRETOR_ESCOLA') {
    escolaIds = await getEscolasDoUsuario(user.id)
    if (escolaIds.length === 0) {
      return { ncs: [], total: 0, paginas: 0, totalAberta: 0, totalVencida: 0, totalResolvida: 0 }
    }
  }

  const pagina = filtros?.pagina ?? 1
  const porPagina = filtros?.porPagina ?? 20
  const skip = (pagina - 1) * porPagina

  const where = {
    tenantId: user.tenantId,
    ...(filtros?.escolaId && {
      inspecao: { escolaId: filtros.escolaId },
    }),
    ...(escolaIds && !filtros?.escolaId && {
      inspecao: { escolaId: { in: escolaIds } },
    }),
    ...(filtros?.severidade && { severidade: filtros.severidade }),
    ...(filtros?.status && { status: filtros.status }),
    ...(filtros?.dataInicio || filtros?.dataFim
      ? {
          createdAt: {
            ...(filtros.dataInicio && { gte: filtros.dataInicio }),
            ...(filtros.dataFim && { lte: filtros.dataFim }),
          },
        }
      : {}),
    ...(filtros?.apenasVencidas && {
      prazoResolucao: { lt: agora },
      status: { notIn: ['RESOLVIDA'] as StatusNC[] },
    }),
    ...(filtros?.apenasMinhas && {
      acoes: { some: { responsavelId: user.id } },
    }),
    ...(filtros?.busca && {
      titulo: { contains: filtros.busca, mode: 'insensitive' as const },
    }),
  }

  const severidadeOrder: Record<Severidade, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2, CRITICA: 3 }

  let orderBy: object | object[]
  switch (filtros?.ordenarPor) {
    case 'prazoResolucao':
      orderBy = { prazoResolucao: filtros?.ordem ?? 'asc' }
      break
    case 'severidade':
      // Custom — fallback to createdAt since Prisma doesn't sort enums by custom order
      orderBy = [{ createdAt: filtros?.ordem ?? 'desc' }]
      break
    default:
      orderBy = { createdAt: filtros?.ordem ?? 'desc' }
  }

  const [ncsRaw, total, totalAberta, totalVencida, totalResolvida] = await Promise.all([
    prisma.naoConformidade.findMany({
      where,
      include: INCLUDE_NC_COMPLETA,
      orderBy,
      skip,
      take: porPagina,
    }),
    prisma.naoConformidade.count({ where }),
    prisma.naoConformidade.count({ where: { tenantId: user.tenantId, status: 'ABERTA' } }),
    prisma.naoConformidade.count({
      where: {
        tenantId: user.tenantId,
        prazoResolucao: { lt: agora },
        status: { notIn: ['RESOLVIDA'] },
      },
    }),
    prisma.naoConformidade.count({ where: { tenantId: user.tenantId, status: 'RESOLVIDA' } }),
  ])

  let ncs = ncsRaw.map(mapNcResumo)

  // Client-side sort for severidade (enum priority)
  if (filtros?.ordenarPor === 'severidade') {
    const dir = filtros?.ordem === 'asc' ? 1 : -1
    ncs = ncs.sort((a, b) => dir * (severidadeOrder[a.severidade] - severidadeOrder[b.severidade]))
  }

  return {
    ncs,
    total,
    paginas: Math.ceil(total / porPagina),
    totalAberta,
    totalVencida,
    totalResolvida,
  }
}

// ─── Buscar NC por ID ─────────────────────────────────────────────────────────

export async function buscarNcById(ncId: string): Promise<NaoConformidadeDetalhada | null> {
  const user = await getServerUser()

  const nc = await prisma.naoConformidade.findFirst({
    where: { id: ncId, tenantId: user.tenantId },
    include: {
      ...INCLUDE_NC_COMPLETA,
      inspecao: {
        include: {
          escola: { select: { id: true, nome: true } },
          checklist: { select: { nome: true, categoria: true } },
        },
      },
    },
  })

  if (!nc) return null

  // Buscar item origem
  const item = await prisma.checklistItem.findUnique({
    where: { id: nc.itemId },
    select: { pergunta: true, isCritico: true },
  })

  const agora = new Date()

  const acoes: AcaoCompletada[] = nc.acoes.map((a) => ({
    id: a.id,
    descricao: a.descricao,
    prioridade: a.prioridade,
    status: a.status,
    prazo: a.prazo,
    estaVencida: a.prazo !== null && a.prazo < agora && a.status !== 'CONCLUIDA',
    responsavel: a.responsavel
      ? { id: a.responsavel.id, nome: a.responsavel.nome, email: a.responsavel.email }
      : null,
    evidenciaUrl: a.evidenciaUrl,
    observacaoConclusao: a.observacaoConclusao,
    concluidaEm: a.concluidaEm,
    createdAt: a.createdAt,
  }))

  // Build timeline history
  const historico: HistoricoEvento[] = []

  historico.push({
    id: `${nc.id}-gerada`,
    tipo: 'NC_GERADA',
    descricao: 'Não conformidade gerada automaticamente pela inspeção',
    timestamp: nc.createdAt,
    concluido: true,
  })

  if (nc.prazoResolucao) {
    historico.push({
      id: `${nc.id}-prazo`,
      tipo: 'PRAZO_DEFINIDO',
      descricao: `Prazo de resolução definido`,
      timestamp: nc.createdAt,
      concluido: false,
    })
  }

  for (const acao of nc.acoes) {
    historico.push({
      id: `${acao.id}-criada`,
      tipo: 'ACAO_CRIADA',
      descricao: `Ação criada${acao.responsavel ? ` → atribuída a ${acao.responsavel.nome}` : ''}`,
      timestamp: acao.createdAt,
      concluido: false,
    })

    if (acao.status === 'CONCLUIDA' && acao.concluidaEm) {
      historico.push({
        id: `${acao.id}-concluida`,
        tipo: 'ACAO_CONCLUIDA',
        descricao: `Ação concluída${acao.observacaoConclusao ? `: "${acao.observacaoConclusao.substring(0, 60)}${acao.observacaoConclusao.length > 60 ? '…' : ''}"` : ''}`,
        timestamp: acao.concluidaEm,
        concluido: true,
      })
    }
  }

  if (nc.status === 'RESOLVIDA' && nc.resolvidaEm) {
    const dias = differenceInDays(nc.resolvidaEm, nc.createdAt)
    historico.push({
      id: `${nc.id}-resolvida`,
      tipo: 'NC_RESOLVIDA',
      descricao: `NC resolvida — ${dias} dia${dias !== 1 ? 's' : ''} após abertura`,
      timestamp: nc.resolvidaEm,
      concluido: true,
    })
  }

  historico.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const resumo = mapNcResumo(nc)

  return {
    ...resumo,
    descricao: nc.descricao,
    itemOrigem: {
      pergunta: item?.pergunta ?? 'Item não encontrado',
      isCritico: item?.isCritico ?? false,
    },
    acoes,
    historico,
  }
}

// ─── Atualizar NC ─────────────────────────────────────────────────────────────

export async function atualizarNcAction(
  ncId: string,
  data: {
    titulo?: string
    descricao?: string
    severidade?: Severidade
    prazoResolucao?: Date | null
  }
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    const nc = await prisma.naoConformidade.findFirst({
      where: { id: ncId, tenantId: user.tenantId },
    })
    if (!nc) return { sucesso: false, erro: 'NC não encontrada' }

    await prisma.naoConformidade.update({
      where: { id: ncId },
      data: {
        ...(data.titulo !== undefined && { titulo: data.titulo }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.severidade !== undefined && { severidade: data.severidade }),
        ...(data.prazoResolucao !== undefined && { prazoResolucao: data.prazoResolucao }),
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'NC_ATUALIZADA',
      alvoId: ncId,
    })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${ncId}`)
    return { sucesso: true }
  } catch (err) {
    console.error('[atualizarNcAction]', err)
    return { sucesso: false, erro: 'Erro ao atualizar NC' }
  }
}

// ─── Resolver NC manualmente ──────────────────────────────────────────────────

export async function resolverNcManualAction(
  ncId: string,
  observacao: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Permissão negada' }
    }

    const nc = await prisma.naoConformidade.findFirst({
      where: { id: ncId, tenantId: user.tenantId },
      include: {
        inspecao: { include: { escola: { select: { nome: true } } } },
      },
    })
    if (!nc) return { sucesso: false, erro: 'NC não encontrada' }

    await prisma.naoConformidade.update({
      where: { id: ncId },
      data: {
        status: 'RESOLVIDA',
        resolvidaEm: new Date(),
        descricao: nc.descricao
          ? `${nc.descricao}\n\n[Resolução manual] ${observacao}`
          : `[Resolução manual] ${observacao}`,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'NC_RESOLVIDA_MANUAL',
      alvoId: ncId,
      detalhes: { observacao },
    })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${ncId}`)
    revalidatePath('/dashboard')
    return { sucesso: true }
  } catch (err) {
    console.error('[resolverNcManualAction]', err)
    return { sucesso: false, erro: 'Erro ao resolver NC' }
  }
}

// ─── Reabrir NC ───────────────────────────────────────────────────────────────

export async function reabrirNcAction(
  ncId: string,
  motivo: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Permissão negada' }
    }

    const nc = await prisma.naoConformidade.findFirst({
      where: { id: ncId, tenantId: user.tenantId },
    })
    if (!nc) return { sucesso: false, erro: 'NC não encontrada' }
    if (nc.status !== 'RESOLVIDA') return { sucesso: false, erro: 'Apenas NCs resolvidas podem ser reabertas' }

    await prisma.naoConformidade.update({
      where: { id: ncId },
      data: {
        status: 'ABERTA',
        resolvidaEm: null,
        descricao: nc.descricao
          ? `${nc.descricao}\n\n[Reaberta] ${motivo}`
          : `[Reaberta] ${motivo}`,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'NC_REABERTA',
      alvoId: ncId,
      detalhes: { motivo },
    })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${ncId}`)
    return { sucesso: true }
  } catch (err) {
    console.error('[reabrirNcAction]', err)
    return { sucesso: false, erro: 'Erro ao reabrir NC' }
  }
}

// ─── Criar ação corretiva ─────────────────────────────────────────────────────

export async function criarAcaoAction(
  ncId: string,
  data: {
    descricao: string
    responsavelId?: string
    prazo?: Date
    prioridade: Prioridade
  }
): Promise<{ sucesso: true; acaoId: string } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Apenas nutricionistas podem criar ações' }
    }

    const nc = await prisma.naoConformidade.findFirst({
      where: { id: ncId, tenantId: user.tenantId },
    })
    if (!nc) return { sucesso: false, erro: 'NC não encontrada' }

    const acao = await prisma.acaoCorretiva.create({
      data: {
        naoConformidadeId: ncId,
        descricao: data.descricao,
        responsavelId: data.responsavelId ?? null,
        prazo: data.prazo ?? null,
        prioridade: data.prioridade,
        status: 'ABERTA',
      },
      include: { responsavel: { select: { nome: true, email: true } } },
    })

    // Move NC to EM_ANDAMENTO if still ABERTA
    if (nc.status === 'ABERTA') {
      await prisma.naoConformidade.update({
        where: { id: ncId },
        data: { status: 'EM_ANDAMENTO' },
      })
    }

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'ACAO_CRIADA',
      alvoId: acao.id,
      detalhes: { ncId, responsavelId: data.responsavelId },
    })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${ncId}`)

    return { sucesso: true, acaoId: acao.id }
  } catch (err) {
    console.error('[criarAcaoAction]', err)
    return { sucesso: false, erro: 'Erro ao criar ação' }
  }
}

// ─── Atualizar ação ───────────────────────────────────────────────────────────

export async function atualizarAcaoAction(
  acaoId: string,
  data: {
    descricao?: string
    responsavelId?: string
    prazo?: Date | null
    prioridade?: Prioridade
    status?: StatusAcao
  }
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    const acao = await prisma.acaoCorretiva.findFirst({
      where: { id: acaoId },
      include: { naoConformidade: { select: { tenantId: true, id: true } } },
    })

    if (!acao || acao.naoConformidade.tenantId !== user.tenantId) {
      return { sucesso: false, erro: 'Ação não encontrada' }
    }

    await prisma.acaoCorretiva.update({
      where: { id: acaoId },
      data: {
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.responsavelId !== undefined && { responsavelId: data.responsavelId }),
        ...(data.prazo !== undefined && { prazo: data.prazo }),
        ...(data.prioridade !== undefined && { prioridade: data.prioridade }),
        ...(data.status !== undefined && { status: data.status }),
      },
    })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${acao.naoConformidade.id}`)
    return { sucesso: true }
  } catch (err) {
    console.error('[atualizarAcaoAction]', err)
    return { sucesso: false, erro: 'Erro ao atualizar ação' }
  }
}

// ─── Concluir ação ────────────────────────────────────────────────────────────

export async function concluirAcaoAction(data: {
  acaoId: string
  observacaoConclusao: string
  evidenciaUrl?: string
}): Promise<{ sucesso: true; ncResolvida: boolean } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    const acao = await prisma.acaoCorretiva.findFirst({
      where: { id: data.acaoId },
      include: { naoConformidade: { select: { tenantId: true, id: true } } },
    })

    if (!acao || acao.naoConformidade.tenantId !== user.tenantId) {
      return { sucesso: false, erro: 'Ação não encontrada' }
    }

    // DIRETOR_ESCOLA e MERENDEIRA só podem concluir se forem responsáveis
    if (['DIRETOR_ESCOLA', 'MERENDEIRA'].includes(user.papel)) {
      if (acao.responsavelId !== user.id) {
        return { sucesso: false, erro: 'Você não é responsável por esta ação' }
      }
    }

    await prisma.acaoCorretiva.update({
      where: { id: data.acaoId },
      data: {
        status: 'CONCLUIDA',
        observacaoConclusao: data.observacaoConclusao,
        evidenciaUrl: data.evidenciaUrl ?? null,
        concluidaEm: new Date(),
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'ACAO_CONCLUIDA',
      alvoId: data.acaoId,
    })

    const ncResolvida = await verificarResolucaoAutomaticaNC(acao.naoConformidade.id)

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${acao.naoConformidade.id}`)
    revalidatePath('/dashboard')

    return { sucesso: true, ncResolvida }
  } catch (err) {
    console.error('[concluirAcaoAction]', err)
    return { sucesso: false, erro: 'Erro ao concluir ação' }
  }
}

// ─── Upload de evidência ──────────────────────────────────────────────────────

export async function uploadEvidenciaAcaoAction(
  acaoId: string,
  formData: FormData
): Promise<{ sucesso: true; evidenciaUrl: string } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    const file = formData.get('file') as File | null

    if (!file) return { sucesso: false, erro: 'Arquivo não enviado' }

    const ext = file.type.split('/')[1] ?? 'jpg'
    const path = `${user.tenantId}/evidencias/${acaoId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from('inspecao-fotos')
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

    if (error) return { sucesso: false, erro: error.message }

    const { data: { publicUrl } } = supabase.storage
      .from('inspecao-fotos')
      .getPublicUrl(path)

    return { sucesso: true, evidenciaUrl: publicUrl }
  } catch (err) {
    console.error('[uploadEvidenciaAcaoAction]', err)
    return { sucesso: false, erro: 'Erro ao fazer upload' }
  }
}

// ─── Remover ação ─────────────────────────────────────────────────────────────

export async function removerAcaoAction(
  acaoId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Permissão negada' }
    }

    const acao = await prisma.acaoCorretiva.findFirst({
      where: { id: acaoId },
      include: { naoConformidade: { select: { tenantId: true, id: true } } },
    })

    if (!acao || acao.naoConformidade.tenantId !== user.tenantId) {
      return { sucesso: false, erro: 'Ação não encontrada' }
    }

    if (acao.status !== 'ABERTA') {
      return { sucesso: false, erro: 'Apenas ações abertas podem ser removidas' }
    }

    if (acao.evidenciaUrl) {
      return { sucesso: false, erro: 'Ações com evidências não podem ser removidas' }
    }

    await prisma.acaoCorretiva.delete({ where: { id: acaoId } })

    revalidatePath('/nao-conformidades')
    revalidatePath(`/nao-conformidades/${acao.naoConformidade.id}`)
    return { sucesso: true }
  } catch (err) {
    console.error('[removerAcaoAction]', err)
    return { sucesso: false, erro: 'Erro ao remover ação' }
  }
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

export async function buscarMetricasNC(filtros?: {
  escolaId?: string
  periodo?: '7d' | '30d' | '90d'
}): Promise<{
  totalAberta: number
  totalVencida: number
  totalResolvida: number
  tempMedioResolucaoDias: number
  ncsPorSeveridade: Record<Severidade, number>
  ncsPorEscola: { escola: string; total: number; abertas: number }[]
  tendencia: { data: Date; total: number }[]
}> {
  const user = await getServerUser()
  const agora = new Date()

  const diasPeriodo = filtros?.periodo === '7d' ? 7 : filtros?.periodo === '90d' ? 90 : 30
  const inicio = subDays(agora, diasPeriodo)

  const escolaFilter = filtros?.escolaId
    ? { inspecao: { escolaId: filtros.escolaId } }
    : {}

  const baseWhere = { tenantId: user.tenantId, ...escolaFilter }

  const [totalAberta, totalVencida, totalResolvida, resolvidasComData, porSeveridade, ncsEscola] =
    await Promise.all([
      prisma.naoConformidade.count({ where: { ...baseWhere, status: 'ABERTA' } }),
      prisma.naoConformidade.count({
        where: { ...baseWhere, prazoResolucao: { lt: agora }, status: { notIn: ['RESOLVIDA'] } },
      }),
      prisma.naoConformidade.count({ where: { ...baseWhere, status: 'RESOLVIDA' } }),
      prisma.naoConformidade.findMany({
        where: { ...baseWhere, status: 'RESOLVIDA', resolvidaEm: { not: null } },
        select: { createdAt: true, resolvidaEm: true },
      }),
      prisma.naoConformidade.groupBy({
        by: ['severidade'],
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.naoConformidade.findMany({
        where: { ...baseWhere, createdAt: { gte: inicio } },
        select: {
          status: true,
          inspecao: { select: { escola: { select: { nome: true } } } },
        },
      }),
    ])

  const tempMedio =
    resolvidasComData.length > 0
      ? resolvidasComData.reduce((acc, nc) => {
          return acc + differenceInDays(nc.resolvidaEm!, nc.createdAt)
        }, 0) / resolvidasComData.length
      : 0

  const ncsPorSeveridade: Record<Severidade, number> = {
    BAIXA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0,
  }
  for (const g of porSeveridade) {
    ncsPorSeveridade[g.severidade] = g._count.id
  }

  // Escola breakdown
  const escolaMap = new Map<string, { escola: string; total: number; abertas: number }>()
  for (const nc of ncsEscola as Array<{ status: StatusNC; inspecao: { escola: { nome: string } } }>) {
    const nome = nc.inspecao.escola.nome
    const existing: { escola: string; total: number; abertas: number } = escolaMap.get(nome) ?? { escola: nome, total: 0, abertas: 0 }
    existing.total++
    if (nc.status === 'ABERTA' || nc.status === 'EM_ANDAMENTO') existing.abertas++
    escolaMap.set(nome, existing)
  }

  // Tendency last 30 days
  const tendencia: { data: Date; total: number }[] = []
  const ncs30d = await prisma.naoConformidade.findMany({
    where: { ...baseWhere, createdAt: { gte: subDays(agora, 30) } },
    select: { createdAt: true },
  })

  for (let i = 29; i >= 0; i--) {
    const dia = subDays(agora, i)
    const total = ncs30d.filter((nc) => {
      const d = new Date(nc.createdAt)
      return (
        d.getDate() === dia.getDate() &&
        d.getMonth() === dia.getMonth() &&
        d.getFullYear() === dia.getFullYear()
      )
    }).length
    tendencia.push({ data: dia, total })
  }

  return {
    totalAberta,
    totalVencida,
    totalResolvida,
    tempMedioResolucaoDias: Math.round(tempMedio * 10) / 10,
    ncsPorSeveridade,
    ncsPorEscola: Array.from(escolaMap.values()).sort((a, b) => b.total - a.total),
    tendencia,
  }
}
