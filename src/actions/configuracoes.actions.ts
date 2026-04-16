'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/auditoria'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadosTenant {
  id: string
  nome: string
  estado: string
  codigoIbge: string
  logoUrl: string | null
  nomeSecretaria: string | null
  telefone: string | null
  emailInstitucional: string | null
  website: string | null
  cnpj: string | null
  apiKey: string | null
  webhookUrl: string | null
  webhookEventos: string[]
  webhookAtivo: boolean
  notifNcCritica: boolean
  notifInspecaoReprovada: boolean
  notifSemInspecaoDias: number
  notifRelatorioMensal: boolean
  notifEmailAdmin: boolean
  notifEmailNutricionista: boolean
  notifReplyTo: string | null
}

// ─── Buscar dados do tenant ───────────────────────────────────────────────────

export async function buscarDadosTenantAction(): Promise<DadosTenant> {
  const user = await getServerUser()
  requireAdmin(user.papel)

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: user.tenantId },
    select: {
      id: true,
      nome: true,
      estado: true,
      codigoIbge: true,
      logoUrl: true,
      nomeSecretaria: true,
      telefone: true,
      emailInstitucional: true,
      website: true,
      cnpj: true,
      apiKey: true,
      webhookUrl: true,
      webhookEventos: true,
      webhookAtivo: true,
      notifNcCritica: true,
      notifInspecaoReprovada: true,
      notifSemInspecaoDias: true,
      notifRelatorioMensal: true,
      notifEmailAdmin: true,
      notifEmailNutricionista: true,
      notifReplyTo: true,
    },
  })

  return tenant
}

// ─── Dados do município ───────────────────────────────────────────────────────

export async function atualizarDadosMunicipioAction(data: {
  nome: string
  estado: string
  codigoIbge: string
  nomeSecretaria?: string
  telefone?: string
  emailInstitucional?: string
  website?: string
  cnpj?: string
}): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        nome: data.nome,
        estado: data.estado,
        codigoIbge: data.codigoIbge,
        nomeSecretaria: data.nomeSecretaria ?? null,
        telefone: data.telefone ?? null,
        emailInstitucional: data.emailInstitucional ?? null,
        website: data.website ?? null,
        cnpj: data.cnpj ?? null,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'CONFIGURACOES_ALTERADAS',
      alvoTipo: 'tenant',
      alvoNome: 'Dados do Município',
      detalhes: { campos: Object.keys(data) },
    })

    revalidatePath('/configuracoes')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao salvar' }
  }
}

// ─── Upload de logo ───────────────────────────────────────────────────────────

export async function uploadLogoMunicipioAction(
  formData: FormData,
): Promise<{ sucesso: true; logoUrl: string } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    const file = formData.get('logo') as File | null
    if (!file) return { sucesso: false, erro: 'Nenhum arquivo enviado' }

    if (file.size > 2 * 1024 * 1024) {
      return { sucesso: false, erro: 'Arquivo maior que 2MB' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
      return { sucesso: false, erro: 'Formato inválido. Use PNG, SVG, JPG ou WebP' }
    }

    // Upload to Supabase Storage
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const path = `${user.tenantId}/logo.${ext}`
    const bytes = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from('logos')
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    const logoUrl = urlData.publicUrl + `?v=${Date.now()}`

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { logoUrl },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'LOGO_ATUALIZADO',
      alvoTipo: 'tenant',
    })

    revalidatePath('/', 'layout')
    return { sucesso: true, logoUrl }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao fazer upload' }
  }
}

export async function removerLogoAction(): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { logoUrl: null },
    })

    revalidatePath('/', 'layout')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message }
  }
}

// ─── 2FA ──────────────────────────────────────────────────────────────────────

export async function iniciarSetup2FAAction(): Promise<{
  sucesso: true
  qrCodeUrl: string
  codigoManual: string
  segredoTemp: string
} | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { nome: true } })

    const { gerarConfiguracao2FA } = await import('@/lib/auth/twoFactor')
    const config = await gerarConfiguracao2FA({
      email: user.email,
      municipio: tenant?.nome ?? 'MerendaCheck',
    })

    return {
      sucesso: true,
      qrCodeUrl: config.qrCodeUrl,
      codigoManual: config.codigoManual,
      segredoTemp: config.segredoCriptografado,
    }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao gerar QR code' }
  }
}

