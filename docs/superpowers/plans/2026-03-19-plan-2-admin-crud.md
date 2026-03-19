# Plan 2: Admin CRUD & Image Upload

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete admin interface — listing CRUD, user management, image uploads, and admin dashboard — so the Super Admin can manage all content.

**Architecture:** Next.js App Router with server components for data fetching, client components for forms. Route group `/admin/(authenticated)/` with shared auth guard layout. API routes under `/api/admin/` with role-based middleware. Presigned S3 uploads for images.

**Tech Stack:** Next.js 15, Prisma, Zod, S3 presigned URLs, sanitize-html, React (forms with useState)

**Spec:** `docs/superpowers/specs/2026-03-19-prd-review-design.md`
**PRD:** `docs/PRD.md`
**Depends on:** Plan 1 (Foundation) — complete

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                          # (existing) Outer admin layout
│   │   ├── login/page.tsx                      # (existing) Login page
│   │   └── (authenticated)/                    # Route group with auth guard
│   │       ├── layout.tsx                      # Auth guard + sidebar nav
│   │       ├── dashboard/page.tsx              # Dashboard with stats
│   │       ├── listings/
│   │       │   ├── page.tsx                    # Listings table
│   │       │   ├── new/page.tsx                # Create listing form
│   │       │   └── [id]/
│   │       │       └── edit/page.tsx           # Edit listing form
│   │       └── users/
│   │           ├── page.tsx                    # Users table (Super Admin only)
│   │           ├── new/page.tsx                # Create user form
│   │           └── [id]/
│   │               └── edit/page.tsx           # Edit user form
│   └── api/
│       └── admin/
│           ├── listings/
│           │   ├── route.ts                    # GET (list), POST (create)
│           │   └── [id]/route.ts               # GET, PUT, DELETE
│           ├── users/
│           │   ├── route.ts                    # GET (list), POST (create)
│           │   └── [id]/route.ts               # GET, PUT, DELETE
│           └── uploads/
│               ├── presign/route.ts            # POST presigned URL
│               └── complete/route.ts           # POST process image
├── lib/
│   ├── admin-auth.ts                           # Auth middleware for API routes
│   └── slug.ts                                 # Slug generation utility
├── components/
│   ├── ui/
│   │   ├── textarea.tsx                        # New: Textarea component
│   │   ├── select.tsx                          # New: Select dropdown
│   │   ├── toggle.tsx                          # New: Toggle switch
│   │   └── index.ts                            # Updated barrel export
│   └── admin/
│       ├── sidebar.tsx                         # Admin sidebar navigation
│       ├── listing-form.tsx                    # Listing create/edit form
│       ├── user-form.tsx                       # User create/edit form
│       ├── image-upload.tsx                    # S3 presigned upload component
│       ├── open-hours-editor.tsx               # Weekly hours grid editor
│       ├── menu-editor.tsx                     # Add/remove menu items
│       ├── events-editor.tsx                   # Add/remove events
│       └── multi-select.tsx                    # Multi-select with badges
```

---

## Task 1: Auth Middleware for Admin API Routes

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/lib/slug.ts`

- [ ] **Step 1: Create admin auth middleware**

```typescript
// src/lib/admin-auth.ts
import { NextResponse } from "next/server";
import { verifyToken, type TokenPayload } from "./auth-utils";
import { cookies } from "next/headers";

type RoleRequirement = "super_admin" | "admin" | "any";

export async function requireAuth(
  role: RoleRequirement = "any"
): Promise<{ session: TokenPayload } | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("barhop-session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (role === "super_admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}
```

Note: No `NextRequest` parameter — `cookies()` from `next/headers` works in route handlers without needing the request object. Callers use: `const auth = await requireAuth("super_admin"); if (auth instanceof NextResponse) return auth; const { session } = auth;`

- [ ] **Step 2: Create slug utility**

```typescript
// src/lib/slug.ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-auth.ts src/lib/slug.ts && git commit -m "feat: add admin auth middleware and slug utility"
```

**Note for all commits in this plan:** Use targeted `git add` with specific paths. Never use `git add -A` to avoid accidentally staging `.env` files. Verify with `git status` before committing.

