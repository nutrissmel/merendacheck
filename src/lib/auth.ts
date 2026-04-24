import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from './prisma'
import { redirect } from 'next/navigation'
import type { Papel } from '@prisma/client'

export type AuthUser = {
  id: string
  supabaseUserId: string
  tenantId: string
  nome: string
  email: string
  papel: Papel
  primeiroAcesso: boolean
  ativo: boolean
}

/**
 * Retorna o usuário autenticado ou null (sem redirecionar)
 */
export async function getServerUserOrNull(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se chamado de Server Component
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let usuario: Awaited<ReturnType<typeof prisma.usuario.findUnique>>
  try {
    usuario = await prisma.usuario.findUnique({
      where: { supabaseUserId: user.id },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[getServerUserOrNull] Prisma error:', msg)
    // Sign out so the middleware doesn't redirect back to /dashboard (which would loop)
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    return null
  }

  if (!usuario) return null

  return {
    id: usuario.id,
    supabaseUserId: user.id,
    tenantId: usuario.tenantId,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    primeiroAcesso: usuario.primeiroAcesso,
    ativo: usuario.ativo,
  }
}

/**
 * Retorna o usuário autenticado ou redireciona para /login
 */
export async function getServerUser(): Promise<AuthUser> {
  const user = await getServerUserOrNull()
  if (!user) redirect('/login')
  return user
}

/**
 * Exige um dos papéis — redireciona para /dashboard se não tiver permissão
 */
export async function requirePapel(papeis: Papel[]): Promise<AuthUser> {
  const user = await getServerUser()
  if (!papeis.includes(user.papel)) {
    redirect('/dashboard?error=unauthorized')
  }
  return user
}

/**
 * Retorna só o tenantId (mais leve, tenta ler do JWT se possível)
 */
export async function getTenantId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  // Tentar pegar do JWT claim injetado pelo hook
  const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id
  
  if (tenantId) return tenantId

  // Fallback para o banco
  const user = await getServerUser()
  return user.tenantId
}

/**
 * Verifica se o usuário tem acesso a uma escola específica
 */
export async function verificarAcessoEscola(
  escolaId: string,
  user?: AuthUser
): Promise<boolean> {
  const authUser = user || await getServerUser()
  
  if (authUser.papel === 'ADMIN_MUNICIPAL' || authUser.papel === 'NUTRICIONISTA' || authUser.papel === 'SUPER_ADMIN') {
    const escola = await prisma.escola.findFirst({
      where: { id: escolaId, tenantId: authUser.tenantId }
    })
    return !!escola
  }

  const vinculo = await prisma.usuarioEscola.findFirst({
    where: { usuarioId: authUser.id, escolaId: escolaId }
  })
  
  return !!vinculo
}

/**
 * Retorna filtro de tenantId para queries Prisma.
 * SUPER_ADMIN vê dados de todos os tenants (retorna {}).
 * Demais papéis filtram pelo próprio tenant.
 */
export function tenantWhere(user: AuthUser): { tenantId?: string } {
  if (user.papel === 'SUPER_ADMIN') return {}
  return { tenantId: user.tenantId }
}

/**
 * Retorna URL de redirect após login baseado no papel
 */
export function getRedirectPorPapel(papel: Papel): string {
  switch (papel) {
    case 'ADMIN_MUNICIPAL':
    case 'NUTRICIONISTA':
    case 'SUPER_ADMIN':
      return '/dashboard'
    case 'DIRETOR_ESCOLA':
      return '/escolas'
    case 'MERENDEIRA':
      return '/inspecoes/nova'
    default:
      return '/dashboard'
  }
}

/**
 * Wrapper que protege uma Server Action por papel
 */
export function withAuth<T, Args extends any[]>(
  handler: (user: AuthUser, ...args: Args) => Promise<T>,
  papeis?: Papel[]
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    const user = await getServerUser()
    if (papeis && !papeis.includes(user.papel)) {
      throw new Error('Não autorizado')
    }
    return handler(user, ...args)
  }
}
