'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getDB, type InspecaoLocal, type RespostaLocal, type FotoLocal } from '@/lib/offline/db'
import { calcularScore } from '@/lib/utils'

function uuid(): string {
  return crypto.randomUUID()
}

// ─── Criar inspeção local ─────────────────────────────────────────────────────

export interface CriarInspecaoLocalInput {
  tenantId: string
  inspetorId: string
  escolaId: string
  checklistId: string
  clienteId: string
}

export async function criarInspecaoLocal(input: CriarInspecaoLocalInput): Promise<string> {
  const db = getDB()
  const id = uuid()
  const now = Date.now()

  await db.inspecoes.add({
    id,
    clienteId: input.clienteId,
    tenantId: input.tenantId,
    inspetorId: input.inspetorId,
    escolaId: input.escolaId,
    checklistId: input.checklistId,
    status: 'EM_ANDAMENTO',
    statusSync: 'PENDENTE',
    score: 0,
    createdAt: now,
    updatedAt: now,
    tentativasSync: 0,
  })

  return id
}

// ─── Salvar resposta local ────────────────────────────────────────────────────

export interface SalvarRespostaLocalInput {
  inspecaoId: string
  itemId: string
  respostaSimNao?: boolean
  respostaNumerica?: number
  respostaTexto?: string
  conforme?: boolean
  observacao?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  todosItens?: any[]
}

export async function salvarRespostaLocal(input: SalvarRespostaLocalInput): Promise<void> {
  const db = getDB()
  const now = Date.now()

  const existing = await db.respostas
    .where('inspecaoId').equals(input.inspecaoId)
    .and((r) => r.itemId === input.itemId)
    .first()

  const respostaId = existing?.id ?? uuid()

  const resposta: RespostaLocal = {
    id: respostaId,
    inspecaoId: input.inspecaoId,
    itemId: input.itemId,
    respostaSimNao: input.respostaSimNao,
    respostaNumerica: input.respostaNumerica,
    respostaTexto: input.respostaTexto,
    conforme: input.conforme,
    observacao: input.observacao,
    fotoUrl: existing?.fotoUrl,
    statusSync: 'PENDENTE',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await db.respostas.put(resposta)

  // Recalculate score
  if (input.todosItens) {
    const todasRespostas = await db.respostas
      .where('inspecaoId').equals(input.inspecaoId)
      .toArray()

    const { score } = calcularScore(input.todosItens, todasRespostas)
    await db.inspecoes.update(input.inspecaoId, { score, updatedAt: now, statusSync: 'PENDENTE' })
  }
}

// ─── Salvar foto local ────────────────────────────────────────────────────────

export interface SalvarFotoLocalInput {
  inspecaoId: string
  itemId: string
  respostaId: string
  dataUrl: string
  mimeType?: string
}

export async function salvarFotoLocal(input: SalvarFotoLocalInput): Promise<string> {
  const db = getDB()
  const id = uuid()
  const now = Date.now()

  // Remove old foto for same item
  const old = await db.fotos
    .where('inspecaoId').equals(input.inspecaoId)
    .and((f) => f.itemId === input.itemId)
    .first()

  if (old) await db.fotos.delete(old.id)

  const foto: FotoLocal = {
    id,
    inspecaoId: input.inspecaoId,
    itemId: input.itemId,
    respostaId: input.respostaId,
    dataUrl: input.dataUrl,
    mimeType: input.mimeType ?? 'image/jpeg',
    statusSync: 'PENDENTE',
    createdAt: now,
  }

  await db.fotos.add(foto)

  // Update resposta with local dataUrl as placeholder
  await db.respostas.update(input.respostaId, {
    fotoUrl: input.dataUrl,
    updatedAt: now,
    statusSync: 'PENDENTE',
  })

  return id
}

// ─── Finalizar inspeção local ─────────────────────────────────────────────────

export async function finalizarInspecaoLocal(
  inspecaoId: string,
  assinaturaUrl?: string
): Promise<void> {
  const db = getDB()
  const now = Date.now()

  await db.inspecoes.update(inspecaoId, {
    status: 'FINALIZADA',
    statusSync: 'PENDENTE',
    finalizadaAt: now,
    updatedAt: now,
    assinaturaUrl,
  })
}

// ─── Buscar inspeção em andamento ─────────────────────────────────────────────

export async function buscarEmAndamentoLocal(
  inspetorId: string,
  escolaId: string,
  checklistId: string
): Promise<InspecaoLocal | undefined> {
  const db = getDB()
  return db.inspecoes
    .where('inspetorId').equals(inspetorId)
    .and((i) =>
      i.escolaId === escolaId &&
      i.checklistId === checklistId &&
      i.status === 'EM_ANDAMENTO'
    )
    .first()
}

// ─── Hooks reativos ───────────────────────────────────────────────────────────

export function useTotalPendentes(): number {
  return (useLiveQuery(async () => {
    const db = getDB()
    return db.inspecoes.where('statusSync').anyOf(['PENDENTE', 'ERRO']).count()
  }, [], 0) as number)
}

export function useInspecaoLocalAtiva(inspecaoId: string) {
  return useLiveQuery(
    () => getDB().inspecoes.get(inspecaoId),
    [inspecaoId]
  )
}

export function useRespostasLocais(inspecaoId: string): RespostaLocal[] {
  return (useLiveQuery(
    () => getDB().respostas.where('inspecaoId').equals(inspecaoId).toArray(),
    [inspecaoId],
    []
  ) as RespostaLocal[])
}

// Re-export types used by consumers
export type { InspecaoLocal, RespostaLocal, FotoLocal }
