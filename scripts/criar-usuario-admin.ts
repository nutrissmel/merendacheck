/**
 * Cria o usuário admin no Supabase Auth e vincula ao registro no banco.
 * Uso: npx tsx scripts/criar-usuario-admin.ts
 */
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const prisma = new PrismaClient()

const USUARIOS = [
  { email: 'admin@luziania.go.gov.br', senha: 'Merenda@2025', nome: 'Secretária Maria Silva' },
  { email: 'nutri@luziania.go.gov.br', senha: 'Merenda@2025', nome: 'Nutricionista Ana Costa' },
]

async function main() {
  for (const u of USUARIOS) {
    console.log(`\nCriando ${u.email}...`)

    // 1. Criar no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.senha,
      email_confirm: true, // já confirma o e-mail automaticamente
    })

    if (error && !error.message.includes('already been registered')) {
      console.error(`  ❌ Erro Supabase: ${error.message}`)
      continue
    }

    const supabaseUserId = data?.user?.id

    if (!supabaseUserId) {
      // Usuário já existe — buscar o ID
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existing = (listData?.users as { id: string; email?: string }[] | undefined)?.find((usr) => usr.email === u.email)
      if (!existing) {
        console.error(`  ❌ Não encontrado no Supabase`)
        continue
      }
      console.log(`  ℹ️  Já existe no Supabase: ${existing.id}`)

      // Atualizar senha
      await supabase.auth.admin.updateUserById(existing.id, { password: u.senha })

      // Vincular no banco
      await prisma.usuario.updateMany({
        where: { email: u.email },
        data: { supabaseUserId: existing.id },
      })
      console.log(`  ✅ Vinculado: ${existing.id}`)
    } else {
      console.log(`  ✅ Criado: ${supabaseUserId}`)

      // Vincular no banco
      const updated = await prisma.usuario.updateMany({
        where: { email: u.email },
        data: { supabaseUserId },
      })

      if (updated.count === 0) {
        console.log(`  ⚠️  Nenhum registro no banco para ${u.email}. Verifique se o seed foi rodado.`)
      } else {
        console.log(`  ✅ Banco atualizado (${updated.count} registro)`)
      }
    }
  }

  console.log('\nPronto! Credenciais:')
  USUARIOS.forEach((u) => console.log(`  ${u.email} / ${u.senha}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
