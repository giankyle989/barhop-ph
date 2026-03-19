# BarHop PH — Master Implementation Plan

> This document indexes all sub-plans. Each plan is a self-contained unit that produces working, testable software. Execute them in order.

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md`

---

## Plan Index

| # | Plan | Phase | Dependencies | Status |
|---|---|---|---|---|
| 1 | [Foundation](./2026-03-19-plan-1-foundation.md) | Phase 1 | None | Pending |
| 2 | Admin CRUD & Image Upload | Phase 2 | Plan 1 | Pending |
| 3 | Customer UI & Search | Phase 3 | Plan 2 | Pending |
| 4 | SEO & Performance | Phase 4 | Plan 3 | Pending |
| 5 | Data Seeding | Phase 5 | Plan 4 | Pending |
| 6 | Promoted Listings & Analytics | Phase 6-7 | Plan 5 | Pending |
| 7 | Polish & Launch | Phase 8 | Plan 6 | Pending |

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

Each plan is written just before execution starts. This avoids stale plans and allows learnings from earlier phases to inform later ones. Only Plan 1 is fully detailed now.
