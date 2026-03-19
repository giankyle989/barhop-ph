"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserFormProps {
  user?: {
    id: string;
    name: string;
    email: string;
    /** DB role value: "super_admin" | "admin" */
    role: string;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(user?.id);

  // ── Field state ──────────────────────────────────────────────────────────

  const [name, setName] = useState<string>(user?.name ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<string>(user?.role ?? "admin");

  // ── Submit state ─────────────────────────────────────────────────────────

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Form submission ──────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: Record<string, string> = { name, email, role };

      if (isEditMode) {
        // Only include password in the payload when the user typed something
        if (password) payload.password = password;

        const res = await fetch(`/api/admin/users/${user!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }
      } else {
        payload.password = password;

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }
      }

      router.push("/admin/users");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-lg">
      <div className="space-y-5">
        {/* Name */}
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          autoComplete="name"
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          autoComplete="email"
        />

        {/* Password with show/hide toggle */}
        <div className="w-full">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-content-secondary mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isEditMode
                  ? "Leave blank to keep current password"
                  : "Minimum 6 characters"
              }
              required={!isEditMode}
              autoComplete={isEditMode ? "new-password" : "new-password"}
              className="w-full rounded bg-surface-card border border-border px-3 py-2 pr-10 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors"
            />
            {/* Show/hide toggle — icon-only button with accessible label */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-content-muted hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded-r"
            >
              {showPassword ? (
                /* Eye-slash icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                /* Eye icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {isEditMode && (
            <p className="mt-1 text-xs text-content-muted">
              Leave blank to keep the current password.
            </p>
          )}
        </div>

        {/* Role */}
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { value: "admin", label: "Admin" },
            { value: "super_admin", label: "Super Admin" },
          ]}
        />
      </div>

      {/* Error message */}
      {submitError && (
        <div
          role="alert"
          className="mt-5 rounded bg-status-closed/10 border border-status-closed/30 px-4 py-3 text-sm text-status-closed"
        >
          {submitError}
        </div>
      )}

      {/* Submit */}
      <div className="mt-6 flex gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditMode ? "Save Changes" : "Create User"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={isSubmitting}
          onClick={() => router.push("/admin/users")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
