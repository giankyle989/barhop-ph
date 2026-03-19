import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { REGIONS, CATEGORIES, getCategoryBySlug, getRegionBySlug } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Zod validation schema for query params
// ---------------------------------------------------------------------------

const VALID_REGION_SLUGS = REGIONS.map((r) => r.slug) as [string, ...string[]];
// Collect every unique city slug across all regions (some slugs appear in multiple regions)
const ALL_CITY_SLUGS = [...new Set(REGIONS.flatMap((r) => r.cities.map((c) => c.slug)))] as [
  string,
  ...string[],
];
const VALID_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const querySchema = z.object({
  // search
  q: z.string().trim().max(200).optional(),

  // browse filters
  region: z.enum(VALID_REGION_SLUGS).optional(),
  city: z.enum(ALL_CITY_SLUGS).optional(),
  // comma-separated category slugs — each must be a known slug
  category: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .every((s) => VALID_CATEGORY_SLUGS.includes(s));
      },
      { message: "category contains unknown slug(s)" }
    ),

  // nearby
  nearby: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(25).optional(),

  // open now
  openNow: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  phtDay: z.enum(DAYS_OF_WEEK).optional(),
  phtTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "phtTime must be HH:MM")
    .optional(),

  // pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// Open-hours helper — applied in JS after pagination in browse/open-now mode
// ---------------------------------------------------------------------------

