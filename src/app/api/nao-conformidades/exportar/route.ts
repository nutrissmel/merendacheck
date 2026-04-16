import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusNC, Severidade } from '@prisma/client'

export const dynamic = 'force-dynamic'

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

const SEVERIDADE_LABEL: Record<Severidade, string> = {
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica',
}

const STATUS_LABEL: Record<StatusNC, string> = {
  ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', RESOLVIDA: 'Resolvida', VENCIDA: 'Vencida',
}

export async function GET(request: NextRequest) {
  const user = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const escolaId = searchParams.get('escolaId') ?? undefined
  const status = searchParams.get('status') as StatusNC | null
  const severidade = searchParams.get('severidade') as Severidade | null
  const agora = new Date()

  const ncs = await prisma.naoConformidade.findMany({
    where: {
      tenantId: user.tenantId,
      ...(escolaId && { inspecao: { escolaId } }),
      ...(status && { status }),
      ...(severidade && { severidade }),
    },
    include: {
      inspecao: {
        include: {
          escola: { select: { nome: true } },
          checklist: { select: { nome: true } },
        },
      },
      acoes: {
        select: { status: true },
      },
    },
    orderBy: [{ severidade: 'desc' }, { createdAt: 'desc' }],
  })

  // Build item origin lookup
  const itemIds = [...new Set(ncs.map((nc) => nc.itemId))]
  const itens = await prisma.checklistItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, pergunta: true },
  })
  const itenMap = new Map(itens.map((i) => [i.id, i.pergunta]))

  // CSV header
  const headers = [
    'ID',
    'Título',
    'Escola',
    'Checklist',
    'Item Origem',
    'Severidade',
    'Status',
    'Criada em',
    'Prazo',
    'Resolvida em',
    'Dias em aberto',
    'Total de ações',
    'Ações concluídas',
  ]

  const rows = ncs.map((nc) => {
    const diasAberto = differenceInDays(
      nc.resolvidaEm ?? agora,
      nc.createdAt
    )
    const acoesConcluidas = nc.acoes.filter((a) => a.status === 'CONCLUIDA').length

    return [
      nc.id,
      nc.titulo,
      nc.inspecao.escola.nome,
      nc.inspecao.checklist.nome,
      itenMap.get(nc.itemId) ?? '',
      SEVERIDADE_LABEL[nc.severidade],
      STATUS_LABEL[nc.status],
      formatDate(nc.createdAt),
      nc.prazoResolucao ? format(new Date(nc.prazoResolucao), 'dd/MM/yyyy', { locale: ptBR }) : '',
      nc.resolvidaEm ? formatDate(nc.resolvidaEm) : '',
      String(diasAberto),
      String(nc.acoes.length),
      String(acoesConcluidas),
    ].map(escapeCsv).join(',')
  })

  const csvContent = [
    '\uFEFF' + headers.join(','), // BOM for Excel UTF-8
    ...rows,
  ].join('\r\n')

  const filename = `nao-conformidades-${format(agora, 'yyyy-MM-dd', { locale: ptBR })}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
