import { getServerUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { InstallPWABanner } from '@/components/shared/InstallPWABanner'
import { BannerNotificacoesPush } from '@/components/shared/BannerNotificacoesPush'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  let ncCount = 0
  let ncVencidas = 0
  try {
    const [ncCountData, ncVencidasData] = await Promise.all([
      prisma.naoConformidade.count({
        where: { tenantId: user.tenantId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
      }),
      prisma.naoConformidade.count({
        where: {
          tenantId: user.tenantId,
          prazoResolucao: { lt: new Date() },
          status: { notIn: ['RESOLVIDA'] },
        },
      }),
    ])
    ncCount = ncCountData
    ncVencidas = ncVencidasData
  } catch {
    // NC counts are non-critical; fail gracefully
  }

  const userProps = {
    nome: user.nome,
    email: user.email,
    papel: user.papel,
  }

  return (
    <div className="flex h-screen bg-[#F5F9FD] overflow-hidden">
      {/* Sidebar — hidden on mobile for MERENDEIRA, shown for all on md+ */}
      <Sidebar user={userProps} ncCount={ncCount} ncVencidas={ncVencidas} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header — hidden on mobile when showing full-screen inspection */}
        <Header user={userProps} ncCount={ncCount} />

        <Suspense fallback={null}>
          <TrialBanner />
        </Suspense>

        <main className="flex-1 overflow-y-auto p-0 md:p-6 dashboard-main">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile only (md+ hidden via CSS in component) */}
      <MobileTabBar />

      {/* PWA install prompt — client component, shows only on mobile */}
      <InstallPWABanner papel={user.papel} />

      {/* Push notification banner — mobile only */}
      <BannerNotificacoesPush />
    </div>
  )
}