---

## Task 2: Additional UI Components

**Files:**
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/toggle.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Create Textarea component**

Styled like Input but multi-line. Props: label, error, rows (default 4).

- [ ] **Step 2: Create Select component**

Styled dropdown. Props: label, error, options (array of { value, label }), placeholder.

- [ ] **Step 3: Create Toggle switch component**

Boolean toggle. Props: label, checked, onChange, disabled.

- [ ] **Step 4: Update barrel export**

Add Textarea, Select, Toggle to `src/components/ui/index.ts`.

- [ ] **Step 5: Verify build and commit**

```bash
npm run build && git add -A && git commit -m "feat: add Textarea, Select, Toggle UI components"
```

---

## Task 3: Admin Sidebar & Authenticated Layout

**Files:**
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/app/admin/(authenticated)/layout.tsx`
- Move: `src/app/admin/dashboard/page.tsx` → `src/app/admin/(authenticated)/dashboard/page.tsx`

- [ ] **Step 1: Create sidebar component**

Client component with nav links: Dashboard, Listings, Users (Super Admin only), Analytics (external Umami link). Show current user name/role at bottom. Logout button. Highlight active route. Hamburger toggle on mobile.

- [ ] **Step 2: Create authenticated layout**

Server component that checks `getSessionFromCookie()`. If no session, redirect to `/admin/login`. Pass session data to sidebar. Wraps children with sidebar + main content area.

- [ ] **Step 3: Move dashboard page**

Move existing dashboard to the `(authenticated)` route group. Update it to show:
- Total listing count (all / promoted / free)
- Listing count by status (published / draft / archived)
- Quick links: "Create Listing", "Manage Users"

Query these counts from Prisma using `db.listing.count()` with filters.

- [ ] **Step 4: Remove old dashboard page and update admin layout**

Delete old `src/app/admin/dashboard/page.tsx`. Clean up `src/app/admin/layout.tsx` to be just a pass-through (it already is).

- [ ] **Step 5: Verify build and commit**

```bash
npm run build && git add -A && git commit -m "feat: add admin sidebar, authenticated layout, dashboard with stats"
```

---

## Task 4: Listings API — CRUD Endpoints

**Files:**
- Create: `src/app/api/admin/listings/route.ts` (GET list, POST create)
- Create: `src/app/api/admin/listings/[id]/route.ts` (GET, PUT, DELETE)

- [ ] **Step 1: Create listings list + create endpoint**

`GET /api/admin/listings`:
- Super Admin: all listings. Admin: own listings only (where `ownerId === session.userId`).
- Support query params: `?status=published&search=pool&page=1&limit=20`
- Return: `{ listings: [...], total: number, page: number, totalPages: number }`

`POST /api/admin/listings`:
- Super Admin only. (Design decision: listing creation is Super Admin only per PRD Section 7.2.2. Admins can only view and edit their own pre-assigned listings. Super Admin creates listings and assigns ownership via `ownerId`.)
- Validate body with `createListingSchema`. Accept optional `ownerId` field (string, nullable) to assign a business owner.
- Auto-generate slug from name using `generateSlug()`.
- Handle slug collision: if `(city, slug)` exists, append `-2`, `-3`, etc.
- Sanitize description HTML with `sanitize-html` (already installed from Plan 1).
- Import: `import { db } from "@/lib/db"`.
- Return created listing.

- [ ] **Step 2: Create single listing endpoint**

`GET /api/admin/listings/:id`:
- Auth required. Admin can only view own listings.
- Return full listing.

`PUT /api/admin/listings/:id`:
- Auth required. Admin can only edit own listings.
- Admin edit restrictions: **server-side**, before calling Prisma update, delete restricted keys (`name`, `slug`, `categories`, `region`, `city`, `address`, `latitude`, `longitude`, `isPromoted`, `ownerId`, `status`) from the validated body if `session.role === "admin"`. Do not rely on the client to omit these.
- Validate with `updateListingSchema`.
- Sanitize description.
- Set `updatedById` to current user.

`DELETE /api/admin/listings/:id`:
- Super Admin only.
- Soft delete by setting status to `archived`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add listings CRUD API endpoints"
```