function isOpenNow(
  openHours: Record<string, { open: string; close: string } | null> | null,
  day: string,
  time: string
): boolean {
  if (!openHours) return false;
  const hours = openHours[day];
  if (!hours) return false;

  const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const nowMins = toMinutes(time);
  const openMins = toMinutes(hours.open);
  // close "24:00" wraps to next day — treat as 1440 mins
  const closeMins = hours.close === "24:00" ? 1440 : toMinutes(hours.close);

  if (closeMins <= openMins) {
    // overnight shift: open > close means we wrap midnight
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse all params into a plain object for Zod
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    q,
    region,
    city,
    category,
    nearby,
    lat,
    lng,
    radius: rawRadius,
    openNow,
    phtDay,
    phtTime,
    page,
    limit,
  } = parsed.data;

  const offset = (page - 1) * limit;

  // ---------------------------------------------------------------------------
  // Validate region/city relationship when both are supplied
  // ---------------------------------------------------------------------------
  if (region && city) {
    const regionObj = getRegionBySlug(region);
    if (regionObj && !regionObj.cities.find((c) => c.slug === city)) {
      return NextResponse.json(
        { error: "city does not belong to the specified region" },
        { status: 400 }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Mode: nearby
  // ---------------------------------------------------------------------------
  if (nearby) {
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "lat and lng are required when nearby=true" },
        { status: 400 }
      );
    }

    const radius = Math.min(rawRadius ?? 5, 25); // km, max 25
    const radiusMeters = radius * 1000;

    type NearbyRow = {
      id: string;
      name: string;
      slug: string;
      categories: string[];
      region: string;
      city: string;
      imageUrl: string | null;
      isPromoted: boolean;
      openHours: Record<string, { open: string; close: string } | null> | null;
      tags: string[];
      distance: number;
    };

    let results: NearbyRow[];

    if (openNow && phtDay && phtTime) {
      results = await db.$queryRaw<NearbyRow[]>`
        SELECT id, name, slug, categories, region, city, image_url AS "imageUrl",
               is_promoted AS "isPromoted", open_hours AS "openHours", tags,
               ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) AS distance
        FROM listings
        WHERE status = 'published'
          AND ST_DWithin(location, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})
          AND open_hours->>${phtDay} IS NOT NULL
          AND open_hours->${phtDay}->>'open' IS NOT NULL
        ORDER BY is_promoted DESC, distance ASC
        LIMIT ${limit}
      `;
    } else {
      results = await db.$queryRaw<NearbyRow[]>`
        SELECT id, name, slug, categories, region, city, image_url AS "imageUrl",
               is_promoted AS "isPromoted", open_hours AS "openHours", tags,
               ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) AS distance
        FROM listings
        WHERE status = 'published'
          AND ST_DWithin(location, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})
        ORDER BY is_promoted DESC, distance ASC
        LIMIT ${limit}
      `;
    }

    // Apply in-memory open-now time comparison after DB-level day filter
    const listings =
      openNow && phtDay && phtTime
        ? results.filter((r) => isOpenNow(r.openHours, phtDay, phtTime))
        : results;

    return NextResponse.json({ listings });
  }

  // ---------------------------------------------------------------------------
  // Mode: full-text search
  // ---------------------------------------------------------------------------
  if (q) {
    type SearchRow = {
      id: string;
      name: string;
      slug: string;
      categories: string[];
      region: string;
      city: string;
      imageUrl: string | null;
      isPromoted: boolean;
      openHours: Record<string, { open: string; close: string } | null> | null;
      tags: string[];
    };

    // Use ILIKE for partial name matching + full-text search for description matching
    const likePattern = `%${q}%`;

    let listings: SearchRow[];
    let total: number;

    if (openNow && phtDay && phtTime) {
      const rows = await db.$queryRaw<SearchRow[]>`
        SELECT id, name, slug, categories, region, city, image_url AS "imageUrl",
               is_promoted AS "isPromoted", open_hours AS "openHours", tags
        FROM listings
        WHERE status = 'published'
          AND (name ILIKE ${likePattern} OR search_vector @@ plainto_tsquery('english', ${q}))
          AND open_hours->>${phtDay} IS NOT NULL
          AND open_hours->${phtDay}->>'open' IS NOT NULL
        ORDER BY is_promoted DESC,
          CASE WHEN name ILIKE ${likePattern} THEN 0 ELSE 1 END,
          ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM listings
        WHERE status = 'published'
          AND (name ILIKE ${likePattern} OR search_vector @@ plainto_tsquery('english', ${q}))
          AND open_hours->>${phtDay} IS NOT NULL
          AND open_hours->${phtDay}->>'open' IS NOT NULL
      `;

      listings = rows.filter((r) => isOpenNow(r.openHours, phtDay, phtTime));
      total = countResult[0]?.count ?? 0;
    } else {
      const rows = await db.$queryRaw<SearchRow[]>`
        SELECT id, name, slug, categories, region, city, image_url AS "imageUrl",
               is_promoted AS "isPromoted", open_hours AS "openHours", tags
        FROM listings
        WHERE status = 'published'
          AND (name ILIKE ${likePattern} OR search_vector @@ plainto_tsquery('english', ${q}))
        ORDER BY is_promoted DESC,
          CASE WHEN name ILIKE ${likePattern} THEN 0 ELSE 1 END,
          ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM listings
        WHERE status = 'published'
          AND (name ILIKE ${likePattern} OR search_vector @@ plainto_tsquery('english', ${q}))
      `;

      listings = rows;
      total = countResult[0]?.count ?? 0;
    }

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  // ---------------------------------------------------------------------------
  // Mode: browse (with optional open-now filter)
  // ---------------------------------------------------------------------------

  // Resolve category slugs to names
  const categoryNames: string[] = [];
  if (category) {
    const slugs = category
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of slugs) {
      const cat = getCategoryBySlug(s);
      if (cat) categoryNames.push(cat.name);
    }
  }

  if (openNow && phtDay && phtTime) {
    // Raw SQL path so we can add open_hours JSON filter before pagination
    type BrowseRow = {
      id: string;
      name: string;
      slug: string;
      categories: string[];
      region: string;
      city: string;
      imageUrl: string | null;
      isPromoted: boolean;
      openHours: Record<string, { open: string; close: string } | null> | null;
      tags: string[];
    };

    const categoryFilter =
      categoryNames.length > 0
        ? Prisma.sql`AND categories && ${categoryNames}::text[]`
        : Prisma.empty;

    const rows = await db.$queryRaw<BrowseRow[]>`
      SELECT id, name, slug, categories, region, city, image_url AS "imageUrl",
             is_promoted AS "isPromoted", open_hours AS "openHours", tags
      FROM listings
      WHERE status = 'published'
        ${region ? Prisma.sql`AND region = ${region}` : Prisma.empty}
        ${city ? Prisma.sql`AND city = ${city}` : Prisma.empty}
        ${categoryFilter}
        AND open_hours->>${phtDay} IS NOT NULL
        AND open_hours->${phtDay}->>'open' IS NOT NULL
      ORDER BY is_promoted DESC, updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await db.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM listings
      WHERE status = 'published'
        ${region ? Prisma.sql`AND region = ${region}` : Prisma.empty}
        ${city ? Prisma.sql`AND city = ${city}` : Prisma.empty}
        ${categoryFilter}
        AND open_hours->>${phtDay} IS NOT NULL
        AND open_hours->${phtDay}->>'open' IS NOT NULL
    `;

    const listings = rows.filter((r) => isOpenNow(r.openHours, phtDay, phtTime));
    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  // Standard Prisma browse path (no open-now filter)
  const where: Prisma.ListingWhereInput = { status: "published" };
  if (region) where.region = region;
  if (city) where.city = city;

  if (categoryNames.length === 1) {
    where.categories = { has: categoryNames[0] };
  } else if (categoryNames.length > 1) {
    where.categories = { hasSome: categoryNames };
  }

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: [{ isPromoted: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        categories: true,
        region: true,
        city: true,
        imageUrl: true,
        isPromoted: true,
        openHours: true,
        tags: true,
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
