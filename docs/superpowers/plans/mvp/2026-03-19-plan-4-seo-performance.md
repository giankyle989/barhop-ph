# Plan 4: SEO & Performance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize search engine discoverability and page performance. After this plan, Google can fully crawl, understand, and index every customer page. Target Lighthouse Performance score >= 90.

**Architecture:** Static generation where possible (sitemap, robots.txt), ISR for dynamic pages, image optimization via Next.js `<Image>`, lazy loading for below-fold content. All SEO metadata generated server-side.

**Tech Stack:** Next.js 15 (metadata API, sitemap generation, Image component), Prisma

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md` (Section 9, 12)
**PRD:** `docs/PRD.md` (Section 6.1.6, 12)
**Depends on:** Plan 3 (Customer UI) — complete

---

## Before You Start

1. **Read Plan 3** (`2026-03-19-plan-3-customer-ui.md`) and review what was actually built — the implementation may differ from what was planned. Check actual component file names, props, and page structure.
2. **Read the codebase** — scan `src/app/(customer)/`, `src/components/customer/`, and `src/lib/` for the actual state of customer pages and components.
3. **Adapt** — if Plan 3's output differs from what this plan assumes (e.g., different metadata patterns, component structure), adjust this plan's tasks to match reality.

---

## File Structure

```
src/app/
  sitemap.ts                          # Dynamic sitemap generator
  robots.ts                           # robots.txt generator
  not-found.tsx                       # Custom 404 page
  (customer)/
    listings/[region]/[city]/[slug]/
      opengraph-image.tsx             # Dynamic OG image (optional, if needed)

src/lib/
  structured-data.ts                  # (exists from Plan 3, enhanced here)
  seo.ts                              # SEO utility functions

public/
  favicon.ico                         # App favicon
  apple-touch-icon.png                # iOS icon
  og-default.png                      # Default OG image for landing pages
```

---

## Task 1: Sitemap Generation

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create dynamic sitemap**

Next.js 15 supports `sitemap.ts` that returns a `MetadataRoute.Sitemap` array.

```typescript
// src/app/sitemap.ts
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
```

Promoted listings get `changeFrequency: "daily"` and higher priority (per design spec Section 4).

- [ ] **Step 2: Commit**

```bash
git add src/app/sitemap.ts && git commit -m "feat: add dynamic sitemap with promoted listing priority"
```

---

## Task 2: Robots.txt

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots.txt**

```typescript
// src/app/robots.ts
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barhop.ph";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/robots.ts && git commit -m "feat: add robots.txt blocking admin routes"
```

---

## Task 3: Canonical URLs & Enhanced Metadata

**Files:**
- Create: `src/lib/seo.ts`
- Modify: `src/app/(customer)/listings/[region]/page.tsx` (add canonical)
- Modify: `src/app/(customer)/listings/[region]/[city]/page.tsx` (add canonical)
- Modify: `src/app/(customer)/listings/[region]/[city]/[slug]/page.tsx` (add canonical)
- Modify: `src/app/(customer)/listings/page.tsx` (add canonical)
- Modify: `src/app/(customer)/page.tsx` (add canonical)
- Modify: `src/app/(customer)/nearby/page.tsx` (add canonical)

- [ ] **Step 1: Create SEO utility**

```typescript
// src/lib/seo.ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barhop.ph";

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function siteUrl(): string {
  return SITE_URL;
}
```

- [ ] **Step 2: Add canonical URLs to all customer pages**

Add `alternates.canonical` to each page's `generateMetadata` or static `metadata` export:

```typescript
// Example for listing detail:
return {
  title,
  description,
  alternates: {
    canonical: canonicalUrl(`/listings/${region}/${city}/${slug}`),
  },
  openGraph: { ... },
};
```

For the browse page, canonical should strip non-essential params (only keep region, city, category, page — strip openNow, phtDay, phtTime).

- [ ] **Step 3: Add Twitter Card metadata**

Add to root layout or per-page metadata:
```typescript
twitter: {
  card: "summary_large_image",
  site: "@barhopph",
},
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/seo.ts src/app/\(customer\) && git commit -m "feat: add canonical URLs and Twitter Card metadata to all customer pages"
```

---

## Task 4: Custom 404 and Gone (410) Pages

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create custom 404 page**

Styled to match the dark theme. Show:
- Large "404" text with neon glow
- "Page not found" message
- Search bar to find venues
- Links to home, browse, popular cities

- [ ] **Step 2: Handle archived listings**

In the listing detail page, if a listing has `status: "archived"`, ideally return HTTP 410 (Gone) so Google de-indexes it. Next.js doesn't directly support 410, so:

- If listing is archived, call `notFound()` which returns 404
- Add a comment noting this limitation — a custom middleware could intercept and return 410 in the future
- Redirect user to the city page: show a message "This venue is no longer listed" with a link to the city landing page

- [ ] **Step 3: Commit**

```bash
git add src/app/not-found.tsx && git commit -m "feat: add custom 404 page with search and navigation"
```

---

## Task 5: Image Optimization

**Note:** Plan 3 already uses Next.js `<Image>` in ListingCard (configured in Task 0). This task focuses on **optimizing** image usage — adding `sizes`, `priority`, proper `alt` text, and converting any remaining `<img>` tags.

**Files:**
- Modify: `src/components/customer/listing-card.tsx` (add `sizes` prop)
- Modify: `src/components/customer/listing-gallery.tsx` (add lazy loading, `sizes`)
- Modify: `src/app/(customer)/listings/[region]/[city]/[slug]/page.tsx` (hero `priority`)

- [ ] **Step 1: Verify remote image patterns**

Confirm `next.config.ts` has the `images.remotePatterns` for `**.cloudfront.net` and `**.amazonaws.com` (added in Plan 3 Task 0, alongside the existing `NEXT_PUBLIC_CDN_HOSTNAME` entry). If missing, refer to Plan 3 Task 0 Step 2 for the correct config.

- [ ] **Step 2: Replace `<img>` with Next.js `<Image>`**

In listing-card.tsx:
```typescript
import Image from "next/image";
// Use: <Image src={imageUrl} alt={name} width={400} height={300} className="..." />
// Add sizes prop for responsive: sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

