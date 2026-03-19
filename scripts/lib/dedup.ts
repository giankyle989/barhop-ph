/**
 * Deduplication and unique slug generation for data seeding.
 *
 * - `isDuplicate`        — checks a single googlePlaceId against the DB.
 * - `getExistingPlaceIds` — bulk-loads all known placeIds into a Set for fast
 *                           in-memory checks during batch processing.
 * - `generateUniqueSlug` — produces a city-scoped unique slug, appending a
 *                           numeric suffix (-2, -3, …) when collisions exist.
 */

import { db } from "../../src/lib/db";
import { generateSlug } from "../../src/lib/slug";

// ---------------------------------------------------------------------------
// Place-ID deduplication
// ---------------------------------------------------------------------------

/**
 * Returns true if a listing with this Google Place ID already exists.
 * Prefer `getExistingPlaceIds` for batch work to avoid N+1 queries.
 */
export async function isDuplicate(googlePlaceId: string): Promise<boolean> {
  const count = await db.listing.count({
    where: { googlePlaceId },
  });
  return count > 0;
}

/**
 * Loads every non-null googlePlaceId from the listings table into a Set.
 * Call once before iterating a batch, then use `Set.has()` for O(1) checks.
 */
export async function getExistingPlaceIds(): Promise<Set<string>> {
  const rows = await db.listing.findMany({
    where: { googlePlaceId: { not: null } },
    select: { googlePlaceId: true },
  });

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.googlePlaceId) ids.add(row.googlePlaceId);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Unique slug generation
// ---------------------------------------------------------------------------

/**
 * Generates a slug for `name` that is unique within `city`.
 *
 * If the base slug is taken, appends "-2", "-3", … until a free slot is found.
 * Uniqueness is checked live against the DB; for concurrent imports consider
 * wrapping callers in a serialised queue.
 */
export async function generateUniqueSlug(
  name: string,
  city: string
): Promise<string> {
  const base = generateSlug(name);

  // Check base slug first (happy path — no suffix).
  const baseExists = await db.listing.count({
    where: { city, slug: base },
  });

  if (baseExists === 0) return base;

  // Find the highest existing numeric suffix for this base in one query.
  // Pattern: slug = base OR slug LIKE base-N (N is a digit sequence).
  const existing = await db.listing.findMany({
    where: {
      city,
      slug: { startsWith: base },
    },
    select: { slug: true },
  });

  // Extract the numeric suffix from matching slugs.
  const suffixRegex = new RegExp(`^${escapeRegex(base)}(?:-(\\d+))?$`);
  let maxSuffix = 1;
  for (const { slug } of existing) {
    const m = suffixRegex.exec(slug);
    if (m) {
      const n = m[1] ? parseInt(m[1], 10) : 1;
      if (n > maxSuffix) maxSuffix = n;
    }
  }

  return `${base}-${maxSuffix + 1}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
