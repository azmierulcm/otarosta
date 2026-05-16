export default function MarketplaceLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-surface-2 rounded-full animate-pulse shrink-0" />
      </div>

      {/* Filter skeletons */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-surface-2 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-border overflow-hidden">
            <div className="aspect-[4/3] bg-surface-2 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-surface-2 rounded animate-pulse" />
              <div className="h-5 w-20 bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-28 bg-surface-2 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
