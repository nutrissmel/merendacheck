import { NextResponse } from 'next/server'
import { getServerUserOrNull } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PAPEL_PT: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_MUNICIPAL: 'Administrador',
  NUTRICIONISTA: 'Nutricionista',
  DIRETOR_ESCOLA: 'Diretor',
  MERENDEIRA: 'Merendeira',
}

export async function GET() {
  const user = await getServerUserOrNull()

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  if (user.papel !== 'ADMIN_MUNICIPAL' && user.papel !== 'SUPER_ADMIN') {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 })
  }

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [usuarios, tenant, mesPorUsuario] = await Promise.all([
    prisma.usuario.findMany({
      where: { tenantId: user.tenantId },
      include: {
        escolas: { include: { escola: { select: { nome: true } } } },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { nome: true },
    }),
    prisma.inspecao.groupBy({
      by: ['inspetorId'],
      where: { tenantId: user.tenantId, iniciadaEm: { gte: inicioMes } },
      _count: true,
    }),
  ])

  const mesMap = new Map(mesPorUsuario.map((r) => [r.inspetorId, r._count]))

  const cabecalho = ['Nome', 'E-mail', 'Papel', 'Escolas', 'Status', 'Inspeções (mês)', 'Cadastro']
  const linhas = usuarios.map((u) => [
    u.nome,
    u.email,
    PAPEL_PT[u.papel] ?? u.papel,
    u.escolas.map((ue) => ue.escola.nome).join('; '),
    u.ativo ? 'Ativo' : 'Inativo',
    String(mesMap.get(u.id) ?? 0),
    format(u.createdAt, 'dd/MM/yyyy', { locale: ptBR }),
  ])

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csvRows = [
    cabecalho.map(escape).join(','),
    ...linhas.map((row) => row.map(escape).join(',')),
  ]
  const csv = '\uFEFF' + csvRows.join('\r\n') // BOM for Excel UTF-8

  const nomeArquivo = `usuarios-${(tenant?.nome ?? 'municipio').replace(/\s+/g, '-').toLowerCase()}-${format(agora, 'yyyy-MM-dd')}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      'X-Filename': nomeArquivo,
    },
  })
}
