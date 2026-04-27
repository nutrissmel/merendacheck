import { unstable_cache } from 'next/cache'
import { getServerUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { InstallPWABanner } from '@/components/shared/InstallPWABanner'
import { BannerNotificacoesPush } from '@/components/shared/BannerNotificacoesPush'
import { AgendamentosHojeModal } from '@/components/shared/AgendamentosHojeModal'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

// Cache NC counts por 30 segundos — sidebar não precisa de tempo real
const getNcCounts = (tenantId: string) =>
  unstable_cache(
    async () => {
      const [ncCount, ncVencidas] = await Promise.all([
        prisma.naoConformidade.count({
          where: { tenantId, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
        }),
        prisma.naoConformidade.count({
          where: {
            tenantId,
            prazoResolucao: { lt: new Date() },
            status: { notIn: ['RESOLVIDA'] },
          },
        }),
      ])
      return { ncCount, ncVencidas }
    },
    [`nc-counts-${tenantId}`],
    { revalidate: 30 }
  )()

// Cache agendamentos de hoje — TTL de 5 minutos, chave inclui data
const getAgendamentosHoje = (tenantId: string) => {
  const hoje = new Date().toISOString().slice(0, 10)
  return unstable_cache(
    async () => {
      return prisma.agendamento.findMany({
        where: {
          tenantId,
          ativo: true,
          proximaExecucao: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
        },
        include: {
          escola: { select: { id: true, nome: true } },
          checklist: { select: { id: true, nome: true, categoria: true } },
        },
        orderBy: { proximaExecucao: 'asc' },
      })
    },
    [`agendamentos-hoje-${tenantId}-${hoje}`],
    { revalidate: 300 }
  )()
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  let ncCount = 0
  let ncVencidas = 0
  let agendamentosHoje: Awaited<ReturnType<typeof getAgendamentosHoje>> = []

  try {
    const [counts, agendamentos] = await Promise.all([
      getNcCounts(user.tenantId),
      getAgendamentosHoje(user.tenantId),
    ])
    ncCount = counts.ncCount
    ncVencidas = counts.ncVencidas
    agendamentosHoje = agendamentos
  } catch {
    // Non-critical; fail gracefully
  }

  const userProps = {
    nome: user.nome,
    email: user.email,
    papel: user.papel,
  }

  return (
    <div className="flex h-screen bg-[#F5F9FD] overflow-hidden">
      <Sidebar user={userProps} ncCount={ncCount} ncVencidas={ncVencidas} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header user={userProps} ncCount={ncCount} />

        <Suspense fallback={null}>
          <TrialBanner />
        </Suspense>

        <main className="flex-1 overflow-y-auto p-0 md:p-6 dashboard-main">
          {children}
        </main>
      </div>

      <MobileTabBar />
      <InstallPWABanner papel={user.papel} />
      <BannerNotificacoesPush />
      <AgendamentosHojeModal agendamentos={agendamentosHoje} />
    </div>
  )
}
