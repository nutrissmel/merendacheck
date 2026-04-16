import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isBefore, addDays, addWeeks, addMonths, nextDay, setDate } from 'date-fns'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Frequencia } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Segurança via token secreto
const CRON_SECRET = process.env.CRON_SECRET ?? 'mc-cron-dev-secret'

function proximaExecucaoApos(
  frequencia: Frequencia,
  diaSemana: number | null,
  diaMes: number | null,
  horario: string | null,
  referencia: Date,
): Date {
  const [h = 8, m = 0] = (horario ?? '08:00').split(':').map(Number)

  if (frequencia === 'DIARIO') {
    const d = new Date(referencia)
    d.setDate(d.getDate() + 1)
    d.setHours(h, m, 0, 0)
    return d
  }

  if (frequencia === 'SEMANAL') {
    const d = nextDay(referencia, (diaSemana ?? 1) as 0|1|2|3|4|5|6)
    d.setHours(h, m, 0, 0)
    return d
  }

  if (frequencia === 'QUINZENAL') {
    const d = nextDay(referencia, (diaSemana ?? 1) as 0|1|2|3|4|5|6)
    d.setHours(h, m, 0, 0)
    return addWeeks(d, 1) // quinzenal = 2 semanas, próxima já está na semana seguinte
  }

  if (frequencia === 'MENSAL') {
    let d = setDate(referencia, diaMes ?? 1)
    d.setHours(h, m, 0, 0)
    d = addMonths(d, 1)
    return d
  }

  return addDays(referencia, 999)
}

export async function GET(request: NextRequest) {
  // Validar token
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ?? request.nextUrl.searchParams.get('token')

  if (token !== CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const agora = new Date()
  const resultados: string[] = []

  try {
    // Buscar agendamentos ativos que já deveriam ter sido executados (atrasados)
    const agendamentosVencidos = await prisma.agendamento.findMany({
      where: {
        ativo: true,
        frequencia: { not: 'SOB_DEMANDA' },
        proximaExecucao: { lte: agora },
      },
      include: {
        escola: { select: { id: true, nome: true } },
        checklist: { select: { id: true, nome: true } },
        tenant: {
          select: {
            id: true,
            nome: true,
            usuarios: {
              where: {
                papel: { in: ['ADMIN_MUNICIPAL', 'NUTRICIONISTA'] },
                ativo: true,
              },
              select: { id: true, email: true, nome: true },
            },
          },
        },
      },
    })

    for (const ag of agendamentosVencidos) {
      resultados.push(`Agendamento vencido: ${ag.escola.nome} — ${ag.checklist.nome}`)

      // 1. Criar notificações para admins/nutricionistas do tenant
      for (const usuario of ag.tenant.usuarios) {
        await prisma.notificacao.create({
          data: {
            tenantId: ag.tenantId,
            usuarioId: usuario.id,
            tipo: 'agendamento_lembrete',
            titulo: 'Inspeção programada pendente',
            texto: `A inspeção "${ag.checklist.nome}" na ${ag.escola.nome} está atrasada.`,
            url: `/agendamentos`,
          },
        })
      }

      // 2. Enviar email de lembrete via Resend
      const destinatarios = ag.tenant.usuarios.map((u) => u.email)
      if (destinatarios.length > 0) {
        try {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)

          await resend.emails.send({
            from: 'MerendaCheck <lembretes@merendacheck.com.br>',
            to: destinatarios,
            subject: `[Lembrete] Inspeção pendente — ${ag.escola.nome}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0E2E60;">Inspeção Programada Pendente</h2>
                <p>Olá!</p>
                <p>
                  A inspeção <strong>${ag.checklist.nome}</strong> na escola
                  <strong>${ag.escola.nome}</strong> estava programada para
                  <strong>${format(ag.proximaExecucao!, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</strong>
                  e ainda não foi realizada.
                </p>
                <a
                  href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.merendacheck.com.br'}/inspecoes/nova?escola=${ag.escolaId}&checklist=${ag.checklistId}"
                  style="display:inline-block; background:#0E2E60; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:12px;"
                >
                  Iniciar inspeção agora →
                </a>
                <p style="color:#5A7089; font-size:12px; margin-top:24px;">
                  Email automático do MerendaCheck — ${ag.tenant.nome}
                </p>
              </div>
            `,
          })

          resultados.push(`  → Email enviado para ${destinatarios.length} usuário(s)`)
        } catch (emailErr: any) {
          resultados.push(`  → Erro no email: ${emailErr?.message}`)
        }
      }

      // 3. Atualizar proximaExecucao para o próximo ciclo
      const novaProxima = proximaExecucaoApos(
        ag.frequencia,
        ag.diaSemana,
        ag.diaMes,
        ag.horario,
        agora,
      )

      await prisma.agendamento.update({
        where: { id: ag.id },
        data: { proximaExecucao: novaProxima },
      })

      resultados.push(`  → Próxima execução: ${format(novaProxima, 'dd/MM/yyyy HH:mm')}`)
    }

    // Verificar NCs vencidas e criar notificações
    const ncsVencidas = await prisma.naoConformidade.findMany({
      where: {
        status: { in: ['ABERTA', 'EM_ANDAMENTO'] },
        prazoResolucao: { lte: agora },
      },
      include: {
        inspecao: {
          include: {
            escola: { select: { nome: true } },
          },
        },
      },
      take: 50,
    })

    if (ncsVencidas.length > 0) {
      // Marcar como VENCIDA e criar notificações em batch
      await prisma.naoConformidade.updateMany({
        where: {
          id: { in: ncsVencidas.map((nc) => nc.id) },
          status: { in: ['ABERTA', 'EM_ANDAMENTO'] },
        },
        data: { status: 'VENCIDA' },
      })

      resultados.push(`${ncsVencidas.length} NCs marcadas como vencidas`)
    }

    return NextResponse.json({
      sucesso: true,
      timestamp: agora.toISOString(),
      agendamentosProcessados: agendamentosVencidos.length,
      ncsAtualizadas: ncsVencidas.length,
      log: resultados,
    })
  } catch (err: any) {
    console.error('[CRON] Erro:', err)
    return NextResponse.json(
      { sucesso: false, erro: err?.message ?? 'Erro interno' },
      { status: 500 },
    )
  }
}
