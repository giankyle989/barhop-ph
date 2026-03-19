# BarHop PH — PRD Review & Design Decisions

**Date:** 2026-03-19
**Status:** Draft
**Context:** Full review of PRD.md with scope, technical, and gap analysis for a solo developer building the complete MVP.

---

## 1. Scope & Timeline

- **Approach:** Full build (all features in PRD)
- **Solo dev realistic timeline:** 20–24 weeks
- **Key risk:** Every week spent on infrastructure is a week Google isn't indexing pages. SEO is the #1 goal — prioritize getting customer-facing pages live early in the build order.

---

## 2. Deployment Strategy

### Now: Vercel

Deploy on Vercel (free/Pro tier) for zero-config Next.js hosting. This eliminates weeks of DevOps work and gets the site live faster.

**Architecture rules to keep the app portable:**

- Keep the multi-stage Dockerfile in the repo and test it locally via `docker compose`
- Keep the `/api/health` endpoint (needed for future ECS health checks)
- All config via environment variables — no `process.env.VERCEL`-specific logic
- Don't use Vercel-specific services (Vercel Blob, Vercel KV, Vercel Cron, `@vercel/og`)
- Set `output: 'standalone'` in `next.config.ts` (Vercel ignores it, Docker needs it)
- S3 + CloudFront remain the image storage/CDN — AWS credentials stored as Vercel environment variables

### Database: Neon PostgreSQL (Serverless)

The PRD specifies Amazon RDS in a private VPC subnet, which is inaccessible from Vercel's serverless functions. For the Vercel phase, use **Neon** (serverless PostgreSQL):

- Free tier: 0.5 GB storage, 190 compute hours/month — sufficient for MVP
- Supports PostGIS extension (required for geo queries)
- Built-in connection pooling (important for serverless — avoids connection exhaustion)
- Accessible from Vercel without VPC peering
- Prisma works with Neon out of the box
- When migrating to ECS, switch to RDS by changing `DATABASE_URL` — Prisma abstracts the connection

### CI/CD Pipeline (Vercel Phase)

- **Push to `main`** → Vercel auto-deploys to production
- **Push to `develop`** → Vercel auto-deploys to preview/staging URL
- **Pull requests** → Vercel creates preview deployment + GitHub Actions runs lint, type check, and tests
- No manual deploy steps needed

### Future: AWS ECS Fargate with Rolling Updates

When traffic outgrows Vercel (>1TB bandwidth/month, need VPC-level networking, or cost exceeds equivalent ECS), migrate to AWS ECS Fargate with **rolling updates** (not blue-green).

**Why rolling updates over blue-green:**

- Built into ECS natively — no CodeDeploy, no extra target groups, no appspec.yml
- Near-zero downtime (~30s of mixed old/new versions during deploy)
- A bar listings directory can tolerate a rolling deploy — blue-green solves problems (instant rollback for financial transactions, breaking API changes) that this app won't have
- Blue-green can be added as an incremental upgrade later if truly needed

**Migration path:**

1. Push Docker image to ECR
2. Stand up ECS Fargate + ALB (rolling update deployment)
3. Point Route 53 from Vercel to ALB
4. No app code changes needed

---

## 3. Analytics (Simplified for MVP)

The PRD's analytics requirements (Sections 7.3.3 and 7.4) describe a full analytics platform. This is scoped down for solo-dev feasibility.

### Super Admin Analytics

Use **Umami's built-in dashboard** directly. It already provides:

- Traffic overview (page views, unique visitors, sessions)
- Top pages (= top listings)
- Traffic sources
- Bounce rate and session duration
- Device/browser breakdown

No custom dashboard needed for Super Admin in v1.

### Umami Hosting

