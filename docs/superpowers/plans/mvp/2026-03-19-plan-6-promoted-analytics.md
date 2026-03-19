# Plan 6: Promoted Listings & Analytics

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement promoted listing visibility features (priority placement, Featured badge, homepage carousel, spotlight cards) and integrate Umami Cloud analytics (site-wide dashboard link, per-listing view counts, search query tracking).

**Architecture:** Promoted listing features are primarily CSS/ordering changes — no new database fields needed (`isPromoted` already exists). Analytics uses Umami Cloud's hosted service and API for data, with a lightweight admin widget for per-listing stats.

**Tech Stack:** Next.js 15, Umami Cloud API, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md` (Sections 3, 4)
**PRD:** `docs/PRD.md` (Sections 7.3, 7.4)
**Depends on:** Plan 5 (Data Seeding) — complete

---

## Before You Start

1. **Read Plans 3–5** and review what was actually built — especially the customer components (`listing-card.tsx`, home page, region/city pages) and admin pages that this plan modifies.
2. **Read the codebase** — check `src/components/customer/`, `src/app/(customer)/page.tsx`, `src/components/admin/sidebar.tsx`, and `src/types/index.ts` for their actual current state.
3. **Adapt** — if components have different props, file names, or structures than this plan assumes, adjust tasks to match reality. For example, if `listing-card.tsx` already handles promoted styling differently, adapt the Featured Badge integration accordingly.

---

## File Structure

```
src/
  components/customer/
    featured-badge.tsx                # Featured listing badge
    featured-carousel.tsx             # Home page featured venues carousel
    spotlight-card.tsx                # Promoted listing spotlight on landing pages
  components/admin/
    listing-views-widget.tsx          # Per-listing view count widget
  lib/
    umami.ts                          # Umami Cloud API client
  app/
    (customer)/
      page.tsx                        # (modify) Add featured carousel
      listings/
        [region]/page.tsx             # (modify) Add spotlight card
        [region]/[city]/page.tsx      # (modify) Add spotlight card
