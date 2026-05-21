export default function RosterLoading() {
  return (
    <main className="min-h-screen bg-surface-2 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header skeleton */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-3 w-24 bg-surface rounded animate-pulse" />
          <div className="h-8 w-56 bg-surface rounded animate-pulse" />
          <div className="h-4 w-72 bg-surface rounded animate-pulse" />
        </div>

        {/* Card skeleton — 9:16 aspect ratio approximation */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm aspect-[9/16] bg-surface rounded-[var(--radius-xl)] border border-border animate-pulse" />
        </div>
      </div>
    </main>
  );
}