Use **Umami Cloud** (hosted SaaS) — free tier supports up to 10K events/month. This avoids self-hosting complexity (the PRD's plan of running Umami as an ECS service is deferred along with ECS). When migrating to AWS, Umami can be self-hosted on ECS at that point.

### Admin (Business Owner) Analytics

Expose **listing page view counts only** in v1 — a single number per listing (total views, last 30 days). No charts, no comparisons, no click-through rates.

Full analytics dashboard (charts, referral sources, contact click tracking, city comparisons) is a future enhancement.

### Analytics API endpoints

- **`GET /api/admin/analytics/overview`** — **Dropped.** Super Admin uses Umami Cloud dashboard directly (linked from the admin sidebar). No custom API needed.
- **`GET /api/admin/analytics/listings/:id`** — **Retained, simplified.** Returns `{ total_views: number, last_30_days_views: number }`. Data source: Umami Cloud API (query page views filtered by the listing's URL path). Auth: Super Admin sees any listing, Admin sees own listings only.

### Analytics admin page routes

- **`/admin/analytics`** — Replaced by an external link to the Umami Cloud dashboard in the admin sidebar. No custom page built.
- **`/admin/listings/:id/analytics`** — Removed as a standalone page. Instead, show the view count (total + last 30 days) as an inline widget on the `/admin/listings` table and on the `/admin/listings/:id/edit` page.

### Custom event tracking (MVP)

Track internal search queries via Umami custom events (`umami.track('search', { query })`) from day one. This enables the "Top Search Queries" feature in the Super Admin dashboard (PRD Section 7.4.1) using Umami's built-in event reporting — no custom dashboard needed.

---

## 4. Promoted Listing Strategy (Simplified)

The PRD's promoted content tiers (Section 7.3.2) create two different rendering paths for every listing field, adding significant complexity to the detail page, admin forms, and API.

### Decision: All content fields available to all listings

Promotion value comes from **visibility**, not content gating:

- **Priority placement** — promoted listings appear first in search/browse/landing pages
- **Homepage "Featured Venues" section** — exclusively promoted listings
- **"Featured" badge** — visual indicator on listing cards
- **Region/city page spotlight** — highlighted card on landing pages

All content fields (gallery, video, social links, contact buttons, rich events, menu with images) are available to every listing regardless of promotion status. The `description` field is **sanitized HTML** for all listings (using a server-side sanitizer like `sanitize-html` or `DOMPurify` to prevent XSS). This allows basic formatting (bold, italic, links, line breaks) without security risk. This simplifies the entire codebase — one rendering path, one form, one API shape.

### Promoted SEO Benefits (Retained)

Even though content tiers are removed, promoted listings still receive differentiated SEO treatment:

- **Priority sitemap inclusion** — promoted listings get `<changefreq>daily</changefreq>` vs `weekly` for free listings
- **More aggressive internal linking** — promoted listings are linked from category, region, and city pages more prominently
- **Longer auto-generated meta descriptions** — promoted listings pull from their richer content to generate more detailed meta descriptions
- **Richer JSON-LD** — promoted listings include additional fields in structured data (social links, contact info, events) since they're more likely to have this data populated

---

## 5. Data Model Changes

### New fields to add to the Listing entity

| Field | Type | Required | Notes |
|---|---|---|---|
| `video_url` | String | No | YouTube/Facebook video embed URL |
| `social_links` | JSON | No | `{ facebook?, instagram?, tiktok?, x? }` |
| `phone` | String | No | Primary phone number |
| `whatsapp` | String | No | WhatsApp number |
| `email` | String | No | Contact email |
| `google_place_id` | String | No | Google Places unique ID. Used for dedup and future data refresh. Unique constraint. |
| `status` | Enum | Yes | `draft`, `published`, `archived`. Default: `draft`. Only `published` listings are visible to customers. `archived` listings return HTTP 410 (Gone). |

### PRD `image_url` required constraint relaxed

The PRD marks `image_url` as required, but with the `status` field, draft listings may not yet have an image. Change `image_url` to **nullable**. Listings without an image show "No image available" on the customer side. The seeding script sets status to `published` only for listings that have an image.

### User entity changes

Add rate-limiting fields to the User model (PRD Section 9):

| Field | Type | Required | Notes |
|---|---|---|---|
| `failed_login_count` | Integer | Yes | Default: 0. Incremented on failed login. Reset on successful login. |
| `last_failed_login_at` | Timestamp | No | Set on failed login. Used with `failed_login_count` for sliding window rate limiting. |

### Category becomes an array

- `category` field changes from `String` to `String[]`
- Filtering uses `ANY` match (listing appears if it matches any selected category)
- First category in the array is the **primary** — used for SEO breadcrumbs, structured data, and URL generation
- Admin forms use multi-select input

### Slug uniqueness

- Unique constraint on `(city, slug)` instead of just `slug`
- Seeding script detects collisions and appends suffix: `the-brewery`, `the-brewery-2`

### Audit field

- Add `updated_by` (UUID, FK, nullable, `ON DELETE SET NULL`) to the Listing entity — setting null on user deletion preserves the listing while removing the reference
- Future enhancement: full audit log page — Super Admin sees all changes, Admin sees own changes only

---

## 6. API Design Changes

### Nearby endpoint

Change from `GET /api/listings/nearby` to `GET /api/listings?nearby=true&lat=X&lng=Y` to avoid route conflict with `GET /api/listings/:slug`.

### Listing lookup by slug

Since slug uniqueness is scoped to `(city, slug)`, the public API endpoint `GET /api/listings/:slug` is insufficient — a slug alone may not uniquely identify a listing. The customer-facing page routes resolve listings from the full URL path `/listings/:region/:city/:slug`, so the API lookup should accept city + slug:

- `GET /api/listings/:city/:slug` — public listing detail endpoint
- Alternatively, use the page route's server-side data fetching (Next.js `getServerSideProps` / server components) to query Prisma directly by `{ city, slug }`, bypassing the need for this API endpoint entirely

### Full-text search

- Use PostgreSQL `tsvector` with GIN index on `name` and `description` fields
- Search goes through `GET /api/listings?q=<term>` — same endpoint as browse, with an optional search parameter
- When `q` is present, results are sorted by relevance rank (not cursor-based). Fall back to offset pagination (`?q=foo&page=1&limit=20`) since relevance-ranked results don't have a stable sort order for cursor pagination
- When `q` is absent, use cursor-based pagination with stable sort order
- Client-side: debounced input (300ms) triggers search requests

### Nearby / geolocation

- Endpoint: `GET /api/listings?nearby=true&lat=X&lng=Y&radius=5`
- Default radius: 5km. Max radius: 25km.
- PostGIS query: use `ST_DWithin` with a `geography` column for accurate distance calculations
- Add a computed `location` column (`geography(Point, 4326)`) derived from `latitude`/`longitude`, with a spatial GiST index
- Sort results by distance ascending (`ST_Distance`)
- Bounding box pre-filter via `ST_DWithin` ensures the GiST index is used efficiently

### Upload API endpoints (admin-only, authenticated)

- `POST /api/uploads/presign` — Returns a presigned S3 URL for direct browser upload. Request: `{ filename, contentType }`. Response: `{ uploadUrl, s3Key }`.
- `POST /api/uploads/complete` — Triggers server-side image processing (resize + WebP). Request: `{ s3Key }`. Response: `{ variants: { thumb, card, hero } }`.

### Pagination

Cursor-based pagination for list/browse endpoints: `?cursor=<id>&limit=20`. More performant than offset-based for large datasets and plays nicer with ISR caching. Exception: search results use offset pagination (see above).

---

## 7. Auth Design

### Approach: Custom JWT (not NextAuth.js)

NextAuth.js is overkill — no customer accounts, no OAuth providers, just two admin roles.

- Use `jose` library for JWT signing/verification
- Store session token in an httpOnly, secure, SameSite cookie
- 24-hour JWT expiry, no refresh tokens for MVP
- Expired token → redirect to login page
- CSRF protection: SameSite cookie attribute + custom header check
- Rate limiting on auth endpoints: database-backed sliding window counter (`failed_login_count`, `last_failed_login_at` on the `users` table). Lock account after 5 failed attempts within 15 minutes. No external Redis dependency needed for MVP.
- Input validation: Zod schemas on all API inputs. All JSON columns (`social_links`, `open_hours`, `menu`, `events`) require corresponding Zod schemas for validation.
- Logout: clears the httpOnly cookie client-side. JWTs are stateless and cannot be server-side invalidated — a stolen token remains valid until expiry (24h). This is acceptable for an admin-only MVP. If this becomes a concern, reduce expiry to 1-2 hours or add a lightweight token blocklist in the database.

### Super Admin bootstrapping

Seed script (`npx prisma db seed`) creates the initial Super Admin account using credentials from environment variables (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`).

### Password reset

Super Admin can manually reset an Admin's password and generate a temporary one. No email-based self-service for MVP.

---

## 8. Admin Edit Restrictions

Business owner Admin accounts have restricted edit access to prevent identity/placement changes.

### Admin CAN edit

description, images, gallery, tags, open_hours, menu, events, phone, whatsapp, email, social_links, video_url

### Admin CANNOT edit

name, slug, categories, region, city, address, latitude, longitude, is_promoted, owner_id

---

## 9. SEO & Customer Side

### URL prefix: `/listings/` (not `/bars/`)

The PRD has an inconsistency: Section 11.1 uses `/listings/:region/:city` but Section 6.1.6 references `/bars/ncr`. The definitive URL prefix is **`/listings/`** since the app covers clubs, lounges, KTVs, and other venues beyond just bars. All customer-facing routes:

- `/listings` — browse all
- `/listings/:region` — region landing page
- `/listings/:region/:city` — city landing page
- `/listings/:region/:city/:slug` — listing detail
- `/nearby` — geolocation-based nearby listings (retained from PRD). Uses the same `GET /api/listings?nearby=true&lat=X&lng=Y` endpoint. This is a standalone page with browser geolocation prompt, not just a filter on `/listings`.

### DNS/SSL (Vercel Phase)

Point `barhop.ph` domain to Vercel via CNAME record. DNS can remain in Route 53 or any registrar. Vercel provisions SSL automatically. When migrating to ECS, update the DNS record to point to the ALB.

### Google Maps API key management

Two separate API keys in Google Cloud Console:

- **Client-side key** (Maps JavaScript API): restricted to production domain via HTTP referrer restriction. Set a daily quota cap and billing alert to prevent abuse.
- **Server-side key** (Places API for seeding): restricted by IP address. Used only in the seeding script.

### Region/city mapping

Static `regions.ts` constants file mapping: region enum → display name → URL slug → cities list. Not stored in the database — derived from the lookup.

Unique constraint on `(region, city_slug)` for city deduplication (e.g., "San Fernando" exists in Region I and Region III).

### 404 / empty states

- Empty landing pages: "No listings yet" message with links to nearby cities
- Deleted listings: return HTTP 410 (Gone) so Google de-indexes, redirect user to the city page

### Open Graph images

- Listing detail pages: use the listing's primary `image_url`
- Landing pages: branded default BarHop PH image

### Open/closed status

- All open hours stored and compared in PHT (UTC+8)
- Open/closed badge on listing cards: computed **client-side** using user's local clock against PHT schedule (ISR-cached pages can't know current time)
- When `close` time < `open` time (e.g., `"open": "17:00", "close": "03:00"`), the closing time is interpreted as the following calendar day
- 24-hour operation: `{"open": "00:00", "close": "24:00"}`. A `null` day means closed.
- The rule `close < open = next day` handles all midnight cases naturally: `{"open": "17:00", "close": "00:00"}` → `00:00 < 17:00` → close is next-day midnight. Use `"24:00"` only for explicit 24-hour operation.

### Caching

- Next.js ISR with revalidation period (~60 seconds) for listing detail and landing pages
- `stale-while-revalidate` cache headers

---

## 10. Image Processing

### Upload pipeline

Vercel serverless functions have a **4.5MB request body limit** and 10s/60s execution timeout (free/Pro). Processing multiple image variants with Sharp can exceed these limits. To avoid this:

**Approach: Presigned URL upload + server-side processing**

1. Admin selects image(s) in the browser
2. Client requests a presigned S3 upload URL from the API (`POST /api/uploads/presign`)
3. Client uploads directly to S3 using the presigned URL (bypasses Vercel body limit entirely)
4. Client notifies the API with the S3 key (`POST /api/uploads/complete`)
5. API triggers image processing: resize to standard sizes (thumbnail ~200px, card ~600px, hero ~1200px), convert to WebP using Sharp
6. Store the base S3 key in the listing record
7. Derive variant URLs by naming convention (e.g., `{key}-thumb.webp`, `{key}-card.webp`, `{key}-hero.webp`)

**Client-side enforcement:** Max file size 5MB per image, max 10 gallery images. Reject oversized files before upload.

**For the seeding script:** Runs locally (not on Vercel), so it processes images directly with Sharp and uploads to S3 — no presigned URL needed.

Serve all images via CloudFront CDN with 7-day cache TTL.

---

## 11. Data Seeding Strategy

### Photo pipeline (dual source)

For each venue, try sources in priority order:

1. **Google Places Photos API** — fetch the best photo. Display alongside Google Map embed on detail page. Store in S3 with "Powered by Google" attribution. Cost is well under the $200/month free credit (~$7.60 total for 200+ listings).
2. **Facebook page scrape (fallback)** — if Google Places has no photo or poor quality, scrape the venue's public Facebook page cover photo using headless browser (Puppeteer/Playwright). Display with attribution: "Photo from [Venue Name]". Rate-limit requests.
3. **No image available** — if neither source has a photo, show "No image available" with CTA: "Is this your bar? Add your photos."

### Legal risk mitigation

- Google Places photos displayed alongside Google Map embed + "Powered by Google" attribution
- Facebook photos displayed with venue attribution
- Takedown policy on every listing page — "Claim this listing" / "Report an issue"
- Remove any content immediately upon business owner request

### Seeding script workflow

1. **Google Places Text Search API** — discover venues by category + city queries
2. **Google Places Details API** — get full data (name, address, coordinates, hours, phone)
3. **Google Places Photos API** — download best photo, upload to S3
4. **Facebook scrape (fallback)** — for venues with no/poor Google photo, find Facebook page, scrape cover photo, upload to S3
5. **Map data to schema** — auto-generate slug (with collision handling), map `addressComponents` to region/city (via lookup table), map Google `types` to app categories (via mapping table)
6. **Insert into database** via Prisma
7. **Deduplicate** by `google_place_id`

### Category mapping from Google Places types

| Google Places type | App category |
|---|---|
| `night_club` | Night Club |
| `bar` | Pub |
| `restaurant` (with bar indicators) | Pub |
| Unmapped types | Flag for manual review |

Full mapping table to be built during implementation. Venues can be manually re-categorized after seeding.

### Data not available from API (manual enrichment)

- Menu items and prices
- Events
- Detailed tags beyond what Google `types` provides
- Better descriptions for top NCR listings

### Menu JSON structure update

The PRD's menu structure is `{ item, price, description? }`. Since all content fields are now available to all listings, add an optional `image_url` field for menu items with photos:

```json
{ "item": "San Miguel Pale Pilsen", "price": "₱85", "description": "330ml bottle", "image_url": "https://cdn.barhop.ph/..." }
```

The `image_url` field is optional — most free listings will have text-only menus, promoted listings are more likely to populate it.

### Category mapping — full canonical list

The app uses these categories (from PRD Appendix 20.1):

Sports Bar, Cocktail Bar, Rooftop Bar, Night Club, KTV / Karaoke Bar, Beer Garden, Lounge, Pub, Wine Bar, Beach Bar, Live Music Bar, Speakeasy, Hookah / Shisha Bar

The Google Places type → app category mapping will be finalized during implementation of the seeding script. Unmapped types default to "Pub" and are flagged for manual review.

---

## 12. Admin Dashboard Page

The `/admin/dashboard` page shows a simple overview:

- Total listing count (all / promoted / free)
- Listings by status (most recently updated)
- Quick links to create listing, manage users

This is a lightweight landing page, not a full analytics dashboard (analytics lives in Umami).

---

## 13. Dockerfile Fix

The PRD's Dockerfile (Section 15.6) has a bug: Stage 1 installs `--only=production` but Stage 2 copies those deps and runs `npm run build`, which needs devDependencies (TypeScript, ESLint, etc.).

### Fixed Dockerfile

```dockerfile
# Stage 1: Install all dependencies (including dev) and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime (standalone output bundles its own node_modules)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Note: Next.js `standalone` output bundles the required `node_modules` subset, so a separate production dependency stage is unnecessary.

---

## 14. Revised Milestones (Solo Dev, 20–24 weeks)

The PRD's milestones (Section 19) assumed a team and AWS ECS infra. Revised for Vercel + Neon + solo dev, prioritizing customer-facing pages for early SEO indexing:

| Phase | Duration | Deliverables |
|---|---|---|
| **Phase 1: Foundation** | 2–3 weeks | Next.js project setup, Prisma + Neon DB schema, auth system (JWT + roles), seed script for Super Admin, Vercel deployment, S3 + CloudFront setup |
| **Phase 2: Admin CRUD** | 2–3 weeks | Listing CRUD (create/read/update/delete), user management (Super Admin), presigned image upload pipeline, admin edit restrictions |
| **Phase 3: Customer UI** | 3–4 weeks | Listing browse, search, filters, detail page, region/city landing pages, nearby/geolocation, Google Map embed, open/closed badge |
| **Phase 4: SEO & Performance** | 1–2 weeks | ISR, structured data (JSON-LD), sitemap.xml, meta tags, OG images, breadcrumbs, canonical URLs, Lighthouse optimization |
| **Phase 5: Data Seeding** | 1–2 weeks | Google Places API seeding script, Facebook photo scrape fallback, 200+ listings seeded, manual enrichment of top NCR listings |
| **Phase 6: Promoted Listings** | 1–2 weeks | Priority placement, featured badge, homepage featured section, promoted SEO benefits |
| **Phase 7: Analytics** | 1 week | Umami Cloud integration, custom event tracking (search queries), per-listing view count widget for Admin |
| **Phase 8: Polish & Launch** | 1–2 weeks | Bug fixes, mobile responsiveness audit, accessibility pass, production deploy, monitoring |
| **Total** | **~12–19 weeks** | |

Note: Getting through Phase 4 as fast as possible is the priority — that's when Google starts indexing pages. Phases 5-8 can happen while pages are already being indexed.

---

## 15. Future Enhancements (Documented, Not In MVP)

| Enhancement | Trigger / Context |
|---|---|
| Migrate to AWS ECS Fargate with rolling updates | Outgrow Vercel limits |
| Blue-green deployment via CodeDeploy | Need instant rollback for critical deploys |
| Full analytics dashboard for Admin (charts, referral sources, click tracking, city comparisons) | After v1 analytics proves useful |
| Promoted content tiers (gated fields for free vs promoted) | If visibility-only promotion isn't enough monetization |
| Full audit log page (Super Admin sees all changes, Admin sees own changes) | When listing count and admin count grows |
| Periodic Google Places API re-sync for data freshness | When stale data becomes a user complaint |
| Facebook Graph API integration (replace scraping) | If scraping causes issues or volume increases significantly |
| Custom CTA button (`cta_label`, `cta_url` fields) | PRD Section 7.3.2 feature — deferred from MVP for simplicity |
| Self-hosted Umami on ECS | When migrating compute to AWS |
