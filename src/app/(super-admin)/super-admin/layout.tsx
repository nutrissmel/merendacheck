import { getServerUser } from '@/lib/auth'
import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar'

export const metadata = { title: 'Super Admin — MerendaCheck' }

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()

  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden">
      <SuperAdminSidebar user={{ nome: user.nome, email: user.email }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#F0F4F8] rounded-tl-2xl">
          {children}
        </main>
      </div>
    </div>
  )
}
