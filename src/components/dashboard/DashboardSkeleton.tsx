function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#EEF4FD] rounded ${className ?? ''}`} />
}

// ─── KPIs ─────────────────────────────────────────────────────

export function KPIsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)] space-y-3"
        >
          <div className="flex items-start justify-between">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
          <Pulse className="h-10 w-20" />
          <Pulse className="h-3 w-32" />
          <Pulse className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

// ─── Gráfico Conformidade ─────────────────────────────────────

export function GraficoConformidadeSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <Pulse className="h-4 w-40" />
          <Pulse className="h-3 w-28" />
        </div>
        <Pulse className="h-8 w-28 rounded-lg" />
      </div>

      {/* Área do gráfico */}
      <div className="h-[280px] relative">
        {/* Linhas de eixo Y simuladas */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-[#EEF4FD]"
            style={{ top: `${i * 25}%` }}
          />
        ))}
        {/* Área de onda */}
        <div className="absolute inset-0 flex items-end gap-1 px-8 pb-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-[#EEF4FD] rounded-t animate-pulse"
              style={{
                height: `${30 + Math.sin(i * 0.7) * 25 + 20}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
        {/* Eixo X */}
        <div className="absolute bottom-0 left-8 right-4 flex justify-between">
          {[...Array(5)].map((_, i) => (
            <Pulse key={i} className="h-2 w-10" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────

export function HeatmapSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
      <div className="space-y-2 mb-4">
        <Pulse className="h-4 w-52" />
        <Pulse className="h-3 w-28" />
      </div>

      <div className="space-y-[3px]">
        {[...Array(7)].map((_, dia) => (
          <div key={dia} className="flex items-center gap-[3px]">
            <Pulse className="w-8 h-3 rounded" />
            {[...Array(13)].map((_, hora) => (
              <div
                key={hora}
                className="w-7 h-7 bg-[#EEF4FD] rounded animate-pulse"
                style={{ animationDelay: `${(dia * 13 + hora) * 20}ms` }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Pulse className="h-2 w-10" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#EEF4FD] rounded animate-pulse" />
        ))}
        <Pulse className="h-2 w-8" />
      </div>
    </div>
  )
}

// ─── Ranking Escolas ──────────────────────────────────────────

export function RankingEscolasSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#D5E3F0] flex items-center justify-between">
        <Pulse className="h-4 w-40" />
        <div className="flex gap-1">
          <Pulse className="h-7 w-20 rounded-md" />
          <Pulse className="h-7 w-20 rounded-md" />
        </div>
      </div>

      <div className="divide-y divide-[#EEF4FD]">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-center gap-3"
          >
            <Pulse className="w-7 h-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-3 w-48" />
              <Pulse className="h-2 w-32" />
            </div>
            <Pulse className="h-6 w-20 rounded-full" />
            <Pulse className="h-3 w-10 hidden sm:block" />
            <Pulse className="h-6 w-20 rounded hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton completo do dashboard ───────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Pulse className="h-7 w-56" />
          <Pulse className="h-3 w-40" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-9 w-36 rounded-lg" />
          <Pulse className="h-9 w-36 rounded-lg" />
          <Pulse className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      <KPIsSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GraficoConformidadeSkeleton />
        </div>
        <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 space-y-4">
          <Pulse className="h-4 w-36" />
          <Pulse className="h-[180px] w-full rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingEscolasSkeleton />
        <HeatmapSkeleton />
      </div>
    </div>
  )
}
