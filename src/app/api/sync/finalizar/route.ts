import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    const body = await request.json() as {
      inspecaoId: string
      assinaturaUrl?: string
    }

    const { inspecaoId, assinaturaUrl } = body

    const inspecao = await prisma.inspecao.findFirst({
      where: { id: inspecaoId, tenantId: user.tenantId },
      include: {
        checklist: { include: { itens: { where: { obrigatorio: true } } } },
        respostas: true,
      },
    })

    if (!inspecao) {
      return NextResponse.json({ erro: 'Inspeção não encontrada' }, { status: 404 })
    }

    if (inspecao.status === 'FINALIZADA') {
      return NextResponse.json({ sucesso: true }) // idempotent
    }

    // Create NCs for non-conforming items
    const naoConformes = inspecao.respostas.filter((r) => r.conforme === false)

    await prisma.$transaction([
      prisma.inspecao.update({
        where: { id: inspecaoId },
        data: {
          status: 'FINALIZADA',
          finalizadaAt: new Date(),
          assinaturaUrl,
        },
      }),
      ...naoConformes.map((r) => {
        const item = inspecao.checklist.itens.find((i) => i.id === r.itemId)
        return prisma.naoConformidade.create({
          data: {
            tenantId: user.tenantId,
            inspecaoId,
            itemId: r.itemId,
            descricao: item?.pergunta ?? 'Item não conforme',
            gravidade: item?.isCritico ? 'CRITICA' : 'MODERADA',
            status: 'ABERTA',
          },
        })
      }),
    ])

    return NextResponse.json({ sucesso: true })
  } catch (err) {
    console.error('[sync/finalizar]', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
