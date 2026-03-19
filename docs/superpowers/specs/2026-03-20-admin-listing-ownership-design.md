# Admin–Listing Ownership Management

## Overview

Super admins need the ability to assign listings to admin users (business owners) and manage those assignments. Admin users can only see and edit listings they own. This feature adds ownership controls in two places: the listing form and the user edit page, plus pagination for the admin listings and users pages.

## Current State

The database schema already supports ownership via `Listing.ownerId → User.id` (one-to-many). The API enforces scoping — admin users only see/edit their own listings. What's missing is the UI for super admins to manage assignments, and pagination on admin list pages.

Note: The Prisma schema has `onDelete: SetNull` on the owner relation, so deleting a user automatically nullifies `ownerId` on their listings. No explicit reassignment logic is needed for user deletion.

## Changes

### 1. Listing Form — Owner Dropdown

**Location:** `src/components/admin/listing-form.tsx`, Basic Info section (super admin only)

Add a `Select` dropdown labeled "Owner" with options:
- "Unassigned" (value: empty string, maps to `ownerId = null`)
- All users with `role = "admin"`, formatted as "Name (email)"

The listing form needs to receive the list of admin users as a prop. The parent pages (create and edit) will fetch this list server-side and pass it down. The `adminUsers` prop being present implies the viewer is a super admin (complementary to the existing `isAdmin` prop which means the viewer IS an admin).

**Data flow:**
- Create page (`/admin/listings/new/page.tsx`): query `db.user.findMany({ where: { role: "admin" } })` and pass to `ListingForm`
- Edit page (`/admin/listings/[id]/edit/page.tsx`): same query, pass to `ListingForm`
- Form adds `ownerId` state (initialized from `listing?.ownerId ?? ""`) and includes it in the submit payload
- On submit, `ownerId` is sent as part of the JSON body (empty string → `null` on the API side)

### 2. API Fixes — Owner Validation

**Critical:** The existing API has validation gaps that this feature will exercise more heavily.

#### POST `/api/admin/listings` (create)
- **Current:** Checks that `ownerId` references an existing user, but does NOT check that the user has `role: "admin"`.
- **Fix:** Add a role check — reject if the referenced user is not an admin. This prevents accidentally assigning listings to super admin accounts.

#### PUT `/api/admin/listings/[id]` (update)
- **Current:** For super admins, `ownerId` passes through without any existence or role validation. Additionally, `ownerId` is not part of `updateListingSchema`, so Zod strips it from `parsed.data` — it never reaches the database update even for super admins.
- **Fix:** Extract `ownerId` from the raw request body before Zod validation (same pattern as POST handler). When `ownerId` is present, validate that the user exists and has `role: "admin"`. Include validated `ownerId` in the update data.

### 3. Admin Listings Page — Pagination

**Location:** `src/app/admin/(authenticated)/listings/page.tsx`

The server component currently queries the DB directly without pagination (the API route already supports pagination but the page bypasses it). Change to paginated server-side query:

- Read `page` from URL search params (default: 1)
- Page size: 20
- Use Prisma `skip` / `take` + `count` for pagination
- Pass `total`, `page`, `totalPages` to the client component
- Client component renders pagination controls: Previous / Next buttons + "Showing X–Y of Z"
- Pagination links use URL search params (`?page=2`) for bookmarkability

### 4. Admin Users Page — Pagination

**Location:** `src/app/admin/(authenticated)/users/page.tsx`

Same pattern as listings:

- Read `page` from URL search params (default: 1)
- Page size: 20
- Prisma `skip` / `take` + `count`
- Pagination controls at the bottom

### 5. User Edit Page — Manage Listings Section

**Location:** `src/app/admin/(authenticated)/users/[id]/edit/page.tsx`

Only shown when the user being edited has `role = "admin"`. Two sub-sections:

#### 5a. Assigned Listings Table

Displays listings currently owned by this admin user:
- Columns: Name, City, Status
- Each row has a "Remove" button (sets `ownerId = null` via PUT `/api/admin/listings/[id]`)
- Paginated via URL search params (same pattern, 20 per page)

**Refresh strategy:** After a remove or assign action, call `router.refresh()` to re-run the server component and get fresh data. This keeps the assigned listings table as a server-rendered component while allowing client-side mutations.

#### 5b. Assign Listing Search

A searchable text input (client component) for finding and assigning listings:
- On typing (debounced ~300ms), queries `GET /api/admin/listings?search=<term>&limit=10`
- Since the caller is a super admin, the API returns all listings (not scoped by owner)
- Dropdown shows results: listing name, city, current owner name (if any)
- Selecting an unowned listing assigns it immediately (PUT with `ownerId`)
- Selecting a listing owned by another admin shows a confirmation warning: "This listing is currently assigned to [Owner Name]. Reassign?" — on confirm, proceeds with PUT
- After assignment, calls `router.refresh()` to update the assigned listings table

### 6. API Change — Include Owner in Listings Response

**Location:** `src/app/api/admin/listings/route.ts` (GET handler)

Add `owner: { select: { id: true, name: true } }` to the Prisma select. This lets the assign-listing search dropdown display the current owner name. Minimal change, no new endpoints needed.

## Components

### New Components
- **`Pagination`** — Shared pagination UI (Previous/Next buttons + page info). Reused across listings page, users page, and assigned listings table.
- **`ListingAssigner`** — Client component for the search + assign flow on the user edit page. Handles debounced search, dropdown, reassignment confirmation, and `router.refresh()` after mutation.
- **`AssignedListingsTable`** — Client component wrapper around server-rendered listing rows, with remove buttons that call the API and then `router.refresh()`.

### Modified Components
- **`ListingForm`** — Add optional `adminUsers` prop (array of `{ id, name, email }`) + `ownerId` state + Owner dropdown (shown when `adminUsers` is provided, i.e., super admin view)
- **`ListingsClient`** — Accept and render `Pagination` component with pagination data

## Edge Cases

- **Role change:** If a user's role changes from admin to super_admin while they own listings, those listings remain assigned. The owner dropdown only shows admin-role users, so they won't appear in future assignment UIs. This is acceptable — super admins can clear ownership via the listing form.
- **Concurrent reassignment:** Two super admins reassigning the same listing simultaneously — last write wins. Acceptable for this scale.

## Data Flow Summary

```
Super Admin creates/edits listing
  → ListingForm shows Owner dropdown (admin users list)
  → Submit includes ownerId
  → API validates ownerId references an admin-role user
  → API saves ownerId on listing

Super Admin edits user (admin role)
  → Page shows AssignedListingsTable (user's listings)
  → Page shows ListingAssigner (search all listings)
  → Assign: PUT /api/admin/listings/[id] with ownerId = user.id
  → Remove: PUT /api/admin/listings/[id] with ownerId = null
  → Both trigger router.refresh() to update the table

Admin logs in
  → Listings page filtered to ownerId = their userId
  → Can only edit listings they own
```

## No Migration Needed

The `ownerId` foreign key and `ListingOwner` relation already exist in the Prisma schema. All changes are UI, API validation hardening, and minor API response shape.
