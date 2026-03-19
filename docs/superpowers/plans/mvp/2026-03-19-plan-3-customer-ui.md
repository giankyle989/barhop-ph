# Plan 3: Customer UI & Search

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete customer-facing UI: home, browse with search/filters, region/city landing pages, listing detail page (most important for SEO), and nearby page with geolocation.

**Architecture:** Route group `src/app/(customer)/` wraps all customer pages with shared Navbar + Footer. Server components for all pages (SSR for SEO), client components only for interactivity (search, filters, open/closed badge, geolocation). ISR with 60s revalidation. Direct Prisma queries in server components for landing/detail pages. Public API (`/api/listings`) for client-side search, filter, and nearby.

**Tech Stack:** Next.js 15, Prisma, PostGIS, Tailwind CSS 4, Zod, Lucide React (icons), Google Maps JavaScript API

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md`
**Wireframes:** `docs/wireframes-customer.html` — reference for all customer page layouts
**Depends on:** Plan 2 (Admin CRUD) — complete

---

## Before You Start

1. **Read Plan 2** (`2026-03-19-plan-2-admin-crud.md`) and review what was actually built — the implementation may differ from what was planned. Check the actual file structure, component APIs, and patterns used.
2. **Read the codebase** — scan `src/` for any changes made after Plan 2 that aren't in the plan (hotfixes, refactors, new utilities).
3. **Adapt** — if the prior plan's output differs from what this plan assumes (e.g., different component props, file locations, naming), adjust this plan's tasks to match reality rather than forcing the code to match the plan.

---

## File Structure

```
src/app/(customer)/
  layout.tsx                          # Navbar + Footer wrapper
  page.tsx                            # Home page
  listings/
    page.tsx + browse-client.tsx      # Browse with filters
    [region]/page.tsx                 # Region landing
    [region]/[city]/page.tsx          # City landing
    [region]/[city]/[slug]/page.tsx   # Listing detail
  nearby/page.tsx                     # Nearby page

src/components/customer/
  navbar.tsx, footer.tsx              # Layout components
  listing-card.tsx                    # Grid + list card variants
  open-closed-badge.tsx               # Client-side PHT time check
  search-bar.tsx                      # Debounced search
  filter-sidebar.tsx                  # Region/city/category/open-now filters
  breadcrumbs.tsx                     # SEO breadcrumbs with JSON-LD
  pagination.tsx                      # Link-based pagination
  listing-gallery.tsx                 # Image gallery/lightbox
  listing-map.tsx                     # Google Maps embed
  listing-hours.tsx                   # Weekly hours table
  listing-menu.tsx                    # Menu items display
  listing-events.tsx                  # Events display
  listing-contact.tsx                 # Contact info + social links
  nearby-client.tsx                   # Geolocation + results

src/lib/
  listing-helpers.ts                  # URL builders, ListingCardData type
  structured-data.ts                  # JSON-LD generators

src/app/api/
  listings/route.ts                   # Browse/search/filter/nearby
  categories/route.ts                 # List categories
  regions/route.ts                    # List regions with cities
```

---

## Task 0: Prerequisites

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install icon library**

```bash
npm install lucide-react
```

Lucide is lightweight and tree-shakeable. Use it for all icons across customer components (Search, Menu, X, ChevronRight, Star, MapPin, Phone, Mail, ExternalLink, etc.).

- [ ] **Step 2: Update Next.js Image remote patterns**

`next.config.ts` already has an `images.remotePatterns` entry for `NEXT_PUBLIC_CDN_HOSTNAME`. **Add** additional patterns for S3 direct access (don't replace the existing entry):

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: process.env.NEXT_PUBLIC_CDN_HOSTNAME || "localhost", // existing
    },
    { protocol: "https", hostname: "**.cloudfront.net" },  // add: CloudFront wildcard
    { protocol: "https", hostname: "**.amazonaws.com" },   // add: S3 direct access
  ],
},
```

**Note:** Use `**` (not `*`) for hostname wildcards — Next.js uses `**` to match any number of subdomain segments.

- [ ] **Step 3: Add missing env vars to .env.example**

Add to `.env.example`:
```
# Site URL (used for canonical URLs, sitemap, breadcrumbs JSON-LD)
NEXT_PUBLIC_SITE_URL="https://barhop.ph"
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts .env.example package.json package-lock.json && git commit -m "chore: add lucide-react, image remote patterns, NEXT_PUBLIC_SITE_URL env var"
```

