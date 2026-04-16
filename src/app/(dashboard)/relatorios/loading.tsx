import { PageHeaderSkeleton, TabelaSkeleton, StatsCardSkeleton } from '@/components/shared/LoadingSkeleton'

export default function RelatoriosLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsCardSkeleton />
      <TabelaSkeleton />
    </div>
  )
}
