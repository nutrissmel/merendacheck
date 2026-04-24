import { Skeleton } from '@/components/ui/skeleton'

export default function ChecklistsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {[100, 140, 130].map((w, i) => (
          <Skeleton key={i} className={`h-9 w-[${w}px] rounded-t-md`} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="w-7 h-7 rounded-lg" />
            </div>
            <div className="px-4 pb-3 space-y-2">
              <Skeleton className="h-5 w-4/5 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <div className="px-4 py-3 border-t border-neutral-100 space-y-2">
              <Skeleton className="h-3 w-40 rounded" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <div className="px-4 py-3 border-t border-neutral-100 flex justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
