'use server'

import { revalidatePath } from 'next/cache'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcularScore } from '@/lib/utils'
import {
  iniciarInspecaoSchema,
  salvarRespostaSchema,
  finalizarInspecaoSchema,
} from '@/lib/validations'
import type { StatusInspecao, Severidade } from '@prisma/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export type IniciarInspecaoInput = {
  escolaId: string
  checklistId: string
  clienteId?: string
}

export type SalvarRespostaInput = {
  inspecaoId: string
  itemId: string
  respostaSimNao?: boolean
  respostaNumerica?: number
  respostaTexto?: string
  conforme?: boolean | null
  observacao?: string
}

export type FinalizarInspecaoInput = {
  inspecaoId: string
  assinaturaUrl?: string
  latLng?: string
}

export type InspecaoResumo = {
  id: string
  escola: { id: string; nome: string }
  checklist: { id: string; nome: string; categoria: string }
  inspetor: { id: string; nome: string }
  status: StatusInspecao
  score: number | null
  scoreStatus: string | null
  iniciadaEm: Date
  finalizadaEm: Date | null
  totalRespostas: number
}

export type InspecaoCompleta = {
  id: string
  tenantId: string
  escolaId: string
  escola: { id: string; nome: string; cidade: string | null }
  checklistId: string
  checklist: {
    id: string
    nome: string
    categoria: string
    itens: Array<{
      id: string
      ordem: number
      pergunta: string
      descricao: string | null
      tipoResposta: string
      obrigatorio: boolean
      isCritico: boolean
      fotoObrigatoria: boolean
      valorMinimo: number | null
      valorMaximo: number | null
      unidade: string | null
      opcoes: string[]
      peso: number
    }>
  }
  inspetorId: string
  inspetor: { id: string; nome: string }
  status: StatusInspecao
  score: number | null
  scoreStatus: string | null
  iniciadaEm: Date
  finalizadaEm: Date | null
  latLng: string | null
  assinaturaUrl: string | null
  respostas: Array<{
    id: string
    itemId: string
    respostaSimNao: boolean | null
    respostaNumerica: number | null
    respostaTexto: string | null
    conforme: boolean | null
    fotoUrl: string | null
    observacao: string | null
  }>
  naoConformidades: Array<{
    id: string
    itemId: string
    titulo: string
    severidade: Severidade
    status: string
  }>
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function iniciarInspecaoAction(input: IniciarInspecaoInput) {
  try {
    const user = await getServerUser()
    const parsed = iniciarInspecaoSchema.safeParse(input)
    if (!parsed.success) {
      return { erro: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }
    const { escolaId, checklistId, clienteId } = parsed.data

    // Dedup by clienteId (offline sync)
    if (clienteId) {
      const existente = await prisma.inspecao.findUnique({
        where: { clienteId },
        select: { id: true },
      })
      if (existente) {
        return { sucesso: true, inspecaoId: existente.id }
      }
    }

    // Check escola belongs to tenant
    const escola = await prisma.escola.findFirst({
      where: { id: escolaId, tenantId: user.tenantId },
      select: { id: true },
    })
    if (!escola) return { erro: 'Escola não encontrada' }

    // Check checklist belongs to tenant
    const checklist = await prisma.checklistModelo.findFirst({
      where: {
        id: checklistId,
        OR: [{ tenantId: user.tenantId }, { isTemplate: true }],
        ativo: true,
      },
      select: { id: true, itens: { select: { id: true } } },
    })
    if (!checklist) return { erro: 'Checklist não encontrado ou inativo' }

    // Check for em_andamento inspection for same school+checklist by same inspector
    const emAndamento = await prisma.inspecao.findFirst({
      where: {
        tenantId: user.tenantId,
        escolaId,
        checklistId,
        inspetorId: user.id,
        status: 'EM_ANDAMENTO',
      },
      select: { id: true },
    })
    if (emAndamento) {
      return { sucesso: true, inspecaoId: emAndamento.id, inspecaoExistenteId: emAndamento.id }
    }

    // Check if already applied today
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const jaHoje = await prisma.inspecao.findFirst({
      where: {
        tenantId: user.tenantId,
        escolaId,
        checklistId,
        status: 'FINALIZADA',
        finalizadaEm: { gte: hoje, lt: amanha },
      },
      select: { id: true },
    })

    const inspecao = await prisma.inspecao.create({
      data: {
        tenantId: user.tenantId,
        escolaId,
        checklistId,
        inspetorId: user.id,
        status: 'EM_ANDAMENTO',
        clienteId: clienteId ?? null,
      },
    })

    revalidatePath('/inspecoes')

    return {
      sucesso: true,
      inspecaoId: inspecao.id,
      jaAplicadoHoje: !!jaHoje,
    }
  } catch (e) {
    console.error('iniciarInspecaoAction', e)
    return { erro: 'Erro ao iniciar inspeção' }
  }
}

export async function salvarRespostaAction(input: SalvarRespostaInput) {
  try {
    const user = await getServerUser()
    const parsed = salvarRespostaSchema.safeParse(input)
    if (!parsed.success) {
      return { erro: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }
    const { inspecaoId, itemId, respostaSimNao, respostaNumerica, respostaTexto, conforme, observacao } = parsed.data

    // Verify ownership
    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId, status: 'EM_ANDAMENTO' },
      select: {
        id: true,
        checklistId: true,
        checklist: { select: { itens: { select: { id: true, peso: true, isCritico: true } } } },
      },
    })
    if (!inspecao) return { erro: 'Inspeção não encontrada ou já finalizada' }

    // Upsert resposta
    await prisma.respostaItem.upsert({
      where: { inspecaoId_itemId: { inspecaoId, itemId } },
      create: {
        inspecaoId,
        itemId,
        respostaSimNao: respostaSimNao ?? null,
        respostaNumerica: respostaNumerica ?? null,
        respostaTexto: respostaTexto ?? null,
        conforme: conforme ?? null,
        observacao: observacao ?? null,
      },
      update: {
        respostaSimNao: respostaSimNao ?? null,
        respostaNumerica: respostaNumerica ?? null,
        respostaTexto: respostaTexto ?? null,
        conforme: conforme ?? null,
        observacao: observacao ?? null,
      },
    })

    // Recalculate score
    const todasRespostas = await prisma.respostaItem.findMany({
      where: { inspecaoId },
      select: { itemId: true, conforme: true },
    })

    const { score, scoreStatus } = calcularScore(
      inspecao.checklist.itens as any,
      todasRespostas
    )

    await prisma.inspecao.update({
      where: { id: inspecaoId },
      data: { score: Math.round(score * 10) / 10, scoreStatus },
    })

    return { sucesso: true, score: Math.round(score) }
  } catch (e) {
    console.error('salvarRespostaAction', e)
    return { erro: 'Erro ao salvar resposta' }
  }
}

