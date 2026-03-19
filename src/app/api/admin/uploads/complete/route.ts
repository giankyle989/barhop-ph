import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-auth";
import { getCdnUrl } from "@/lib/s3";

const completeSchema = z.object({
  s3Key: z.string().min(1),
});

// POST /api/admin/uploads/complete
export async function POST(request: NextRequest) {
  const auth = await requireAuth("any");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { s3Key } = parsed.data;

  const url = getCdnUrl(s3Key);

  return NextResponse.json({ url });
}
