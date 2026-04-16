import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SuperAdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()

  if (user.papel !== 'SUPER_ADMIN') {
    redirect('/dashboard?error=unauthorized')
  }

  return <>{children}</>
}