export async function confirmar2FAAction(
  segredoTemp: string,
  codigoOtp: string,
): Promise<{ sucesso: true; codigosRecuperacao: string[] } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    const { verificarCodigo2FA, gerarCodigosRecuperacao, hashearCodigosRecuperacao } = await import('@/lib/auth/twoFactor')

    if (!(await verificarCodigo2FA(segredoTemp, codigoOtp))) {
      return { sucesso: false, erro: 'Código inválido. Verifique o app autenticador.' }
    }

    const codigos = gerarCodigosRecuperacao()
    const hashes = hashearCodigosRecuperacao(codigos)

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        doisFatoresAtivo: true,
        doisFatoresSegredo: segredoTemp,
        codigosRecuperacao: hashes,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: '2FA_ATIVADO',
    })

    return { sucesso: true, codigosRecuperacao: codigos }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao ativar 2FA' }
  }
}

export async function desativar2FAAction(): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const user = await getServerUser()

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        doisFatoresAtivo: false,
        doisFatoresSegredo: null,
        codigosRecuperacao: [],
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: '2FA_DESATIVADO',
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message }
  }
}

// ─── Sessões ──────────────────────────────────────────────────────────────────

export type SessaoAtiva = {
  id: string
  dispositivo: string
  ultimoAcesso: Date
  atual: boolean
}

export async function listarSessoesAtivasAction(): Promise<SessaoAtiva[]> {
  const user = await getServerUser()
  // Supabase Admin API para sessões — retorna sessões do usuário
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data } = await supabaseAdmin.auth.admin.getUserById(user.supabaseUserId ?? user.id)
    // Supabase doesn't expose session list via Admin API directly
    // Return current session only as fallback
    return [
      {
        id: 'current',
        dispositivo: 'Sessão atual',
        ultimoAcesso: new Date(),
        atual: true,
      },
    ]
  } catch {
    return []
  }
}

export async function encerrarTodasSessoesAction(): Promise<{ sucesso: boolean }> {
  try {
    const user = await getServerUser()
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await supabaseAdmin.auth.admin.signOut(user.supabaseUserId ?? user.id, 'others')
    return { sucesso: true }
  } catch {
    return { sucesso: false }
  }
}

// ─── Notificações globais ─────────────────────────────────────────────────────

export async function salvarNotificacoesGlobaisAction(data: {
  notifNcCritica: boolean
  notifInspecaoReprovada: boolean
  notifSemInspecaoDias: number
  notifRelatorioMensal: boolean
  notifEmailAdmin: boolean
  notifEmailNutricionista: boolean
  notifReplyTo?: string
}): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        notifNcCritica: data.notifNcCritica,
        notifInspecaoReprovada: data.notifInspecaoReprovada,
        notifSemInspecaoDias: data.notifSemInspecaoDias,
        notifRelatorioMensal: data.notifRelatorioMensal,
        notifEmailAdmin: data.notifEmailAdmin,
        notifEmailNutricionista: data.notifEmailNutricionista,
        notifReplyTo: data.notifReplyTo ?? null,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'CONFIGURACOES_ALTERADAS',
      alvoNome: 'Notificações Globais',
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao salvar' }
  }
}

// ─── Integrações — API Key ────────────────────────────────────────────────────

export async function regenerarApiKeyAction(): Promise<
  { sucesso: true; apiKey: string } | { sucesso: false; erro: string }
> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    const apiKey = 'mc_live_' + crypto.randomBytes(24).toString('hex')

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { apiKey },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'API_KEY_GERADA',
    })

    return { sucesso: true, apiKey }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao gerar API key' }
  }
}

// ─── Integrações — Webhook ────────────────────────────────────────────────────

export async function salvarWebhookAction(data: {
  url: string
  eventos: string[]
}): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    if (!data.url.startsWith('https://')) {
      return { sucesso: false, erro: 'URL deve usar HTTPS' }
    }

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        webhookUrl: data.url,
        webhookEventos: data.eventos,
        webhookAtivo: data.eventos.length > 0,
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'WEBHOOK_CONFIGURADO',
      detalhes: { url: data.url, eventos: data.eventos },
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao salvar webhook' }
  }
}

export async function testarWebhookAction(): Promise<
  { sucesso: true; statusCode: number; resposta: string } | { sucesso: false; erro: string }
> {
  try {
    const user = await getServerUser()
    requireAdmin(user.papel)

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { webhookUrl: true },
    })

    if (!tenant?.webhookUrl) {
      return { sucesso: false, erro: 'Nenhuma URL de webhook configurada' }
    }

    const payload = {
      evento: 'teste',
      timestamp: new Date().toISOString(),
      dados: { mensagem: 'Teste de webhook do MerendaCheck' },
    }

    const response = await fetch(tenant.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MerendaCheck-Event': 'teste' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    const texto = await response.text().catch(() => '')
    return {
      sucesso: true,
      statusCode: response.status,
      resposta: texto.slice(0, 200),
    }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao testar webhook' }
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function requireAdmin(papel: string) {
  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(papel)) {
    throw new Error('Acesso restrito a administradores')
  }
}
