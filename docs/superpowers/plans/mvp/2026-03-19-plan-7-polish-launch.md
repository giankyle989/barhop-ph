# Plan 7: Polish & Launch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Final polish pass — fix bugs, ensure mobile responsiveness, accessibility compliance, production environment configuration, and launch. After this plan, the site is live on barhop.ph and ready for Google indexing.

**Architecture:** No new architecture. This plan is about quality assurance, configuration, and deployment.

**Tech Stack:** Next.js 15, Vercel, Route 53 / DNS, Google Search Console

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md` (Section 13)
**Depends on:** Plan 6 (Promoted Listings & Analytics) — complete

---

## Before You Start

1. **Read Plans 3–6** and review what was actually built — this plan audits and polishes everything, so you need to know the actual state of all customer pages, admin pages, components, and APIs.
2. **Read the codebase** — do a full scan of `src/` to understand the current file structure, component patterns, and any deviations from the plans.
3. **Adapt** — this plan's audit checklists assume specific components and pages exist. If anything was renamed, restructured, or dropped during earlier plans, update the audit targets accordingly.
4. **Check `.env.example`** — verify it reflects all env vars actually used in the codebase, not just what the plans specified.

---

## Task 1: Mobile Responsiveness Audit

**Files:**
- Modify: various components as needed

- [ ] **Step 1: Audit all customer pages on mobile viewports**

Test each page at these breakpoints: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (desktop).

Pages to test:
1. Home page — hero, featured carousel, category grid, popular cities
2. Browse page — filter sidebar (drawer), search, listing grid, pagination
3. Region landing — city pills, listing grid
4. City landing — category pills, listing grid
5. Listing detail — hero image, two-column → single column, hours, map, contact
6. Nearby page — geolocation prompt, radius selector, results grid

Common issues to fix:
- Text overflow on long venue names
- Image aspect ratios on small screens
- Filter sidebar drawer not full-width on mobile
- Horizontal scroll bleed from carousels
- Touch targets too small (min 44x44px per WCAG)
- Card grid not switching to single column

- [ ] **Step 2: Fix navbar mobile menu**

Verify:
- Hamburger button visible on mobile, hidden on desktop
- Menu slides in smoothly
- Backdrop overlay closes menu
- Menu links close the menu on click
- No body scroll when menu is open

- [ ] **Step 3: Fix listing detail mobile layout**

On mobile (< `md`):
- Single column layout (no sidebar)
- Image gallery scrolls horizontally
- Hours table is scrollable if too wide
- Map iframe resizes to full width
- Contact buttons are full-width, stacked

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "fix: mobile responsiveness across all customer pages"
```

---

## Task 2: Accessibility Audit (WCAG 2.1 AA)

**Files:**
- Modify: various components as needed

- [ ] **Step 1: Semantic HTML audit**

Verify across all pages:
- Single `<h1>` per page
- Heading hierarchy: H1 → H2 → H3 (no skips)
- `<nav>` for navigation (navbar, breadcrumbs, footer)
- `<main>` for main content area
- `<footer>` for footer
- `<article>` for listing cards (optional but good practice)
- `<section>` with headings for page sections
- `<ul>`/`<li>` for lists (tags, menu items, events)

- [ ] **Step 2: ARIA labels and keyboard navigation**

- All icon-only buttons have `aria-label` (hamburger menu, close buttons, carousel arrows, copy address)
- All form inputs have associated `<label>` elements or `aria-label`
- Modal/drawer components have `role="dialog"`, `aria-modal="true"`, focus trap
- Listing cards are keyboard-navigable (focusable link wrapping the card)
- Skip-to-content link at top of page: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
- Carousel is keyboard-navigable with arrow keys

- [ ] **Step 3: Color contrast check**

Verify all text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text):

- `#F8FAFC` (content) on `#0A0A0F` (surface) — should pass
- `#94A3B8` (content-secondary) on `#0A0A0F` — check, may need adjustment
- `#64748B` (content-muted) on `#0A0A0F` — check, may need lighter shade
- `#64748B` (content-muted) on `#1A1A2E` (card) — check
- Badge text on colored backgrounds (open/closed/featured)
- Link text on dark backgrounds

Fix any failing contrasts by adjusting the muted/secondary text colors.

- [ ] **Step 4: Image alt text audit**

