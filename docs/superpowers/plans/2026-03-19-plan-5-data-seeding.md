# Plan 5: Data Seeding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the database with 200+ real bar/club listings using Google Places API and Facebook photo scraping. After this plan, the site has real content for Google to index.

**Architecture:** Standalone seeding scripts that run locally (not on Vercel). Use Google Places API for venue discovery and data, Facebook page scraping for fallback photos. All images uploaded to S3 via direct upload (not presigned URLs — script runs locally with AWS credentials).

**Tech Stack:** Prisma, Google Places API (Text Search, Details, Photos), Puppeteer/Playwright (Facebook scrape), Sharp (image processing), @aws-sdk/client-s3

**Important:** Scripts in `scripts/` run outside the Next.js context via `npx tsx`. The `@/` path alias won't resolve. Scripts must use **relative imports** to reference app code (e.g., `import { db } from "../src/lib/db"`, `import { generateSlug } from "../src/lib/slug"`, `import { REGIONS } from "../src/lib/constants/regions"`). Alternatively, add `scripts/tsconfig.json` with paths configured, but relative imports are simpler.

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md` (Section 11)
**PRD:** `docs/PRD.md` (Section 8)
**Depends on:** Plan 4 (SEO & Performance) — complete

---

## Before You Start

1. **Read Plans 3 & 4** and review what was actually built — check the actual Prisma schema, listing fields, and any changes to constants or validations.
2. **Read the codebase** — scan `prisma/schema.prisma`, `src/lib/constants/`, `src/lib/slug.ts`, `src/lib/db.ts`, and `src/lib/s3.ts` to verify the actual APIs these scripts will call.
3. **Adapt** — if the schema, constants, or utilities differ from what this plan assumes, adjust the seeding scripts to match. Pay special attention to field names (camelCase in Prisma vs snake_case in DB).

---

## File Structure

```
scripts/
  seed-listings.ts                    # Main seeding orchestrator
  lib/
    google-places.ts                  # Google Places API client
    facebook-scraper.ts               # Facebook photo scraper
    image-processor.ts                # Sharp image processing + S3 upload
    category-mapper.ts                # Google Places type → app category mapping
    region-mapper.ts                  # Google address → region/city mapping
    dedup.ts                          # Deduplication by google_place_id
```

---

## Task 1: Google Places API Client

**Files:**
- Create: `scripts/lib/google-places.ts`

- [ ] **Step 1: Create Places API client**

Uses Google Places API (New) or legacy Text Search. Requires `GOOGLE_PLACES_API_KEY` env var (server-side key, IP-restricted).

```typescript
// Core functions:

// 1. Text Search — discover venues by query
async function searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceResult[]>
// Example queries: "bars in Makati", "night clubs in Cebu City", "rooftop bar BGC"

// 2. Place Details — get full data for a venue
async function getPlaceDetails(placeId: string): Promise<PlaceDetails>
// Returns: name, address, coordinates, phone, hours, website, photos, types

// 3. Place Photo — download a photo
async function downloadPlacePhoto(photoReference: string, maxWidth: number): Promise<Buffer>
```

Implement rate limiting: max 10 requests/second, exponential backoff on 429 errors.

Cost estimate: ~$7.60 for 200 listings (Text Search $32/1000 req, Details $17/1000 req, Photos $7/1000 req — well within $200/month free credit).

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/google-places.ts && git commit -m "feat: add Google Places API client for venue discovery"
```

---

## Task 2: Category & Region Mapping

**Files:**
- Create: `scripts/lib/category-mapper.ts`
- Create: `scripts/lib/region-mapper.ts`

- [ ] **Step 1: Create category mapper**

Maps Google Places `types` array to app categories:

```typescript
const TYPE_TO_CATEGORY: Record<string, string> = {
  night_club: "Night Club",
  bar: "Pub",
  // bars with specific keywords in name:
  // "rooftop" → "Rooftop Bar"
  // "sports" → "Sports Bar"
  // "cocktail" → "Cocktail Bar"
  // "wine" → "Wine Bar"
  // "karaoke" or "ktv" → "KTV / Karaoke Bar"
  // "lounge" → "Lounge"
  // "beer garden" → "Beer Garden"
  // "speakeasy" → "Speakeasy"
  // "hookah" or "shisha" → "Hookah / Shisha Bar"
  // "beach" → "Beach Bar"
  // "live music" → "Live Music Bar"
};

export function mapCategories(types: string[], name: string): string[] {
  // 1. Check name keywords first (more specific)
  // 2. Fall back to Google types
  // 3. Default to "Pub" if unmapped
  // Returns array with primary category first, possible secondary
}
```

