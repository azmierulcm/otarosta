// app/roster/page.tsx — Next.js App Router

import RosterCard from "./RosterCard";

export const metadata = {
  title: "Roster Card",
  description: "Shareable roster summary card for crew members.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-2 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-mono mb-2">
            {"// ROSTER CARD"}
          </p>
          <h1 className="text-3xl font-black tracking-tighter text-text">
            Your month in the sky
          </h1>
          <p className="mt-2 text-[14px] text-text-muted font-bold">
            A shareable summary card built for 9:16 Instagram Stories.
          </p>
        </header>

        <div className="flex justify-center">
          <RosterCard defaultRole="pilot" defaultPeriod="month" />
        </div>
      </div>
    </main>
  );
}