Verify:
- All `<Image>` components have descriptive `alt` text
- Decorative images use `alt=""`
- No images with missing `alt` attribute
- Gallery images have meaningful alt text (not just "image 1")

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "fix: accessibility improvements for WCAG 2.1 AA compliance"
```

---

## Task 3: Cross-Browser Testing

- [ ] **Step 1: Test on target browsers**

Test core user flows on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest, macOS/iOS)
- Edge (latest)
- iOS Safari (iPhone)
- Android Chrome

Core flows:
1. Home → Browse → Filter → Listing Detail
2. Search → Results → Listing Detail
3. Nearby → Enable Location → Results
4. Admin login → Dashboard → Edit listing

Known cross-browser issues to watch:
- CSS `backdrop-filter: blur()` support (Safari prefix)
- `scroll-snap-type` behavior differences
- `navigator.clipboard.writeText()` (HTTPS only, may need fallback)
- `navigator.geolocation` permission prompts
- CSS custom properties in Tailwind v4

- [ ] **Step 2: Fix any issues found**

---

## Task 4: Error Handling & Edge Cases

**Files:**
- Modify: various pages and API routes

- [ ] **Step 1: Audit error states**

Verify graceful handling of:
- API fetch failures in client components (show error message, retry button)
- Empty listing results (show "No listings found" with suggestions)
- Invalid URL params (redirect or show 404)
- Missing images (placeholder shown, no broken image icons)
- Missing open hours (hide OpenClosedBadge, show "Hours not available")
- Missing description (hide description section, no empty space)
- Geolocation denied (show message with "Browse all listings" link)
- Network errors on nearby/search (show retry button)

- [ ] **Step 2: Add error boundaries**

Create a global error boundary for customer pages:

```typescript
// src/app/(customer)/error.tsx
"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-display text-display-sm mb-4">Something went wrong</h2>
        <p className="text-content-secondary mb-6">We're having trouble loading this page.</p>
        <button onClick={reset} className="bg-neon-purple text-white px-6 py-2 rounded-lg">
          Try again
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ && git commit -m "fix: add error handling, edge cases, and error boundaries"
```

---

## Task 5: Production Environment Configuration

- [ ] **Step 1: Verify environment variables**

Ensure all required env vars are set in Vercel production environment:

```
# Database
DATABASE_URL=...

# Auth
JWT_SECRET=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...

# CloudFront CDN
NEXT_PUBLIC_CDN_HOSTNAME=...
NEXT_PUBLIC_CDN_URL=...

# Google Maps (client-side, restricted to production domain)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Google Places (server-side, seeding only, restricted by IP)
GOOGLE_PLACES_API_KEY=...

# Umami Analytics
NEXT_PUBLIC_UMAMI_URL=...
NEXT_PUBLIC_UMAMI_WEBSITE_ID=...
UMAMI_API_KEY=...
UMAMI_API_URL=...
NEXT_PUBLIC_UMAMI_DASHBOARD_URL=...

# Site
NEXT_PUBLIC_SITE_URL=https://barhop.ph

