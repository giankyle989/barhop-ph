# Plan 1: Foundation — Project Setup, Design System, DB Schema, Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the BarHop PH project from zero to a running Next.js app with database, auth, design system, and first Vercel deployment.

**Architecture:** Next.js 15 App Router with TypeScript, Prisma ORM connected to Neon PostgreSQL (with PostGIS), custom JWT auth via `jose`, Tailwind CSS with a dark nightlife design system. S3 + CloudFront for image storage. Deployed on Vercel.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Prisma 6, Neon PostgreSQL, PostGIS, jose, Zod, bcryptjs, @aws-sdk/client-s3, Sharp, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md`

---

## File Structure

```
barhop-ph/
├── .env.example                    # Template for env vars
├── .env.local                      # Local dev env vars (gitignored)
├── .gitignore
├── Dockerfile                      # Multi-stage build for future ECS migration
├── docker-compose.yml              # Local dev with PostgreSQL + PostGIS
├── next.config.ts                  # Next.js config (standalone output)
├── package.json
├── tsconfig.json
├── vitest.config.ts                # Test config
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                  # Generated migrations
│   └── seed.ts                     # Super Admin seed script
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (dark theme, fonts, Umami script)
│   │   ├── page.tsx                 # Home page (placeholder for Plan 3)
│   │   ├── api/
│   │   │   ├── health/route.ts      # Health check endpoint
│   │   │   └── auth/
│   │   │       ├── login/route.ts   # POST login
│   │   │       ├── logout/route.ts  # POST logout
│   │   │       └── me/route.ts      # GET current user
│   │   └── admin/
│   │       ├── layout.tsx           # Admin layout (sidebar, auth guard)
│   │       ├── login/page.tsx       # Admin login page
│   │       └── dashboard/page.tsx   # Admin dashboard (placeholder)
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── auth-utils.ts            # JWT sign/verify, password hashing (pure, no next/headers)
│   │   ├── auth.ts                  # Cookie helpers (depends on next/headers)
│   │   ├── validations.ts          # Zod schemas (shared)
│   │   ├── constants/
│   │   │   ├── regions.ts          # Region → city mapping
│   │   │   ├── categories.ts       # Category enum list
│   │   │   └── tags.ts             # Predefined tags list
│   │   └── s3.ts                   # S3 client + presign helpers
│   ├── components/
│   │   └── ui/                      # Shared UI components (design system)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       └── ...
│   └── types/
│       └── index.ts                 # Shared TypeScript types
└── tests/
    ├── lib/
    │   ├── auth.test.ts             # Auth utility tests
    │   └── validations.test.ts      # Zod schema tests
    └── api/
        ├── health.test.ts           # Health endpoint test
        └── auth.test.ts             # Auth API tests
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`, `.env.local`, `vitest.config.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /opt/barhop-ph
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults. This creates the base Next.js 15 project with App Router, TypeScript, Tailwind, and ESLint.

- [ ] **Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client @prisma/adapter-neon @neondatabase/serverless ws jose bcryptjs zod sanitize-html @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp
npm install -D @types/bcryptjs @types/sanitize-html @types/ws vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom@^6.0.0 @testing-library/user-event
```

Note: `ws` is required as a WebSocket polyfill for the Neon serverless driver in Node.js environments.

- [ ] **Step 3: Configure next.config.ts for standalone output**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_CDN_HOSTNAME || "localhost",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Create test setup file**

```typescript
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Create .env.example**

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth
JWT_SECRET="generate-a-64-char-random-string"
SUPER_ADMIN_EMAIL="admin@barhop.ph"
SUPER_ADMIN_PASSWORD="change-me-in-production"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-southeast-1"
S3_BUCKET_NAME="barhop-ph-images"

# CloudFront
NEXT_PUBLIC_CDN_HOSTNAME="cdn.barhop.ph"
NEXT_PUBLIC_CDN_URL="https://cdn.barhop.ph"

# Google Maps (client-side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Google Places (server-side, seeding only)
GOOGLE_PLACES_API_KEY=""

# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
NEXT_PUBLIC_UMAMI_URL=""
```

- [ ] **Step 7: Update .gitignore**

Add to the existing `.gitignore`:
```
.env.local
.env.production.local
```

- [ ] **Step 8: Add test script to package.json**

Add to `"scripts"` in `package.json`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 9: Create types file**

```typescript
// src/types/index.ts
// Shared TypeScript types — populated as needed in subsequent tasks
export type {};
```

- [ ] **Step 10: Verify the project builds and tests run**

```bash
npm run build
npm run test:run
```

Expected: Build succeeds. Tests pass (no tests yet, 0 test suites).

- [ ] **Step 11: Initialize git and commit**

```bash
cd /opt/barhop-ph
git init
git add -A
git commit -m "feat: initialize Next.js 15 project with TypeScript, Tailwind, Vitest"
```

---

## Task 2: Design System — Tailwind v4 Tokens & Base Theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

The design direction is **dark & nightlife**: near-black backgrounds, neon accents, moody atmosphere.

**Important:** Tailwind CSS v4 uses CSS-first configuration via `@theme` directives. There is NO `tailwind.config.ts` file. Content detection is automatic.

- [ ] **Step 1: Replace globals.css with Tailwind v4 theme and design tokens**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-surface: #0A0A0F;
  --color-surface-raised: #12121A;
  --color-surface-card: #1A1A2E;
  --color-surface-overlay: #222236;

  /* Neon accents */
  --color-neon-purple: #A855F7;
  --color-neon-pink: #EC4899;
  --color-neon-cyan: #06B6D4;

  /* Text */
  --color-content: #F8FAFC;
  --color-content-secondary: #94A3B8;
  --color-content-muted: #64748B;

  /* Status */
  --color-status-open: #22C55E;
  --color-status-closed: #EF4444;
  --color-status-featured: #F59E0B;

  /* Borders */
  --color-border: #2D2D44;
  --color-border-hover: #3D3D5C;

  /* Fonts */
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), system-ui, sans-serif;

  /* Font sizes */
  --font-size-display-lg: 3rem;
  --line-height-display-lg: 1.1;
  --font-size-display-md: 2.25rem;
  --line-height-display-md: 1.2;
  --font-size-display-sm: 1.5rem;
  --line-height-display-sm: 1.3;

  /* Border radius */
  --radius-card: 0.75rem;

  /* Shadows */
  --shadow-glow: 0 0 20px rgba(168, 85, 247, 0.3);
  --shadow-glow-pink: 0 0 20px rgba(236, 72, 153, 0.3);
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
}

@layer base {
  body {
    @apply bg-surface text-content antialiased;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--color-surface);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 9999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-hover);
  }
}

@layer utilities {
  .glow-purple {
    box-shadow: var(--shadow-glow);
  }
  .glow-pink {
    box-shadow: var(--shadow-glow-pink);
  }
}
```

Note: If `tailwind.config.ts` was generated by `create-next-app`, delete it — Tailwind v4 does not use it.

