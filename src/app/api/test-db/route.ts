import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}
  try {
    results.tenants = await prisma.tenant.count()
  } catch (e) {
    results.tenants_error = e instanceof Error ? e.message.slice(0, 200) : String(e)
  }
  try {
    results.usuarios = await prisma.usuario.count()
  } catch (e) {
    results.usuarios_error = e instanceof Error ? e.message.slice(0, 200) : String(e)
  }
  return NextResponse.json({ db_url_host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0], ...results })
}