In listing detail hero:
```typescript
<Image src={imageUrl} alt={name} fill priority className="object-cover" sizes="100vw" />
// Use priority for LCP image (hero)
```

In listing-gallery.tsx:
```typescript
// Thumbnails: width={200} height={150} loading="lazy"
// Lightbox full image: fill with sizes="100vw"
```

- [ ] **Step 3: Add alt text to all images**

Ensure all `<Image>` components have descriptive alt text:
- Listing card: `"{name} - {primaryCategory} in {city}"`
- Hero: `"{name}"`
- Gallery: `"{name} photo {index + 1}"`

- [ ] **Step 4: Commit**

```bash
git add src/components/customer/listing-card.tsx src/components/customer/listing-gallery.tsx src/app/\(customer\)/listings/\[region\]/\[city\]/\[slug\]/page.tsx && git commit -m "feat: optimize images with Next.js Image component and lazy loading"
```

---

## Task 6: Static Assets (Favicon, OG Image)

**Files:**
- Create: `src/app/icon.tsx` or add `public/favicon.ico`
- Create: `public/og-default.png`
- Modify: `src/app/layout.tsx` (add icons metadata)

- [ ] **Step 1: Create favicon**

Create a simple favicon — a stylized "B" or beer glass icon with neon purple accent. Use `src/app/icon.tsx` for a dynamically generated icon or place static files in `public/`.

Minimal approach: create `src/app/favicon.ico` (or use `icon.tsx` if generating dynamically). Also add `apple-touch-icon.png` (180x180).

- [ ] **Step 2: Create default OG image**

Create a branded OG image (1200x630) for pages without a specific image:
- Dark background matching the design system
- "BarHop PH" logo/text
- Tagline: "Discover Bars & Clubs in the Philippines"
- Neon purple/pink accents

Place in `public/og-default.png`. Reference in root layout metadata:

