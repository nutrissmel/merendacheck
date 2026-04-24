'use server'

import prisma from '@/lib/prisma'
import { requirePapel, getServerUser, tenantWhere } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { CategoriaChecklist, Frequencia, TipoResposta, ChecklistItem } from '@prisma/client'

// ─── TIPOS ────────────────────────────────────────────────────

export type CriarItemInput = {
  pergunta: string
  descricao?: string
  tipoResposta: TipoResposta
  obrigatorio: boolean
  isCritico: boolean
  fotoObrigatoria: boolean
  valorMinimo?: number
  valorMaximo?: number
  unidade?: string
  opcoes?: string[]
  peso: number
  secao?: string
}

export type ChecklistComContagem = {
  id: string
  nome: string
  descricao: string | null
  categoria: CategoriaChecklist
  categoriaPersonalizada: string | null
  frequencia: Frequencia
  ativo: boolean
  isTemplate: boolean
  totalItens: number
  itensCriticos: number
  totalInspecoes: number
  createdAt: Date
  updatedAt: Date
}

export type ChecklistDetalhado = ChecklistComContagem & {
  itens: ChecklistItem[]
}

// ─── HELPERS ──────────────────────────────────────────────────

function buildWhereClause(
  user: AuthUser,
  filtros?: {
    busca?: string
    categoria?: CategoriaChecklist
    frequencia?: Frequencia
    ativo?: boolean
    apenasTemplates?: boolean
    apenasPropriosTenant?: boolean
  }
) {
  const PAPEIS_OPERACIONAIS = ['NUTRICIONISTA', 'DIRETOR_ESCOLA', 'MERENDEIRA'] as const
  const isOperacional = (PAPEIS_OPERACIONAIS as readonly string[]).includes(user.papel)
  const isSuperAdmin = user.papel === 'SUPER_ADMIN'

  // Papéis operacionais veem apenas o Checklist SMEL entre os templates globais
  const templateFilter = isOperacional
    ? { isTemplate: true, nome: 'Checklist SMEL' }
    : { isTemplate: true }

  const baseFilter = filtros?.apenasTemplates
    ? templateFilter
    : filtros?.apenasPropriosTenant
    ? { tenantId: user.tenantId, isTemplate: false }
    : isSuperAdmin
    ? {}
    : { OR: [{ tenantId: user.tenantId }, templateFilter] }

  return {
    AND: [
      baseFilter,
      filtros?.busca
        ? { nome: { contains: filtros.busca, mode: 'insensitive' as const } }
        : {},
      filtros?.categoria ? { categoria: filtros.categoria } : {},
      filtros?.frequencia ? { frequencia: filtros.frequencia } : {},
      filtros?.ativo !== undefined ? { ativo: filtros.ativo } : {},
    ],
  }
}

// ─── LISTAR ───────────────────────────────────────────────────

