import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { REGIONS } from "@/lib/constants/regions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barhop.ph";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/listings`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/nearby`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  );

  // Region pages
  for (const region of REGIONS) {
    entries.push({
      url: `${SITE_URL}/listings/${region.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
    // City pages
    for (const city of region.cities) {
      entries.push({
        url: `${SITE_URL}/listings/${region.slug}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  // All published listings
  const listings = await db.listing.findMany({
    where: { status: "published" },
    select: { slug: true, region: true, city: true, updatedAt: true, isPromoted: true },
    orderBy: { updatedAt: "desc" },
  });

  for (const listing of listings) {
    entries.push({
      url: `${SITE_URL}/listings/${listing.region}/${listing.city}/${listing.slug}`,
      lastModified: listing.updatedAt,
      changeFrequency: listing.isPromoted ? "daily" : "weekly",
      priority: listing.isPromoted ? 0.9 : 0.7,
    });
  }

  return entries;
}
