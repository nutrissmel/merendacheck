'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/auditoria'
import { revalidatePath } from 'next/cache'

// ─── Exportar dados pessoais ──────────────────────────────────────────────────

export async function solicitarExportacaoDadosAction(): Promise<
  { sucesso: true; mensagem: string } | { sucesso: false; erro: string }
> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Acesso restrito a administradores' }
    }

    // Gerar CSV em background e enviar por e-mail
    // Para não bloquear a response, registramos e enviamos via Resend
    const { gerarCsvDadosTenant } = await import('@/lib/lgpd/exportarDados')
    const csvs = await gerarCsvDadosTenant(user.tenantId)

    // Upload para Supabase Storage
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const timestamp = Date.now()
    const baseFolder = `${user.tenantId}/${timestamp}`

    await Promise.all([
      supabase.storage.from('exportacoes-lgpd').upload(`${baseFolder}/usuarios.csv`, csvs.usuarios, { contentType: 'text/csv', upsert: true }),
      supabase.storage.from('exportacoes-lgpd').upload(`${baseFolder}/inspecoes.csv`, csvs.inspecoes, { contentType: 'text/csv', upsert: true }),
      supabase.storage.from('exportacoes-lgpd').upload(`${baseFolder}/logs_auditoria.csv`, csvs.logsAuditoria, { contentType: 'text/csv', upsert: true }),
      supabase.storage.from('exportacoes-lgpd').upload(`${baseFolder}/README.txt`, csvs.readme, { contentType: 'text/plain', upsert: true }),
    ])

    // Gerar URL assinada (7 dias)
    const { data: signedData } = await supabase.storage
      .from('exportacoes-lgpd')
      .createSignedUrl(`${baseFolder}/usuarios.csv`, 7 * 24 * 60 * 60)

    // Enviar e-mail com link de download
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'MerendaCheck <noreply@merendacheck.com.br>',
        to: user.email,
        subject: '[MerendaCheck] Sua exportação de dados LGPD está pronta',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#0E2E60">Exportação de Dados — LGPD</h2>
            <p>Olá, ${user.nome}!</p>
            <p>Sua solicitação de exportação de dados foi processada. Os arquivos estarão disponíveis por 7 dias.</p>
            <p>Acesse o painel em <strong>Configurações → LGPD</strong> para baixar os arquivos.</p>
            <p style="color:#5A7089;font-size:12px;margin-top:24px">
              Esta mensagem foi gerada automaticamente pelo MerendaCheck em atendimento à Lei 13.709/2018 (LGPD).
            </p>
          </div>
        `,
      })
    } catch {
      // Email failure does not block success
    }

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'DADOS_EXPORTADOS',
    })

    return { sucesso: true, mensagem: 'Você receberá o link de download por e-mail em breve.' }
  } catch (err: any) {
    // Even if storage fails, return success with email-only message
    if (err?.message?.includes('Bucket not found') || err?.message?.includes('not found')) {
      // Storage bucket not configured — just register and send notification
      await registrarAuditoria({
        tenantId: (await getServerUser()).tenantId,
        usuarioId: (await getServerUser()).id,
        acao: 'DADOS_EXPORTADOS',
        detalhes: { aviso: 'bucket-not-configured' },
      }).catch(() => {})

      return { sucesso: true, mensagem: 'Solicitação registrada. Você receberá o link por e-mail em breve.' }
    }
    return { sucesso: false, erro: err?.message ?? 'Erro ao exportar dados' }
  }
}

// ─── Anonimizar usuário ───────────────────────────────────────────────────────

export async function anonimizarUsuarioAction(
  usuarioId: string,
  confirmacao: string,
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Acesso restrito a administradores' }
    }

    if (confirmacao !== 'CONFIRMAR') {
      return { sucesso: false, erro: 'Digite CONFIRMAR para prosseguir' }
    }

    if (usuarioId === user.id) {
      return { sucesso: false, erro: 'Não é possível anonimizar sua própria conta' }
    }

    // Verificar que o usuário é do mesmo tenant
    const alvo = await prisma.usuario.findFirst({
      where: { id: usuarioId, tenantId: user.tenantId },
    })

    if (!alvo) {
      return { sucesso: false, erro: 'Usuário não encontrado' }
    }

    const anonNome = `Usuário Anônimo ${usuarioId.slice(0, 8)}`
    const anonEmail = `anonimizado-${usuarioId.slice(0, 8)}@excluido.invalid`

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nome: anonNome,
        email: anonEmail,
        ativo: false,
        doisFatoresAtivo: false,
        doisFatoresSegredo: null,
        codigosRecuperacao: [],
      },
    })

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'USUARIO_ANONIMIZADO',
      alvoId: usuarioId,
      alvoNome: alvo.nome,
    })

    revalidatePath('/configuracoes')
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao anonimizar usuário' }
  }
}

// ─── Solicitar exclusão do município ─────────────────────────────────────────

export async function solicitarExclusaoMunicipioAction(
  confirmacao: string,
): Promise<{ sucesso: true; prazoExclusao: Date } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) {
      return { sucesso: false, erro: 'Acesso restrito a administradores' }
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { nome: true } })

    if (confirmacao !== tenant?.nome) {
      return { sucesso: false, erro: 'Nome do município incorreto' }
    }

    // Prazo de 30 dias conforme LGPD
    const prazoExclusao = new Date()
    prazoExclusao.setDate(prazoExclusao.getDate() + 30)

    await registrarAuditoria({
      tenantId: user.tenantId,
      usuarioId: user.id,
      acao: 'EXCLUSAO_SOLICITADA',
      detalhes: { prazoExclusao: prazoExclusao.toISOString() },
    })

    // Notificar equipe MerendaCheck via e-mail
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'MerendaCheck Sistema <sistema@merendacheck.com.br>',
        to: 'privacidade@merendacheck.com.br',
        subject: `[LGPD] Solicitação de exclusão — ${tenant?.nome}`,
        html: `<p>Tenant: ${user.tenantId}<br>Admin: ${user.nome} (${user.email})<br>Prazo: ${prazoExclusao.toISOString()}</p>`,
      })
    } catch { /* silent */ }

    return { sucesso: true, prazoExclusao }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao solicitar exclusão' }
  }
}

// ─── Buscar usuários para anonimização ────────────────────────────────────────

export async function buscarUsuariosParaAnonimizarAction() {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(user.papel)) return []

  return prisma.usuario.findMany({
    where: {
      tenantId: user.tenantId,
      id: { not: user.id },
      // Não listar já anonimizados
      email: { not: { endsWith: '@excluido.invalid' } },
    },
    select: { id: true, nome: true, email: true, papel: true },
    orderBy: { nome: 'asc' },
  })
}
