import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com service_role — só usar em Server Actions/Server Components.
 * Permite criar/deletar usuários sem confirmação de e-mail.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
