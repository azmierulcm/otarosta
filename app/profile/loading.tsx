export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-24 space-y-4">
      {/* Header */}
      <div className="bg-bg border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-surface-2 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-56 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-surface-2 rounded-full animate-pulse" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-[var(--radius-md)] p-5 space-y-2">
            <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
            <div className="h-7 w-24 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Destination grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-border overflow-hidden">
            <div className="aspect-square bg-surface-2 animate-pulse" />
            <div className="p-2 space-y-1">
              <div className="h-3 bg-surface-2 rounded animate-pulse" />
              <div className="h-2 w-8 bg-surface-2 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