Flag unmapped venues for manual review by adding a "needs-review" tag.

- [ ] **Step 2: Create region mapper**

Maps Google Places `addressComponents` to app region/city slugs:

```typescript
export function mapToRegionCity(addressComponents: AddressComponent[]): { region: string; city: string } | null {
  // 1. Extract city from "locality" or "administrative_area_level_2"
  // 2. Search REGIONS constant for matching city slug
  // 3. Return region + city slugs
  // 4. Return null if no match (flag for manual review)
}
```

Handle edge cases:
- "San Fernando" exists in Region I and Region III — use province/admin_area_level_1 to disambiguate
- "BGC" / "Bonifacio Global City" → maps to Taguig
- Metro Manila cities are administrative_area_level_2, not localities

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/category-mapper.ts scripts/lib/region-mapper.ts && git commit -m "feat: add category and region mapping for Google Places data"
```

---

## Task 3: Image Processing & S3 Upload

**Files:**
- Create: `scripts/lib/image-processor.ts`

- [ ] **Step 1: Create image processor**

Downloads, processes, and uploads images to S3:

```typescript
export async function processAndUploadImage(
  imageBuffer: Buffer,
  s3KeyPrefix: string, // e.g., "listings/makati-the-pool-bar"
): Promise<{ original: string; thumb: string; card: string; hero: string }> {
  // 1. Process variants with Sharp:
  //    - thumb: 200x200, cover crop, webp
  //    - card: 600x400, cover crop, webp
  //    - hero: 1200x600, cover crop, webp
  //    - original: original size, webp (max 2000px wide)

  // 2. Upload all variants to S3:
  //    - s3Key: `${s3KeyPrefix}-thumb.webp`, etc.

  // 3. Return CDN URLs for all variants
}
```

Uses `@aws-sdk/client-s3` with direct `PutObjectCommand` (not presigned — running locally with credentials).

Set `Content-Type: image/webp` and `Cache-Control: public, max-age=604800` (7 days) on uploads.

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/image-processor.ts && git commit -m "feat: add image processing with Sharp and S3 upload"
```

---

## Task 4: Facebook Photo Scraper (Fallback) — OPTIONAL

**This task is optional.** If Puppeteer adds too much complexity or dependency size, skip it entirely. Most venues will have Google Places photos. Listings without photos stay as drafts and show "No image available" on the customer side.

**Files:**
- Create: `scripts/lib/facebook-scraper.ts`

- [ ] **Step 0: Install Puppeteer (if proceeding)**

```bash
npm install --save-dev puppeteer
```

- [ ] **Step 1: Create Facebook scraper**

Fallback for venues where Google Places has no photo or poor quality.

```typescript
export async function scrapeFacebookCoverPhoto(
  venueName: string,
  city: string,
): Promise<Buffer | null> {
  // 1. Search for venue's Facebook page
  //    - Google search: `"${venueName}" "${city}" site:facebook.com`
  //    - Or direct FB URL if known

  // 2. Navigate to page with Puppeteer/Playwright (headless)

  // 3. Extract cover photo URL from page metadata or DOM

  // 4. Download photo buffer

  // 5. Return buffer or null if not found
}
```

Rate limiting: max 1 request per 3 seconds. Respect robots.txt.

This is a best-effort fallback — if it fails, the listing gets no image (which is fine, per design spec Section 5).

**Note:** If Puppeteer/Playwright adds too much complexity or dependency size, this step can be deferred. Listings without photos show "No image available" and work fine.

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/facebook-scraper.ts && git commit -m "feat: add Facebook cover photo scraper as image fallback"
```

---

## Task 5: Deduplication Logic

**Files:**
- Create: `scripts/lib/dedup.ts`

- [ ] **Step 1: Create dedup utility**

```typescript
export async function isDuplicate(googlePlaceId: string): Promise<boolean> {
  const existing = await db.listing.findUnique({
    where: { googlePlaceId },
    select: { id: true },
  });
  return !!existing;
}

