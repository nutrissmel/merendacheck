import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    const body = await request.json() as {
      clienteId: string
      escolaId: string
      checklistId: string
      createdAt?: string
    }

    const { clienteId, escolaId, checklistId, createdAt } = body

    if (!clienteId || !escolaId || !checklistId) {
      return NextResponse.json({ erro: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    // Dedup: if already created with this clienteId, return existing
    const existing = await prisma.inspecao.findFirst({
      where: { clienteId, tenantId: user.tenantId },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ inspecaoId: existing.id })
    }

    const inspecao = await prisma.inspecao.create({
      data: {
        clienteId,
        tenantId: user.tenantId,
        inspetorId: user.id,
        escolaId,
        checklistId,
        status: 'EM_ANDAMENTO',
        score: 0,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
      select: { id: true },
    })

    return NextResponse.json({ inspecaoId: inspecao.id })
  } catch (err) {
    console.error('[sync/inspecao]', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