---

## Task 5: Users API — CRUD Endpoints

**Files:**
- Create: `src/app/api/admin/users/route.ts` (GET, POST)
- Create: `src/app/api/admin/users/[id]/route.ts` (GET, PUT, DELETE)

- [ ] **Step 1: Create users list + create endpoint**

All users endpoints are Super Admin only.

`GET /api/admin/users`:
- Return all users with listing count.

`POST /api/admin/users`:
- Validate: name, email, password (min 6), role.
- Hash password with bcryptjs.
- Return created user (without passwordHash).

- [ ] **Step 2: Create single user endpoint**

`GET /api/admin/users/:id`:
- Return user with assigned listings.

`PUT /api/admin/users/:id`:
- Update name, email, role. Optional password reset (if provided, hash it).
- Cannot demote the last super_admin.

`DELETE /api/admin/users/:id`:
- Cannot delete self or last super_admin.
- Set ownerId to null on orphaned listings.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add users CRUD API endpoints (Super Admin only)"
```

---

## Task 6: Image Upload API (Presigned S3)

**Files:**
- Create: `src/app/api/admin/uploads/presign/route.ts`
- Create: `src/app/api/admin/uploads/complete/route.ts`

- [ ] **Step 1: Create presign endpoint**

`POST /api/admin/uploads/presign`:
- Auth required (any admin).
- Validate: `{ filename: string, contentType: string }`.
- Reject if contentType not image/* or file extension not jpg/jpeg/png/webp/gif.
- Call `createPresignedUploadUrl()` from s3.ts.
- Return `{ uploadUrl, s3Key }`.

- [ ] **Step 2: Create complete endpoint**

`POST /api/admin/uploads/complete`:
- Auth required.
- Validate: `{ s3Key: string }`.
- For MVP: just return the CDN URLs for variants (actual Sharp processing deferred to when we have a processing pipeline — for now, serve the original).
- Return `{ url: getCdnUrl(s3Key) }`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add image upload API with presigned S3 URLs"
```

---

## Task 7: Image Upload Component

**Files:**
- Create: `src/components/admin/image-upload.tsx`

- [ ] **Step 1: Create image upload component**

Client component. Props: `onUpload(url: string)`, `currentImage?: string`, `label?: string`.

Flow:
1. File input with drag-and-drop zone (dashed border).
2. Client-side validation: max 5MB, image types only.
3. Request presigned URL from `/api/admin/uploads/presign`.
4. Upload directly to S3 via presigned URL (PUT request).
5. Call `/api/admin/uploads/complete` with s3Key.
6. Call `onUpload(url)` with the CDN URL.
7. Show preview of uploaded image.

States: idle, uploading (progress bar), complete (preview), error.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add image upload component with S3 presigned URLs"
```

---

## Task 8: Form Sub-Components

**Files:**
- Create: `src/components/admin/multi-select.tsx`
- Create: `src/components/admin/open-hours-editor.tsx`
- Create: `src/components/admin/menu-editor.tsx`
- Create: `src/components/admin/events-editor.tsx`

- [ ] **Step 1: Create multi-select component**

For categories and tags. Props: `options: string[]`, `selected: string[]`, `onChange(selected: string[])`, `label`. Shows selected items as badges with X to remove. Dropdown with checkboxes to add.

- [ ] **Step 2: Create open hours editor**

7-row grid for Mon-Sun. Each row: day name, open time input (HH:MM), close time input (HH:MM), "Closed" toggle. When toggled closed, inputs are disabled and set to null. Props: `value: OpenHours`, `onChange(value: OpenHours)`.

- [ ] **Step 3: Create menu editor**

Dynamic rows for menu items. Each row: item name, price (with ₱ prefix), description, remove button. "Add Item" button at bottom. Props: `value: MenuItem[]`, `onChange(value: MenuItem[])`.

- [ ] **Step 4: Create events editor**

Dynamic cards for events. Each card: title, date, recurrence (dropdown: One-time, Weekly, Monthly), description, remove button. "Add Event" button. Props: `value: EventItem[]`, `onChange(value: EventItem[])`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add form sub-components (multi-select, hours, menu, events)"
```

