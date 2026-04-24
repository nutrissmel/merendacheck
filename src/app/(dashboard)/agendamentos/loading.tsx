import { PageHeaderSkeleton, TabelaSkeleton } from '@/components/shared/LoadingSkeleton'

export default function AgendamentosLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TabelaSkeleton />
    </div>
  )
}