---

## Task 1: Customer Layout Shell (Navbar + Footer)

**Files:**
- Create: `src/components/customer/navbar.tsx`
- Create: `src/components/customer/footer.tsx`
- Create: `src/app/(customer)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(customer)/page.tsx`

- [ ] **Step 1: Create navbar component**

Client component (`"use client"`) with mobile hamburger menu. Contains:
- BarHop PH logo/text (link to `/`)
- Nav links: Browse (`/listings`), Nearby (`/nearby`)
- Mobile: hamburger icon toggles slide-out menu
- Sticky top, blur backdrop, `bg-surface/80` background
- Use `usePathname()` from `next/navigation` to highlight active link

- [ ] **Step 2: Create footer component**

Server component. Contains:
- BarHop PH branding
- Quick links: Browse, Nearby, regions (NCR, Central Visayas, Western Visayas)
- "For Business Owners" link to `/admin/login`
- Copyright notice
- Dark background (`bg-surface-raised`)

- [ ] **Step 3: Create customer layout**

```typescript
// src/app/(customer)/layout.tsx
import { Navbar } from "@/components/customer/navbar";
import { Footer } from "@/components/customer/footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Move home page**

Move `src/app/page.tsx` to `src/app/(customer)/page.tsx`. Ensure the root `/` route still works (route groups don't affect URLs). Delete the old file.

- [ ] **Step 5: Commit**

```bash
git add src/components/customer/navbar.tsx src/components/customer/footer.tsx src/app/\(customer\)/layout.tsx src/app/\(customer\)/page.tsx && git rm src/app/page.tsx && git commit -m "feat: add customer layout shell with navbar and footer"
```

---

## Task 2: ListingCard + OpenClosedBadge + Helpers

**Files:**
- Create: `src/components/customer/open-closed-badge.tsx`
- Create: `src/components/customer/listing-card.tsx`
- Create: `src/lib/listing-helpers.ts`

- [ ] **Step 1: Create listing helpers**

```typescript
// src/lib/listing-helpers.ts
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
  // Optional fields for nearby mode
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
```

- [ ] **Step 2: Create OpenClosedBadge**

Client component. Computes whether the venue is currently open using PHT timezone:

```typescript
// Logic:
// 1. Get current PHT time: new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
// 2. Get current day of week (lowercase)
// 3. Look up day in openHours
// 4. If null → Closed
// 5. Compare current time against open/close
// 6. Handle close < open (next-day closing): if close < open, venue is open if currentTime >= open OR currentTime < close
// 7. Handle 24:00 as end of day
```

Props: `openHours: Record<string, { open: string; close: string } | null> | null`. Display green "Open" or red "Closed" badge using the design system status colors.

- [ ] **Step 3: Create ListingCard**

Client component (`"use client"`) since it contains `OpenClosedBadge` (client) and is used inside client wrappers (`browse-client.tsx`, `nearby-client.tsx`).

Props: `listing: ListingCardData`, `variant: "grid" | "list"`.

Grid variant: vertical card with image on top, content below. List variant: horizontal card with image on left, content on right.

Both variants show:
- Image via Next.js `<Image>` (or "No image" placeholder with neon gradient). Use `sizes` prop for responsive rendering.
- Name (linked to listing detail page via `buildListingUrl`)
- Primary category badge
- City name
- OpenClosedBadge
- Distance badge if `distance` is present (for nearby mode)
- Promoted cards get `glow-purple` shadow

**Note:** The "Featured" badge is NOT added in this task. It will be built as a dedicated component in Plan 6 Task 1 and integrated into ListingCard at that point. For now, promoted cards are only visually distinguished by the `glow-purple` shadow.

Use the existing `Card` and `Badge` UI components. Use `lucide-react` icons (e.g., `MapPin` for city, `Clock` for hours).

- [ ] **Step 4: Commit**

```bash
git add src/lib/listing-helpers.ts src/components/customer/open-closed-badge.tsx src/components/customer/listing-card.tsx && git commit -m "feat: add listing card, open/closed badge, and listing helpers"
```

---

## Task 3: Breadcrumbs + SearchBar + Pagination

**Files:**
- Create: `src/components/customer/breadcrumbs.tsx`
- Create: `src/components/customer/search-bar.tsx`
- Create: `src/components/customer/pagination.tsx`

- [ ] **Step 1: Create breadcrumbs component**

Server component. Props: `items: Array<{ label: string; href?: string }>`.

Renders breadcrumb trail with `>` separator. Last item is plain text (current page). Also outputs BreadcrumbList JSON-LD `<script type="application/ld+json">` for SEO.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://barhop.ph/" },
    { "@type": "ListItem", "position": 2, "name": "NCR", "item": "https://barhop.ph/listings/ncr" }
  ]
}
```

