import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { getCityBySlug, getRegionBySlug } from "@/lib/constants";
import { getPrimaryCategory } from "@/lib/listing-helpers";
import { generateListingJsonLd } from "@/lib/structured-data";
import { canonicalUrl, siteUrl } from "@/lib/seo";
import { Badge, Skeleton } from "@/components/ui";
import { Breadcrumbs } from "@/components/customer/breadcrumbs";
import { OpenClosedBadge } from "@/components/customer/open-closed-badge";
import { ListingHours } from "@/components/customer/listing-hours";
import { ListingMenu } from "@/components/customer/listing-menu";
import { ListingEvents } from "@/components/customer/listing-events";
import { ListingContact } from "@/components/customer/listing-contact";
import type { OpenHours, SocialLinks, MenuItem, EventItem } from "@/lib/validations";

// Lazy-load heavy below-fold client components to reduce initial bundle size.
// ListingGallery: lightbox with keyboard nav — defer until it scrolls into view.
const ListingGallery = dynamic(
  () => import("@/components/customer/listing-gallery").then((m) => ({ default: m.ListingGallery })),
  { loading: () => <Skeleton className="h-[200px] w-full" /> }
);

// ListingMap: Google Maps iframe — lazy load with skeleton placeholder.
const ListingMap = dynamic(
  () => import("@/components/customer/listing-map").then((m) => ({ default: m.ListingMap })),
  { loading: () => <Skeleton className="h-[300px] w-full" /> }
);

export const revalidate = 60;

// cache() deduplicates DB calls between generateMetadata and the page component
// within the same render pass.
const getListing = cache(
  async (region: string, city: string, slug: string) => {
    return db.listing.findFirst({
      where: { region, city, slug, status: "published" },
    });
  }
);

interface Props {
  params: Promise<{ region: string; city: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, city, slug } = await params;
  const listing = await getListing(region, city, slug);
  if (!listing) return {};

  const primaryCategory = getPrimaryCategory(listing.categories);
  const cityObj = getCityBySlug(region, city);
  const title = `${listing.name} — ${primaryCategory} in ${cityObj?.name ?? city}`;
  const description = listing.description
    ? listing.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `${listing.name} is a ${primaryCategory} in ${cityObj?.name ?? city}. View hours, menu, events, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`/listings/${region}/${city}/${slug}`),
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: listing.imageUrl ? [listing.imageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

// Sanitize-html config: allow formatting tags, links, and basic structure —
// strip all scripts and event handlers (XSS prevention)
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "ul", "ol", "li",
    "h2", "h3", "h4", "a", "blockquote",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  // Force external links to be safe
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      },
    }),
  },
};

export default async function ListingDetailPage({ params }: Props) {
  const { region, city, slug } = await params;
  const listing = await getListing(region, city, slug);

  if (!listing) {
    notFound();
  }

  const cityObj = getCityBySlug(region, city);
  const regionObj = getRegionBySlug(region);

  const openHours = listing.openHours as OpenHours | null;
  const socialLinks = listing.socialLinks as SocialLinks | null;
  const menu = listing.menu as MenuItem[] | null;
  const events = listing.events as EventItem[] | null;

  // Sanitize description HTML server-side before passing to dangerouslySetInnerHTML
  const sanitizedDescription = listing.description
    ? sanitizeHtml(listing.description, SANITIZE_OPTIONS)
    : null;

  const jsonLd = generateListingJsonLd(listing, siteUrl());

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            {
              label: regionObj?.displayName ?? region,
              href: `/listings/${region}`,
            },
            {
              label: cityObj?.name ?? city,
              href: `/listings/${region}/${city}`,
            },
            { label: listing.name },
          ]}
        />

        {/* Hero image */}
        {listing.imageUrl && (
          <div className="relative mt-4 w-full aspect-[16/6] rounded-card overflow-hidden border border-border">
            <Image
              src={listing.imageUrl}
              alt={`${listing.name} - ${getPrimaryCategory(listing.categories)} in ${cityObj?.name ?? city}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/20 to-transparent" />
          </div>
        )}

        {/* Venue header */}
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-display-sm sm:text-display-md text-content leading-tight">
              {listing.name}
            </h1>

            {/* Category badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.categories.map((cat, i) => (
                <Badge key={cat} variant={i === 0 ? "neon" : "default"}>
                  {cat}
                </Badge>
              ))}
              {listing.isPromoted && (
                <Badge variant="featured">Featured</Badge>
              )}
            </div>
          </div>

          {/* Open/Closed badge — prominent placement */}
          <div className="flex-shrink-0 mt-1">
            <OpenClosedBadge openHours={openHours} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column (2/3): description, gallery, menu, events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {sanitizedDescription && (
              <section aria-label="About this venue">
                <h2 className="text-display-sm font-display text-content mb-3">
                  About
                </h2>
                {/* Safe: content is sanitized server-side with sanitize-html */}
                <div
                  className="prose prose-invert prose-sm max-w-none text-content-secondary leading-relaxed [&_a]:text-neon-purple [&_a:hover]:text-neon-purple/80"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </section>
            )}

            {/* Gallery */}
            {listing.gallery && listing.gallery.length > 0 && (
              <section aria-label="Photo gallery">
                <h2 className="text-display-sm font-display text-content mb-3">
                  Gallery
                </h2>
                <ListingGallery images={listing.gallery} alt={listing.name} />
              </section>
            )}

            {/* Menu */}
            {menu && menu.length > 0 && (
              <section aria-label="Menu">
                <h2 className="text-display-sm font-display text-content mb-3">
                  Menu
                </h2>
                <div className="rounded-card border border-border bg-surface-card p-4">
                  <ListingMenu menu={menu} />
                </div>
              </section>
            )}

            {/* Events */}
            {events && events.length > 0 && (
              <section aria-label="Events">
                <h2 className="text-display-sm font-display text-content mb-3">
                  Events
                </h2>
                <ListingEvents events={events} />
              </section>
            )}
          </div>

          {/* Right column (1/3): hours, contact, map */}
          <aside className="space-y-6">
            {/* Opening hours */}
            <div className="rounded-card border border-border bg-surface-card p-4">
              <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>Opening Hours</span>
              </h2>
              <ListingHours openHours={openHours} />
            </div>

            {/* Contact info */}
            <div className="rounded-card border border-border bg-surface-card p-4">
              <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
                Contact
              </h2>
              <ListingContact
                listingId={listing.id}
                address={listing.address}
                phone={listing.phone}
                whatsapp={listing.whatsapp}
                email={listing.email}
                socialLinks={socialLinks}
              />
            </div>

            {/* Map */}
            <div>
              <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
                Location
              </h2>
              <ListingMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                name={listing.name}
              />
            </div>
          </aside>
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <section aria-label="Tags" className="mt-10">
            <h2 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Bottom padding */}
        <div className="h-12" />
      </div>
    </>
  );
}
