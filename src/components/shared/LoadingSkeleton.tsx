import { Skeleton } from '@/components/ui/skeleton'

export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-[#D5E3F0] rounded-xl p-5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
          <Skeleton className="w-20 h-8 rounded" />
          <Skeleton className="w-32 h-4 rounded" />
        </div>
      ))}
    </div>
  )
}

export function TabelaSkeleton() {
  return (
    <div className="rounded-xl border border-[#D5E3F0] overflow-hidden">
      <div className="bg-[#EEF4FD] px-4 py-3 flex gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20 rounded" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-t border-[#D5E3F0] flex gap-8">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-24 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EscolaCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-[#D5E3F0] rounded-xl p-5 space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="mt-4 h-px bg-[#D5E3F0]" />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-5 max-w-lg">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-xl mt-2" />
    </div>
  )
}