Use `NEXT_PUBLIC_SITE_URL` env var for the base URL (default to `https://barhop.ph`).

- [ ] **Step 2: Create search bar**

Client component (`"use client"`). Props: `defaultValue?: string`, `placeholder?: string`.

- Debounced input (300ms) using `setTimeout`/`clearTimeout`
- On change, updates URL search params (`?q=<term>`) via `router.push` (preserving other params)
- Tracks search queries via `window.umami?.track('search', { query })` if available
- Uses the `Input` UI component with a search icon (from `lucide-react`)
- Clear button when text is present

**Important:** Add the `window.umami` TypeScript declaration to `src/types/index.ts` now (not in Plan 6), since this component uses it:
```typescript
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}
export {};
```

- [ ] **Step 3: Create pagination component**

Regular component (no `"use client"` directive needed — it's pure rendering with no hooks). Props: `currentPage: number`, `totalPages: number`, `baseUrl: string`, `searchParams?: Record<string, string>`.

- Uses Next.js `<Link>` components for page links (works in both server and client contexts)
- Shows: First, Prev, page numbers (with ellipsis), Next, Last
- Each link uses `<Link href={...}>` with the correct URL + search params for SEO crawlability
- Current page is highlighted with neon-purple background
- Max 5 visible page numbers with ellipsis for gaps

**Note:** This component is used both in server-rendered pages (region/city landings if they add pagination later) and inside `browse-client.tsx` (client component). Using `<Link>` from `next/link` works in both contexts.

- [ ] **Step 4: Commit**

```bash
git add src/components/customer/breadcrumbs.tsx src/components/customer/search-bar.tsx src/components/customer/pagination.tsx src/types/index.ts && git commit -m "feat: add breadcrumbs, search bar, and pagination components"
```

---

## Task 4: FilterSidebar

**Files:**
- Create: `src/components/customer/filter-sidebar.tsx`

- [ ] **Step 1: Create filter sidebar**

Client component (`"use client"`). Renders filter controls that sync with URL search params.

Filters:
1. **Region** — select dropdown populated from `REGIONS` constant. On change, updates `?region=<slug>` and clears `?city=`.
2. **City** — select dropdown filtered by selected region. Updates `?city=<slug>`.
3. **Category** — checkbox list from `CATEGORIES` constant. Updates `?category=<slug>` (multiple allowed, comma-separated).
4. **Open Now** — toggle switch. When enabled, adds `?openNow=true` and sends current PHT day+time as `?phtDay=<day>&phtTime=<HH:MM>`.

URL sync pattern:
- Read initial values from `useSearchParams()`
- On filter change, build new URL params, **reset `page` to 1** (avoid stale page number after filter narrows results), and call `router.push`
- "Clear All Filters" button resets to `/listings`

Mobile behavior:
- On mobile (< `md` breakpoint), sidebar is a slide-out drawer triggered by a "Filters" button
- Use `useState` for open/close state
- Overlay backdrop when open
- Close on backdrop click or X button

- [ ] **Step 2: Commit**

```bash
git add src/components/customer/filter-sidebar.tsx && git commit -m "feat: add filter sidebar with region/city/category/open-now filters"
```

---

## Task 5: Public API — GET /api/listings

**Files:**
- Create: `src/app/api/listings/route.ts`

- [ ] **Step 1: Implement browse mode**

`GET /api/listings` with query params: `?region=<slug>&city=<slug>&category=pub,lounge&page=1&limit=20`

**Important:** All modes use **offset pagination** with page numbers (`?page=1&limit=20`). This keeps the API simple, works with the link-based Pagination component (SEO-friendly page links), and is fine for MVP scale. Cursor pagination is a future optimization if needed.

```typescript
// Prisma query:
const where: Prisma.ListingWhereInput = { status: "published" };
// Add filters from query params
if (region) where.region = region;
if (city) where.city = city;
// Handle multiple comma-separated categories
// IMPORTANT: DB stores category NAMES ("Night Club"), not slugs ("night-club").
// URL params use slugs. Must resolve slugs to names via getCategoryBySlug().
if (category) {
  const slugs = category.split(",").map(c => c.trim()).filter(Boolean);
  const names = slugs
    .map(s => getCategoryBySlug(s)?.name)
    .filter((n): n is string => !!n);
  if (names.length > 0) {
    where.categories = names.length === 1 ? { has: names[0] } : { hasSome: names };
  }
}

const [listings, total] = await Promise.all([
  db.listing.findMany({
    where,
    orderBy: [{ isPromoted: "desc" }, { updatedAt: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
    select: { /* ListingCardData fields only */ },
  }),
  db.listing.count({ where }),
]);

return { listings, total, page, totalPages: Math.ceil(total / limit) };
```

- [ ] **Step 2: Implement search mode**

When `?q=<term>` is present, use full-text search with offset pagination:

```typescript
// Raw SQL for full-text search:
const results = await db.$queryRaw`
  SELECT id, name, slug, categories, region, city, image_url as "imageUrl",
         is_promoted as "isPromoted", open_hours as "openHours", tags
  FROM listings
  WHERE status = 'published'
    AND search_vector @@ plainto_tsquery('english', ${q})
  ORDER BY is_promoted DESC, ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC
  LIMIT ${limit} OFFSET ${offset}
`;

const countResult = await db.$queryRaw`
  SELECT COUNT(*)::int as count FROM listings
  WHERE status = 'published' AND search_vector @@ plainto_tsquery('english', ${q})
`;
```

Return: `{ listings, total, page, totalPages }`.

- [ ] **Step 3: Implement nearby mode**

When `?nearby=true&lat=X&lng=Y` are present:

```typescript
const radius = Math.min(Number(searchParams.get("radius")) || 5, 25); // km, max 25

const results = await db.$queryRaw`
  SELECT id, name, slug, categories, region, city, image_url as "imageUrl",
         is_promoted as "isPromoted", open_hours as "openHours", tags,
         ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) as distance
  FROM listings
  WHERE status = 'published'
    AND ST_DWithin(location, ST_MakePoint(${lng}, ${lat})::geography, ${radius * 1000})
  ORDER BY is_promoted DESC, distance ASC
  LIMIT ${limit}