export async function listarChecklists(filtros?: {
  busca?: string
  categoria?: CategoriaChecklist
  frequencia?: Frequencia
  ativo?: boolean
  apenasTemplates?: boolean
  apenasPropriosTenant?: boolean
}): Promise<ChecklistComContagem[]> {
  const user = await getServerUser()

  const checklists = await prisma.checklistModelo.findMany({
    where: buildWhereClause(user, filtros),
    orderBy: [{ isTemplate: 'desc' }, { nome: 'asc' }],
    include: {
      _count: { select: { inspecoes: true } },
      itens: { select: { isCritico: true } },
    },
  })

  return checklists.map((c) => ({
    id: c.id,
    nome: c.nome,
    descricao: c.descricao,
    categoria: c.categoria,
    categoriaPersonalizada: c.categoriaPersonalizada,
    frequencia: c.frequencia,
    ativo: c.ativo,
    isTemplate: c.isTemplate,
    totalItens: c.itens.length,
    itensCriticos: c.itens.filter((i) => i.isCritico).length,
    totalInspecoes: c._count.inspecoes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

// ─── BUSCAR POR ID ────────────────────────────────────────────

export async function buscarChecklistById(
  checklistId: string
): Promise<ChecklistDetalhado | null> {
  const user = await getServerUser()

  const checklist = await prisma.checklistModelo.findFirst({
    where: {
      id: checklistId,
      OR: [{ tenantId: user.tenantId }, { isTemplate: true }],
    },
    include: {
      _count: { select: { inspecoes: true } },
      itens: { orderBy: { ordem: 'asc' } },
    },
  })

  if (!checklist) return null

  return {
    id: checklist.id,
    nome: checklist.nome,
    descricao: checklist.descricao,
    categoria: checklist.categoria,
    categoriaPersonalizada: checklist.categoriaPersonalizada,
    frequencia: checklist.frequencia,
    ativo: checklist.ativo,
    isTemplate: checklist.isTemplate,
    totalItens: checklist.itens.length,
    itensCriticos: checklist.itens.filter((i) => i.isCritico).length,
    totalInspecoes: checklist._count.inspecoes,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
    itens: checklist.itens,
  }
}

// ─── CRIAR DO ZERO ────────────────────────────────────────────

export async function criarChecklistAction(data: {
  nome: string
  descricao?: string
  categoria: CategoriaChecklist
  categoriaPersonalizada?: string
  frequencia: Frequencia
}): Promise<{ sucesso: true; checklistId: string } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  if (!data.nome || data.nome.trim().length < 3) {
    return { sucesso: false, erro: 'Nome deve ter pelo menos 3 caracteres' }
  }

  const checklist = await prisma.checklistModelo.create({
    data: {
      tenantId: user.tenantId,
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      categoria: data.categoria,
      categoriaPersonalizada: data.categoria === 'OUTRO' ? (data.categoriaPersonalizada?.trim() || null) : null,
      frequencia: data.frequencia,
      isTemplate: false,
      ativo: true,
    },
  })

  revalidatePath('/checklists')
  return { sucesso: true, checklistId: checklist.id }
}

// ─── CRIAR A PARTIR DE TEMPLATE ───────────────────────────────

export async function criarAPartirDeTemplateAction(
  templateId: string,
  novoNome?: string
): Promise<{ sucesso: true; checklistId: string } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const template = await prisma.checklistModelo.findFirst({
    where: { id: templateId, isTemplate: true },
    include: { itens: { orderBy: { ordem: 'asc' } } },
  })

  if (!template) return { sucesso: false, erro: 'Template não encontrado.' }

  const novoChecklist = await prisma.checklistModelo.create({
    data: {
      tenantId: user.tenantId,
      nome: novoNome?.trim() || `${template.nome} (cópia)`,
      descricao: template.descricao,
      categoria: template.categoria,
      frequencia: template.frequencia,
      isTemplate: false,
      ativo: true,
      itens: {
        create: template.itens.map((item) => ({
          ordem: item.ordem,
          pergunta: item.pergunta,
          descricao: item.descricao,
          tipoResposta: item.tipoResposta,
          obrigatorio: item.obrigatorio,
          isCritico: item.isCritico,
          fotoObrigatoria: item.fotoObrigatoria,
          valorMinimo: item.valorMinimo,
          valorMaximo: item.valorMaximo,
          unidade: item.unidade,
          opcoes: item.opcoes,
          peso: item.peso,
        })),
      },
    },
  })

  revalidatePath('/checklists')
  return { sucesso: true, checklistId: novoChecklist.id }
}

// ─── DUPLICAR ─────────────────────────────────────────────────

export async function duplicarChecklistAction(
  checklistId: string
): Promise<{ sucesso: true; checklistId: string } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const original = await prisma.checklistModelo.findFirst({
    where: {
      id: checklistId,
      OR: [{ tenantId: user.tenantId }, { isTemplate: true }],
    },
    include: { itens: { orderBy: { ordem: 'asc' } } },
  })

  if (!original) return { sucesso: false, erro: 'Checklist não encontrado.' }

  const copia = await prisma.checklistModelo.create({
    data: {
      tenantId: user.tenantId,
      nome: `${original.nome} (cópia)`,
      descricao: original.descricao,
      categoria: original.categoria,
      frequencia: original.frequencia,
      isTemplate: false,
      ativo: true,
      itens: {
        create: original.itens.map((item) => ({
          ordem: item.ordem,
          pergunta: item.pergunta,
          descricao: item.descricao,
          tipoResposta: item.tipoResposta,
          obrigatorio: item.obrigatorio,
          isCritico: item.isCritico,
          fotoObrigatoria: item.fotoObrigatoria,
          valorMinimo: item.valorMinimo,
          valorMaximo: item.valorMaximo,
          unidade: item.unidade,
          opcoes: item.opcoes,
          peso: item.peso,
        })),
      },
    },
  })

  revalidatePath('/checklists')
  return { sucesso: true, checklistId: copia.id }
}

// ─── ATUALIZAR ────────────────────────────────────────────────

export async function atualizarChecklistAction(
  checklistId: string,
  data: Partial<{
    nome: string
    descricao: string
    categoria: CategoriaChecklist
    categoriaPersonalizada: string
    frequencia: Frequencia
  }>
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const checklist = await prisma.checklistModelo.findFirst({
    where: { id: checklistId, tenantId: user.tenantId, isTemplate: false },
  })

  if (!checklist) return { sucesso: false, erro: 'Checklist não encontrado ou sem permissão.' }

  const novaCategoria = data.categoria ?? checklist.categoria
  await prisma.checklistModelo.update({
    where: { id: checklistId },
    data: {
      ...(data.nome !== undefined && { nome: data.nome.trim() }),
      ...(data.descricao !== undefined && { descricao: data.descricao.trim() || null }),
      ...(data.categoria !== undefined && { categoria: data.categoria }),
      ...(data.frequencia !== undefined && { frequencia: data.frequencia }),
      categoriaPersonalizada: novaCategoria === 'OUTRO'
        ? (data.categoriaPersonalizada?.trim() || null)
        : null,
    },
  })

  revalidatePath('/checklists')
  revalidatePath(`/checklists/${checklistId}`)
  revalidatePath(`/checklists/${checklistId}/editar`)
  return { sucesso: true }
}

// ─── TOGGLE ATIVO ─────────────────────────────────────────────

export async function toggleChecklistAtivoAction(
  checklistId: string
): Promise<{ sucesso: true; ativo: boolean } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const checklist = await prisma.checklistModelo.findFirst({
    where: { id: checklistId, tenantId: user.tenantId, isTemplate: false },
  })

  if (!checklist) return { sucesso: false, erro: 'Checklist não encontrado ou sem permissão.' }

  const atualizado = await prisma.checklistModelo.update({
    where: { id: checklistId },
    data: { ativo: !checklist.ativo },
  })

  revalidatePath('/checklists')
  return { sucesso: true, ativo: atualizado.ativo }
}