```

---

## Task 1: Featured Badge Component

**Files:**
- Create: `src/components/customer/featured-badge.tsx`
- Modify: `src/components/customer/listing-card.tsx`

- [ ] **Step 1: Create featured badge**

Server component. A visually distinct badge that appears on promoted listing cards.

```typescript
// Visual: Gold/amber background with star icon, "Featured" text
// Uses design system: --color-status-featured (#F59E0B)
// Positioned absolute top-right of listing card
export function FeaturedBadge() {
  return (
    <span className="absolute top-2 right-2 bg-status-featured text-surface text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
      <StarIcon className="w-3 h-3" />
      Featured
    </span>
  );
}
```

Use `Star` icon from `lucide-react` (installed in Plan 3 Task 0).

- [ ] **Step 2: Integrate into ListingCard**

In `listing-card.tsx`, add the FeaturedBadge when `listing.isPromoted` is true. Also add `glow-purple` shadow class to the card wrapper for promoted listings.

- [ ] **Step 3: Commit**

```bash
git add src/components/customer/featured-badge.tsx src/components/customer/listing-card.tsx && git commit -m "feat: add Featured badge to promoted listing cards"
```

---

## Task 2: Featured Venues Carousel

**Files:**
- Create: `src/components/customer/featured-carousel.tsx`
- Modify: `src/app/(customer)/page.tsx`

- [ ] **Step 1: Create featured carousel component**

Client component (`"use client"`) for horizontal scrolling.

Props: `listings: ListingCardData[]`.

Features:
- Horizontal scrollable container with CSS `overflow-x: auto` and `scroll-snap-type: x mandatory`
- Each card gets `scroll-snap-align: start`
- Left/right arrow buttons for desktop navigation
- Smooth scroll behavior
- Show 3 cards on desktop, 1.5 on mobile (peek at next card)
- Hide arrows when at start/end of scroll

Style: slightly larger cards than standard grid, with `glow-purple` shadow.

- [ ] **Step 2: Replace "Recently Added" section on home page**

Plan 3 built a "Recently Added" static grid on the home page. Replace it with the featured carousel:

In `src/app/(customer)/page.tsx`:
- Change the query to prioritize promoted listings: `db.listing.findMany({ where: { status: "published", isPromoted: true }, orderBy: { updatedAt: "desc" }, take: 8 })`
- Fall back to recently updated if no promoted listings exist
- Replace the static grid with the `<FeaturedCarousel />` component
- Update section title to "Featured Venues" (or "Recently Added" when using fallback)

- [ ] **Step 3: Commit**

```bash
git add src/components/customer/featured-carousel.tsx src/app/\(customer\)/page.tsx && git commit -m "feat: add featured venues carousel to home page"
```

---

## Task 3: Spotlight Cards on Landing Pages

**Files:**
- Create: `src/components/customer/spotlight-card.tsx`
- Modify: `src/app/(customer)/listings/[region]/page.tsx`
- Modify: `src/app/(customer)/listings/[region]/[city]/page.tsx`

- [ ] **Step 1: Create spotlight card**

Server component. A wider, more prominent card for promoted listings at the top of landing pages.

Props: `listing: ListingCardData & { description?: string | null }`.

The spotlight card needs the `description` field for a preview, but `ListingCardData` doesn't include it (to keep card data lightweight). Pass it separately by extending the type at the call site — the Prisma query in the region/city pages should `select` the `description` field in addition to the card fields for spotlight listings.

Visual: Full-width card with hero image, venue name, category, short description preview (strip HTML, truncate to ~120 chars), "Featured" badge. Purple gradient border or glow effect. Links to listing detail page.

- [ ] **Step 2: Add to region landing pages**

In the region page, before the listing grid, show up to 2 spotlight cards for promoted listings in that region:

```typescript
const spotlightListings = await db.listing.findMany({
  where: { status: "published", isPromoted: true, region: regionSlug },
  orderBy: { updatedAt: "desc" },
  take: 2,
});
```

Only show the spotlight section if there are promoted listings.

- [ ] **Step 3: Add to city landing pages**

Same pattern, scoped to region + city. Show up to 2 spotlight cards.

- [ ] **Step 4: Commit**

```bash
git add src/components/customer/spotlight-card.tsx src/app/\(customer\)/listings/\[region\]/page.tsx src/app/\(customer\)/listings/\[region\]/\[city\]/page.tsx && git commit -m "feat: add spotlight cards for promoted listings on landing pages"
```

---

## Task 4: Promoted Listing Priority in All Queries

**Files:**
- Verify: `src/app/api/listings/route.ts` (already done in Plan 3)
- Verify: all server component queries

- [ ] **Step 1: Audit all listing queries**

Verify that every listing query across the app uses `ORDER BY is_promoted DESC` as the first sort criteria:

- `/api/listings` route (browse, search, nearby modes) — should already be done
- Home page featured section — isPromoted filter
- Region page listing grid — verify orderBy
- City page listing grid — verify orderBy

This should already be implemented from Plan 3, but verify and fix if missing.

- [ ] **Step 2: Commit (if changes needed)**

```bash
git add src/ && git commit -m "fix: ensure promoted listings sort first in all queries"
```

---

## Task 5: Umami Cloud Integration

**Files:**
- Modify: `src/app/layout.tsx` (verify Umami script)
- Create: `src/lib/umami.ts`

- [ ] **Step 1: Verify Umami script tag**

The Umami tracking script was added in Plan 1 (`src/app/layout.tsx`). Verify it's correctly loading:

```typescript
{process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
  <script
    defer
    src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
  />
)}
```

Env vars needed (add any missing ones to `.env.example`):
- `NEXT_PUBLIC_UMAMI_URL` — Umami Cloud URL (e.g., `https://cloud.umami.is`) — already in .env.example
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — website ID from Umami dashboard — already in .env.example
- `UMAMI_API_KEY` — server-side API key for querying Umami data (NEW — add to .env.example)
- `UMAMI_API_URL` — Umami API base URL, default `https://api.umami.is/v1` (NEW — add to .env.example)
- `NEXT_PUBLIC_UMAMI_DASHBOARD_URL` — link to Umami Cloud dashboard for admin sidebar (NEW — add to .env.example)

- [ ] **Step 2: Create Umami API client**

```typescript
// src/lib/umami.ts
// Server-side only — uses UMAMI_API_KEY (not NEXT_PUBLIC_)

const UMAMI_API_URL = process.env.UMAMI_API_URL || "https://api.umami.is/v1";
const UMAMI_API_KEY = process.env.UMAMI_API_KEY;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export async function getPageViews(urlPath: string, days: number = 30): Promise<number> {
  if (!UMAMI_API_KEY || !UMAMI_WEBSITE_ID) return 0;

  const startAt = Date.now() - days * 24 * 60 * 60 * 1000;
  const endAt = Date.now();

  const response = await fetch(
    `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=url&url=${encodeURIComponent(urlPath)}`,
    {
      headers: { "x-umami-api-key": UMAMI_API_KEY },
      next: { revalidate: 3600 }, // Cache for 1 hour
    },
  );

  if (!response.ok) return 0;
  const data = await response.json();
  return data[0]?.y || 0;
}

export async function getTotalPageViews(urlPath: string): Promise<number> {
  return getPageViews(urlPath, 365 * 10); // "All time" = 10 years
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/umami.ts src/app/layout.tsx && git commit -m "feat: add Umami Cloud API client for analytics"
```

---

## Task 6: Custom Event Tracking

**Files:**
- Modify: `src/components/customer/search-bar.tsx`
- Modify: `src/components/customer/listing-contact.tsx`

- [ ] **Step 1: Track search queries**

In search-bar.tsx, after debounce fires, track the search query:

```typescript
// Already partially done in Plan 3, verify:
if (typeof window !== "undefined" && window.umami) {
  window.umami.track("search", { query: value });
}
```

