import { Resend } from 'resend'
import { BoasVindasEmail } from './boasVindas'
import { ConviteEmail } from './convite'
import { ConviteAceitoEmail } from './conviteAceito'
import { NCGeradaEmail, type NCGeradaEmailProps } from './ncGerada'
import { AcaoAtribuidaEmail, type AcaoAtribuidaEmailProps } from './acaoAtribuida'
import { NCResolvidaEmail, type NCResolvidaEmailProps } from './ncResolvida'
import { NCVencidaEmail, type NCVencidaEmailProps } from './ncVencida'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Papel } from '@prisma/client'
import type React from 'react'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
}

const FROM_ADDRESS = 'MerendaCheck <noreply@merendacheck.com.br>'

// ─────────────────────────────────────────────────────────────────
// Helper interno
// ─────────────────────────────────────────────────────────────────
async function enviarEmail(params: {
  para: string
  assunto: string
  corpo: React.ReactElement
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: [params.para],
      subject: params.assunto,
      react: params.corpo,
    })
    if (error) {
      console.error('[Email] Erro ao enviar via Resend:', error)
    }
  } catch (err) {
    console.error('[Email] Erro inesperado:', err)
  }
}

// ─────────────────────────────────────────────────────────────────
// Boas-vindas (cadastro de município)
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailBoasVindas(params: {
  para: string
  nomeAdmin: string
  nomeMunicipio: string
  trialExpiresAt: Date
}): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
  const dataFormatada = format(params.trialExpiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  await enviarEmail({
    para: params.para,
    assunto: `Bem-vindo ao MerendaCheck, ${params.nomeAdmin}! 🎉`,
    corpo: BoasVindasEmail({
      nomeAdmin: params.nomeAdmin,
      nomeMunicipio: params.nomeMunicipio,
      trialExpiresAt: dataFormatada,
      loginUrl,
    }) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// Convite de usuário
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailConvite(params: {
  para: string
  nomeConvidadoPor: string
  nomeMunicipio: string
  papel: Papel
  linkConvite: string
  expiresAt: Date
  mensagemPersonalizada?: string
}): Promise<void> {
  const expiresFormatada = format(params.expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  await enviarEmail({
    para: params.para,
    assunto: `${params.nomeConvidadoPor} convidou você para o MerendaCheck`,
    corpo: ConviteEmail({
      nomeConvidadoPor: params.nomeConvidadoPor,
      nomeMunicipio: params.nomeMunicipio,
      papel: params.papel,
      linkConvite: params.linkConvite,
      expiresAt: expiresFormatada,
      mensagemPersonalizada: params.mensagemPersonalizada,
    }) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// Notificação de convite aceito (para quem convidou)
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailConviteAceito(params: {
  para: string
  nomeConvidado: string
  papel: Papel
  nomeMunicipio: string
  urlUsuarios: string
}): Promise<void> {
  await enviarEmail({
    para: params.para,
    assunto: `${params.nomeConvidado} aceitou seu convite no MerendaCheck ✅`,
    corpo: ConviteAceitoEmail({
      nomeConvidado: params.nomeConvidado,
      papel: params.papel,
      nomeMunicipio: params.nomeMunicipio,
      urlUsuarios: params.urlUsuarios,
    }) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// Reset de senha
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailResetSenha(params: {
  para: string
  nomeAdmin: string
  linkReset: string
}): Promise<void> {
  // Reutiliza o fluxo nativo do Supabase Auth — este placeholder
  // pode ser implementado com template customizado no Sprint 9
  console.info('[Email] enviarEmailResetSenha: delegado ao Supabase Auth', params.para)
}

// ─────────────────────────────────────────────────────────────────
// NC gerada automaticamente — para nutricionista
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailNCGerada(params: {
  para: string
  nomeNutricionista: string
  nomeEscola: string
  nomeChecklist: string
  dataInspecao: Date
  itemPergunta: string
  severidade: string
  ncId: string
}): Promise<void> {
  const urlDetalhe = `${process.env.NEXT_PUBLIC_APP_URL}/nao-conformidades/${params.ncId}`
  const dataFormatada = format(params.dataInspecao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  await enviarEmail({
    para: params.para,
    assunto: `⚠️ Nova NC detectada — ${params.nomeEscola}`,
    corpo: NCGeradaEmail({
      nomeNutricionista: params.nomeNutricionista,
      nomeEscola: params.nomeEscola,
      nomeChecklist: params.nomeChecklist,
      dataInspecao: dataFormatada,
      itemPergunta: params.itemPergunta,
      severidade: params.severidade,
      urlDetalhe,
    } satisfies NCGeradaEmailProps) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// Ação atribuída — para o responsável
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailAcaoAtribuida(params: {
  para: string
  nomeResponsavel: string
  tituloNC: string
  nomeEscola: string
  descricaoAcao: string
  prazo: Date | null
  prioridade: string
  ncId: string
  acaoId: string
}): Promise<void> {
  const urlAcao = `${process.env.NEXT_PUBLIC_APP_URL}/nao-conformidades/${params.ncId}#acao-${params.acaoId}`
  const prazoFormatado = params.prazo
    ? format(params.prazo, 'dd/MM/yyyy', { locale: ptBR })
    : null

  await enviarEmail({
    para: params.para,
    assunto: `📋 Nova ação atribuída a você — ${params.nomeEscola}`,
    corpo: AcaoAtribuidaEmail({
      nomeResponsavel: params.nomeResponsavel,
      tituloNC: params.tituloNC,
      nomeEscola: params.nomeEscola,
      descricaoAcao: params.descricaoAcao,
      prazo: prazoFormatado,
      prioridade: params.prioridade,
      urlAcao,
    } satisfies AcaoAtribuidaEmailProps) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// NC resolvida — para nutricionista
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailNCResolvida(params: {
  para: string
  nomeNutricionista: string
  tituloNC: string
  nomeEscola: string
  resolvidaEm: Date
  criadaEm: Date
  ncId: string
}): Promise<void> {
  const urlDetalhe = `${process.env.NEXT_PUBLIC_APP_URL}/nao-conformidades/${params.ncId}`
  const dias = differenceInDays(params.resolvidaEm, params.criadaEm)

  await enviarEmail({
    para: params.para,
    assunto: `✅ NC resolvida — ${params.tituloNC}`,
    corpo: NCResolvidaEmail({
      nomeNutricionista: params.nomeNutricionista,
      tituloNC: params.tituloNC,
      nomeEscola: params.nomeEscola,
      resolvidaEm: format(params.resolvidaEm, 'dd/MM/yyyy', { locale: ptBR }),
      diasParaResolucao: dias,
      urlDetalhe,
    } satisfies NCResolvidaEmailProps) as React.ReactElement,
  })
}

// ─────────────────────────────────────────────────────────────────
// NC vencida — para nutricionista + admin
// ─────────────────────────────────────────────────────────────────
export async function enviarEmailNCVencida(params: {
  para: string
  nomeDestinatario: string
  tituloNC: string
  nomeEscola: string
  prazoResolucao: Date
  severidade: string
  ncId: string
}): Promise<void> {
  const urlDetalhe = `${process.env.NEXT_PUBLIC_APP_URL}/nao-conformidades/${params.ncId}`
  const dias = differenceInDays(new Date(), params.prazoResolucao)

  await enviarEmail({
    para: params.para,
    assunto: `🚨 NC VENCIDA — ${params.tituloNC}`,
    corpo: NCVencidaEmail({
      nomeDestinatario: params.nomeDestinatario,
      tituloNC: params.tituloNC,
      nomeEscola: params.nomeEscola,
      prazoEra: format(params.prazoResolucao, 'dd/MM/yyyy', { locale: ptBR }),
      diasVencida: Math.max(0, dias),
      severidade: params.severidade,
      urlDetalhe,
    } satisfies NCVencidaEmailProps) as React.ReactElement,
  })
}
