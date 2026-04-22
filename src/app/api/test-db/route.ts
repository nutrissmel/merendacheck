import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const count = await prisma.tenant.count()
    return NextResponse.json({ ok: true, tenants: count, db_url_host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'hidden' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg, db_url_host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'hidden' }, { status: 500 })
  }
}