- [ ] **Step 3: Update root layout with fonts and dark theme**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "BarHop PH — Discover Bars & Clubs in the Philippines",
    template: "%s | BarHop PH",
  },
  description:
    "The Philippines' #1 directory for bars, clubs, and nightlife venues. Find the best spots in Makati, BGC, Cebu, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans min-h-screen">
        {children}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create placeholder home page**

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-display text-display-lg text-center">
        <span className="text-neon-purple">Bar</span>
        <span className="text-neon-pink">Hop</span>
        {" "}PH
      </h1>
      <p className="mt-4 text-content-secondary text-lg">
        Discover bars & clubs across the Philippines
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Verify dev server shows dark theme**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Dark background (#0A0A0F), "BarHop PH" in neon purple/pink, gray subtitle text.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dark nightlife design system tokens and base theme"
```

---

## Task 3: Shared UI Components (Design System)

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/index.ts` (barrel export)

- [ ] **Step 1: Create Button component**

```tsx
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-neon-purple hover:bg-neon-purple/90 text-white shadow-glow active:shadow-none",
  secondary:
    "bg-surface-card hover:bg-surface-overlay text-content border border-border hover:border-border-hover",
  ghost: "hover:bg-surface-card text-content-secondary hover:text-content",
  danger: "bg-status-closed hover:bg-status-closed/90 text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 2: Create Input component**

```tsx
// src/components/ui/input.tsx
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-content-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded bg-surface-card border border-border px-3 py-2 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors ${
            error ? "border-status-closed focus:ring-status-closed" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-status-closed">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
```

- [ ] **Step 3: Create Badge component**

```tsx
// src/components/ui/badge.tsx
type BadgeVariant = "default" | "open" | "closed" | "featured" | "neon";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-overlay text-content-secondary",
  open: "bg-status-open/20 text-status-open",
  closed: "bg-status-closed/20 text-status-closed",
  featured: "bg-status-featured/20 text-status-featured border border-status-featured/30",
  neon: "bg-neon-purple/20 text-neon-purple",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create Card component**

```tsx
// src/components/ui/card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

export function Card({ children, className = "", featured = false }: CardProps) {
  return (
    <div
      className={`rounded-card bg-surface-card border border-border shadow-card transition-all duration-200 hover:border-border-hover ${
        featured ? "border-status-featured/30 glow-purple" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 pb-0 ${className}`}>{children}</div>;
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
```

- [ ] **Step 5: Create Skeleton component for loading states**

```tsx
// src/components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-overlay ${className}`}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 6: Create barrel export**

```typescript
// src/components/ui/index.ts
export { Button } from "./button";
export { Input } from "./input";
export { Badge } from "./badge";
export { Card, CardHeader, CardContent } from "./card";
export { Skeleton } from "./skeleton";
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add shared UI components (Button, Input, Badge, Card, Skeleton)"
```

---

## Task 4: Database Schema (Prisma + Neon + PostGIS)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `prisma/migrations/` (auto-generated)

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

enum Role {
  super_admin
  admin
}

enum ListingStatus {
  draft
  published
  archived
}

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  passwordHash       String    @map("password_hash")
  role               Role
  name               String
  failedLoginCount   Int       @default(0) @map("failed_login_count")
  lastFailedLoginAt  DateTime? @map("last_failed_login_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  ownedListings      Listing[] @relation("ListingOwner")
  updatedListings    Listing[] @relation("ListingUpdater")

  @@map("users")
}

model Listing {
  id             String        @id @default(cuid())
  name           String
  slug           String
  categories     String[]
  region         String
  city           String
  address        String
  latitude       Float
  longitude      Float
  description    String?       @db.Text
  imageUrl       String?       @map("image_url")
  gallery        String[]      @default([])
  tags           String[]      @default([])
  openHours      Json?         @map("open_hours")
  menu           Json?
  events         Json?
  isPromoted     Boolean       @default(false) @map("is_promoted")
  status         ListingStatus @default(draft)
  videoUrl       String?       @map("video_url")
  socialLinks    Json?         @map("social_links")
  phone          String?
  whatsapp       String?
  email          String?
  googlePlaceId  String?       @unique @map("google_place_id")

  ownerId        String?       @map("owner_id")
  owner          User?         @relation("ListingOwner", fields: [ownerId], references: [id], onDelete: SetNull)

  updatedById    String?       @map("updated_by")
  updatedBy      User?         @relation("ListingUpdater", fields: [updatedById], references: [id], onDelete: SetNull)

  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  @@unique([city, slug])
  @@index([status])
  @@index([region, city])
  @@index([isPromoted])
  // Note: GIN index on categories added via raw SQL migration (see Step 7)
  @@map("listings")
}
```

- [ ] **Step 3: Create Prisma client singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// WebSocket polyfill required for Node.js environments (local dev, seed scripts)
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 4: Set up local database with Docker Compose**

```yaml
# docker-compose.yml
services:
  db:
    image: postgis/postgis:16-3.4-alpine
    environment:
      POSTGRES_USER: barhop
      POSTGRES_PASSWORD: barhop_dev
      POSTGRES_DB: barhop_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 5: Create .env.local for local dev**

```bash
DATABASE_URL="postgresql://barhop:barhop_dev@localhost:5432/barhop_dev"
JWT_SECRET="dev-secret-at-least-32-characters-long-for-testing-only"
SUPER_ADMIN_EMAIL="admin@barhop.ph"
SUPER_ADMIN_PASSWORD="admin123"
```

- [ ] **Step 6: Start local database and run migration**

```bash
docker compose up -d
npx prisma migrate dev --name init
```

Expected: Migration creates `users` and `listings` tables with all columns and indexes.

- [ ] **Step 7: Add PostGIS geography column via raw SQL migration**

Prisma doesn't natively support PostGIS geography columns. Create a custom migration:

```bash
npx prisma migrate dev --name add-geography-column --create-only
```

Then edit the generated migration SQL file to add:

```sql
-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column derived from lat/lng
ALTER TABLE listings ADD COLUMN location geography(Point, 4326);

-- Create spatial index
CREATE INDEX listings_location_idx ON listings USING GIST (location);

-- Create function to auto-update location from lat/lng
CREATE OR REPLACE FUNCTION update_listing_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER listing_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listing_location();

-- Add full-text search index
ALTER TABLE listings ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX listings_search_idx ON listings USING GIN (search_vector);

-- GIN index for array containment queries on categories
CREATE INDEX listings_categories_idx ON listings USING GIN (categories);
```

Then apply:

```bash
npx prisma migrate dev
```

- [ ] **Step 8: Verify schema in database**

```bash
npx prisma studio
```

Expected: Prisma Studio opens, shows `users` and `listings` tables with all columns.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with User, Listing models, PostGIS, full-text search"
```

---

## Task 5: Constants — Regions, Categories, Tags

**Files:**
- Create: `src/lib/constants/regions.ts`
- Create: `src/lib/constants/categories.ts`
- Create: `src/lib/constants/tags.ts`
- Create: `src/lib/constants/index.ts`
- Create: `tests/lib/constants.test.ts`

- [ ] **Step 1: Write failing test for region lookup**

```typescript
// tests/lib/constants.test.ts
import { describe, it, expect } from "vitest";
import {
  REGIONS,
  getRegionBySlug,
  getCityBySlug,
} from "@/lib/constants/regions";
import { CATEGORIES } from "@/lib/constants/categories";
import { TAGS } from "@/lib/constants/tags";

describe("regions", () => {
  it("has NCR as a region", () => {
    const ncr = getRegionBySlug("ncr");
    expect(ncr).toBeDefined();
    expect(ncr!.name).toBe("NCR");
    expect(ncr!.displayName).toBe("National Capital Region");
  });

  it("finds Makati under NCR", () => {
    const city = getCityBySlug("ncr", "makati");
    expect(city).toBeDefined();
    expect(city!.name).toBe("Makati");
  });

  it("returns undefined for non-existent region", () => {
    expect(getRegionBySlug("nonexistent")).toBeUndefined();
  });

  it("returns undefined for non-existent city", () => {
    expect(getCityBySlug("ncr", "nonexistent")).toBeUndefined();
  });

  it("all regions have at least one city", () => {
    for (const region of REGIONS) {
      expect(region.cities.length).toBeGreaterThan(0);
    }
  });
});

describe("categories", () => {
  it("has 13 categories", () => {
    expect(CATEGORIES).toHaveLength(13);
  });

  it("includes Night Club", () => {
    expect(CATEGORIES.find((c) => c.name === "Night Club")).toBeDefined();
  });
});

describe("tags", () => {
  it("includes Pet Friendly", () => {
    expect(TAGS).toContain("Pet Friendly");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/constants.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create regions.ts**

```typescript
// src/lib/constants/regions.ts
export interface City {
  name: string;
  slug: string;
}

export interface Region {
  name: string;
  displayName: string;
  slug: string;
  cities: City[];
}

export const REGIONS: Region[] = [
  {
    name: "NCR",
    displayName: "National Capital Region",
    slug: "ncr",
    cities: [
      { name: "Makati", slug: "makati" },
      { name: "Taguig", slug: "taguig" },
      { name: "Quezon City", slug: "quezon-city" },
      { name: "Manila", slug: "manila" },
      { name: "Pasig", slug: "pasig" },
      { name: "Mandaluyong", slug: "mandaluyong" },
      { name: "Pasay", slug: "pasay" },
      { name: "San Juan", slug: "san-juan" },
      { name: "Parañaque", slug: "paranaque" },
      { name: "Las Piñas", slug: "las-pinas" },
      { name: "Muntinlupa", slug: "muntinlupa" },
      { name: "Marikina", slug: "marikina" },
      { name: "Caloocan", slug: "caloocan" },
      { name: "Valenzuela", slug: "valenzuela" },
      { name: "Navotas", slug: "navotas" },
      { name: "Malabon", slug: "malabon" },
      { name: "Pateros", slug: "pateros" },
    ],
  },
  {
    name: "Region VII",
    displayName: "Central Visayas",
    slug: "central-visayas",
    cities: [
      { name: "Cebu City", slug: "cebu-city" },
      { name: "Mandaue", slug: "mandaue" },
      { name: "Lapu-Lapu", slug: "lapu-lapu" },
    ],
  },
  {
    name: "Region III",
    displayName: "Central Luzon",
    slug: "central-luzon",
    cities: [
      { name: "Angeles City", slug: "angeles-city" },
      { name: "San Fernando", slug: "san-fernando" },
      { name: "Clark", slug: "clark" },
    ],
  },
  {
    name: "Region XI",
    displayName: "Davao Region",
    slug: "davao-region",
    cities: [
      { name: "Davao City", slug: "davao-city" },
    ],
  },
  {
    name: "Region VI",
    displayName: "Western Visayas",
    slug: "western-visayas",
    cities: [
      { name: "Iloilo City", slug: "iloilo-city" },
      { name: "Bacolod", slug: "bacolod" },
    ],
  },
  {
    name: "Region I",
    displayName: "Ilocos Region",
    slug: "ilocos-region",
    cities: [
      { name: "San Fernando", slug: "san-fernando" },
      { name: "Vigan", slug: "vigan" },
    ],
  },
  {
    name: "CAR",
    displayName: "Cordillera Administrative Region",
    slug: "car",
    cities: [
      { name: "Baguio", slug: "baguio" },
    ],
  },
  {
    name: "Region II",
    displayName: "Cagayan Valley",
    slug: "cagayan-valley",
    cities: [
      { name: "Tuguegarao", slug: "tuguegarao" },
    ],
  },
  {
    name: "Region IV-A",
    displayName: "CALABARZON",
    slug: "calabarzon",
    cities: [
      { name: "Tagaytay", slug: "tagaytay" },
      { name: "Antipolo", slug: "antipolo" },
      { name: "Lucena", slug: "lucena" },
    ],
  },
  {
    name: "Region IV-B",
    displayName: "MIMAROPA",
    slug: "mimaropa",
    cities: [
      { name: "Puerto Princesa", slug: "puerto-princesa" },
      { name: "Calapan", slug: "calapan" },
    ],
  },
  {
    name: "Region V",
    displayName: "Bicol Region",
    slug: "bicol-region",
    cities: [
      { name: "Legazpi", slug: "legazpi" },
      { name: "Naga", slug: "naga" },
    ],
  },
  {
    name: "Region VIII",
    displayName: "Eastern Visayas",
    slug: "eastern-visayas",
    cities: [
      { name: "Tacloban", slug: "tacloban" },
    ],
  },
  {
    name: "Region IX",
    displayName: "Zamboanga Peninsula",
    slug: "zamboanga-peninsula",
    cities: [
      { name: "Zamboanga City", slug: "zamboanga-city" },
    ],
  },
  {
    name: "Region X",
    displayName: "Northern Mindanao",
    slug: "northern-mindanao",
    cities: [
      { name: "Cagayan de Oro", slug: "cagayan-de-oro" },
    ],
  },
  {
    name: "Region XII",
    displayName: "SOCCSKSARGEN",
    slug: "soccsksargen",
    cities: [
      { name: "General Santos", slug: "general-santos" },
    ],
  },
  {
    name: "Region XIII",
    displayName: "Caraga",
    slug: "caraga",
    cities: [
      { name: "Butuan", slug: "butuan" },
    ],
  },
  {
    name: "BARMM",
    displayName: "Bangsamoro Autonomous Region in Muslim Mindanao",
    slug: "barmm",
    cities: [
      { name: "Cotabato City", slug: "cotabato-city" },
    ],
  },
];

export function getRegionBySlug(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function getCityBySlug(
  regionSlug: string,
  citySlug: string
): City | undefined {
  const region = getRegionBySlug(regionSlug);
  return region?.cities.find((c) => c.slug === citySlug);
}
```

- [ ] **Step 4: Create categories.ts**

```typescript
// src/lib/constants/categories.ts
export interface Category {
  name: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { name: "Sports Bar", slug: "sports-bar" },
  { name: "Cocktail Bar", slug: "cocktail-bar" },
  { name: "Rooftop Bar", slug: "rooftop-bar" },
  { name: "Night Club", slug: "night-club" },
  { name: "KTV / Karaoke Bar", slug: "ktv-karaoke-bar" },
  { name: "Beer Garden", slug: "beer-garden" },
  { name: "Lounge", slug: "lounge" },
  { name: "Pub", slug: "pub" },
  { name: "Wine Bar", slug: "wine-bar" },
  { name: "Beach Bar", slug: "beach-bar" },
  { name: "Live Music Bar", slug: "live-music-bar" },
  { name: "Speakeasy", slug: "speakeasy" },
  { name: "Hookah / Shisha Bar", slug: "hookah-shisha-bar" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
```

- [ ] **Step 5: Create tags.ts**

```typescript
// src/lib/constants/tags.ts
export const TAGS: string[] = [
  "24/7",
  "Pet Friendly",
  "Parking Available",
  "Wi-Fi Available",
  "Live Music",
  "Outdoor Seating",
  "LGBTQ+ Friendly",
  "Happy Hour",
  "Wheelchair Accessible",
  "Hookah / Shisha",
  "Dance Floor",
  "VIP Area",
  "Food Available",
  "Craft Beer",
  "Rooftop",
  "Family Friendly",
  "Student Discount",
  "Ladies Night",
  "Sports Screening",
  "Pool Table",
  "Darts",
  "Board Games",
];
```

- [ ] **Step 6: Create barrel export**

```typescript
// src/lib/constants/index.ts
export { REGIONS, getRegionBySlug, getCityBySlug } from "./regions";
export type { Region, City } from "./regions";
export { CATEGORIES, getCategoryBySlug } from "./categories";
export type { Category } from "./categories";
export { TAGS } from "./tags";
```

- [ ] **Step 7: Run tests**

```bash
npm run test:run -- tests/lib/constants.test.ts
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add region/city mapping, categories, and tags constants"
```

---

## Task 6: Zod Validation Schemas

**Files:**
- Create: `src/lib/validations.ts`
- Create: `tests/lib/validations.test.ts`

- [ ] **Step 1: Write failing tests for validation schemas**

```typescript
// tests/lib/validations.test.ts
import { describe, it, expect } from "vitest";
import {
  loginSchema,
  openHoursSchema,
  socialLinksSchema,
  menuItemSchema,
  eventSchema,
  createListingSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "admin@barhop.ph",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "admin@barhop.ph",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("openHoursSchema", () => {
  it("accepts valid open hours", () => {
    const result = openHoursSchema.safeParse({
      monday: { open: "17:00", close: "00:00" },
      tuesday: null,
      wednesday: { open: "17:00", close: "03:00" },
      thursday: { open: "00:00", close: "24:00" },
      friday: { open: "17:00", close: "03:00" },
      saturday: { open: "17:00", close: "03:00" },
      sunday: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time format", () => {
    const result = openHoursSchema.safeParse({
      monday: { open: "5pm", close: "midnight" },
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("socialLinksSchema", () => {
  it("accepts valid social links", () => {
    const result = socialLinksSchema.safeParse({
      facebook: "https://facebook.com/bar",
      instagram: "https://instagram.com/bar",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = socialLinksSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("menuItemSchema", () => {
  it("accepts menu item with all fields", () => {
    const result = menuItemSchema.safeParse({
      item: "San Miguel",
      price: "₱85",
      description: "330ml bottle",
      image_url: "https://cdn.barhop.ph/img.webp",
    });
    expect(result.success).toBe(true);
  });

  it("accepts menu item with required fields only", () => {
    const result = menuItemSchema.safeParse({
      item: "San Miguel",
      price: "₱85",
    });
    expect(result.success).toBe(true);
  });
});

describe("createListingSchema", () => {
  it("accepts minimal valid listing", () => {
    const result = createListingSchema.safeParse({
      name: "The Pool Bar",
      categories: ["Cocktail Bar"],
      region: "ncr",
      city: "makati",
      address: "123 Ayala Ave, Makati",
      latitude: 14.5547,
      longitude: 121.0244,
    });
    expect(result.success).toBe(true);
  });

  it("rejects listing without name", () => {
    const result = createListingSchema.safeParse({
      categories: ["Cocktail Bar"],
      region: "ncr",
      city: "makati",
      address: "123 Ayala Ave",
      latitude: 14.5547,
      longitude: 121.0244,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid latitude", () => {
    const result = createListingSchema.safeParse({
      name: "Test Bar",
      categories: ["Pub"],
      region: "ncr",
      city: "makati",
      address: "123 Ayala Ave",
      latitude: 200,
      longitude: 121.0244,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- tests/lib/validations.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validation schemas**

```typescript
// src/lib/validations.ts
import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Time format: HH:MM (00:00-24:00)
// Matches HH:MM from 00:00-23:59 plus exactly 24:00
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/);

const dayHoursSchema = z
  .object({
    open: timeSchema,
    close: timeSchema,
  })
  .nullable();

export const openHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const socialLinksSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  x: z.string().url().optional(),
});

export const menuItemSchema = z.object({
  item: z.string().min(1),
  price: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  recurrence: z.string().optional(),
  description: z.string().optional(),
});

export const createListingSchema = z.object({
  name: z.string().min(1).max(200),
  categories: z.array(z.string()).min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  openHours: openHoursSchema.optional(),
  menu: z.array(menuItemSchema).optional(),
  events: z.array(eventSchema).optional(),
  isPromoted: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  videoUrl: z.string().url().optional().nullable(),
  socialLinks: socialLinksSchema.optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  googlePlaceId: z.string().optional(),
});

export const updateListingSchema = createListingSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type OpenHours = z.infer<typeof openHoursSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type EventItem = z.infer<typeof eventSchema>;
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/lib/validations.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Zod validation schemas for all entities"
```

---

## Task 7: Auth System (JWT + Cookies + Rate Limiting)

**Files:**
- Create: `src/lib/auth-utils.ts` (pure functions — no next/headers dependency, testable)
- Create: `src/lib/auth.ts` (cookie helpers — depends on next/headers, not unit tested)
- Create: `tests/lib/auth-utils.test.ts`

The auth code is split into two files:
- `auth-utils.ts`: Pure functions (signToken, verifyToken, hashPassword, verifyPassword) that can be tested in Vitest without mocking Next.js internals.
- `auth.ts`: Cookie helpers (setSessionCookie, clearSessionCookie, getSessionFromCookie) that depend on `next/headers` and are tested via integration/manual testing.

- [ ] **Step 1: Write failing tests for auth utilities**

```typescript
// tests/lib/auth-utils.test.ts
import { describe, it, expect } from "vitest";
import { signToken, verifyToken, hashPassword, verifyPassword } from "@/lib/auth-utils";

describe("JWT", () => {
  it("signs and verifies a token", async () => {
    const payload = { userId: "user-1", role: "super_admin" as const };
    const token = await signToken(payload);
    expect(typeof token).toBe("string");

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified!.userId).toBe("user-1");
    expect(verified!.role).toBe("super_admin");
  });

  it("rejects an invalid token", async () => {
    const result = await verifyToken("invalid-token");
    expect(result).toBeNull();
  });
});

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hashed = await hashPassword("mypassword");
    expect(hashed).not.toBe("mypassword");

    const isValid = await verifyPassword("mypassword", hashed);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hashed = await hashPassword("mypassword");
    const isValid = await verifyPassword("wrongpassword", hashed);
    expect(isValid).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- tests/lib/auth-utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement auth-utils.ts (pure functions, no next/headers)**

```typescript
// src/lib/auth-utils.ts
import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-at-least-32-characters-long-for-testing-only"
);

export interface TokenPayload {
  userId: string;
  role: "super_admin" | "admin";
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
```

- [ ] **Step 4: Implement auth.ts (cookie helpers, depends on next/headers)**

```typescript
// src/lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken, type TokenPayload } from "./auth-utils";

const COOKIE_NAME = "barhop-session";

export type { TokenPayload } from "./auth-utils";
export { signToken, verifyToken, hashPassword, verifyPassword } from "./auth-utils";

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromCookie(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- tests/lib/auth-utils.test.ts
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth utilities (sign, verify, password hashing, cookies)"
```

---

## Task 8: Auth API Routes (Login, Logout, Me)

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create health check endpoint**

```typescript
// src/app/api/health/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 503 }
    );
  }
}
```

- [ ] **Step 2: Create login endpoint with rate limiting**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or password format" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Check rate limiting
  const isLockedOut =
    user.failedLoginCount >= MAX_FAILED_ATTEMPTS &&
    user.lastFailedLoginAt &&
    Date.now() - user.lastFailedLoginAt.getTime() < LOCKOUT_WINDOW_MS;

  if (isLockedOut) {
    return NextResponse.json(
      { error: "Account temporarily locked. Try again later." },
      { status: 429 }
    );
  }

  // Reset counter if lockout window has expired
  if (
    user.failedLoginCount >= MAX_FAILED_ATTEMPTS &&
    user.lastFailedLoginAt &&
    Date.now() - user.lastFailedLoginAt.getTime() >= LOCKOUT_WINDOW_MS
  ) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastFailedLoginAt: null },
    });
    user.failedLoginCount = 0;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    // Increment failed login count
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: {
          increment: 1,
        },
        lastFailedLoginAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Reset failed login count on success
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lastFailedLoginAt: null,
    },
  });

  const token = await signToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
