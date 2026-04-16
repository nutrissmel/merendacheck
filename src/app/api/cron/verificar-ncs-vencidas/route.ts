import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/auditoria'
import {
  enviarEmailNCVencida,
} from '@/lib/emails'
import { differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // 1. Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const agora = new Date()
  const erros: string[] = []
  let processadas = 0

  try {
    // 2. Find overdue NCs
    const ncsVencidas = await prisma.naoConformidade.findMany({
      where: {
        prazoResolucao: { lt: agora },
        status: { in: ['ABERTA', 'EM_ANDAMENTO'] },
      },
      include: {
        inspecao: {
          include: {
            escola: { select: { nome: true } },
          },
        },
      },
    })

    if (ncsVencidas.length === 0) {
      return NextResponse.json({ processadas: 0, erros: [], mensagem: 'Nenhuma NC vencida encontrada' })
    }

    // 3. Update status to VENCIDA in batch
    const ids = ncsVencidas.map((nc) => nc.id)
    await prisma.naoConformidade.updateMany({
      where: { id: { in: ids } },
      data: { status: 'VENCIDA' },
    })

    // 4. Send email alerts — find nutricionistas + admins per tenant
    const tenantIds = [...new Set(ncsVencidas.map((nc) => nc.tenantId))]

    for (const tenantId of tenantIds) {
      const destinatarios = await prisma.usuario.findMany({
        where: {
          tenantId,
          ativo: true,
          papel: { in: ['NUTRICIONISTA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'] },
        },
        select: { email: true, nome: true },
      })

      const ncsDoTenant = ncsVencidas.filter((nc) => nc.tenantId === tenantId)

      for (const nc of ncsDoTenant) {
        const diasVencida = Math.max(0, differenceInDays(agora, nc.prazoResolucao!))

        for (const dest of destinatarios) {
          try {
            await enviarEmailNCVencida({
              para: dest.email,
              nomeDestinatario: dest.nome,
              tituloNC: nc.titulo,
              nomeEscola: nc.inspecao.escola.nome,
              prazoResolucao: nc.prazoResolucao!,
              severidade: nc.severidade,
              ncId: nc.id,
            })
          } catch (err) {
            const msg = `Email para ${dest.email} (NC ${nc.id}): ${err instanceof Error ? err.message : 'erro'}`
            erros.push(msg)
            console.error('[cron/verificar-ncs-vencidas]', msg)
          }
        }

        // 5. Audit log
        await registrarAuditoria({
          tenantId: nc.tenantId,
          usuarioId: 'system',
          acao: 'NC_MARCADA_VENCIDA_CRON',
          alvoId: nc.id,
          detalhes: { diasVencida, prazo: nc.prazoResolucao },
        })

        processadas++
      }
    }

    return NextResponse.json({
      processadas,
      erros,
      mensagem: `${processadas} NC(s) marcada(s) como vencida(s)`,
    })

  } catch (err) {
    console.error('[cron/verificar-ncs-vencidas] Erro geral:', err)
    return NextResponse.json(
      { erro: 'Erro interno no cron', detalhes: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