`;
```

Return: `{ listings }` with `distance` field (in meters) on each listing.

- [ ] **Step 4: Implement Open Now filter**

When `?openNow=true&phtDay=<day>&phtTime=<HH:MM>` are present, add server-side filtering.

**Important:** Filtering Open Now in JS after fetching breaks pagination (fetch 20, filter to 12 → short page, wrong total). Instead, use **raw SQL for browse mode too** when Open Now is active, so the filter is applied before pagination:

```typescript
if (openNow && phtDay && phtTime) {
  // Switch to raw SQL to filter on open_hours JSON in the WHERE clause
  // This ensures pagination counts are correct
  const results = await db.$queryRaw`
    SELECT id, name, slug, categories, region, city, image_url as "imageUrl",
           is_promoted as "isPromoted", open_hours as "openHours", tags
    FROM listings
    WHERE status = 'published'
      ${region ? Prisma.sql`AND region = ${region}` : Prisma.empty}
      ${city ? Prisma.sql`AND city = ${city}` : Prisma.empty}
      AND open_hours->>${phtDay} IS NOT NULL
      AND open_hours->${phtDay}->>'open' IS NOT NULL
    ORDER BY is_promoted DESC, updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  // Then apply the time comparison in JS on the already-paginated results
  // (the SQL filters out "closed on this day", JS checks the exact time)
  // For the count query, use the same WHERE clause
}
```

For search and nearby modes (already raw SQL), add the same `open_hours` JSON conditions to the WHERE clause.

The Open Now time comparison (handling close < open for next-day closing) is still done in JS after fetching, but the SQL pre-filters to only venues that have hours for the requested day, keeping pagination accurate. The small inaccuracy (a venue that's listed for today but closed at the current time may inflate the count slightly) is acceptable for MVP.

- [ ] **Step 5: Input validation**

Validate all query params with Zod:
- `q`: string, max 200 chars, trimmed
- `region`, `city`: string, validated against constants
- `category`: comma-separated string of category slugs, each validated against `CATEGORIES`
- `lat`, `lng`: number, valid range
- `radius`: number, 1-25
- `page`, `limit`: positive integers, limit max 50
- `phtDay`: one of monday-sunday
- `phtTime`: HH:MM format

Return 400 with error details for invalid params.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/listings/route.ts && git commit -m "feat: add public listings API with browse, search, nearby, and open-now filter"
```