```typescript
openGraph: {
  images: [{ url: "/og-default.png", width: 1200, height: 630 }],
},
```

- [ ] **Step 3: Add metadata to root layout**

```typescript
export const metadata: Metadata = {
  // ... existing
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "BarHop PH",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://barhop.ph"),
};
```

- [ ] **Step 4: Commit**

```bash
git add public/ src/app/layout.tsx src/app/favicon.ico && git commit -m "feat: add favicon, OG image, and enhanced root metadata"
```

---

## Task 7: Performance Optimization

**Files:**
- Modify: various components (lazy loading, code splitting)

- [ ] **Step 1: Lazy load below-fold components**

Use `next/dynamic` to lazy-load heavy client components:

```typescript
import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("@/components/customer/listing-map"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false, // Google Maps iframe doesn't need SSR
});

const ListingGallery = dynamic(() => import("@/components/customer/listing-gallery"), {
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

const NearbyClient = dynamic(() => import("@/components/customer/nearby-client"), {
  ssr: false, // Requires browser geolocation API
});
```

- [ ] **Step 2: Optimize font loading**

Fonts are already loaded via `next/font/google` (Plan 1), which auto-optimizes. Verify:
- `font-display: swap` is applied (default in next/font)
- Only required font weights are loaded

- [ ] **Step 3: Minimize client-side JavaScript**

Audit client components. Ensure:
- Server components are used wherever possible (no unnecessary `"use client"`)
- Filter sidebar imports `REGIONS` and `CATEGORIES` from constants (not fetched from API)
- OpenClosedBadge is a small, self-contained component
- No unnecessary re-renders (use `useMemo`/`useCallback` where relevant)

- [ ] **Step 4: Add loading states**

Create loading.tsx files for customer routes that use Suspense:

```typescript
// src/app/(customer)/listings/[region]/[city]/[slug]/loading.tsx
export default function ListingDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Skeleton className="h-6 w-64 mb-4" />
      <Skeleton className="h-[400px] w-full rounded-card mb-8" />
      <Skeleton className="h-10 w-96 mb-4" />
      {/* ... more skeleton elements */}
    </div>
  );
}
```

Create for: listing detail, region, city, browse pages.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(customer\) src/components/customer && git commit -m "feat: optimize performance with lazy loading, code splitting, and loading states"
```

---

## Task 8: Build Verification & Lighthouse Audit

- [ ] **Step 1: Run build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 2: Run lint and type check**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

- [ ] **Step 4: Manual Lighthouse audit**

Run `npm run dev` and use Chrome DevTools Lighthouse on:
- Home page
- Listing detail page
- Browse page

Target scores:
- Performance: >= 90
- Accessibility: >= 90
- Best Practices: >= 90
- SEO: >= 95

Common fixes:
- Add `aria-label` to icon-only buttons
- Ensure color contrast ratios meet WCAG AA
- Add `lang` attribute (already on html tag)
- Verify heading hierarchy (H1 → H2 → H3, no skips)

- [ ] **Step 5: Update project docs**

Update the following files to reflect Plan 4 completion:
- `docs/superpowers/plans/2026-03-19-master-plan.md` — mark Plan 4 status as `Done`
- `CLAUDE.md` — update "Project Status" to `Phase: Plan 4 — SEO & Performance (complete)`

- [ ] **Step 6: Push**

```bash
git push origin main
```

---

## Execution Strategy

**Parallel Phase A** (no dependencies): Tasks 1, 2, 3, 4, 6
**Phase B** (after A): Tasks 5, 7 (modifies components from Plan 3)
**Phase C**: Task 8 (verification)

## Summary

After completing all 8 tasks, the app will have:

- Dynamic sitemap.xml with all pages and promoted listing priority
- robots.txt blocking admin routes
- Canonical URLs on all customer pages
- Twitter Card metadata
- Custom 404 page
- Optimized images via Next.js Image component
- Favicon and branded OG image
- Lazy-loaded below-fold components
- Loading states with skeletons
- Lighthouse Performance >= 90, SEO >= 95

**Next:** Plan 5 (Data Seeding) populates the database with real venue data from Google Places API.