# Super Admin (for seed only, not needed in Vercel)
# SUPER_ADMIN_EMAIL=...
# SUPER_ADMIN_PASSWORD=...
```

**Do NOT commit or log any actual values.** Verify via Vercel dashboard.

- [ ] **Step 2: Verify Google Maps API key restrictions**

In Google Cloud Console:
- Client-side key: HTTP referrer restriction to `barhop.ph/*` and `*.vercel.app/*` (for preview deployments)
- Daily quota cap set
- Billing alerts configured
- Only Maps JavaScript API enabled

- [ ] **Step 3: Verify S3/CloudFront configuration**

- S3 bucket has appropriate CORS policy for Vercel domain
- CloudFront distribution serves images with correct cache headers
- Presigned URLs work from production domain

- [ ] **Step 4: Update .env.example**

Ensure `.env.example` lists all required variables (without values):

```bash
# Already should be done from Plan 1, but verify all new vars are included
```

- [ ] **Step 5: Commit**

```bash
git add .env.example && git commit -m "chore: update .env.example with all required environment variables"
```

---

## Task 6: DNS & Domain Setup

- [ ] **Step 1: Configure domain in Vercel**

1. Add `barhop.ph` as a custom domain in Vercel project settings
2. Add `www.barhop.ph` as an alias (redirects to `barhop.ph`)
3. Vercel provides the required DNS records

- [ ] **Step 2: Configure DNS records**

In the domain registrar or Route 53:
- `barhop.ph` → CNAME to `cname.vercel-dns.com` (or A record to Vercel IP)
- `www.barhop.ph` → CNAME to `cname.vercel-dns.com`

Wait for DNS propagation (up to 48 hours, usually minutes).

- [ ] **Step 3: Verify SSL**

Vercel auto-provisions SSL via Let's Encrypt. Verify:
- `https://barhop.ph` loads correctly
- `http://barhop.ph` redirects to HTTPS
- `https://www.barhop.ph` redirects to `https://barhop.ph`

---

## Task 7: Google Search Console Setup

- [ ] **Step 1: Add property**

1. Go to Google Search Console
2. Add property: `https://barhop.ph`
3. Verify ownership via DNS TXT record or Vercel integration

- [ ] **Step 2: Submit sitemap**

1. In Search Console, go to Sitemaps
2. Submit: `https://barhop.ph/sitemap.xml`
3. Verify it's processed without errors

- [ ] **Step 3: Request indexing**

1. Use URL Inspection tool to request indexing for key pages:
   - Home page
   - Browse page
   - Top 5 region pages (NCR, Central Visayas, Western Visayas, Davao, Central Luzon)
   - Top 10 city pages (Makati, Taguig, Quezon City, Manila, Cebu City, etc.)
   - 5-10 top listing detail pages

---

## Task 8: Final Build & Deploy

- [ ] **Step 1: Run full verification locally**

```bash
npm run build && npm run lint && npx tsc --noEmit && npm run test:run
```

- [ ] **Step 2: Review production build output**

Check build output for:
- No warnings
- Page sizes are reasonable (< 200KB per page first load JS)
- Static pages are generated correctly
- ISR pages have correct revalidation periods

- [ ] **Step 3: Push to main**

```bash
git push origin main
```

Vercel auto-deploys to production.

- [ ] **Step 4: Post-deploy verification**

On the live site (`https://barhop.ph`):
1. Home page loads correctly with featured venues
2. Browse page search and filters work
3. Region/city landing pages show listings
4. Listing detail page shows all sections, JSON-LD in source
5. Nearby page prompts for location, shows results
6. Admin login works
7. Admin can edit listings
8. View source: meta tags, canonical URLs, structured data present
9. Sitemap accessible at `/sitemap.xml`
10. Robots.txt accessible at `/robots.txt`

- [ ] **Step 5: Monitor for errors**

Check Vercel dashboard for:
- Build errors
- Runtime errors (function logs)
- Edge function errors

Check Umami dashboard for:
- Tracking script firing
- Page views recording

---

## Task 9: Launch Checklist

- [ ] **Final verification before announcing launch:**

| Check | Status |
|---|---|
| All pages load on mobile and desktop | |
| Search and filters work | |
| Geolocation nearby works | |
| Admin login and edit works | |
| 200+ listings published with images | |
| Sitemap submitted to Google | |
| SSL/HTTPS working | |
| Domain resolves correctly | |
| Umami tracking active | |
| No console errors in production | |
| Lighthouse Performance >= 90 | |
| Lighthouse SEO >= 95 | |
| Lighthouse Accessibility >= 90 | |
| OG images show in social preview | |
| Favicon displays correctly | |

- [ ] **Update project docs**

Update the following files to reflect project completion:
- `docs/superpowers/plans/2026-03-19-master-plan.md` — mark Plan 7 status as `Done`
- `CLAUDE.md` — update "Project Status" to `Phase: MVP Complete — Live at barhop.ph`. Review all sections and update any that are stale (commands, conventions, architecture decisions).

---

## Execution Strategy

**Phase A**: Tasks 1, 2, 3 (audit and fix — can be partially parallel)
**Phase B**: Task 4 (error handling)
**Phase C**: Tasks 5, 6, 7 (environment and infrastructure — sequential)
**Phase D**: Tasks 8, 9 (deploy and verify)

## Summary

After completing all 9 tasks, the app is:

- **Live** at `https://barhop.ph`
- **Mobile-responsive** across all pages and breakpoints
- **Accessible** meeting WCAG 2.1 AA standards
- **Cross-browser compatible** on Chrome, Firefox, Safari, Edge
- **Error-resilient** with graceful degradation and error boundaries
- **Production-configured** with all environment variables set
- **SSL-secured** with auto-provisioned certificates
- **Google-indexed** with sitemap submitted to Search Console
- **Analytics-tracked** with Umami Cloud recording page views and events
- **200+ real listings** ready for discovery

**The MVP is complete.** Future work includes periodic data refresh, full analytics dashboard, and scaling to AWS ECS when traffic warrants.
