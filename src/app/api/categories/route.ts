import { CATEGORIES } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { data: CATEGORIES },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