---

## Task 6: Public API — Categories + Regions

**Files:**
- Create: `src/app/api/categories/route.ts`
- Create: `src/app/api/regions/route.ts`

- [ ] **Step 1: Create categories endpoint**

`GET /api/categories` — returns the `CATEGORIES` constant array. Cache response with `Cache-Control: public, max-age=86400` (24 hours — these are static).

- [ ] **Step 2: Create regions endpoint**

`GET /api/regions` — returns the `REGIONS` constant with optional listing counts.

If `?counts=true` is passed, query listing counts per region and city:
```typescript
const counts = await db.listing.groupBy({
  by: ["region", "city"],
  where: { status: "published" },
  _count: true,
});
```

Merge counts into the REGIONS structure. Cache response with `Cache-Control: public, max-age=3600` (1 hour when counts included, 24 hours without).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/categories/route.ts src/app/api/regions/route.ts && git commit -m "feat: add public categories and regions API endpoints"
```

---

## Task 7: Home Page

**Files:**
- Modify: `src/app/(customer)/page.tsx`

- [ ] **Step 1: Build home page**

Replace placeholder. Server component with ISR (`export const revalidate = 60`).

Sections:
1. **Hero** — Full-width gradient background (purple-to-surface), large display heading "Discover the Best Bars & Clubs in the Philippines", subtitle, SearchBar component centered
2. **Recently Added** — Simple grid of ListingCards (grid variant, max 8). Query: `db.listing.findMany({ where: { status: "published" }, orderBy: { updatedAt: "desc" }, take: 8 })`. Section title: "Recently Added". **Note:** Plan 6 will enhance this section into a "Featured Venues" carousel with promoted-first logic. For now, just show recent listings in a static grid.
3. **Browse by Category** — Grid of category cards (3 cols desktop, 2 mobile). Each card links to `/listings?category=<slug>`. Show category name with an appropriate icon or gradient background.
4. **Popular Cities** — Grid of city cards linking to their landing pages. Hardcode top cities: Makati, Taguig (BGC), Quezon City, Cebu City, Davao City, Iloilo City. Each card shows city name and region.

- [ ] **Step 2: Generate metadata**

```typescript
export const metadata: Metadata = {
  title: "BarHop PH — Discover Bars & Clubs in the Philippines",
  description: "The Philippines' #1 directory for bars, clubs, and nightlife venues. Search by location, category, and hours. Find the best spots in Makati, BGC, Cebu, and more.",
  openGraph: {
    title: "BarHop PH — Discover Bars & Clubs in the Philippines",
    description: "The Philippines' #1 directory for bars, clubs, and nightlife venues.",
    type: "website",
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/page.tsx && git commit -m "feat: build home page with hero, featured venues, categories, and popular cities"
```

---

## Task 8: Browse Page

**Files:**
- Create: `src/app/(customer)/listings/page.tsx`
- Create: `src/app/(customer)/listings/browse-client.tsx`

- [ ] **Step 1: Create server shell**

```typescript
// src/app/(customer)/listings/page.tsx
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse Bars & Clubs",
  description: "Browse all bars, clubs, and nightlife venues in the Philippines. Filter by region, city, category, and hours.",
};

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse" }]} />
      <h1 className="font-display text-display-md mt-4 mb-8">Browse Bars & Clubs</h1>
      <BrowseClient initialParams={params} />
    </div>
  );
}
```

- [ ] **Step 2: Create client wrapper**

`browse-client.tsx` — Client component that manages:
- SearchBar at top
- FilterSidebar on left (desktop) / drawer (mobile)
- Grid/List toggle button
- Results area: fetches from `/api/listings` using `fetch` with current URL params
- Loading skeleton state
- "No results" empty state
- Pagination component at bottom (all modes use offset pagination with page numbers)

State management:
- All filter/search state lives in URL search params (not React state)
- `useSearchParams()` reads current state
- `router.push()` updates state (triggers re-fetch)
- `useEffect` watches searchParams and fetches data
- API always returns `{ listings, total, page, totalPages }` — pass `page` and `totalPages` to Pagination component

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/listings/page.tsx src/app/\(customer\)/listings/browse-client.tsx && git commit -m "feat: add browse page with search, filters, and grid/list toggle"
```

