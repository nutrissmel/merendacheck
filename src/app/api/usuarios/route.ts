import { NextResponse } from 'next/server'
import { getServerUserOrNull } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const user = await getServerUserOrNull()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  if (user.papel !== 'ADMIN_MUNICIPAL' && user.papel !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const [usuarios, escolas] = await Promise.all([
    prisma.usuario.findMany({
      where: { tenantId: user.tenantId },
      include: {
        escolas: {
          include: { escola: { select: { nome: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.escola.findMany({
      where: { tenantId: user.tenantId, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  return NextResponse.json({
    usuarioLogadoId: user.id,
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      ativo: u.ativo,
      createdAt: u.createdAt,
      escolas: u.escolas.map((ue) => ({ nome: ue.escola.nome })),
    })),
    escolas,
  })
}
