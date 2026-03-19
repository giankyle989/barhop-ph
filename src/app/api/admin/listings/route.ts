import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { createListingSchema } from "@/lib/validations";

const ALLOWED_HTML_TAGS = ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li"];
const ALLOWED_HTML_ATTRIBUTES = { a: ["href"] };

function sanitizeDescription(raw: string): string {
  return sanitizeHtml(raw, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: ALLOWED_HTML_ATTRIBUTES,
  });
}

/** Strip all HTML tags from plain text fields (name, address, phone, etc.) */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/**
 * Resolve a unique slug for a given city. Tries `base`, then `base-2`, `base-3`, …
 */
async function resolveUniqueSlug(city: string, base: string): Promise<string> {
  const existing = await db.listing.findFirst({ where: { city, slug: base } });
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const candidate = `${base}-${counter}`;
    const collision = await db.listing.findFirst({ where: { city, slug: candidate } });
    if (!collision) return candidate;
    counter++;
  }
}

// GET /api/admin/listings
export async function GET(request: NextRequest) {
  const auth = await requireAuth("any");
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  // Build where clause — admins are scoped to their own listings
  const where: Prisma.ListingWhereInput = {};

  if (session.role === "admin") {
    where.ownerId = session.userId;
  }

  if (status) {
    const validStatuses = ["draft", "published", "archived"] as const;
    if (validStatuses.includes(status as (typeof validStatuses)[number])) {
      where.status = status as (typeof validStatuses)[number];
    }
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        status: true,
        isPromoted: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/admin/listings
export async function POST(request: NextRequest) {
  const auth = await requireAuth("super_admin");
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  // Extract ownerId before schema validation (it's not in createListingSchema)
  const rawBody = body as Record<string, unknown>;
  const ownerId = typeof rawBody.ownerId === "string" ? rawBody.ownerId : undefined;

  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, city, description, address, phone, whatsapp, email, ...rest } = parsed.data;

  // If ownerId was supplied, verify the referenced user exists and is an admin role
  if (ownerId) {
    const owner = await db.user.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) {
      return NextResponse.json({ error: "ownerId references a non-existent user" }, { status: 422 });
    }
  }

  // Strip HTML from plain text fields
  const cleanName = stripHtml(name);
  const cleanAddress = stripHtml(address);
  const baseSlug = generateSlug(cleanName);
  const slug = await resolveUniqueSlug(city, baseSlug);

  const cleanDescription = description ? sanitizeDescription(description) : undefined;

  const listing = await db.listing.create({
    data: {
      name: cleanName,
      slug,
      city,
      address: cleanAddress,
      description: cleanDescription,
      phone: phone ? stripHtml(phone) : undefined,
      whatsapp: whatsapp ? stripHtml(whatsapp) : undefined,
      email: email ? stripHtml(email) : undefined,
      ...rest,
      ownerId: ownerId ?? null,
      updatedById: session.userId,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
