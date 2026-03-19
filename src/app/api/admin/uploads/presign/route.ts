import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-auth";
import { createPresignedUploadUrl } from "@/lib/s3";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

// POST /api/admin/uploads/presign
export async function POST(request: NextRequest) {
  const auth = await requireAuth("any");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { filename, contentType } = parsed.data;

  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "contentType must be an image MIME type" },
      { status: 422 }
    );
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "File extension must be one of: jpg, jpeg, png, webp, gif" },
      { status: 422 }
    );
  }

  const { uploadUrl, s3Key } = await createPresignedUploadUrl(filename, contentType);

  return NextResponse.json({ uploadUrl, s3Key });
}