export async function uploadFotoItemAction(formData: FormData) {
  try {
    const user = await getServerUser()
    const file = formData.get('file') as File | null
    const inspecaoId = formData.get('inspecaoId') as string | null
    const itemId = formData.get('itemId') as string | null

    if (!file || !inspecaoId || !itemId) {
      return { erro: 'Dados incompletos para upload' }
    }

    // Verify ownership
    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId, status: 'EM_ANDAMENTO' },
      select: { id: true },
    })
    if (!inspecao) return { erro: 'Inspeção não encontrada' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const timestamp = Date.now()
    const path = `${user.tenantId}/${inspecaoId}/${itemId}/${timestamp}.${ext}`

    const supabase = createAdminClient()

    // Garante que o bucket existe (cria automaticamente se não existir)
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExiste = buckets?.some((b) => b.name === 'inspections')
    if (!bucketExiste) {
      const { error: bucketError } = await supabase.storage.createBucket('inspections', {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      })
      if (bucketError) {
        console.error('Erro ao criar bucket inspections:', bucketError)
        return { erro: `Bucket de armazenamento não configurado: ${bucketError.message}` }
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from('inspections')
      .upload(path, arrayBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Storage upload error:', error.message, error)
      return { erro: `Erro ao salvar foto: ${error.message}` }
    }

    const { data: urlData } = supabase.storage.from('inspections').getPublicUrl(path)
    const fotoUrl = urlData.publicUrl

    // Update resposta with fotoUrl
    await prisma.respostaItem.upsert({
      where: { inspecaoId_itemId: { inspecaoId, itemId } },
      create: { inspecaoId, itemId, conforme: null, fotoUrl },
      update: { fotoUrl },
    })

    return { sucesso: true, fotoUrl }
  } catch (e) {
    console.error('uploadFotoItemAction', e)
    return { erro: 'Erro ao processar foto' }
  }
}

export async function finalizarInspecaoAction(input: FinalizarInspecaoInput) {
  try {
    const user = await getServerUser()
    const parsed = finalizarInspecaoSchema.safeParse(input)
    if (!parsed.success) {
      return { erro: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }
    const { inspecaoId, assinaturaUrl, latLng } = parsed.data

    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId, status: 'EM_ANDAMENTO' },
      select: {
        id: true,
        escolaId: true,
        checklist: {
          select: {
            itens: {
              select: {
                id: true,
                pergunta: true,
                obrigatorio: true,
                isCritico: true,
                peso: true,
              },
              orderBy: { ordem: 'asc' },
            },
          },
        },
        respostas: {
          select: { itemId: true, conforme: true },
        },
      },
    })

    if (!inspecao) return { erro: 'Inspeção não encontrada ou já finalizada' }

    // Validate mandatory items
    const itensPendentes = inspecao.checklist.itens.filter((item) => {
      if (!item.obrigatorio) return false
      const resp = inspecao.respostas.find((r) => r.itemId === item.id)
      return !resp || resp.conforme === null
    })

    if (itensPendentes.length > 0) {
      return {
        erro: `${itensPendentes.length} item(ns) obrigatório(s) sem resposta`,
        itensPendentes: itensPendentes.map((i) => i.id),
      }
    }

    const { score, scoreStatus, temCriticoReprovado } = calcularScore(
      inspecao.checklist.itens as any,
      inspecao.respostas
    )

    // Build NC list for non-conforming items
    const naoConformidades = inspecao.checklist.itens
      .filter((item) => {
        const resp = inspecao.respostas.find((r) => r.itemId === item.id)
        return resp && resp.conforme === false
      })
      .map((item) => ({
        tenantId: user.tenantId,
        inspecaoId,
        itemId: item.id,
        titulo: item.pergunta.slice(0, 100),
        severidade: (item.isCritico ? 'CRITICA' : 'MEDIA') as Severidade,
        status: 'ABERTA' as const,
        prazoResolucao: (() => {
          const d = new Date()
          d.setDate(d.getDate() + (item.isCritico ? 2 : 7))
          return d
        })(),
      }))

    await prisma.$transaction(async (tx) => {
      await tx.inspecao.update({
        where: { id: inspecaoId },
        data: {
          status: 'FINALIZADA',
          finalizadaEm: new Date(),
          score: Math.round(score * 10) / 10,
          scoreStatus,
          assinaturaUrl: assinaturaUrl || null,
          latLng: latLng || null,
        },
      })

      if (naoConformidades.length > 0) {
        await tx.naoConformidade.createMany({ data: naoConformidades })
      }
    })

    revalidatePath('/inspecoes')
    revalidatePath(`/inspecoes/${inspecaoId}`)
    revalidatePath('/dashboard')

    return {
      sucesso: true,
      score: Math.round(score),
      scoreStatus,
      temCriticoReprovado,
      totalNCs: naoConformidades.length,
    }
  } catch (e) {
    console.error('finalizarInspecaoAction', e)
    return { erro: 'Erro ao finalizar inspeção' }
  }
}

