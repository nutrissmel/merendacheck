import { getDB, type CacheEscola, type CacheChecklist } from './db'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// ─── Escolas ──────────────────────────────────────────────────────────────────

export async function cacheEscolas(
  escolas: Array<{ id: string; nome: string; codigo?: string | null; tenantId: string }>
): Promise<void> {
  const db = getDB()
  const now = Date.now()

  const rows: CacheEscola[] = escolas.map((e) => ({
    id: e.id,
    nome: e.nome,
    codigo: e.codigo ?? undefined,
    tenantId: e.tenantId,
    cachedAt: now,
  }))

  await db.escolas.bulkPut(rows)
}

export async function buscarEscolasCache(tenantId: string): Promise<CacheEscola[]> {
  const db = getDB()
  const cutoff = Date.now() - CACHE_TTL_MS

  const escolas = await db.escolas
    .where('tenantId').equals(tenantId)
    .and((e) => e.cachedAt > cutoff)
    .toArray()

  return escolas
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export async function cacheChecklists(
  checklists: Array<{
    id: string
    nome: string
    categoria: string
    tenantId: string
    itens: unknown
  }>
): Promise<void> {
  const db = getDB()
  const now = Date.now()

  const rows: CacheChecklist[] = checklists.map((c) => ({
    id: c.id,
    nome: c.nome,
    categoria: c.categoria,
    tenantId: c.tenantId,
    itens: JSON.stringify(c.itens),
    cachedAt: now,
  }))

  await db.checklists.bulkPut(rows)
}

export async function buscarChecklistsCache(tenantId: string): Promise<
  Array<CacheChecklist & { itensObj: unknown[] }>
> {
  const db = getDB()
  const cutoff = Date.now() - CACHE_TTL_MS

  const rows = await db.checklists
    .where('tenantId').equals(tenantId)
    .and((c) => c.cachedAt > cutoff)
    .toArray()

  return rows.map((r) => ({
    ...r,
    itensObj: JSON.parse(r.itens) as unknown[],
  }))
}

export async function buscarChecklistCache(id: string): Promise<
  (CacheChecklist & { itensObj: unknown[] }) | undefined
> {
  const db = getDB()
  const row = await db.checklists.get(id)
  if (!row) return undefined

  return { ...row, itensObj: JSON.parse(row.itens) as unknown[] }
}
