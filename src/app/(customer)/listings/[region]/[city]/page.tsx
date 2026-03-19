import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { REGIONS, CATEGORIES, getRegionBySlug, getCityBySlug } from "@/lib/constants";
import { listingToCardData } from "@/lib/listing-helpers";
import { ListingCard } from "@/components/customer/listing-card";
import { Breadcrumbs } from "@/components/customer/breadcrumbs";
import { Badge } from "@/components/ui";
import { canonicalUrl } from "@/lib/seo";

export const revalidate = 60;

interface Props {
  params: Promise<{ region: string; city: string }>;
}

export async function generateStaticParams() {
  const params: { region: string; city: string }[] = [];
  for (const r of REGIONS) {
    for (const c of r.cities) {
      params.push({ region: r.slug, city: c.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug, city: citySlug } = await params;
  const region = getRegionBySlug(regionSlug);
  const city = getCityBySlug(regionSlug, citySlug);
  if (!region || !city) return {};
  return {
    title: `Bars & Clubs in ${city.name}, ${region.displayName}`,
    description: `Find the best bars, clubs, and nightlife in ${city.name}. Browse venues with hours, menus, events, and more.`,
    alternates: {
      canonical: canonicalUrl(`/listings/${regionSlug}/${citySlug}`),
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

const LISTING_LIMIT = 24;

export default async function CityPage({ params }: Props) {
  const { region: regionSlug, city: citySlug } = await params;
  const region = getRegionBySlug(regionSlug);
  const city = getCityBySlug(regionSlug, citySlug);

  if (!region || !city) {
    notFound();
  }

  const listings = await db.listing.findMany({
    where: {
      region: regionSlug,
      city: citySlug,
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
          { label: region.displayName, href: `/listings/${regionSlug}` },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <section className="mt-6 mb-8">
        <h1 className="font-display text-display-md text-content">
          Bars &amp; Clubs in {city.name}
        </h1>
        <p className="mt-2 text-content-secondary">{region.displayName}</p>
      </section>

      {/* Category pills */}
      <section aria-label="Browse by category" className="mb-10">
        <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3">
          Browse by Category
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/listings?region=${regionSlug}&city=${citySlug}&category=${category.slug}`}
              className="group"
            >
              <Badge
                variant="default"
                className="cursor-pointer border border-border group-hover:border-border-hover group-hover:text-neon-purple transition-colors px-3 py-1 text-sm"
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Listing grid */}
      <section aria-label={`Venues in ${city.name}`}>
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
                  href={`/listings?region=${regionSlug}&city=${citySlug}`}
                  className="inline-flex items-center gap-1 text-neon-purple hover:text-neon-purple/80 font-medium transition-colors"
                >
                  View all in {city.name} &rarr;
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface-card px-8 py-16 text-center">
            <p className="text-content-secondary">
              No venues listed in {city.name} yet.
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
