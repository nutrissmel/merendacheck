import { NextResponse } from 'next/server'
import { getServerUserOrNull } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const user = await getServerUserOrNull()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const [usuario, tenant] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: user.id },
      select: { createdAt: true },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { nome: true, estado: true },
    }),
  ])

  return NextResponse.json({
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    nomeMunicipio: tenant?.nome ?? '',
    estado: tenant?.estado ?? '',
    createdAt: usuario?.createdAt ?? new Date(),
  })
}
