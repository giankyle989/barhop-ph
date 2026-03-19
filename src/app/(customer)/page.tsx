import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { listingToCardData } from "@/lib/listing-helpers";
import { SearchBar } from "@/components/customer/search-bar";
import { FeaturedCarousel } from "@/components/customer/featured-carousel";
import { CATEGORIES } from "@/lib/constants";
import { canonicalUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "BarHop PH — Discover Bars & Clubs in the Philippines",
  description:
    "The Philippines' #1 directory for bars, clubs, and nightlife venues. Search by location, category, and hours. Find the best spots in Makati, BGC, Cebu, and more.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: "BarHop PH — Discover Bars & Clubs in the Philippines",
    description:
      "The Philippines' #1 directory for bars, clubs, and nightlife venues.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const POPULAR_CITIES = [
  { name: "Makati", region: "ncr", city: "makati", regionLabel: "NCR" },
  { name: "Taguig (BGC)", region: "ncr", city: "taguig", regionLabel: "NCR" },
  {
    name: "Quezon City",
    region: "ncr",
    city: "quezon-city",
    regionLabel: "NCR",
  },
  {
    name: "Cebu City",
    region: "central-visayas",
    city: "cebu-city",
    regionLabel: "Central Visayas",
  },
  {
    name: "Davao City",
    region: "davao-region",
    city: "davao-city",
    regionLabel: "Davao Region",
  },
  {
    name: "Iloilo City",
    region: "western-visayas",
    city: "iloilo-city",
    regionLabel: "Western Visayas",
  },
];

export default async function HomePage() {
  // Prefer promoted listings for the carousel; fall back to recent if none exist
  const promotedListings = await db.listing.findMany({
    where: { status: "published", isPromoted: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const useFallback = promotedListings.length === 0;

  const carouselListings = useFallback
    ? await db.listing.findMany({
        where: { status: "published" },
        orderBy: { updatedAt: "desc" },
        take: 8,
      })
    : promotedListings;

  const carouselCards = carouselListings.map((listing) => listingToCardData(listing));
  const carouselTitle = useFallback ? "Recently Added" : "Featured Venues";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-x-hidden bg-gradient-to-b from-neon-purple/20 via-surface to-surface py-24 sm:py-32">
        {/* Decorative background glow */}
        <div
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
          aria-hidden="true"
        >
          <div className="h-96 w-96 rounded-full bg-neon-purple/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-display text-display-lg font-bold text-content">
            Discover the Best{" "}
            <span className="text-neon-purple">Bars &amp; Clubs</span> in the
            Philippines
          </h1>
          <p className="mt-4 text-lg text-content-secondary">
            Your guide to the hottest nightlife spots across every city in the
            Philippines — from Makati to Cebu and beyond.
          </p>

          <div className="mt-8 mx-auto max-w-xl">
            <Suspense fallback={<div className="h-10 w-full rounded-md bg-surface-raised animate-pulse" />}>
              <SearchBar placeholder="Search bars and clubs..." mode="autocomplete" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Featured Venues / Recently Added carousel */}
      {carouselCards.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 overflow-hidden">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-display-sm font-semibold text-content">
              {carouselTitle}
            </h2>
            <Link
              href="/listings"
              className="flex items-center gap-1 text-sm text-neon-purple hover:text-neon-pink transition-colors"
            >
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <FeaturedCarousel listings={carouselCards} />
        </section>
      )}

      {/* Browse by Category */}
      <section className="bg-surface-raised py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 font-display text-display-sm font-semibold text-content">
            Browse by Category
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/listings?category=${category.slug}`}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-surface-card px-4 py-3 transition-all hover:border-neon-purple/40 hover:shadow-glow-purple"
              >
                <span className="text-sm font-medium text-content group-hover:text-neon-purple transition-colors">
                  {category.name}
                </span>
                <ArrowRight
                  size={14}
                  className="shrink-0 text-content-muted group-hover:text-neon-purple transition-colors"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="mb-8 font-display text-display-sm font-semibold text-content">
          Popular Cities
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {POPULAR_CITIES.map(({ name, region, city, regionLabel }) => (
            <Link
              key={city}
              href={`/listings/${region}/${city}`}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-surface-card p-6 transition-all hover:border-neon-purple/40 hover:shadow-glow-purple"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-neon-purple/10 p-2">
                  <MapPin
                    size={16}
                    className="text-neon-purple"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-semibold text-content group-hover:text-neon-purple transition-colors">
                    {name}
                  </p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {regionLabel}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
