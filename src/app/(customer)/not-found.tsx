import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, ArrowRight, Home, List } from "lucide-react";
import { SearchBar } from "@/components/customer/search-bar";

// Note: Archived listings also 404 via notFound(). Future improvement: custom
// middleware to return HTTP 410 (Gone) for archived listings so search engines
// can distinguish "never existed" (404) from "existed but removed" (410).

export const metadata: Metadata = {
  title: "404 — Page Not Found | BarHop PH",
  description: "The page you're looking for doesn't exist. Search for bars and clubs across the Philippines.",
};

const POPULAR_CITIES = [
  { name: "Makati", region: "ncr", city: "makati" },
  { name: "Cebu City", region: "central-visayas", city: "cebu-city" },
  { name: "Davao City", region: "davao-region", city: "davao-city" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-24">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-[600px] w-[600px] rounded-full bg-neon-purple/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl text-center">
        {/* 404 heading with neon glow */}
        <p
          className="font-display font-bold text-neon-purple leading-none select-none"
          style={{
            fontSize: "clamp(6rem, 20vw, 10rem)",
            textShadow:
              "0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3)",
          }}
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="mt-2 font-display text-display-md font-semibold text-content">
          Page not found
        </h1>
        <p className="mt-3 text-base text-content-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been removed.
          Try searching for a venue instead.
        </p>

        {/* Search bar */}
        <div className="mt-8 mx-auto max-w-md">
          <Suspense
            fallback={
              <div className="h-10 w-full rounded-md bg-surface-raised animate-pulse" />
            }
          >
            <SearchBar placeholder="Search bars and clubs..." />
          </Suspense>
        </div>

        {/* Primary nav links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-neon-purple px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
          >
            <Home size={15} aria-hidden="true" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:border-neon-purple/50 hover:text-neon-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
          >
            <List size={15} aria-hidden="true" />
            Browse listings
          </Link>
        </div>

        {/* Popular city shortcuts */}
        <div className="mt-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-content-muted">
            Popular cities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {POPULAR_CITIES.map(({ name, region, city }) => (
              <Link
                key={city}
                href={`/listings/${region}/${city}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-card px-4 py-2 text-sm text-content-secondary transition-all hover:border-neon-purple/40 hover:text-neon-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
              >
                <MapPin size={12} aria-hidden="true" className="shrink-0" />
                {name}
                <ArrowRight
                  size={12}
                  aria-hidden="true"
                  className="shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
