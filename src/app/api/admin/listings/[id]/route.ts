import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { updateListingSchema } from "@/lib/validations";

const ALLOWED_HTML_TAGS = ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li"];
const ALLOWED_HTML_ATTRIBUTES = { a: ["href"] };

function sanitizeDescription(raw: string): string {
  return sanitizeHtml(raw, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: ALLOWED_HTML_ATTRIBUTES,
  });
}

// Fields that admins (non-super_admin) are not allowed to modify.
// "slug" is intentionally absent — it is auto-generated and never accepted via the API,
// so it cannot appear in parsed.data (updateListingSchema has no slug field).
const ADMIN_RESTRICTED_FIELDS = [
  "name",
  "categories",
  "region",
  "city",
  "address",
  "latitude",
  "longitude",
  "isPromoted",
  "ownerId",
  "status",
] as const;

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/listings/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth("any");
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { id } = await params;

  const listing = await db.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Admins may only view listings they own
  if (session.role === "admin" && listing.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ listing });
}

// PUT /api/admin/listings/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth("any");
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { id } = await params;

  const existing = await db.listing.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Admins may only edit their own listings
  if (session.role === "admin" && existing.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = { ...parsed.data };

  // Strip fields that non-super_admin users cannot modify
  if (session.role === "admin") {
    for (const field of ADMIN_RESTRICTED_FIELDS) {
      delete (data as Record<string, unknown>)[field];
    }
  }

  // Sanitize description if present
  if (data.description) {
    data.description = sanitizeDescription(data.description);
  }

  const updated = await db.listing.update({
    where: { id },
    data: {
      ...data,
      updatedById: session.userId,
    },
  });

  return NextResponse.json({ listing: updated });
}

// DELETE /api/admin/listings/:id — soft delete (archive)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth("super_admin");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const existing = await db.listing.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await db.listing.update({
    where: { id },
    data: { status: "archived" },
  });

  return NextResponse.json({ success: true });
}