---

## Task 9: Region Landing Page

**Files:**
- Create: `src/app/(customer)/listings/[region]/page.tsx`

- [ ] **Step 1: Build region landing page**

Server component with ISR.

```typescript
export const revalidate = 60;

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
```

Page content:
1. Breadcrumbs: Home > Region name
2. Hero section with region display name as H1
3. City pills: linked badges for each city in the region, linking to `/listings/<region>/<city>`
4. Listing grid: direct Prisma query for published listings in this region, ordered by `isPromoted DESC, updatedAt DESC`, limit 24. Convert results to `ListingCardData` using `listingToCardData()` helper. Render as ListingCard grid.
5. If listings > 24, link to browse page with region filter: "View all in [Region] →"

Validate region slug via `getRegionBySlug()`. Return `notFound()` if invalid.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(customer\)/listings/\[region\]/page.tsx && git commit -m "feat: add region landing page with city pills and listing grid"
```

---

## Task 10: City Landing Page

**Files:**
- Create: `src/app/(customer)/listings/[region]/[city]/page.tsx`

- [ ] **Step 1: Build city landing page**

Server component with ISR. Same pattern as region but scoped to city.

```typescript
export const revalidate = 60;

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
  };
}
```

Page content:
1. Breadcrumbs: Home > Region > City
2. Hero with city name as H1, region as subtitle
3. Category pills: linked badges for each category, linking to `/listings?region=<region>&city=<city>&category=<slug>`
4. Listing grid: published listings in this region+city, ordered by `isPromoted DESC, updatedAt DESC`, limit 24. Convert results to `ListingCardData` using `listingToCardData()` helper.
5. If listings > 24, link to browse page with region+city filter

Validate both slugs. Return `notFound()` if invalid.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(customer\)/listings/\[region\]/\[city\]/page.tsx && git commit -m "feat: add city landing page with category pills and listing grid"
```

---

## Task 11: Listing Detail Page

**Files:**
- Create: `src/app/(customer)/listings/[region]/[city]/[slug]/page.tsx`
- Create: `src/components/customer/listing-gallery.tsx`
- Create: `src/components/customer/listing-map.tsx`
- Create: `src/components/customer/listing-hours.tsx`
- Create: `src/components/customer/listing-menu.tsx`
- Create: `src/components/customer/listing-events.tsx`
- Create: `src/components/customer/listing-contact.tsx`
- Create: `src/lib/structured-data.ts`

This is the most important page for SEO.

- [ ] **Step 1: Create structured data generator**

```typescript
// src/lib/structured-data.ts
import type { Listing } from "@prisma/client";

export function generateListingJsonLd(listing: Listing, siteUrl: string) {
  const url = `${siteUrl}/listings/${listing.region}/${listing.city}/${listing.slug}`;
  const primaryCategory = listing.categories[0];

  // Map categories to schema.org types
  const schemaType = primaryCategory === "Night Club" ? "NightClub"
    : ["Pub", "Beer Garden", "Sports Bar"].includes(primaryCategory) ? "BarOrPub"
    : "LocalBusiness";

  // Resolve slugs to display names for structured data
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
      addressLocality: cityObj?.name || listing.city,     // "Makati" not "makati"
      addressRegion: regionObj?.displayName || listing.region, // "NCR" not "ncr"
      addressCountry: "PH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
  };

  if (listing.imageUrl) jsonLd.image = listing.imageUrl;
  if (listing.description) jsonLd.description = listing.description.replace(/<[^>]*>/g, "").slice(0, 300);
  if (listing.phone) jsonLd.telephone = listing.phone;
  if (listing.email) jsonLd.email = listing.email;

  // Add opening hours
  if (listing.openHours) {
    const hours = listing.openHours as Record<string, { open: string; close: string } | null>;
    const dayMap: Record<string, string> = {
      monday: "Mo", tuesday: "Tu", wednesday: "We", thursday: "Th",
      friday: "Fr", saturday: "Sa", sunday: "Su",
    };
    const specs: string[] = [];
    for (const [day, h] of Object.entries(hours)) {
      if (h && dayMap[day]) {
        specs.push(`${dayMap[day]} ${h.open}-${h.close}`);
      }
    }
    if (specs.length) jsonLd.openingHours = specs;
  }

  // Add social links for promoted listings
  if (listing.isPromoted && listing.socialLinks) {
    const social = listing.socialLinks as Record<string, string>;
    const sameAs = Object.values(social).filter(Boolean);
    if (sameAs.length) jsonLd.sameAs = sameAs;
  }

  // Add menu for promoted listings
  if (listing.isPromoted && listing.menu) {
    jsonLd.hasMenu = {
      "@type": "Menu",
      hasMenuSection: {
        "@type": "MenuSection",
        hasMenuItem: (listing.menu as Array<{ item: string; price: string }>).map(m => ({
          "@type": "MenuItem",
          name: m.item,
          offers: { "@type": "Offer", price: m.price.replace(/[^\d.]/g, ""), priceCurrency: "PHP" },
        })),
      },
    };
  }

  return jsonLd;
}
```

