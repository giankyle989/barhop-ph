import type { Listing } from "@prisma/client";
import { REGIONS } from "@/lib/constants/regions";

// Build a slug→name lookup for fast city name resolution
const CITY_NAME_MAP = new Map<string, string>();
for (const region of REGIONS) {
  for (const city of region.cities) {
    CITY_NAME_MAP.set(city.slug, city.name);
  }
}

/** Resolve a city slug to its display name. Falls back to title-casing the slug. */
export function getCityDisplayName(citySlug: string): string {
  return CITY_NAME_MAP.get(citySlug) ?? citySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

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
