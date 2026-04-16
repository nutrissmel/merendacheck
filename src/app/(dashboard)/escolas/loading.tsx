import { PageHeaderSkeleton, EscolaCardSkeleton } from '@/components/shared/LoadingSkeleton'

export default function EscolasLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <EscolaCardSkeleton />
    </div>
  )
}
