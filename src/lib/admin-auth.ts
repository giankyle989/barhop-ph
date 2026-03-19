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