- [ ] **Step 2: Create listing sub-components**

**listing-gallery.tsx** — Client component. Image gallery with lightbox. Props: `images: string[]`, `alt: string`. Shows thumbnails in a grid. Clicking opens a fullscreen overlay with prev/next navigation. Close on Escape key or X button.

**listing-map.tsx** — Client component. Props: `latitude: number`, `longitude: number`, `name: string`. Embeds a Google Map via iframe (no API key needed for embed):
```html
<iframe src="https://www.google.com/maps/embed/v1/place?key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=15" />
```
Falls back to a static link to Google Maps if the key is not set.

**listing-hours.tsx** — Client component (`"use client"`) since it needs to highlight today's row using the user's local clock in PHT. Props: `openHours: OpenHours | null`. Renders a 7-row table: Day | Hours. Shows "Closed" for null days. Determines "today" via `new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long' }).toLowerCase()` and highlights that row. Pairs with OpenClosedBadge for current status.

**listing-menu.tsx** — Server component. Props: `menu: MenuItem[] | null`. Renders menu items in a list: item name, price (right-aligned with ₱), description below in muted text. Shows "No menu available" if null/empty.

**listing-events.tsx** — Server component. Props: `events: EventItem[] | null`. Renders event cards: title, date/recurrence badge, description. Shows "No upcoming events" if null/empty.

**listing-contact.tsx** — Client component (for copy-to-clipboard). Props: `listingId: string`, `address: string`, `phone?: string`, `whatsapp?: string`, `email?: string`, `socialLinks?: SocialLinks`. The `listingId` prop is used by Plan 6 for Umami event tracking. Shows:
- Address with "Copy Address" button (`navigator.clipboard.writeText`)
- Phone link (`tel:`)
- WhatsApp link (`https://wa.me/<number>`)
- Email link (`mailto:`)
- Social media icons linked to profiles

- [ ] **Step 3: Build detail page**

**Important:** Both `generateMetadata` and the page component need the same listing data. Prisma calls are NOT automatically deduped by React (unlike `fetch`). Wrap the query in React `cache()` to avoid hitting the DB twice:

