# BarHop PH — Master Implementation Plan

> This document indexes all sub-plans. Each plan is a self-contained unit that produces working, testable software. Execute them in order.

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md`

---

## Plan Index

| # | Plan | Phase | Dependencies | Status |
|---|---|---|---|---|
| 1 | [Foundation](./2026-03-19-plan-1-foundation.md) | Phase 1 | None | Done |
| 2 | [Admin CRUD & Image Upload](./2026-03-19-plan-2-admin-crud.md) | Phase 2 | Plan 1 | Done |
| 3 | [Customer UI & Search](./2026-03-19-plan-3-customer-ui.md) | Phase 3 | Plan 2 | Done |
| 4 | [SEO & Performance](./2026-03-19-plan-4-seo-performance.md) | Phase 4 | Plan 3 | Done |
| 5 | [Data Seeding](./2026-03-19-plan-5-data-seeding.md) | Phase 5 | Plan 4 | Done |
| 6 | [Promoted Listings & Analytics](./2026-03-19-plan-6-promoted-analytics.md) | Phase 6-7 | Plan 5 | Pending |
| 7 | [Polish & Launch](./2026-03-19-plan-7-polish-launch.md) | Phase 8 | Plan 6 | Pending |

## Design System

The UI/UX design system (dark nightlife theme, component specs, wireframes) is embedded within Plan 1 as the first task group. All subsequent plans reference these design tokens and shared components.

## Key Architecture Decisions

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** Neon PostgreSQL + Prisma ORM + PostGIS
- **Auth:** Custom JWT via `jose` + httpOnly cookies
- **Hosting:** Vercel (MVP) → AWS ECS Fargate (future)
- **Images:** S3 + CloudFront, presigned URL uploads
- **Analytics:** Umami Cloud
- **Styling:** Tailwind CSS

## Execution Strategy

All plans are now fully detailed and ready for execution.