export async function cancelarInspecaoAction(inspecaoId: string) {
  try {
    const user = await getServerUser()

    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId, status: 'EM_ANDAMENTO' },
      select: { id: true, inspetorId: true },
    })

    if (!inspecao) return { erro: 'Inspeção não encontrada' }

    const podeGerenciar = ['SUPER_ADMIN', 'ADMIN_MUNICIPAL', 'NUTRICIONISTA'].includes(user.papel)
    if (inspecao.inspetorId !== user.id && !podeGerenciar) {
      return { erro: 'Sem permissão para cancelar esta inspeção' }
    }

    await prisma.inspecao.update({
      where: { id: inspecaoId },
      data: { status: 'CANCELADA' },
    })

    revalidatePath('/inspecoes')

    return { sucesso: true }
  } catch (e) {
    console.error('cancelarInspecaoAction', e)
    return { erro: 'Erro ao cancelar inspeção' }
  }
}

export async function listarInspecoes(filtros?: {
  status?: StatusInspecao
  escolaId?: string
  checklistId?: string
  inspetorId?: string
  categoria?: string
  busca?: string
  dataInicio?: Date
  dataFim?: Date
  page?: number
  limit?: number
}) {
  try {
    const user = await getServerUser()
    const page = filtros?.page ?? 1
    const limit = filtros?.limit ?? 20
    const skip = (page - 1) * limit

    const isAdmin = ['SUPER_ADMIN', 'ADMIN_MUNICIPAL', 'NUTRICIONISTA'].includes(user.papel)

    const where: any = { tenantId: user.tenantId }

    if (!isAdmin) {
      if (user.papel === 'MERENDEIRA') where.inspetorId = user.id
      if (user.papel === 'DIRETOR_ESCOLA') where.inspetorId = user.id
    }

    if (filtros?.status) where.status = filtros.status
    if (filtros?.escolaId) where.escolaId = filtros.escolaId
    if (filtros?.checklistId) where.checklistId = filtros.checklistId
    if (filtros?.inspetorId && isAdmin) where.inspetorId = filtros.inspetorId
    if (filtros?.categoria) where.checklist = { categoria: filtros.categoria }
    if (filtros?.busca) where.escola = { nome: { contains: filtros.busca, mode: 'insensitive' } }
    if (filtros?.dataInicio || filtros?.dataFim) {
      where.iniciadaEm = {
        ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
        ...(filtros.dataFim   ? { lte: filtros.dataFim   } : {}),
      }
    }

    const [total, inspecoes] = await Promise.all([
      prisma.inspecao.count({ where }),
      prisma.inspecao.findMany({
        where,
        orderBy: { iniciadaEm: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          score: true,
          scoreStatus: true,
          iniciadaEm: true,
          finalizadaEm: true,
          escola: { select: { id: true, nome: true } },
          checklist: { select: { id: true, nome: true, categoria: true } },
          inspetor: { select: { id: true, nome: true } },
          _count: { select: { respostas: true } },
        },
      }),
    ])

    const lista: InspecaoResumo[] = inspecoes.map((i) => ({
      id: i.id,
      escola: i.escola,
      checklist: { id: i.checklist.id, nome: i.checklist.nome, categoria: i.checklist.categoria },
      inspetor: i.inspetor,
      status: i.status,
      score: i.score,
      scoreStatus: i.scoreStatus,
      iniciadaEm: i.iniciadaEm,
      finalizadaEm: i.finalizadaEm,
      totalRespostas: i._count.respostas,
    }))

    return { lista, total, paginas: Math.ceil(total / limit) }
  } catch (e) {
    console.error('listarInspecoes', e)
    return { lista: [], total: 0, paginas: 0 }
  }
}

