import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { REGIONS, getRegionBySlug } from "@/lib/constants";
import { listingToCardData } from "@/lib/listing-helpers";
import { ListingCard } from "@/components/customer/listing-card";
import { Breadcrumbs } from "@/components/customer/breadcrumbs";
import { Badge } from "@/components/ui";

export const revalidate = 60;

interface Props {
  params: Promise<{ region: string }>;
}

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug } = await params;
  const region = getRegionBySlug(regionSlug);
  if (!region) return {};
  return {
    title: `Bars & Clubs in ${region.displayName}`,
    description: `Discover the best bars, clubs, and nightlife venues in ${region.displayName}, Philippines. Browse by city, category, and hours.`,
  };
}

const LISTING_LIMIT = 24;

export default async function RegionPage({ params }: Props) {
  const { region: regionSlug } = await params;
  const region = getRegionBySlug(regionSlug);

  if (!region) {
    notFound();
  }

  const listings = await db.listing.findMany({
    where: {
      region: regionSlug,
      status: "published",
    },
    orderBy: [{ isPromoted: "desc" }, { updatedAt: "desc" }],
    take: LISTING_LIMIT + 1, // Fetch one extra to detect if there are more
  });

  // Determine whether there are more results beyond the limit
  const hasMore = listings.length > LISTING_LIMIT;
  const displayedListings = hasMore ? listings.slice(0, LISTING_LIMIT) : listings;
  const cardData = displayedListings.map((listing) => listingToCardData(listing));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: region.displayName },
        ]}
      />

      {/* Hero */}
      <section className="mt-6 mb-8">
        <h1 className="font-display text-display-md text-content">
          Bars &amp; Clubs in {region.displayName}
        </h1>
        <p className="mt-2 text-content-secondary">
          Discover nightlife venues across {region.cities.length} cit
          {region.cities.length === 1 ? "y" : "ies"} in {region.displayName}.
        </p>
      </section>

      {/* City pills */}
      {region.cities.length > 0 && (
        <section aria-label="Browse by city" className="mb-10">
          <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3">
            Browse by City
          </h2>
          <div className="flex flex-wrap gap-2">
            {region.cities.map((city) => (
              <Link
                key={city.slug}
                href={`/listings/${regionSlug}/${city.slug}`}
                className="group"
              >
                <Badge
                  variant="default"
                  className="cursor-pointer border border-border group-hover:border-border-hover group-hover:text-neon-purple transition-colors px-3 py-1 text-sm"
                >
                  {city.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Listing grid */}
      <section aria-label={`Venues in ${region.displayName}`}>
        {cardData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardData.map((listing) => (
                <ListingCard key={listing.id} listing={listing} variant="grid" />
              ))}
            </div>

            {/* "View all" link when results exceed limit */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Link
                  href={`/listings?region=${regionSlug}`}
                  className="inline-flex items-center gap-1 text-neon-purple hover:text-neon-purple/80 font-medium transition-colors"
                >
                  View all in {region.displayName} &rarr;
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface-card px-8 py-16 text-center">
            <p className="text-content-secondary">
              No venues listed in {region.displayName} yet.
            </p>
            <Link
              href="/listings"
              className="mt-4 inline-block text-neon-purple hover:text-neon-purple/80 font-medium transition-colors"
            >
              Browse all venues &rarr;
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
