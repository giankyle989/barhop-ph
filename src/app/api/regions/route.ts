import { REGIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const includeCounts = searchParams.get("counts") === "true";

  if (!includeCounts) {
    return NextResponse.json(
      { data: REGIONS },
      {
        headers: {
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  }

  const counts = await db.listing.groupBy({
    by: ["region", "city"],
    where: { status: "published" },
    _count: true,
  });

  // Build a lookup map: { [region]: { [city]: count } }
  const countMap: Record<string, Record<string, number>> = {};
  for (const row of counts) {
    if (!countMap[row.region]) {
      countMap[row.region] = {};
    }
    countMap[row.region][row.city] = row._count;
  }

  const regionsWithCounts = REGIONS.map((region) => {
    const regionCounts = countMap[region.name] ?? {};
    const regionTotal = Object.values(regionCounts).reduce((sum, n) => sum + n, 0);

    return {
      ...region,
      listingCount: regionTotal,
      cities: region.cities.map((city) => ({
        ...city,
        listingCount: regionCounts[city.name] ?? 0,
      })),
    };
  });

  return NextResponse.json(
    { data: regionsWithCounts },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
