/**
 * Main venue seeding orchestrator.
 *
 * Discovers bars and nightlife venues via Google Places Text Search, enriches
 * each result with Place Details, downloads and processes the best available
 * photo, uploads variants to S3, then inserts a Listing record via Prisma.
 *
 * Usage:
 *   npx tsx scripts/seed-listings.ts [--city makati] [--dry-run] [--limit 50]
 *
 * Required env vars (set in .env.local):
 *   GOOGLE_PLACES_API_KEY, DATABASE_URL, AWS_REGION, AWS_ACCESS_KEY_ID,
 *   AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, NEXT_PUBLIC_CDN_URL
 */

import { searchPlaces, getPlaceDetails, downloadPlacePhoto } from "./lib/google-places";
import { mapCategories } from "./lib/category-mapper";
import { mapToRegionCity } from "./lib/region-mapper";
import { processAndUploadImage } from "./lib/image-processor";
import { getExistingPlaceIds, generateUniqueSlug } from "./lib/dedup";
import { mapTags } from "./lib/tag-mapper";
import { db } from "../src/lib/db";
import { Prisma } from "@prisma/client";
import type { PlaceDetails } from "./lib/google-places";
import type { ImageVariants } from "./lib/image-processor";

// ---------------------------------------------------------------------------
// Search query configuration
// ---------------------------------------------------------------------------

interface CitySearchConfig {
  city: string;
  region: string;
  queries: string[];
}

