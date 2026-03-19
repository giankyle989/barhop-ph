// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth-utils";

describe("signToken + verifyToken", () => {
  it("round-trips userId and role for super_admin", async () => {
    const payload = { userId: "user-123", role: "super_admin" as const };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified!.userId).toBe("user-123");
    expect(verified!.role).toBe("super_admin");
  });

  it("round-trips userId and role for admin", async () => {
    const payload = { userId: "user-456", role: "admin" as const };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified!.userId).toBe("user-456");
    expect(verified!.role).toBe("admin");
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("not.a.valid.token");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken({ userId: "user-789", role: "admin" });
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });
});

describe("hashPassword + verifyPassword", () => {
  it("verifies correct password as true", async () => {
    const password = "MySecurePass123!";
    const hashed = await hashPassword(password);
    const result = await verifyPassword(password, hashed);
    expect(result).toBe(true);
  });

  it("verifies wrong password as false", async () => {
    const hashed = await hashPassword("correct-password");
    const result = await verifyPassword("wrong-password", hashed);
    expect(result).toBe(false);
  });

  it("produces a different hash each call (salted)", async () => {
    const password = "same-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });
});