export async function buscarInspecaoParaResponder(inspecaoId: string) {
  try {
    const user = await getServerUser()

    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId },
      select: {
        id: true,
        status: true,
        inspetorId: true,
        escola: { select: { id: true, nome: true } },
        checklist: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            itens: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                ordem: true,
                pergunta: true,
                descricao: true,
                tipoResposta: true,
                obrigatorio: true,
                isCritico: true,
                fotoObrigatoria: true,
                valorMinimo: true,
                valorMaximo: true,
                unidade: true,
                opcoes: true,
                peso: true,
              },
            },
          },
        },
        respostas: {
          select: {
            id: true,
            itemId: true,
            respostaSimNao: true,
            respostaNumerica: true,
            respostaTexto: true,
            conforme: true,
            fotoUrl: true,
            observacao: true,
          },
        },
      },
    })

    if (!inspecao) return null
    return inspecao
  } catch (e) {
    console.error('buscarInspecaoParaResponder', e)
    return null
  }
}

export async function buscarInspecaoCompleta(inspecaoId: string): Promise<InspecaoCompleta | null> {
  try {
    const user = await getServerUser()

    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId },
      select: {
        id: true,
        tenantId: true,
        escolaId: true,
        checklistId: true,
        inspetorId: true,
        status: true,
        score: true,
        scoreStatus: true,
        iniciadaEm: true,
        finalizadaEm: true,
        latLng: true,
        assinaturaUrl: true,
        escola: { select: { id: true, nome: true, cidade: true } },
        checklist: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            itens: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                ordem: true,
                pergunta: true,
                descricao: true,
                tipoResposta: true,
                obrigatorio: true,
                isCritico: true,
                fotoObrigatoria: true,
                valorMinimo: true,
                valorMaximo: true,
                unidade: true,
                opcoes: true,
                peso: true,
              },
            },
          },
        },
        inspetor: { select: { id: true, nome: true } },
        respostas: {
          select: {
            id: true,
            itemId: true,
            respostaSimNao: true,
            respostaNumerica: true,
            respostaTexto: true,
            conforme: true,
            fotoUrl: true,
            observacao: true,
          },
        },
        naoConformidades: {
          select: {
            id: true,
            itemId: true,
            titulo: true,
            severidade: true,
            status: true,
          },
        },
      },
    })

    if (!inspecao) return null
    return inspecao as InspecaoCompleta
  } catch (e) {
    console.error('buscarInspecaoCompleta', e)
    return null
  }
}