```

- [ ] **Step 3: Create logout endpoint**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create me endpoint**

```typescript
// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
```

- [ ] **Step 5: Test manually (dev server)**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}` (or error if DB not running — that's fine, we'll test after seeding).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add auth API routes (login with rate limiting, logout, me, health)"
```

---

## Task 9: Super Admin Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Create seed script**

```typescript
// prisma/seed.ts
import { db } from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in environment variables"
    );
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "super_admin",
      name: "Super Admin",
    },
  });

  console.log(`Super admin created: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
```

Note: The seed script imports `db` from `src/lib/db.ts` which uses the Neon adapter with the `ws` polyfill. This works for both local Docker PostgreSQL and remote Neon connections.

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Also add `tsx` as a dev dependency:
```bash
npm install -D tsx
```

- [ ] **Step 3: Run the seed**

```bash
npx prisma db seed
```

Expected: `Super admin created: admin@barhop.ph (cuid...)`

- [ ] **Step 4: Test login with seeded account**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barhop.ph","password":"admin123"}'
```

Expected: `{"user":{"id":"...","email":"admin@barhop.ph","name":"Super Admin","role":"super_admin"}}`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Super Admin seed script"
```

---

## Task 10: Admin Layout & Login Page

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create admin login page**

```tsx
// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display-sm text-center mb-8">
          <span className="text-neon-purple">Bar</span>
          <span className="text-neon-pink">Hop</span>
          {" "}Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            error={error || undefined}
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin layout with auth guard**

```tsx
// src/app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}

// NOTE for Plan 2: This layout is a pass-through. Plan 2 should introduce
// a sub-layout under /admin/(authenticated)/ with a shared auth guard
// so every admin page is protected automatically, not per-page.
```

- [ ] **Step 3: Create admin dashboard placeholder with auth guard**

```tsx
// src/app/admin/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-display-sm mb-4">Dashboard</h1>
      <p className="text-content-secondary">
        Welcome back. Dashboard content will be built in Plan 2.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Test login flow manually**

```bash
npm run dev
```

1. Open http://localhost:3000/admin/login — see login form
2. Enter admin@barhop.ph / admin123 — redirects to /admin/dashboard
3. Open http://localhost:3000/admin/dashboard directly without cookie — redirects to login

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin login page and dashboard placeholder with auth guard"
```

---

## Task 11: Dockerfile & Docker Compose (Local Dev)

**Files:**
- Create: `Dockerfile`
- Modify: `docker-compose.yml` (already exists from Task 4, keep as-is)

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
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

- [ ] **Step 2: Create .dockerignore**

```
node_modules
.next
.env.local
.env.production.local
.git
```

- [ ] **Step 3: Verify Docker build works**

```bash
docker build -t barhop-ph .
```

Expected: Build succeeds. (We won't run it since it needs env vars and a database.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Dockerfile for future ECS migration"
```

---

## Task 12: S3 Client & Presign Helpers

**Files:**
- Create: `src/lib/s3.ts`

- [ ] **Step 1: Create S3 utility**

```typescript
// src/lib/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || "barhop-ph-images";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

export async function createPresignedUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const ext = filename.split(".").pop() || "jpg";
  const s3Key = `uploads/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

  return { uploadUrl, s3Key };
}

