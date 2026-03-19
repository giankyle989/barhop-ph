# BarHop PH

Philippine bar & club listings web app. Centralized directory for discovering bars, clubs, and nightlife venues across the Philippines.

## Project Status

**Phase:** MVP Complete — All 7 plans done

## Key Documents

- **PRD:** `docs/PRD.md`
- **Design Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md` (overrides PRD where they conflict)
- **Master Plan:** `docs/superpowers/plans/2026-03-19-master-plan.md`
- **Current Plan:** `docs/superpowers/plans/2026-03-19-plan-1-foundation.md`
- **Wireframes:** `docs/wireframes-customer.html`, `docs/wireframes-admin.html`

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4 (CSS-first @theme config, NO tailwind.config.ts)
- **Database:** Neon PostgreSQL (serverless) + Prisma ORM + PostGIS
- **Auth:** Custom JWT via `jose` + httpOnly cookies (NOT NextAuth)
- **Hosting:** Vercel (MVP) — portable to AWS ECS Fargate (future)
- **Images:** AWS S3 + CloudFront, presigned URL uploads
- **Analytics:** Umami Cloud
- **Testing:** Vitest + React Testing Library

## Architecture Decisions

- **Auth is split into two files:** `auth-utils.ts` (pure functions, testable) and `auth.ts` (cookie helpers, depends on next/headers)
- **No Vercel-specific services** (no Vercel Blob, KV, Cron, @vercel/og) — keep portable
- **`output: 'standalone'`** in next.config.ts for future Docker/ECS migration
- **Neon adapter with `ws` polyfill** required for Node.js environments (local dev, seeds)
- **Slug uniqueness** scoped to `(city, slug)` not just slug
- **Category** is `String[]` (array), first element is primary
- **Listing status:** draft/published/archived — only published visible to customers
- **All content fields available to all listings** — promotion = visibility only, not content gating
- **Description field** is sanitized HTML (use `sanitize-html`)

## Design System

Dark nightlife theme. Key tokens defined in `src/app/globals.css` via `@theme`:
- Background: `#0A0A0F`, Cards: `#1A1A2E`
- Accent: neon purple `#A855F7`, neon pink `#EC4899`
- Fonts: Inter (body), Space Grotesk (display headings)
- Featured elements get purple glow effect

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Watch mode tests
npm run test:run     # Single run tests
npm run lint         # ESLint
npx prisma studio    # DB browser
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed   # Seed Super Admin
```

## Security

- **NEVER read `.env.local`, `.env.production.local`, or any `.env` file except `.env.example`.** These contain secrets (API keys, database credentials). Only reference `.env.example` for variable names.
- Never log, print, or output environment variable values
- Never commit `.env` files (they are gitignored)
- Never hardcode API keys, secrets, or credentials in source code — always use env vars
- Never expose server-side env vars to the client (only `NEXT_PUBLIC_*` vars are client-safe)
- Sanitize all HTML content with `sanitize-html` before rendering (XSS prevention)
- Validate all API inputs with Zod schemas — never trust client data
- Use parameterized queries via Prisma — never build raw SQL from user input
- Hash passwords with bcryptjs (cost factor 12) — never store plaintext
- JWT tokens in httpOnly, secure, SameSite cookies — never in localStorage
- Rate limit login endpoints (5 attempts / 15 min lockout)
- Admin API routes must verify JWT + role before any operation
- Google Maps client-side key must be restricted to production domain in Google Cloud Console
- S3 presigned URLs expire after 5 minutes — never generate long-lived URLs

## Conventions

- Use Zod for all API input validation
- All JSON columns (open_hours, menu, events, social_links) have Zod schemas in `src/lib/validations.ts`
- Region/city/category data lives in `src/lib/constants/` — NOT in the database
- Customer page routes: `/listings/:region/:city/:slug`
- Admin routes: `/admin/*`
- API routes: `/api/*`
- Commits follow conventional commits: `feat:`, `fix:`, `chore:`, `ci:`
