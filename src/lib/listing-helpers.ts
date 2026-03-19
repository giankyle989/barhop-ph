import type { Listing } from "@prisma/client";

export interface ListingCardData {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  region: string;
  city: string;
  imageUrl: string | null;
  isPromoted: boolean;
  openHours: Record<string, { open: string; close: string } | null> | null;
  tags: string[];
  distance?: number;
}

export function buildListingUrl(region: string, city: string, slug: string): string {
  return `/listings/${region}/${city}/${slug}`;
}

export function getPrimaryCategory(categories: string[]): string {
  return categories[0] || "Bar";
}

export function listingToCardData(listing: Listing, distance?: number): ListingCardData {
  return {
    id: listing.id,
    name: listing.name,
    slug: listing.slug,
    categories: listing.categories,
    region: listing.region,
    city: listing.city,
    imageUrl: listing.imageUrl,
    isPromoted: listing.isPromoted,
    openHours: listing.openHours as ListingCardData["openHours"],
    tags: listing.tags,
    distance,
  };
}
