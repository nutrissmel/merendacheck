import { getDB, type InspecaoLocal } from './db'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  sucesso: boolean
  inspecaoId: string
  servidorId?: string
  erro?: string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: mimeType })
}

// ─── Sincronizar uma inspeção ─────────────────────────────────────────────────

export async function sincronizarInspecao(inspecaoId: string): Promise<SyncResult> {
  const db = getDB()
  const inspecao = await db.inspecoes.get(inspecaoId)

  if (!inspecao) {
    return { sucesso: false, inspecaoId, erro: 'Inspeção não encontrada localmente' }
  }

  // Mark as syncing
  await db.inspecoes.update(inspecaoId, { statusSync: 'SINCRONIZANDO' })

  try {
    // ── Step 1: Create inspection on server ──────────────────────────────────
    const criarRes = await fetch('/api/sync/inspecao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: inspecao.clienteId,
        escolaId: inspecao.escolaId,
        checklistId: inspecao.checklistId,
        createdAt: new Date(inspecao.createdAt).toISOString(),
      }),
    })

    if (!criarRes.ok) {
      throw new Error(`Erro ao criar inspeção: ${criarRes.status}`)
    }

    const { inspecaoId: servidorId } = await criarRes.json() as { inspecaoId: string }

    // Update local record with server ID
    await db.inspecoes.update(inspecaoId, { servidorId })

    // ── Step 2: Upload photos ─────────────────────────────────────────────────
    const fotos = await db.fotos
      .where('inspecaoId').equals(inspecaoId)
      .and((f) => f.statusSync === 'PENDENTE')
      .toArray()

    const fotoUrlMap: Record<string, string> = {}

    for (const foto of fotos) {
      try {
        const file = await dataUrlToFile(foto.dataUrl, `foto-${foto.id}.jpg`, foto.mimeType)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('inspecaoId', servidorId)
        formData.append('itemId', foto.itemId)

        const uploadRes = await fetch('/api/sync/foto', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const { fotoUrl } = await uploadRes.json() as { fotoUrl: string }
          fotoUrlMap[foto.itemId] = fotoUrl
          await db.fotos.update(foto.id, { statusSync: 'SINCRONIZADO', uploadedUrl: fotoUrl })
        }
      } catch {
        // Non-fatal: continue without this photo
        await db.fotos.update(foto.id, { statusSync: 'ERRO' })
      }
    }

    // ── Step 3: Sync answers ──────────────────────────────────────────────────
    const respostas = await db.respostas
      .where('inspecaoId').equals(inspecaoId)
      .toArray()

    for (const resposta of respostas) {
      const fotoUrl = fotoUrlMap[resposta.itemId] ?? resposta.fotoUrl

      await fetch('/api/sync/resposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspecaoId: servidorId,
          itemId: resposta.itemId,
          respostaSimNao: resposta.respostaSimNao,
          respostaNumerica: resposta.respostaNumerica,
          respostaTexto: resposta.respostaTexto,
          conforme: resposta.conforme,
          observacao: resposta.observacao,
          fotoUrl: fotoUrl?.startsWith('data:') ? undefined : fotoUrl,
        }),
      })

      await db.respostas.update(resposta.id, { statusSync: 'SINCRONIZADO' })
    }

    // ── Step 4: Finalize if needed ────────────────────────────────────────────
    if (inspecao.status === 'FINALIZADA') {
      await fetch('/api/sync/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspecaoId: servidorId,
          assinaturaUrl: inspecao.assinaturaUrl?.startsWith('data:')
            ? undefined
            : inspecao.assinaturaUrl,
        }),
      })
    }

    // ── Step 5: Mark as synced ────────────────────────────────────────────────
    await db.inspecoes.update(inspecaoId, {
      statusSync: 'SINCRONIZADO',
      servidorId,
      erroSync: undefined,
    })

    return { sucesso: true, inspecaoId, servidorId }

  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'

    await db.inspecoes.update(inspecaoId, {
      statusSync: 'ERRO',
      erroSync: mensagem,
      tentativasSync: (inspecao.tentativasSync ?? 0) + 1,
    })

    return { sucesso: false, inspecaoId, erro: mensagem }
  }
}

// ─── Sincronizar tudo ─────────────────────────────────────────────────────────

const MAX_TENTATIVAS = 5
const BACKOFF_BASE_MS = 2000

export async function sincronizarTudo(): Promise<SyncResult[]> {
  const db = getDB()

  const pendentes = await db.inspecoes
    .where('statusSync').anyOf(['PENDENTE', 'ERRO'])
    .and((i) => (i.tentativasSync ?? 0) < MAX_TENTATIVAS)
    .toArray()

  const resultados: SyncResult[] = []

  for (const inspecao of pendentes) {
    // Exponential backoff
    const tentativas = inspecao.tentativasSync ?? 0
    if (tentativas > 0) {
      const delay = BACKOFF_BASE_MS * Math.pow(2, tentativas - 1)
      await new Promise((r) => setTimeout(r, delay))
    }

    const resultado = await sincronizarInspecao(inspecao.id)
    resultados.push(resultado)
  }

  return resultados
}

// ─── Count pending ────────────────────────────────────────────────────────────

export async function contarPendentes(): Promise<number> {
  const db = getDB()
  return db.inspecoes
    .where('statusSync').anyOf(['PENDENTE', 'ERRO'])
    .and((i) => (i.tentativasSync ?? 0) < MAX_TENTATIVAS)
    .count()
}
