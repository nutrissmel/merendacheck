import { NextResponse } from 'next/server'

const cache = new Map<string, { data: object; ts: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dias

const reqCount = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000 // 1 min

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = reqCount.get(ip)
  if (!entry || now > entry.reset) {
    reqCount.set(ip, { count: 1, reset: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params
  const cepLimpo = cep.replace(/\D/g, '')

  if (!/^\d{8}$/.test(cepLimpo)) {
    return NextResponse.json({ erro: 'CEP inválido' }, { status: 400 })
  }

  const ip = getIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ erro: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
  }

  const cached = cache.get(cepLimpo)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      next: { revalidate: 604800 },
    })

    if (!res.ok) return NextResponse.json({ erro: 'CEP não encontrado' }, { status: 404 })

    const json = await res.json()

    if (json.erro) return NextResponse.json({ erro: 'CEP não encontrado' }, { status: 404 })

    const data = {
      logradouro: json.logradouro ?? '',
      bairro: json.bairro ?? '',
      localidade: json.localidade ?? '',
      uf: json.uf ?? '',
    }

    cache.set(cepLimpo, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ erro: 'Erro ao buscar CEP' }, { status: 500 })
  }
}
