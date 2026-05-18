// app/roster/page.tsx — Next.js App Router

import RosterCard from "./RosterCard";

export const metadata = {
  title: "Roster Card",
  description: "Shareable roster summary card for crew members.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFCF8] via-[#F7F5F0] to-[#FFE9EE] py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF385C]">
            cemrosta
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#222]">
            Your month in the sky
          </h1>
          <p className="mt-1 text-[14px] text-[#717171]">
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