// ─── ADICIONAR ITEM ───────────────────────────────────────────

export async function adicionarItemAction(
  checklistId: string,
  data: CriarItemInput
): Promise<{ sucesso: true; item: ChecklistItem } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const checklist = await prisma.checklistModelo.findFirst({
    where: { id: checklistId, tenantId: user.tenantId },
    include: { _count: { select: { itens: true } } },
  })

  if (!checklist) return { sucesso: false, erro: 'Checklist não encontrado.' }

  const proxOrdem = checklist._count.itens + 1

  const item = await prisma.checklistItem.create({
    data: {
      checklistId,
      ordem: proxOrdem,
      pergunta: data.pergunta.trim(),
      descricao: data.descricao?.trim() || null,
      tipoResposta: data.tipoResposta,
      obrigatorio: data.obrigatorio,
      isCritico: data.isCritico,
      fotoObrigatoria: data.tipoResposta === 'FOTO' ? true : data.fotoObrigatoria,
      valorMinimo: data.valorMinimo ?? null,
      valorMaximo: data.valorMaximo ?? null,
      unidade: data.unidade?.trim() || null,
      opcoes: data.opcoes ?? [],
      peso: data.peso,
    },
  })

  revalidatePath(`/checklists/${checklistId}/editar`)
  return { sucesso: true, item }
}

