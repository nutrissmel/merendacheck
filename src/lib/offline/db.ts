import Dexie, { type Table } from 'dexie'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusSync = 'PENDENTE' | 'SINCRONIZANDO' | 'SINCRONIZADO' | 'ERRO'

export interface InspecaoLocal {
  id: string                   // UUID gerado no client
  clienteId: string            // dedup key
  tenantId: string
  inspetorId: string
  escolaId: string
  checklistId: string
  status: 'EM_ANDAMENTO' | 'FINALIZADA'
  statusSync: StatusSync
  score: number
  createdAt: number            // timestamp ms
  updatedAt: number
  finalizadaAt?: number
  assinaturaUrl?: string
  servidorId?: string          // id do servidor após sync
  erroSync?: string
  tentativasSync: number
}

export interface RespostaLocal {
  id: string
  inspecaoId: string           // FK → InspecaoLocal.id
  itemId: string
  respostaSimNao?: boolean
  respostaNumerica?: number
  respostaTexto?: string
  conforme?: boolean
  observacao?: string
  fotoUrl?: string             // URL final pós-upload ou dataUrl local
  statusSync: StatusSync
  createdAt: number
  updatedAt: number
}

export interface FotoLocal {
  id: string
  inspecaoId: string
  itemId: string
  respostaId: string
  dataUrl: string              // base64 da imagem capturada offline
  mimeType: string
  statusSync: StatusSync
  uploadedUrl?: string         // URL pós-upload no Supabase
  createdAt: number
}

export interface CacheEscola {
  id: string
  nome: string
  codigo?: string
  tenantId: string
  cachedAt: number
}

export interface CacheChecklist {
  id: string
  nome: string
  categoria: string
  tenantId: string
  itens: string               // JSON serializado dos itens
  cachedAt: number
}

// ─── Dexie DB ─────────────────────────────────────────────────────────────────

class MerendaCheckDB extends Dexie {
  inspecoes!: Table<InspecaoLocal, string>
  respostas!: Table<RespostaLocal, string>
  fotos!: Table<FotoLocal, string>
  escolas!: Table<CacheEscola, string>
  checklists!: Table<CacheChecklist, string>

  constructor() {
    super('MerendaCheckDB')

    this.version(1).stores({
      inspecoes:  'id, clienteId, tenantId, inspetorId, escolaId, statusSync, status, createdAt',
      respostas:  'id, inspecaoId, itemId, statusSync',
      fotos:      'id, inspecaoId, itemId, respostaId, statusSync',
      escolas:    'id, tenantId, cachedAt',
      checklists: 'id, tenantId, cachedAt',
    })
  }
}

let _db: MerendaCheckDB | null = null

export function getDB(): MerendaCheckDB {
  if (!_db) {
    _db = new MerendaCheckDB()
  }
  return _db
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Removes synced inspections older than `diasRetencao` days and orphaned data */
export async function limparDadosAntigos(diasRetencao = 30): Promise<void> {
  const db = getDB()
  const cutoff = Date.now() - diasRetencao * 24 * 60 * 60 * 1000

  const antigas = await db.inspecoes
    .where('statusSync').equals('SINCRONIZADO')
    .and((i) => i.createdAt < cutoff)
    .toArray()

  const ids = antigas.map((i) => i.id)
  if (ids.length === 0) return

  await db.transaction('rw', db.inspecoes, db.respostas, db.fotos, async () => {
    await db.inspecoes.bulkDelete(ids)
    for (const id of ids) {
      await db.respostas.where('inspecaoId').equals(id).delete()
      await db.fotos.where('inspecaoId').equals(id).delete()
    }
  })
}

/** Clears old escola/checklist caches older than 24h */
export async function limparCacheAntigo(): Promise<void> {
  const db = getDB()
  const cutoff = Date.now() - 24 * 60 * 60 * 1000

  await db.escolas.where('cachedAt').below(cutoff).delete()
  await db.checklists.where('cachedAt').below(cutoff).delete()
}

export type { MerendaCheckDB }