export async function getExistingPlaceIds(): Promise<Set<string>> {
  const listings = await db.listing.findMany({
    where: { googlePlaceId: { not: null } },
    select: { googlePlaceId: true },
  });
  return new Set(listings.map(l => l.googlePlaceId!));
}
```

Also handle slug collisions:
```typescript
export async function generateUniqueSlug(name: string, city: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 2;
  while (await db.listing.findFirst({ where: { city, slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/dedup.ts && git commit -m "feat: add deduplication and unique slug generation for seeding"
```

---

## Task 6: Main Seeding Script

**Files:**
- Create: `scripts/seed-listings.ts`

- [ ] **Step 1: Create seeding orchestrator**

```typescript
// scripts/seed-listings.ts
// Run: npx tsx scripts/seed-listings.ts [--city makati] [--dry-run] [--limit 50]

// 1. Parse CLI args
// 2. Build search queries per city:
const SEARCH_QUERIES = [
  // NCR cities
  { city: "makati", queries: ["bars in Makati", "night clubs in Makati", "rooftop bar Makati"] },
  { city: "taguig", queries: ["bars in BGC Taguig", "night clubs BGC", "rooftop bar BGC"] },
  { city: "quezon-city", queries: ["bars in Quezon City", "night clubs Quezon City"] },
  { city: "manila", queries: ["bars in Manila Ermita", "night clubs Manila Malate"] },
  // Visayas
  { city: "cebu-city", queries: ["bars in Cebu City", "night clubs Cebu"] },
  { city: "iloilo-city", queries: ["bars in Iloilo City"] },
  // Mindanao
  { city: "davao-city", queries: ["bars in Davao City"] },
  // ... more cities
];

// 3. For each query:
//    a. Text Search → get place IDs
//    b. Deduplicate against existing
//    c. Place Details → get full data
//    d. Map categories and region/city
//    e. Download best photo (Google Places first, Facebook fallback)
//    f. Process image variants and upload to S3
//    g. Insert into database via Prisma

// 4. Summary report:
//    - Total found, duplicates skipped, inserted, errors, flagged for review
```

- [ ] **Step 2: Handle data mapping**

For each venue from Google Places:

```typescript
const listingData = {
  name: details.name,
  slug: await generateUniqueSlug(details.name, citySlug),
  categories: mapCategories(details.types, details.name),
  region: regionSlug,
  city: citySlug,
  address: details.formattedAddress,
  latitude: details.geometry.location.lat,
  longitude: details.geometry.location.lng,
  description: null, // Manual enrichment later
  imageUrl: imageUrls?.card || null,
  gallery: [], // Manual enrichment later
  tags: mapTags(details), // Infer tags from Google data where possible
  openHours: mapOpenHours(details.openingHours),
  menu: null, // Manual enrichment later
  events: null, // Manual enrichment later
  isPromoted: false,
  status: imageUrls ? "published" : "draft", // Only publish if has image
  phone: details.internationalPhoneNumber || null,
  googlePlaceId: details.placeId,
  socialLinks: null,
};
```

- [ ] **Step 3: Map open hours from Google format**

```typescript
function mapOpenHours(googleHours: OpeningHours | undefined): OpenHours | null {
  if (!googleHours?.periods) return null;

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const result: Record<string, { open: string; close: string } | null> = {};

  for (let i = 0; i < 7; i++) {
    const periods = googleHours.periods.filter(p => p.open.day === i);
    if (periods.length === 0) {
      result[days[i]] = null; // Closed
    } else {
      // Use first period (simplification for MVP)
      const p = periods[0];
      result[days[i]] = {
        open: `${String(p.open.hours).padStart(2, "0")}:${String(p.open.minutes || 0).padStart(2, "0")}`,
        close: p.close
          ? `${String(p.close.hours).padStart(2, "0")}:${String(p.close.minutes || 0).padStart(2, "0")}`
          : "24:00",
      };
    }
  }

  return result as OpenHours;
}
```

- [ ] **Step 4: Add progress logging**

```typescript
// Use console.log with structured output:
console.log(`[${city}] Searching: ${query}`);
console.log(`[${city}] Found ${results.length} venues, ${dupes} duplicates skipped`);
console.log(`[${city}] Processing: ${name} → ${slug}`);
console.log(`[${city}] ✓ Inserted: ${name} (${categories.join(", ")})`);
console.log(`[${city}] ✗ Error: ${name} — ${error.message}`);

// Final summary
console.log("\n=== Seeding Summary ===");
console.log(`Total found: ${totalFound}`);
console.log(`Duplicates: ${dupes}`);
console.log(`Inserted: ${inserted}`);
console.log(`Errors: ${errors}`);
console.log(`Flagged for review: ${flagged}`);
```

- [ ] **Step 5: Commit**

```bash
git add scripts/ && git commit -m "feat: add main venue seeding script with Google Places integration"
```

---

## Task 7: Tag Inference from Google Data

**Files:**
- Modify: `scripts/seed-listings.ts`

- [ ] **Step 1: Infer tags from available data**

```typescript
function mapTags(details: PlaceDetails): string[] {
  const tags: string[] = [];

  // From Google types
  if (details.types.includes("meal_delivery") || details.types.includes("restaurant")) {
    tags.push("Food Available");
  }

  // From opening hours
  if (details.openingHours?.periods?.some(p => !p.close)) {
    tags.push("24/7");
  }

  // From name keywords
  const nameLower = details.name.toLowerCase();
  if (nameLower.includes("rooftop")) tags.push("Rooftop");
  if (nameLower.includes("craft") || nameLower.includes("brewery")) tags.push("Craft Beer");
  if (nameLower.includes("hookah") || nameLower.includes("shisha")) tags.push("Hookah / Shisha");
  if (nameLower.includes("sports")) tags.push("Sports Screening");

  // From amenities (if available in Google data)
  if (details.wheelchairAccessibleEntrance) tags.push("Wheelchair Accessible");

  return [...new Set(tags)]; // Deduplicate
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/ && git commit -m "feat: add tag inference from Google Places data"
```

---

## Task 8: Seed Execution & Verification

- [ ] **Step 1: Run seeding for NCR (priority market)**

```bash
npx tsx scripts/seed-listings.ts --city makati --limit 30
npx tsx scripts/seed-listings.ts --city taguig --limit 30
npx tsx scripts/seed-listings.ts --city quezon-city --limit 20
npx tsx scripts/seed-listings.ts --city manila --limit 20
npx tsx scripts/seed-listings.ts --city pasig --limit 10
npx tsx scripts/seed-listings.ts --city mandaluyong --limit 10
```

Target: ~120 NCR listings.

- [ ] **Step 2: Run seeding for major provincial cities**

```bash
npx tsx scripts/seed-listings.ts --city cebu-city --limit 20
npx tsx scripts/seed-listings.ts --city davao-city --limit 15
npx tsx scripts/seed-listings.ts --city iloilo-city --limit 10
npx tsx scripts/seed-listings.ts --city bacolod --limit 10
npx tsx scripts/seed-listings.ts --city baguio --limit 10
npx tsx scripts/seed-listings.ts --city angeles-city --limit 10
npx tsx scripts/seed-listings.ts --city tagaytay --limit 5
```

Target: ~80 provincial listings. Total: 200+.

- [ ] **Step 3: Verify data quality**

```bash
npx prisma studio
```

Check in Prisma Studio:
- All published listings have images
- Categories are correctly mapped
- Open hours look reasonable
- No duplicate entries
- Region/city slugs match constants
- Listings flagged "needs-review" are reviewed

- [ ] **Step 4: Manual enrichment of top listings**

For the top 20-30 NCR listings (highest traffic potential):
- Add better descriptions (written manually or with AI assistance)
- Add relevant tags that couldn't be inferred
- Fix any incorrect category mappings

Use Prisma Studio or the admin UI.

- [ ] **Step 5: Update project docs**

Update the following files to reflect Plan 5 completion:
- `docs/superpowers/plans/2026-03-19-master-plan.md` — mark Plan 5 status as `Done`
- `CLAUDE.md` — update "Project Status" to `Phase: Plan 5 — Data Seeding (complete)`

- [ ] **Step 6: Commit and push**

```bash
git add scripts/ docs/ CLAUDE.md && git commit -m "feat: complete venue seeding scripts and utilities"
git push origin main
```

---

## Execution Strategy

**Parallel Phase A**: Tasks 1, 2, 3, 4, 5 (all utility modules)
**Phase B** (after A): Task 6 (orchestrator uses all utilities)
**Phase C** (after B): Task 7 (enhancement), then Task 8 (execution)

## Key Considerations

- **API costs:** Stay within Google's $200/month free credit. Text Search: ~$6.40/200 queries, Details: ~$3.40/200, Photos: ~$1.40/200. Total: ~$11.
- **Image storage:** ~200 listings × 4 variants × ~200KB avg = ~160MB S3 storage. Negligible cost.
- **Facebook scraper complexity:** If Puppeteer adds too much friction, skip it. Most venues will have Google photos. Listings without photos stay as drafts.
- **Data freshness:** This is a one-time seed. Periodic re-sync is a future enhancement (noted in design spec Section 15).

## Summary

After completing all 8 tasks, the database will have:

- 200+ real bar/club listings across major Philippine cities
- Accurate categories mapped from Google Places types
- Open hours from Google's data
- Photos from Google Places (with Facebook fallback)
- Image variants (thumb, card, hero) in S3
- Tags inferred from venue data
- All published listings have images; draft listings are awaiting images
- Top NCR listings manually enriched with better descriptions

**Next:** Plan 6 (Promoted Listings & Analytics) adds promoted listing visibility features and Umami integration.
