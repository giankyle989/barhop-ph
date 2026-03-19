import type { Listing } from "@prisma/client";
import { getCityBySlug, getRegionBySlug } from "@/lib/constants";

export function generateListingJsonLd(listing: Listing, siteUrl: string) {
  const url = `${siteUrl}/listings/${listing.region}/${listing.city}/${listing.slug}`;
  const primaryCategory = listing.categories[0];

  const schemaType =
    primaryCategory === "Night Club"
      ? "NightClub"
      : ["Pub", "Beer Garden", "Sports Bar"].includes(primaryCategory ?? "")
        ? "BarOrPub"
        : "LocalBusiness";

  const cityObj = getCityBySlug(listing.region, listing.city);
  const regionObj = getRegionBySlug(listing.region);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: listing.name,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: cityObj?.name || listing.city,
      addressRegion: regionObj?.displayName || listing.region,
      addressCountry: "PH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
  };

  if (listing.imageUrl) jsonLd.image = listing.imageUrl;
  if (listing.description)
    jsonLd.description = listing.description.replace(/<[^>]*>/g, "").slice(0, 300);
  if (listing.phone) jsonLd.telephone = listing.phone;
  if (listing.email) jsonLd.email = listing.email;

  if (listing.openHours) {
    const hours = listing.openHours as Record<
      string,
      { open: string; close: string } | null
    >;
    const dayMap: Record<string, string> = {
      monday: "Mo",
      tuesday: "Tu",
      wednesday: "We",
      thursday: "Th",
      friday: "Fr",
      saturday: "Sa",
      sunday: "Su",
    };
    const specs: string[] = [];
    for (const [day, h] of Object.entries(hours)) {
      if (h && dayMap[day]) {
        specs.push(`${dayMap[day]} ${h.open}-${h.close}`);
      }
    }
    if (specs.length) jsonLd.openingHours = specs;
  }

  if (listing.isPromoted && listing.socialLinks) {
    const social = listing.socialLinks as Record<string, string>;
    const sameAs = Object.values(social).filter(Boolean);
    if (sameAs.length) jsonLd.sameAs = sameAs;
  }

  if (listing.isPromoted && listing.menu) {
    jsonLd.hasMenu = {
      "@type": "Menu",
      hasMenuSection: {
        "@type": "MenuSection",
        hasMenuItem: (
          listing.menu as Array<{ item: string; price: string }>
        ).map((m) => ({
          "@type": "MenuItem",
          name: m.item,
          offers: {
            "@type": "Offer",
            price: m.price.replace(/[^\d.]/g, ""),
            priceCurrency: "PHP",
          },
        })),
      },
    };
  }

  return jsonLd;
}