The TypeScript declaration for `window.umami` was already added in Plan 3 Task 3 (`src/types/index.ts`). Verify it exists; if not, add it now.

- [ ] **Step 2: Track contact button clicks**

In listing-contact.tsx, track clicks on contact buttons:

```typescript
function trackContact(type: string, listingId: string) {
  window.umami?.track("contact_click", { type, listing_id: listingId });
}

// On phone click: trackContact("phone", listingId)
// On WhatsApp click: trackContact("whatsapp", listingId)
// On email click: trackContact("email", listingId)
// On copy address: trackContact("copy_address", listingId)
// On social link click: trackContact("social", listingId)
```

- [ ] **Step 3: Track map interactions**

In listing-map.tsx, track when user interacts with the map:

```typescript
// Track "Get Directions" clicks if we add a link
function trackDirections(listingId: string) {
  window.umami?.track("get_directions", { listing_id: listingId });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/customer/search-bar.tsx src/components/customer/listing-contact.tsx src/components/customer/listing-map.tsx src/types/index.ts && git commit -m "feat: add Umami custom event tracking for search, contact, and directions"
```

---

## Task 7: Per-Listing View Count Widget (Admin)

**Files:**
- Create: `src/components/admin/listing-views-widget.tsx`
- Modify: `src/app/admin/(authenticated)/listings/page.tsx`
- Modify: `src/app/admin/(authenticated)/listings/[id]/edit/page.tsx`

- [ ] **Step 1: Create views widget**

Server component that fetches view count from Umami API and displays it.

```typescript
import { getPageViews, getTotalPageViews } from "@/lib/umami";
import { buildListingUrl } from "@/lib/listing-helpers";

interface Props {
  region: string;
  city: string;
  slug: string;
}

export async function ListingViewsWidget({ region, city, slug }: Props) {
  const urlPath = buildListingUrl(region, city, slug);
  const [total, last30] = await Promise.all([
    getTotalPageViews(urlPath),
    getPageViews(urlPath, 30),
  ]);

  return (
    <div className="flex gap-4 text-sm">
      <div>
        <span className="text-content-muted">Total views:</span>{" "}
        <span className="font-semibold">{total.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-content-muted">Last 30 days:</span>{" "}
        <span className="font-semibold">{last30.toLocaleString()}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to listings table**

In the admin listings table, add a "Views (30d)" column. For each listing, show the 30-day view count. Use `Suspense` with a loading skeleton since the Umami API call may be slow.

Note: For Admin role users, only show views for their own listings (already filtered by the page query).

- [ ] **Step 3: Add to edit page**

On the listing edit page, show the views widget above the form as a stats bar.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/listing-views-widget.tsx src/app/admin/\(authenticated\)/listings/page.tsx src/app/admin/\(authenticated\)/listings/\[id\]/edit/page.tsx && git commit -m "feat: add per-listing view count widget in admin"
```

---

## Task 8: Umami Dashboard Link in Admin Sidebar

**Files:**
- Modify: `src/components/admin/sidebar.tsx`

- [ ] **Step 1: Add Umami link**

In the admin sidebar, add an "Analytics" link that opens the Umami Cloud dashboard in a new tab:

```typescript
// Only show for Super Admin
if (session.role === "super_admin") {
  // Add to nav items:
  {
    name: "Analytics",
    href: process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || "https://cloud.umami.is",
    icon: ChartIcon,
    external: true, // opens in new tab
  }
}
```

Style the external link with a small "external link" icon to indicate it opens in a new tab.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/sidebar.tsx && git commit -m "feat: add Umami analytics dashboard link to admin sidebar"
```

---

## Task 9: Build Verification & Push

- [ ] **Step 1: Run build**

```bash
npm run build
```

- [ ] **Step 2: Run lint and type check**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

- [ ] **Step 4: Update project docs**

Update the following files to reflect Plan 6 completion:
- `docs/superpowers/plans/2026-03-19-master-plan.md` — mark Plan 6 status as `Done`
- `CLAUDE.md` — update "Project Status" to `Phase: Plan 6 — Promoted Listings & Analytics (complete)`

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Execution Strategy

**Parallel Phase A** (no dependencies): Tasks 1, 2, 3, 5, 6
**Phase B** (after A): Tasks 4 (audit), 7, 8
**Phase C**: Task 9 (verification)

## Summary

After completing all 9 tasks, the app will have:

- **Promoted listing visibility:**
  - "Featured" badge on promoted listing cards (gold with star icon)
  - Purple glow effect on promoted cards
  - Featured Venues carousel on home page (promoted listings only)
  - Spotlight cards on region/city landing pages
  - Priority ordering (promoted first) in all listing queries

- **Analytics integration:**
  - Umami Cloud tracking script on all pages
  - Custom event tracking: search queries, contact clicks, get directions
  - Per-listing view count widget in admin (total + last 30 days)
  - Umami Cloud dashboard linked from admin sidebar (Super Admin)

**Next:** Plan 7 (Polish & Launch) handles final bug fixes, mobile responsiveness, accessibility, and production deployment.