---

## Task 9: Listing Form Component

**Files:**
- Create: `src/components/admin/listing-form.tsx`

- [ ] **Step 1: Create listing form**

Large client component ("use client") that combines all sub-components into a full listing form. Sections:

1. **Basic Info**: Name input, categories multi-select, status select, promoted toggle
2. **Location**: Region select, city select (filtered by region), address input, lat/lng inputs
3. **Media**: Primary image upload (ImageUpload component), gallery uploads (up to 10), video URL input
4. **Description**: Textarea for HTML description
5. **Tags**: Multi-select with predefined tags from constants
6. **Open Hours**: OpenHoursEditor
7. **Menu**: MenuEditor
8. **Events**: EventsEditor
9. **Contact & Social**: Phone, WhatsApp, email inputs. Social links (Facebook, Instagram, TikTok, X URL inputs).

Props: `listing?: Listing` (for edit mode), `isAdmin: boolean` (to hide restricted fields for non-super-admin).

On submit: POST to `/api/admin/listings` (create) or PUT to `/api/admin/listings/:id` (edit).

Show "Save as Draft" (secondary button) and "Publish" (primary button).

**Error handling pattern:** On API error, display the error message above the submit buttons using `useState<string | null>`. On success, redirect to the listings table via `router.push("/admin/listings")`. Use try/catch around fetch calls.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add listing form component with all sections"
```

---

## Task 10: Listing Pages (Table, Create, Edit)

**Files:**
- Create: `src/app/admin/(authenticated)/listings/page.tsx`
- Create: `src/app/admin/(authenticated)/listings/new/page.tsx`
- Create: `src/app/admin/(authenticated)/listings/[id]/edit/page.tsx`

- [ ] **Step 1: Create listings table page**

Server component. Fetches listings from DB via Prisma (not API). Shows:
- Search bar, status filter, promoted filter
- Table: thumbnail (40x40), name, city, status badge, promoted badge, actions (Edit, Delete)
- Pagination
- "Create Listing" button (Super Admin only)

- [ ] **Step 2: Create new listing page**

Server component (Super Admin only guard). Renders `<ListingForm />`.

- [ ] **Step 3: Create edit listing page**

Server component. Fetches listing by ID. Admin can only edit own listings. Renders `<ListingForm listing={listing} isAdmin={session.role === "admin"} />`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add admin listings pages (table, create, edit)"
```

---

## Task 11: User Form & Pages

**Files:**
- Create: `src/components/admin/user-form.tsx`
- Create: `src/app/admin/(authenticated)/users/page.tsx`
- Create: `src/app/admin/(authenticated)/users/new/page.tsx`
- Create: `src/app/admin/(authenticated)/users/[id]/edit/page.tsx`

- [ ] **Step 1: Create user form component**

Client component. Fields: name, email, password (with show/hide toggle), role select (Admin / Super Admin). On edit: password is optional (only updates if provided).

- [ ] **Step 2: Create users table page**

Super Admin only. Table: name, email, role badge, listing count, created date, actions (Edit, Delete).

- [ ] **Step 3: Create new user page**

Super Admin only. Renders `<UserForm />`.

- [ ] **Step 4: Create edit user page**

Super Admin only. Fetches user by ID. Renders `<UserForm user={user} />`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin user management pages"
```

---

## Task 12: Build Verification & Push

**Files:** None new

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Run lint and type check**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 4: Push to remote**

```bash
git push origin main
```

---

## Summary

After completing all 12 tasks, the admin side will have:

- Auth-guarded admin layout with sidebar navigation
- Dashboard with listing count stats
- Full listing CRUD (create, read, update, archive)
- Slug auto-generation with collision handling
- Admin edit restrictions (content fields only, not identity/placement)
- Image upload via S3 presigned URLs
- Rich form with sub-components (hours editor, menu editor, events editor, multi-select)
- User management (Super Admin: create, edit, delete admin accounts)
- Description HTML sanitization

**Next:** Plan 3 (Customer UI & Search) builds the public-facing pages.
