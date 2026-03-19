import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { db } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  // Parse body — handle malformed JSON gracefully
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Validate input shape
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // Lookup user — use a constant-time path to avoid user enumeration
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Return the same error shape as a failed password to avoid user enumeration
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Check rate limit: if lockout window has expired, reset the counter
  const now = Date.now();
  const windowExpired =
    user.lastFailedLoginAt === null ||
    now - user.lastFailedLoginAt.getTime() > LOCKOUT_WINDOW_MS;

  if (!windowExpired && user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    const retryAfterMs =
      LOCKOUT_WINDOW_MS - (now - user.lastFailedLoginAt!.getTime());
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: "Account temporarily locked due to too many failed login attempts",
        retryAfterSeconds: retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  // If the lockout window expired, reset counter before verifying password
  if (windowExpired && user.failedLoginCount > 0) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastFailedLoginAt: null },
    });
  }

  // Verify password
  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    // Increment failure counter (re-read from DB to avoid racing on the reset above)
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Success — reset failure counter, issue token, set cookie
  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lastFailedLoginAt: null },
  });

  const token = await signToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
