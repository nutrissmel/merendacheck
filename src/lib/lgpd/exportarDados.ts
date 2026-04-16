import prisma from '@/lib/prisma'

/**
 * Gera CSV com dados pessoais do tenant para exportação LGPD.
 * Retorna um objeto com os CSVs gerados (sem upload — processado no server action).
 */
export async function gerarCsvDadosTenant(tenantId: string): Promise<{
  usuarios: string
  inspecoes: string
  logsAuditoria: string
  readme: string
}> {
  const [usuarios, inspecoes, logs] = await Promise.all([
    prisma.usuario.findMany({
      where: { tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.inspecao.findMany({
      where: { tenantId },
      select: {
        id: true,
        escola: { select: { nome: true } },
        checklist: { select: { nome: true } },
        inspetor: { select: { nome: true, email: true } },
        status: true,
        score: true,
        iniciadaEm: true,
        finalizadaEm: true,
      },
      orderBy: { iniciadaEm: 'asc' },
    }),
    (prisma as any).logAuditoria.findMany({
      where: { tenantId },
      select: {
        id: true,
        usuarioId: true,
        acao: true,
        alvoNome: true,
        ip: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 10000,
    }),
  ])

  // Build CSVs
  const csvUsuarios = [
    'id,nome,email,papel,ativo,createdAt',
    ...usuarios.map((u) =>
      [u.id, csvEscape(u.nome), csvEscape(u.email), u.papel, u.ativo, u.createdAt.toISOString()].join(','),
    ),
  ].join('\n')

  const csvInspecoes = [
    'id,escola,checklist,inspetor,inspetor_email,status,score,iniciadaEm,finalizadaEm',
    ...inspecoes.map((i) =>
      [
        i.id,
        csvEscape(i.escola.nome),
        csvEscape(i.checklist.nome),
        csvEscape(i.inspetor.nome),
        csvEscape(i.inspetor.email),
        i.status,
        i.score ?? '',
        i.iniciadaEm.toISOString(),
        i.finalizadaEm?.toISOString() ?? '',
      ].join(','),
    ),
  ].join('\n')

  const csvLogs = [
    'id,usuarioId,acao,alvo,ip,createdAt',
    ...logs.map((l: any) =>
      [l.id, l.usuarioId, l.acao, csvEscape(l.alvoNome ?? ''), l.ip ?? '', l.createdAt.toISOString()].join(','),
    ),
  ].join('\n')

  const readme = `EXPORTAÇÃO DE DADOS — MerendaCheck
Gerado em: ${new Date().toISOString()}
Tenant ID: ${tenantId}

Arquivos incluídos:
- usuarios.csv: Dados cadastrais de todos os usuários do município
- inspecoes.csv: Histórico de inspeções realizadas
- logs_auditoria.csv: Registro de ações críticas no sistema

Este arquivo foi gerado em atendimento à Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
Para dúvidas ou solicitações: privacidade@merendacheck.com.br
`

  return {
    usuarios: csvUsuarios,
    inspecoes: csvInspecoes,
    logsAuditoria: csvLogs,
    readme,
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}
