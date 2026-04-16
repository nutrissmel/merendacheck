import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  buscarDadosRelatorioInspecoes,
  buscarDadosFNDE,
} from '@/actions/relatorios.actions'
import { RelatorioInspecoesPDF } from '@/components/relatorios/pdf/RelatorioInspecoesPDF'
import { RelatorioFNDEPDF } from '@/components/relatorios/pdf/RelatorioFNDEPDF'
import { startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const tipo = sp.get('tipo') ?? 'inspecoes'
  const download = sp.get('download') === 'true'

  // Período padrão: mês atual
  const agora = new Date()
  const inicio = sp.get('inicio') ?? startOfMonth(agora).toISOString().split('T')[0]
  const fim = sp.get('fim') ?? endOfMonth(agora).toISOString().split('T')[0]
  const escolaId = sp.get('escolaId') ?? undefined

  const filtro = { inicio, fim, escolaId }

  try {
    let pdfStream: NodeJS.ReadableStream
    let filename = 'relatorio'

    if (tipo === 'fnde') {
      const dados = await buscarDadosFNDE(filtro)
      if (!dados) return new NextResponse('Dados não encontrados', { status: 404 })
      pdfStream = await renderToStream(createElement(RelatorioFNDEPDF, { dados }) as any)
      filename = `relatorio-fnde-${inicio}`
    } else {
      const dados = await buscarDadosRelatorioInspecoes(filtro)
      if (!dados) return new NextResponse('Dados não encontrados', { status: 404 })
      pdfStream = await renderToStream(createElement(RelatorioInspecoesPDF, { dados }) as any)
      filename = `relatorio-inspecoes-${inicio}`
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}.pdf"`
          : `inline; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[PDF Route Error]', err)
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