// ─── ATUALIZAR ITEM ───────────────────────────────────────────

export async function atualizarItemAction(
  itemId: string,
  data: Partial<CriarItemInput>
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const item = await prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklist: { tenantId: user.tenantId },
    },
    include: { checklist: { select: { id: true } } },
  })

  if (!item) return { sucesso: false, erro: 'Item não encontrado.' }

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(data.pergunta !== undefined && { pergunta: data.pergunta.trim() }),
      ...(data.descricao !== undefined && { descricao: data.descricao?.trim() || null }),
      ...(data.tipoResposta !== undefined && { tipoResposta: data.tipoResposta }),
      ...(data.obrigatorio !== undefined && { obrigatorio: data.obrigatorio }),
      ...(data.isCritico !== undefined && { isCritico: data.isCritico }),
      ...(data.fotoObrigatoria !== undefined && {
        fotoObrigatoria: data.tipoResposta === 'FOTO' ? true : data.fotoObrigatoria,
      }),
      ...(data.valorMinimo !== undefined && { valorMinimo: data.valorMinimo }),
      ...(data.valorMaximo !== undefined && { valorMaximo: data.valorMaximo }),
      ...(data.unidade !== undefined && { unidade: data.unidade?.trim() || null }),
      ...(data.opcoes !== undefined && { opcoes: data.opcoes }),
      ...(data.peso !== undefined && { peso: data.peso }),
      ...(data.secao !== undefined && { secao: data.secao?.trim() || null }),
    },
  })

  revalidatePath(`/checklists/${item.checklist.id}/editar`)
  return { sucesso: true }
}

// ─── RENOMEAR SEÇÃO ───────────────────────────────────────────

export async function renomearSecaoAction(
  checklistId: string,
  _secaoAtual: string,
  _novaSecao: string,
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const checklist = await prisma.checklistModelo.findFirst({
    where: { id: checklistId, tenantId: user.tenantId, isTemplate: false },
  })
  if (!checklist) return { sucesso: false, erro: 'Checklist não encontrado.' }

  revalidatePath(`/checklists/${checklistId}/editar`)
  return { sucesso: true }
}

// ─── REMOVER ITEM ─────────────────────────────────────────────

export async function removerItemAction(
  itemId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const item = await prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklist: { tenantId: user.tenantId },
    },
    include: {
      checklist: { select: { id: true } },
      _count: { select: { respostas: true } },
    },
  })

  if (!item) return { sucesso: false, erro: 'Item não encontrado.' }

  if (item._count.respostas > 0) {
    return {
      sucesso: false,
      erro: 'Este item possui respostas em inspeções já realizadas e não pode ser removido.',
    }
  }

  await prisma.checklistItem.delete({ where: { id: itemId } })

  // Reordenar os demais itens
  const itensRestantes = await prisma.checklistItem.findMany({
    where: { checklistId: item.checklist.id },
    orderBy: { ordem: 'asc' },
  })

  await prisma.$transaction(
    itensRestantes.map((it, idx) =>
      prisma.checklistItem.update({
        where: { id: it.id },
        data: { ordem: idx + 1 },
      })
    )
  )

  revalidatePath(`/checklists/${item.checklist.id}/editar`)
  return { sucesso: true }
}

// ─── REORDENAR ITENS ──────────────────────────────────────────

export async function reordenarItensAction(
  checklistId: string,
  idsNaOrdem: string[]
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await requirePapel(['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'])

  const checklist = await prisma.checklistModelo.findFirst({
    where: { id: checklistId, tenantId: user.tenantId },
  })

  if (!checklist) return { sucesso: false, erro: 'Checklist não encontrado.' }

  await prisma.$transaction(
    idsNaOrdem.map((id, idx) =>
      prisma.checklistItem.update({
        where: { id },
        data: { ordem: idx + 1 },
      })
    )
  )

  revalidatePath(`/checklists/${checklistId}/editar`)
  return { sucesso: true }
}
