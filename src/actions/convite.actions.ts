'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerUser, requirePapel } from '@/lib/auth'
import { podeAdicionarUsuario } from '@/lib/plano'
import { enviarEmailConvite, enviarEmailConviteAceito } from '@/lib/emails'
import { revalidatePath } from 'next/cache'
import { addHours } from 'date-fns'
import type { Papel } from '@prisma/client'

export type ConviteListItem = {
  id: string
  email: string
  papel: Papel
  status: 'pendente' | 'aceito' | 'expirado'
  createdAt: Date
  expiresAt: Date
  convidadoPorNome: string | null
}

// Papéis que NUTRICIONISTA pode convidar
const PAPEIS_NUTRICIONISTA: Papel[] = ['MERENDEIRA', 'DIRETOR_ESCOLA']

// Papéis que ADMIN_MUNICIPAL pode convidar
const PAPEIS_ADMIN: Papel[] = ['NUTRICIONISTA', 'DIRETOR_ESCOLA', 'MERENDEIRA']

function resolverStatusConvite(
  aceito: boolean,
  expiresAt: Date
): 'pendente' | 'aceito' | 'expirado' {
  if (aceito) return 'aceito'
  if (expiresAt < new Date()) return 'expirado'
  return 'pendente'
}

// ─────────────────────────────────────────────────────────────────
// Enviar convite
// ─────────────────────────────────────────────────────────────────
export async function enviarConviteAction(data: {
  email: string
  papel: Papel
  escolasIds?: string[]
  mensagemPersonalizada?: string
}): Promise<{ sucesso: true; conviteId: string } | { sucesso: false; erro: string }> {
  const user = await getServerUser()

  // Verificar permissão de papel
  if (user.papel !== 'ADMIN_MUNICIPAL' && user.papel !== 'NUTRICIONISTA' && user.papel !== 'SUPER_ADMIN') {
    return { sucesso: false, erro: 'Sem permissão para enviar convites.' }
  }

  // NUTRICIONISTA só pode convidar certos papéis
  if (user.papel === 'NUTRICIONISTA' && !PAPEIS_NUTRICIONISTA.includes(data.papel)) {
    return { sucesso: false, erro: 'Nutricionistas só podem convidar Merendeiras e Diretores.' }
  }

  // ADMIN_MUNICIPAL pode convidar papéis específicos
  if (user.papel === 'ADMIN_MUNICIPAL' && !PAPEIS_ADMIN.includes(data.papel)) {
    return { sucesso: false, erro: 'Papel inválido para convite.' }
  }

  const emailNormalizado = data.email.toLowerCase().trim()

  // Verificar se e-mail já tem usuário ativo no tenant
  const usuarioExistente = await prisma.usuario.findFirst({
    where: { email: emailNormalizado, tenantId: user.tenantId, ativo: true },
  })

  if (usuarioExistente) {
    return { sucesso: false, erro: 'Este e-mail já pertence a um usuário ativo no seu município.' }
  }

  // Verificar se já existe convite pendente
  const convitePendente = await prisma.convite.findFirst({
    where: {
      email: emailNormalizado,
      tenantId: user.tenantId,
      aceito: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (convitePendente) {
    return {
      sucesso: false,
      erro: 'Já existe um convite pendente para este e-mail. Reenvie o convite existente.',
    }
  }

  // Verificar limite de usuários do plano
  const limite = await podeAdicionarUsuario(user.tenantId)
  if (!limite.pode) {
    return {
      sucesso: false,
      erro: `Limite de usuários atingido (${limite.atual}/${limite.limite}) para o plano ${limite.plano}. Faça upgrade para convidar mais pessoas.`,
    }
  }

  // Buscar dados do tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { nome: true },
  })

  // Criar convite no banco
  const convite = await prisma.convite.create({
    data: {
      tenantId: user.tenantId,
      email: emailNormalizado,
      papel: data.papel,
      expiresAt: addHours(new Date(), 72),
      convidadoPorId: user.id,
      escolasIds: data.escolasIds ?? [],
      mensagem: data.mensagemPersonalizada,
    },
  })

  // Enviar e-mail
  const linkConvite = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${convite.token}`
  await enviarEmailConvite({
    para: emailNormalizado,
    nomeConvidadoPor: user.nome,
    nomeMunicipio: tenant?.nome ?? 'Município',
    papel: data.papel,
    linkConvite,
    expiresAt: convite.expiresAt,
    mensagemPersonalizada: data.mensagemPersonalizada,
  })

  revalidatePath('/configuracoes/usuarios')

  return { sucesso: true, conviteId: convite.id }
}

// ─────────────────────────────────────────────────────────────────
// Reenviar convite
// ─────────────────────────────────────────────────────────────────
export async function reenviarConviteAction(
  conviteId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await getServerUser()

  const convite = await prisma.convite.findFirst({
    where: { id: conviteId, tenantId: user.tenantId, aceito: false },
    include: { convidadoPor: { select: { nome: true } } },
  })

  if (!convite) {
    return { sucesso: false, erro: 'Convite não encontrado ou já aceito.' }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { nome: true },
  })

  // Gerar novo token e resetar expiração
  const novoToken = crypto.randomUUID()
  const atualizado = await prisma.convite.update({
    where: { id: conviteId },
    data: { token: novoToken, expiresAt: addHours(new Date(), 72) },
  })

  const linkConvite = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${novoToken}`
  await enviarEmailConvite({
    para: convite.email,
    nomeConvidadoPor: user.nome,
    nomeMunicipio: tenant?.nome ?? 'Município',
    papel: convite.papel,
    linkConvite,
    expiresAt: atualizado.expiresAt,
    mensagemPersonalizada: convite.mensagem ?? undefined,
  })

  revalidatePath('/configuracoes/usuarios')

  return { sucesso: true }
}

// ─────────────────────────────────────────────────────────────────
// Revogar convite (marca como expirado imediatamente)
// ─────────────────────────────────────────────────────────────────
export async function revogarConviteAction(
  conviteId: string
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const user = await getServerUser()

  const convite = await prisma.convite.findFirst({
    where: { id: conviteId, tenantId: user.tenantId, aceito: false },
  })

  if (!convite) {
    return { sucesso: false, erro: 'Convite não encontrado ou já aceito.' }
  }

  if (convite.expiresAt < new Date()) {
    return { sucesso: false, erro: 'Convite já está expirado.' }
  }

  // Revogar definindo expiresAt no passado
  await prisma.convite.update({
    where: { id: conviteId },
    data: { expiresAt: new Date(0) },
  })

  revalidatePath('/configuracoes/usuarios')

  return { sucesso: true }
}

// ─────────────────────────────────────────────────────────────────
// Aceitar convite
// ─────────────────────────────────────────────────────────────────
export async function aceitarConviteAction(data: {
  token: string
  nome: string
  senha: string
  confirmarSenha: string
}): Promise<{ sucesso: true; redirectUrl: string } | { sucesso: false; erro: string; campo?: string }> {
  if (data.senha !== data.confirmarSenha) {
    return { sucesso: false, erro: 'As senhas não conferem.', campo: 'confirmarSenha' }
  }

  if (data.senha.length < 8) {
    return { sucesso: false, erro: 'Senha deve ter ao menos 8 caracteres.', campo: 'senha' }
  }

  if (!data.nome.trim() || data.nome.trim().length < 3) {
    return { sucesso: false, erro: 'Nome completo obrigatório (mínimo 3 caracteres).', campo: 'nome' }
  }

  // Buscar convite
  const convite = await prisma.convite.findUnique({
    where: { token: data.token },
    include: {
      convidadoPor: { select: { email: true, nome: true } },
    },
  })

  if (!convite) {
    return { sucesso: false, erro: 'Convite inválido.' }
  }

  if (convite.aceito) {
    return { sucesso: false, erro: 'Este convite já foi utilizado.' }
  }

  if (convite.expiresAt < new Date()) {
    return { sucesso: false, erro: 'Este convite expirou. Solicite um novo convite.' }
  }

  // Buscar tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: convite.tenantId },
    select: { nome: true },
  })

  // Criar usuário no Supabase Auth (com e-mail já confirmado)
  const adminSupabase = createAdminClient()
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: convite.email,
    password: data.senha,
    email_confirm: true,
    user_metadata: {
      nome: data.nome.trim(),
      papel: convite.papel,
    },
  })

  if (authError || !authData.user) {
    return { sucesso: false, erro: authError?.message ?? 'Erro ao criar conta. Tente novamente.' }
  }

  const supabaseUserId = authData.user.id

  try {
    // Criar usuário no banco + vincular escolas (transação)
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          tenantId: convite.tenantId,
          supabaseUserId,
          nome: data.nome.trim(),
          email: convite.email,
          papel: convite.papel,
          primeiroAcesso: false,
          ativo: true,
        },
      })

      // Vincular escolas (se houver no convite)
      if (convite.escolasIds.length > 0) {
        await tx.usuarioEscola.createMany({
          data: convite.escolasIds.map((escolaId) => ({
            usuarioId: usuario.id,
            escolaId,
          })),
          skipDuplicates: true,
        })
      }

      // Marcar convite como aceito
      await tx.convite.update({
        where: { id: convite.id },
        data: { aceito: true },
      })
    })
  } catch (err) {
    // Cleanup: remover usuário do Auth
    await adminSupabase.auth.admin.deleteUser(supabaseUserId)
    console.error('Erro ao aceitar convite (transação):', err)
    return { sucesso: false, erro: 'Erro ao configurar sua conta. Tente novamente.' }
  }

  // Login automático
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email: convite.email, password: data.senha })

  // Notificar quem convidou
  if (convite.convidadoPor?.email) {
    await enviarEmailConviteAceito({
      para: convite.convidadoPor.email,
      nomeConvidado: data.nome.trim(),
      papel: convite.papel,
      nomeMunicipio: tenant?.nome ?? 'Município',
      urlUsuarios: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes/usuarios`,
    }).catch(() => {}) // não bloquear se falhar
  }

  return { sucesso: true, redirectUrl: '/dashboard?bem-vindo=true' }
}

// ─────────────────────────────────────────────────────────────────
// Buscar convite pelo token
// ─────────────────────────────────────────────────────────────────
export async function buscarConviteByTokenAction(token: string): Promise<{
  id: string
  email: string
  papel: Papel
  nomeMunicipio: string
  nomeConvidadoPor: string
  expiresAt: Date
  valido: boolean
  aceito: boolean
} | null> {
  const convite = await prisma.convite.findUnique({
    where: { token },
    include: {
      convidadoPor: { select: { nome: true } },
    },
  })

  if (!convite) return null

  const tenant = await prisma.tenant.findUnique({
    where: { id: convite.tenantId },
    select: { nome: true },
  })

  const valido = !convite.aceito && convite.expiresAt > new Date()

  return {
    id: convite.id,
    email: convite.email,
    papel: convite.papel,
    nomeMunicipio: tenant?.nome ?? 'Município',
    nomeConvidadoPor: convite.convidadoPor?.nome ?? 'Administrador',
    expiresAt: convite.expiresAt,
    valido,
    aceito: convite.aceito,
  }
}

// ─────────────────────────────────────────────────────────────────
// Listar convites do tenant
// ─────────────────────────────────────────────────────────────────
export async function listarConvitesAction(filtros?: {
  status?: 'pendente' | 'aceito' | 'expirado'
  papel?: Papel
}): Promise<ConviteListItem[]> {
  const user = await getServerUser()

  const convites = await prisma.convite.findMany({
    where: {
      tenantId: user.tenantId,
      ...(filtros?.papel ? { papel: filtros.papel } : {}),
    },
    include: { convidadoPor: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const lista: ConviteListItem[] = convites
    .map((c) => ({
      id: c.id,
      email: c.email,
      papel: c.papel,
      status: resolverStatusConvite(c.aceito, c.expiresAt),
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
      convidadoPorNome: c.convidadoPor?.nome ?? null,
    }))
    .filter((c) => !filtros?.status || c.status === filtros.status)

  return lista
}
