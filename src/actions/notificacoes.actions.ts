'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NotificacaoItem {
  id: string
  tipo: string
  titulo: string
  texto: string
  url: string | null
  lida: boolean
  createdAt: Date
}

export interface PrefsNotif {
  emailNcCritica: boolean
  emailNcResolvida: boolean
  emailNcVencida: boolean
  emailAgendamento: boolean
  emailInspecaoReprovada: boolean
  pushNcCritica: boolean
  pushNcResolvida: boolean
  pushNcVencida: boolean
  pushAgendamento: boolean
  pushInspecaoReprovada: boolean
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export async function buscarNotificacoes(limite = 15): Promise<NotificacaoItem[]> {
  const user = await getServerUser()

  const notifs = await prisma.notificacao.findMany({
    where: { usuarioId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limite,
  })

  return notifs.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    texto: n.texto,
    url: n.url,
    lida: n.lida,
    createdAt: n.createdAt,
  }))
}

export async function contarNaoLidas(): Promise<number> {
  const user = await getServerUser()
  return prisma.notificacao.count({
    where: { usuarioId: user.id, lida: false },
  })
}

export async function marcarComoLida(id: string): Promise<void> {
  const user = await getServerUser()
  await prisma.notificacao.updateMany({
    where: { id, usuarioId: user.id },
    data: { lida: true },
  })
}

export async function marcarTodasComoLidas(): Promise<void> {
  const user = await getServerUser()
  await prisma.notificacao.updateMany({
    where: { usuarioId: user.id, lida: false },
    data: { lida: true },
  })
}

// Criar notificação (chamada internamente pelo sistema)
export async function criarNotificacao(data: {
  tenantId: string
  usuarioId: string
  tipo: string
  titulo: string
  texto: string
  url?: string
}) {
  return prisma.notificacao.create({ data })
}

// ─── Preferências ─────────────────────────────────────────────────────────────

export async function buscarPreferencias(): Promise<PrefsNotif> {
  const user = await getServerUser()

  const prefs = await prisma.preferenciaNotificacao.findUnique({
    where: { usuarioId: user.id },
  })

  // Defaults: tudo ativo
  return {
    emailNcCritica: prefs?.emailNcCritica ?? true,
    emailNcResolvida: prefs?.emailNcResolvida ?? true,
    emailNcVencida: prefs?.emailNcVencida ?? true,
    emailAgendamento: prefs?.emailAgendamento ?? true,
    emailInspecaoReprovada: prefs?.emailInspecaoReprovada ?? true,
    pushNcCritica: prefs?.pushNcCritica ?? true,
    pushNcResolvida: prefs?.pushNcResolvida ?? true,
    pushNcVencida: prefs?.pushNcVencida ?? true,
    pushAgendamento: prefs?.pushAgendamento ?? true,
    pushInspecaoReprovada: prefs?.pushInspecaoReprovada ?? true,
  }
}

export async function salvarPreferencias(
  prefs: Partial<PrefsNotif>,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const user = await getServerUser()

    await prisma.preferenciaNotificacao.upsert({
      where: { usuarioId: user.id },
      create: { usuarioId: user.id, ...prefs },
      update: prefs,
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao salvar' }
  }
}

// ─── Push subscriptions ───────────────────────────────────────────────────────

export async function salvarPushSubscription(subscription: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}): Promise<{ sucesso: boolean }> {
  try {
    const user = await getServerUser()

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        usuarioId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent: subscription.userAgent,
      },
      update: {
        usuarioId: user.id,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    })

    return { sucesso: true }
  } catch {
    return { sucesso: false }
  }
}
