import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calcularScore } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    const body = await request.json() as {
      inspecaoId: string
      itemId: string
      respostaSimNao?: boolean
      respostaNumerica?: number
      respostaTexto?: string
      conforme?: boolean
      observacao?: string
      fotoUrl?: string
    }

    const { inspecaoId, itemId, conforme, ...resto } = body

    // Verify ownership
    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId },
      include: {
        checklist: { include: { itens: true } },
        respostas: true,
      },
    })

    if (!inspecao) {
      return NextResponse.json({ erro: 'Inspeção não encontrada' }, { status: 404 })
    }

    // Upsert resposta
    await prisma.resposta.upsert({
      where: { inspecaoId_itemId: { inspecaoId, itemId } },
      create: { inspecaoId, itemId, conforme, ...resto },
      update: { conforme, ...resto },
    })

    // Recalc score
    const todasRespostas = await prisma.resposta.findMany({ where: { inspecaoId } })
    const { score, scoreStatus, temCriticoReprovado } = calcularScore(
      inspecao.checklist.itens,
      todasRespostas
    )

    await prisma.inspecao.update({
      where: { id: inspecaoId },
      data: { score, scoreStatus, temCriticoReprovado },
    })

    return NextResponse.json({ sucesso: true, score })
  } catch (err) {
    console.error('[sync/resposta]', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