```typescript
import { cache } from "react";

const getListing = cache(async (region: string, city: string, slug: string) => {
  return db.listing.findFirst({
    where: { region, city, slug, status: "published" },
  });
});

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, city, slug } = await params;
  const listing = await getListing(region, city, slug);
  if (!listing) return {};

  const primaryCategory = getPrimaryCategory(listing.categories);
  const cityObj = getCityBySlug(region, city);
  const title = `${listing.name} — ${primaryCategory} in ${cityObj?.name || city}`;
  const description = listing.description
    ? listing.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `${listing.name} is a ${primaryCategory} in ${cityObj?.name || city}. View hours, menu, events, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: listing.imageUrl ? [listing.imageUrl] : [],
    },
  };
}
```

Page layout:
1. Breadcrumbs: Home > Region > City > Venue Name
2. Hero image (full-width, listing.imageUrl)
3. H1: listing name, category badges, Featured badge if promoted
4. OpenClosedBadge (prominent)
5. Two-column layout on desktop:
   - **Left (2/3):** Description (sanitize with `sanitize-html` before rendering via `dangerouslySetInnerHTML` — defense in depth per CLAUDE.md, even though admin API also sanitizes on write), Gallery, Menu, Events
   - **Right (1/3):** Hours table, Contact info, Map
6. Tags section at bottom (badges)
7. JSON-LD structured data `<script>` tag

Handle archived listings: return `notFound()` (410 status handled by Next.js custom not-found).

- [ ] **Step 4: Commit**

```bash
git add src/lib/structured-data.ts src/components/customer/listing-gallery.tsx src/components/customer/listing-map.tsx src/components/customer/listing-hours.tsx src/components/customer/listing-menu.tsx src/components/customer/listing-events.tsx src/components/customer/listing-contact.tsx src/app/\(customer\)/listings/\[region\]/\[city\]/\[slug\]/page.tsx && git commit -m "feat: add listing detail page with gallery, map, hours, menu, events, contact, and JSON-LD"
```

---

## Task 12: Nearby Page

**Files:**
- Create: `src/app/(customer)/nearby/page.tsx`
- Create: `src/components/customer/nearby-client.tsx`

- [ ] **Step 1: Create nearby client component**

Client component that handles geolocation and results:

1. On mount, check if `navigator.geolocation` is available
2. Show "Enable Location" button
3. On click, call `navigator.geolocation.getCurrentPosition()`
4. On success, fetch `/api/listings?nearby=true&lat=X&lng=Y&radius=<radius>`
5. Show results as ListingCard grid with distance badges
6. Radius selector: 1km, 3km, 5km (default), 10km, 25km — changes trigger re-fetch

States:
- Initial: prompt to enable location
- Loading: skeleton cards
- Results: listing grid with distance
- Error: geolocation denied/unavailable message with fallback "Browse all listings" link
- Empty: "No bars found within X km" with suggestion to increase radius

- [ ] **Step 2: Create server shell**

```typescript
export const metadata: Metadata = {
  title: "Bars & Clubs Near Me",
  description: "Find bars, clubs, and nightlife venues near your current location in the Philippines.",
};

export default function NearbyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nearby" }]} />
      <h1 className="font-display text-display-md mt-4 mb-8">Bars & Clubs Near You</h1>
      <NearbyClient />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/nearby/page.tsx src/components/customer/nearby-client.tsx && git commit -m "feat: add nearby page with geolocation and radius selector"
```

---

## Task 13: Build Verification & Push

- [ ] **Step 1: Run build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 2: Run lint and type check**

```bash
npm run lint && npx tsc --noEmit
```

Fix any issues.

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

Ensure existing tests still pass.

- [ ] **Step 4: Update project docs**

Update the following files to reflect Plan 3 completion:
- `docs/superpowers/plans/2026-03-19-master-plan.md` — mark Plan 3 status as `Done`
- `CLAUDE.md` — update "Project Status" to `Phase: Plan 3 — Customer UI (complete)` and add any new conventions discovered during implementation (e.g., new shared utilities, component patterns)

- [ ] **Step 5: Push to remote**

```bash
git push origin main
```

---

## Execution Strategy

**Phase 0**: Task 0 (prerequisites — icons, image config, env vars)
**Parallel Phase A** (after 0, no mutual dependencies): Tasks 1, 2, 3, 4, 6
**Phase B** (after A): Task 5 (needs ListingCardData type from Task 2)
**Parallel Phase C** (after B): Tasks 7, 9, 10, 11
**Parallel Phase D** (after B): Tasks 8, 12
**Phase E**: Task 13

## Verification

1. `npm run build` — all pages compile
2. `npm run lint && npx tsc --noEmit` — clean
3. `npm run test:run` — existing tests pass
4. Manual: browse all 6 pages, verify search/filters/pagination work
5. View source: verify SSR HTML, meta tags, JSON-LD structured data
6. Mobile: verify responsive layout on all pages

## Summary

After completing all 13 tasks, the customer side will have:

- Shared layout with responsive navbar and footer
- Home page with hero, featured venues, categories, and popular cities
- Browse page with search, filters (region/city/category/open-now), grid/list toggle, pagination
- Region landing pages (17 regions) with city pills and listing grids
- City landing pages (54 cities) with category pills and listing grids
- Listing detail page with gallery, hours, menu, events, map, contact, structured data
- Nearby page with geolocation and radius selector
- Public API for listings (browse/search/nearby), categories, and regions
- SEO: SSR, ISR, breadcrumbs with JSON-LD, meta tags, OG images
- All client-side interactivity: open/closed badge, search, filters, geolocation

**Next:** Plan 4 (SEO & Performance) adds sitemap, robots.txt, canonical URLs, Lighthouse optimization.
