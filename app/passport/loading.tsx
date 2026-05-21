export default function PassportLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-24 space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-[var(--radius-md)] p-5 space-y-2 border border-border">
            <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
            <div className="h-7 w-24 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Map skeleton */}
      <div className="bg-surface rounded-[var(--radius-lg)] border border-border overflow-hidden">
        <div className="h-64 bg-surface-2 animate-pulse" />
      </div>

      {/* Destination grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-[var(--radius-md)] border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-surface-2 rounded animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-12 bg-surface-2 rounded animate-pulse" />
                <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
