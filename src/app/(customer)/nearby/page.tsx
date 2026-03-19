import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Breadcrumbs } from "@/components/customer/breadcrumbs";
import { canonicalUrl } from "@/lib/seo";

// NearbyClient uses browser geolocation — skip SSR entirely.
const NearbyClient = dynamic(
  () => import("@/components/customer/nearby-client").then((m) => ({ default: m.NearbyClient })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Bars & Clubs Near Me",
  description:
    "Find bars, clubs, and nightlife venues near your current location in the Philippines.",
  alternates: {
    canonical: canonicalUrl("/nearby"),
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function NearbyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nearby" }]} />
      <h1 className="font-display text-display-md mt-4 mb-8">Bars &amp; Clubs Near You</h1>
      <NearbyClient />
    </div>
  );
}
