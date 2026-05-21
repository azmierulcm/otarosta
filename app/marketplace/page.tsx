import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Marketplace — Otarosta",
  description: "Crew-only classifieds for headsets, luggage, watches, uniforms, and manuals. Verified crew sellers only.",
  alternates: {
    canonical: "/marketplace",
  },
  openGraph: {
    title: "Marketplace — Otarosta",
    description: "Premium crew gear for aviation professionals. Verified sellers only.",
    images: ["/api/og/marketplace"],
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