export function getCdnUrl(s3Key: string): string {
  return `${CDN_URL}/${s3Key}`;
}

export function getVariantKey(baseKey: string, variant: string): string {
  const parts = baseKey.split(".");
  parts.pop(); // remove extension
  return `${parts.join(".")}-${variant}.webp`;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add S3 presigned URL utility"
```

---

## Task 13: First Vercel Deployment

**Files:**
- None new — this is a deployment step

- [ ] **Step 1: Create GitHub repository**

```bash
cd /opt/barhop-ph
gh repo create barhop-ph --private --source=. --push
```

(If `gh` CLI is not configured, create the repo manually on GitHub and push.)

- [ ] **Step 2: Connect to Vercel**

Go to https://vercel.com/new, import the GitHub repository. Vercel auto-detects Next.js.

- [ ] **Step 3: Set environment variables in Vercel**

Add all variables from `.env.example` to Vercel's environment variables settings. For `DATABASE_URL`, use the Neon PostgreSQL connection string.

- [ ] **Step 4: Deploy and verify**

Push to `main` triggers auto-deploy. Verify:
- https://your-project.vercel.app/ — shows the BarHop PH placeholder page
- https://your-project.vercel.app/api/health — returns `{"status":"ok"}`
- https://your-project.vercel.app/admin/login — shows login form

- [ ] **Step 5: Run Prisma migration on Neon**

```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
DATABASE_URL="your-neon-connection-string" npx prisma db seed
```

- [ ] **Step 6: Verify login works on production**

Log in at https://your-project.vercel.app/admin/login with the seeded Super Admin credentials.

- [ ] **Step 7: Commit any deployment config changes**

```bash
git add -A
git commit -m "chore: first Vercel deployment"
```

---

## Task 14: GitHub Actions CI Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  check:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

      - name: Test
        run: npm run test:run
```

- [ ] **Step 2: Commit and push**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for lint, type check, and tests"
git push
```

Expected: CI runs on push. All checks pass.

- [ ] **Step 3: Create develop branch**

```bash
git checkout -b develop
git push -u origin develop
git checkout main
```

This enables the CI/CD pipeline from the spec: pushes to `develop` trigger Vercel preview deployments.

---

## Summary

After completing all 14 tasks, you will have:

- Next.js 15 App Router project with TypeScript
- Dark nightlife design system (Tailwind tokens, shared UI components)
- Prisma schema with User + Listing models, PostGIS geography column, full-text search index
- Region/city/category/tag constants
- Zod validation schemas for all entities
- Custom JWT auth (sign, verify, cookies, rate limiting)
- Auth API routes (login, logout, me, health)
- Super Admin seed script
- Admin login page + dashboard placeholder
- Dockerfile for future ECS migration
- S3 presigned URL utility
- Live Vercel deployment
- GitHub Actions CI pipeline

**Next:** Plan 2 (Admin CRUD & Image Upload) builds on this foundation.
