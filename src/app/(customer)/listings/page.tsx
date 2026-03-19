import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/customer/breadcrumbs";
import { BrowseClient } from "./browse-client";
import { canonicalUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse Bars & Clubs",
  description:
    "Browse all bars, clubs, and nightlife venues in the Philippines. Filter by region, city, category, and hours.",
  alternates: {
    canonical: canonicalUrl("/listings"),
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse" }]} />
      <h1 className="font-display text-display-md mt-4 mb-8">Browse Bars &amp; Clubs</h1>
      {/*
       * BrowseClient uses useSearchParams() which requires a Suspense boundary.
       * We wrap it here so the server shell renders immediately while the client
       * component hydrates independently.
       */}
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseClient initialParams={params} />
      </Suspense>
    </div>
  );
}

/** Minimal skeleton shown while BrowseClient suspends during SSR hydration. */
function BrowseSkeleton() {
  return (
    <div className="flex gap-8 animate-pulse" aria-hidden="true">
      {/* Sidebar placeholder */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="rounded-card bg-surface-card border border-border h-96" />
      </div>
      {/* Grid placeholder */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card bg-surface-card border border-border h-64" />
        ))}
      </div>
    </div>
  );
}