const SEARCH_QUERIES: CitySearchConfig[] = [
  // NCR
  {
    city: "makati",
    region: "ncr",
    queries: [
      "bars in Makati",
      "night clubs in Makati",
      "rooftop bar Makati",
      "cocktail bar Makati",
    ],
  },
  {
    city: "taguig",
    region: "ncr",
    queries: [
      "bars in BGC Taguig",
      "night clubs BGC",
      "rooftop bar BGC",
    ],
  },
  {
    city: "quezon-city",
    region: "ncr",
    queries: [
      "bars in Quezon City",
      "night clubs Quezon City",
    ],
  },
  {
    city: "manila",
    region: "ncr",
    queries: [
      "bars in Manila Ermita",
      "night clubs Manila Malate",
      "bars in Manila",
    ],
  },
  {
    city: "pasig",
    region: "ncr",
    queries: [
      "bars in Pasig Kapitolyo",
      "bars in Pasig",
    ],
  },
  {
    city: "mandaluyong",
    region: "ncr",
    queries: ["bars in Mandaluyong"],
  },
  // Visayas
  {
    city: "cebu-city",
    region: "central-visayas",
    queries: [
      "bars in Cebu City",
      "night clubs Cebu",
    ],
  },
  {
    city: "iloilo-city",
    region: "western-visayas",
    queries: ["bars in Iloilo City"],
  },
  {
    city: "bacolod",
    region: "western-visayas",
    queries: ["bars in Bacolod"],
  },
  // Mindanao
  {
    city: "davao-city",
    region: "davao-region",
    queries: ["bars in Davao City"],
  },
  // Other
  {
    city: "baguio",
    region: "car",
    queries: ["bars in Baguio"],
  },
  {
    city: "angeles-city",
    region: "central-luzon",
    queries: ["bars in Angeles City"],
  },
  {
    city: "tagaytay",
    region: "calabarzon",
    queries: ["bars in Tagaytay"],
  },
];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  city: string | null;
  dryRun: boolean;
  limit: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { city: null, dryRun: false, limit: Infinity };
  const raw = argv.slice(2);

  for (let i = 0; i < raw.length; i++) {
    const flag = raw[i];
    if (flag === "--dry-run") {
      args.dryRun = true;
    } else if (flag === "--city" && raw[i + 1]) {
      args.city = raw[++i];
    } else if (flag === "--limit" && raw[i + 1]) {
      const n = parseInt(raw[++i], 10);
      if (!isNaN(n) && n > 0) args.limit = n;
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// Open hours mapping
// ---------------------------------------------------------------------------

interface DayHours {
  open: string;
  close: string;
}

type OpenHoursResult = Record<string, DayHours | null> | null;

function mapOpenHours(
  googleHours: PlaceDetails["openingHours"]
): OpenHoursResult {
  if (!googleHours?.periods) return null;

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const result: Record<string, DayHours | null> = {};

  for (let i = 0; i < 7; i++) {
    const periods = googleHours.periods.filter((p) => p.open.day === i);

    if (periods.length === 0) {
      result[days[i]] = null;
    } else {
      const p = periods[0];
      result[days[i]] = {
        open: `${String(p.open.hours).padStart(2, "0")}:${String(
          p.open.minutes || 0
        ).padStart(2, "0")}`,
        close: p.close
          ? `${String(p.close.hours).padStart(2, "0")}:${String(
              p.close.minutes || 0
            ).padStart(2, "0")}`
          : "24:00",
      };
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Summary counters
// ---------------------------------------------------------------------------

interface SeedSummary {
  found: number;
  duplicates: number;
  inserted: number;
  errors: number;
  flaggedForReview: number;
}

// ---------------------------------------------------------------------------
// Core processing: one venue
// ---------------------------------------------------------------------------

/**
 * Fetches details for a single place, processes its image, and either inserts
 * into the DB or logs what would be inserted (dry run).
 *
 * Returns "inserted", "flagged", or "error".
 */
async function processVenue(
  placeId: string,
  citySlug: string,
  regionSlug: string,
  dryRun: boolean
): Promise<"inserted" | "flagged" | "error"> {
  let details: PlaceDetails;

  try {
    details = await getPlaceDetails(placeId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${citySlug}] ✗ Error fetching details for ${placeId}: ${msg}`);
    return "error";
  }

  // Resolve region/city from address components. Fall back to the values
  // derived from the search config when address components are ambiguous.
  const resolved = mapToRegionCity(details.addressComponents);
  const finalRegion = resolved?.region ?? regionSlug;
  const finalCity = resolved?.city ?? citySlug;

  let slug: string;
  try {
    slug = await generateUniqueSlug(details.name, finalCity);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${citySlug}] ✗ Error generating slug for "${details.name}": ${msg}`);
    return "error";
  }

  console.log(`[${citySlug}] Processing: ${details.name} → ${slug}`);

  // Image: download the best available photo (highest resolution first).
  let imageUrls: ImageVariants | null = null;

  if (details.photos && details.photos.length > 0) {
    // Sort by descending width, pick the widest.
    const bestPhoto = details.photos.slice().sort((a, b) => b.width - a.width)[0];

    try {
      const photoBuffer = await downloadPlacePhoto(
        bestPhoto.photoReference,
        1600
      );
      const s3KeyPrefix = `listings/${finalCity}/${slug}/photo-1`;
      imageUrls = await processAndUploadImage(photoBuffer, s3KeyPrefix);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[${citySlug}] Image failed for "${details.name}" — will insert as draft: ${msg}`
      );
      // imageUrls stays null; listing will be created as draft
    }
  }

  const categories = mapCategories(details.types, details.name);
  const tags = mapTags(details);
  const openHours = mapOpenHours(details.openingHours);

  // Status: published only when we have a card image; otherwise draft for
  // manual review.
  const status = imageUrls ? ("published" as const) : ("draft" as const);
  const flagged = !imageUrls;

  const listingData = {
    name: details.name,
    slug,
    categories,
    region: finalRegion,
    city: finalCity,
    address: details.formattedAddress,
    latitude: details.geometry.location.lat,
    longitude: details.geometry.location.lng,
    description: null,
    imageUrl: imageUrls?.card ?? null,
    gallery: imageUrls?.original ? [imageUrls.original] : [],
    tags,
    openHours: openHours !== null
      ? (openHours as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    menu: Prisma.JsonNull,
    events: Prisma.JsonNull,
    isPromoted: false,
    status,
    phone: details.internationalPhoneNumber ?? null,
    googlePlaceId: details.placeId,
    socialLinks: Prisma.JsonNull,
  };

  if (dryRun) {
    console.log(
      `[${citySlug}] [DRY RUN] Would insert: ${details.name} (${categories[0]}) status=${status}`
    );
    return flagged ? "flagged" : "inserted";
  }

  try {
    await db.listing.create({ data: listingData });
    console.log(`[${citySlug}] ✓ Inserted: ${details.name} (${categories[0]})`);
    return flagged ? "flagged" : "inserted";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${citySlug}] ✗ Error inserting "${details.name}": ${msg}`);
    return "error";
  }
}

// ---------------------------------------------------------------------------
// Per-city processing
// ---------------------------------------------------------------------------

async function processCity(
  config: CitySearchConfig,
  existingPlaceIds: Set<string>,
  summary: SeedSummary,
  dryRun: boolean,
  limit: number
): Promise<void> {
  const { city, region, queries } = config;

  // Collect unique place IDs across all queries for this city.
  const seenThisRun = new Set<string>();

  for (const query of queries) {
    if (summary.inserted + summary.errors >= limit) break;

    console.log(`[${city}] Searching: ${query}`);

    let results;
    try {
      results = await searchPlaces(query);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${city}] ✗ Search failed for "${query}": ${msg}`);
      continue;
    }

    // Deduplicate: against DB and within this run's already-seen IDs.
    let dupCount = 0;
    const newResults = results.filter((r) => {
      if (existingPlaceIds.has(r.placeId) || seenThisRun.has(r.placeId)) {
        dupCount++;
        return false;
      }
      return true;
    });

    if (dupCount > 0) {
      console.log(
        `[${city}] Found ${results.length} venues, ${dupCount} duplicate${dupCount === 1 ? "" : "s"} skipped`
      );
    } else {
      console.log(`[${city}] Found ${results.length} venues`);
    }

    summary.found += results.length;
    summary.duplicates += dupCount;

    for (const result of newResults) {
      if (summary.inserted + summary.errors >= limit) break;

      seenThisRun.add(result.placeId);
      // Mark in the shared set immediately to prevent re-processing if another
      // city's query returns the same place.
      existingPlaceIds.add(result.placeId);

      const outcome = await processVenue(result.placeId, city, region, dryRun);

      if (outcome === "inserted") {
        summary.inserted++;
      } else if (outcome === "flagged") {
        summary.inserted++;
        summary.flaggedForReview++;
      } else {
        summary.errors++;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log(
    `Starting seeder — city=${args.city ?? "all"}, dry-run=${args.dryRun}, limit=${isFinite(args.limit) ? args.limit : "none"}`
  );

  // Determine which cities to process.
  const targetConfigs = args.city
    ? SEARCH_QUERIES.filter((c) => c.city === args.city)
    : SEARCH_QUERIES;

  if (targetConfigs.length === 0) {
    console.error(
      `No search config found for city "${args.city}". Valid values: ${SEARCH_QUERIES.map((c) => c.city).join(", ")}`
    );
    process.exit(1);
  }

  // Pre-load all existing place IDs for O(1) duplicate checks.
  let existingPlaceIds: Set<string>;
  try {
    existingPlaceIds = await getExistingPlaceIds();
    console.log(
      `Loaded ${existingPlaceIds.size} existing place IDs from database`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load existing place IDs: ${msg}`);
    process.exit(1);
  }

  const summary: SeedSummary = {
    found: 0,
    duplicates: 0,
    inserted: 0,
    errors: 0,
    flaggedForReview: 0,
  };

  for (const config of targetConfigs) {
    await processCity(config, existingPlaceIds, summary, args.dryRun, args.limit);
    if (summary.inserted + summary.errors >= args.limit) break;
  }

  // Final summary report
  console.log("\n=== Seeding Summary ===");
  console.log(`Total found:       ${summary.found}`);
  console.log(`Duplicates:        ${summary.duplicates}`);
  console.log(`Inserted:          ${summary.inserted}`);
  console.log(`Errors:            ${summary.errors}`);
  console.log(`Flagged for review: ${summary.flaggedForReview}`);
  if (args.dryRun) {
    console.log("\n[DRY RUN] No records were written to the database.");
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
