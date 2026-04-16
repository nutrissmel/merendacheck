/**
 * @jest-environment jsdom
 */

// Dexie uses IndexedDB — fake-indexeddb provides an in-memory implementation
import 'fake-indexeddb/auto'

import { getDB, limparDadosAntigos, type InspecaoLocal } from '../db'
import { criarInspecaoLocal, salvarRespostaLocal, finalizarInspecaoLocal } from '@/hooks/useInspecaoOffline'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inspecaoFixture(overrides: Partial<InspecaoLocal> = {}): Parameters<typeof criarInspecaoLocal>[0] {
  return {
    tenantId: 'tenant-1',
    inspetorId: 'user-1',
    escolaId: 'escola-1',
    checklistId: 'cl-1',
    clienteId: `client-${Date.now()}-${Math.random()}`,
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Clear all tables before each test
  const db = getDB()
  await db.inspecoes.clear()
  await db.respostas.clear()
  await db.fotos.clear()
  await db.escolas.clear()
  await db.checklists.clear()
})

// ─── criarInspecaoLocal ───────────────────────────────────────────────────────

describe('criarInspecaoLocal', () => {
  it('cria uma inspeção com status PENDENTE e EM_ANDAMENTO', async () => {
    const id = await criarInspecaoLocal(inspecaoFixture())
    const db = getDB()
    const insp = await db.inspecoes.get(id)

    expect(insp).toBeDefined()
    expect(insp!.statusSync).toBe('PENDENTE')
    expect(insp!.status).toBe('EM_ANDAMENTO')
    expect(insp!.score).toBe(0)
    expect(insp!.tentativasSync).toBe(0)
  })

  it('gera IDs únicos para cada inspeção', async () => {
    const id1 = await criarInspecaoLocal(inspecaoFixture())
    const id2 = await criarInspecaoLocal(inspecaoFixture())
    expect(id1).not.toBe(id2)
  })

  it('armazena o clienteId corretamente', async () => {
    const clienteId = 'meu-cliente-id-unico'
    const id = await criarInspecaoLocal(inspecaoFixture({ clienteId }))
    const db = getDB()
    const insp = await db.inspecoes.get(id)
    expect(insp!.clienteId).toBe(clienteId)
  })
})

// ─── salvarRespostaLocal ──────────────────────────────────────────────────────

describe('salvarRespostaLocal', () => {
  it('salva uma resposta SIM/NÃO', async () => {
    const inspecaoId = await criarInspecaoLocal(inspecaoFixture())

    await salvarRespostaLocal({
      inspecaoId,
      itemId: 'item-1',
      respostaSimNao: true,
      conforme: true,
    })

    const db = getDB()
    const respostas = await db.respostas.where('inspecaoId').equals(inspecaoId).toArray()
    expect(respostas).toHaveLength(1)
    expect(respostas[0].respostaSimNao).toBe(true)
    expect(respostas[0].conforme).toBe(true)
    expect(respostas[0].statusSync).toBe('PENDENTE')
  })

  it('faz upsert — atualiza resposta existente para o mesmo item', async () => {
    const inspecaoId = await criarInspecaoLocal(inspecaoFixture())

    await salvarRespostaLocal({ inspecaoId, itemId: 'item-1', respostaSimNao: true, conforme: true })
    await salvarRespostaLocal({ inspecaoId, itemId: 'item-1', respostaSimNao: false, conforme: false })

    const db = getDB()
    const respostas = await db.respostas.where('inspecaoId').equals(inspecaoId).toArray()
    expect(respostas).toHaveLength(1)
    expect(respostas[0].respostaSimNao).toBe(false)
    expect(respostas[0].conforme).toBe(false)
  })

  it('salva resposta numérica', async () => {
    const inspecaoId = await criarInspecaoLocal(inspecaoFixture())

    await salvarRespostaLocal({
      inspecaoId,
      itemId: 'item-num',
      respostaNumerica: 3.5,
      conforme: true,
    })

    const db = getDB()
    const resp = await db.respostas.where('inspecaoId').equals(inspecaoId).first()
    expect(resp!.respostaNumerica).toBe(3.5)
  })
})

// ─── finalizarInspecaoLocal ───────────────────────────────────────────────────

describe('finalizarInspecaoLocal', () => {
  it('muda status para FINALIZADA', async () => {
    const id = await criarInspecaoLocal(inspecaoFixture())
    await finalizarInspecaoLocal(id)

    const db = getDB()
    const insp = await db.inspecoes.get(id)
    expect(insp!.status).toBe('FINALIZADA')
    expect(insp!.statusSync).toBe('PENDENTE')
    expect(insp!.finalizadaAt).toBeDefined()
  })

  it('armazena URL de assinatura quando fornecida', async () => {
    const id = await criarInspecaoLocal(inspecaoFixture())
    await finalizarInspecaoLocal(id, 'data:image/png;base64,abc123')

    const db = getDB()
    const insp = await db.inspecoes.get(id)
    expect(insp!.assinaturaUrl).toBe('data:image/png;base64,abc123')
  })
})

// ─── limparDadosAntigos ───────────────────────────────────────────────────────

describe('limparDadosAntigos', () => {
  it('remove inspeções sincronizadas mais antigas que o período de retenção', async () => {
    const db = getDB()
    const velhoTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000 // 31 days ago

    // Insert old synced inspection directly
    await db.inspecoes.add({
      id: 'insp-velha',
      clienteId: 'c-velha',
      tenantId: 'tenant-1',
      inspetorId: 'user-1',
      escolaId: 'escola-1',
      checklistId: 'cl-1',
      status: 'FINALIZADA',
      statusSync: 'SINCRONIZADO',
      score: 100,
      createdAt: velhoTimestamp,
      updatedAt: velhoTimestamp,
      tentativasSync: 0,
    })

    // Add a resposta for it
    await db.respostas.add({
      id: 'resp-velha',
      inspecaoId: 'insp-velha',
      itemId: 'item-1',
      statusSync: 'SINCRONIZADO',
      createdAt: velhoTimestamp,
      updatedAt: velhoTimestamp,
    })

    await limparDadosAntigos(30)

    const insp = await db.inspecoes.get('insp-velha')
    const resp = await db.respostas.get('resp-velha')

    expect(insp).toBeUndefined()
    expect(resp).toBeUndefined()
  })

  it('mantém inspeções recentes sincronizadas', async () => {
    const id = await criarInspecaoLocal(inspecaoFixture())
    const db = getDB()
    await db.inspecoes.update(id, { statusSync: 'SINCRONIZADO' })

    await limparDadosAntigos(30)

    const insp = await db.inspecoes.get(id)
    expect(insp).toBeDefined() // Recent — should NOT be deleted
  })

  it('mantém inspeções pendentes independentemente da data', async () => {
    const db = getDB()
    const velhoTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000

    await db.inspecoes.add({
      id: 'insp-pendente-velha',
      clienteId: 'c-pv',
      tenantId: 'tenant-1',
      inspetorId: 'user-1',
      escolaId: 'escola-1',
      checklistId: 'cl-1',
      status: 'EM_ANDAMENTO',
      statusSync: 'PENDENTE',
      score: 0,
      createdAt: velhoTimestamp,
      updatedAt: velhoTimestamp,
      tentativasSync: 0,
    })

    await limparDadosAntigos(30)

    const insp = await db.inspecoes.get('insp-pendente-velha')
    expect(insp).toBeDefined() // Pending — should NOT be deleted
  })
})
