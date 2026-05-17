import { Metadata } from "next";
import PassportClient from "./PassportClient";

export const metadata: Metadata = {
  title: "Your Passport — Cemrosta",
  description: "View your lifetime flight statistics, destination stamps, and career milestones. Built for crew.",
  alternates: { canonical: "/passport" },
  openGraph: {
    title: "Your Passport — Cemrosta",
    description: "View your lifetime flight statistics, destination stamps, and career milestones.",
    images: ["/api/og/profile"],
    url: "https://cemrosta.vercel.app/passport",
  },
};

export default function PassportPage() {
  return <PassportClient />;
}
