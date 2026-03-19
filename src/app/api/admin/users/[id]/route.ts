import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["super_admin", "admin"]).optional(),
  password: z.string().min(6).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth("super_admin");
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      ownedListings: {
        select: {
          id: true,
          name: true,
          city: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth("super_admin");
  if (authResult instanceof NextResponse) return authResult;

  const { session } = authResult;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, email, role, password } = parsed.data;

  // Verify the target user exists
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Guard: cannot demote the last super_admin
  if (role === "admin" && existing.role === "super_admin") {
    const superAdminCount = await db.user.count({
      where: { role: "super_admin" },
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last super admin" },
        { status: 400 }
      );
    }
  }

  // Guard: cannot change own role (prevents accidental self-demotion via race condition)
  if (role && id === session.userId && role !== existing.role) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Check for duplicate email if email is being changed
  if (email && email !== existing.email) {
    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
  }

  // Build update payload
  const updateData: {
    name?: string;
    email?: string;
    role?: "super_admin" | "admin";
    passwordHash?: string;
  } = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (password !== undefined) updateData.passwordHash = await hashPassword(password);

  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth("super_admin");
  if (authResult instanceof NextResponse) return authResult;

  const { session } = authResult;
  const { id } = await params;

  // Cannot delete self
  if (id === session.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  // Verify user exists
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Cannot delete the last super_admin
  if (existing.role === "super_admin") {
    const superAdminCount = await db.user.count({
      where: { role: "super_admin" },
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last super admin" },
        { status: 400 }
      );
    }
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
