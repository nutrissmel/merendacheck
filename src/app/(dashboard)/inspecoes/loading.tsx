import { PageHeaderSkeleton, TabelaSkeleton } from '@/components/shared/LoadingSkeleton'

export default function InspecoesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TabelaSkeleton />
    </div>
  )
}
