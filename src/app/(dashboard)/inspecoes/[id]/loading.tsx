import { Skeleton } from '@/components/ui/skeleton'

export default function InspecaoDetalheLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-4 w-24 rounded" />

      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        </div>
        <div className="flex gap-6 pt-3 border-t border-neutral-100">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-[#D5E3F0] rounded-xl p-4 text-center space-y-2">
            <Skeleton className="h-8 w-12 rounded mx-auto" />
            <Skeleton className="h-3 w-20 rounded mx-auto" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
