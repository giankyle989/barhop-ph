"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    role: string;
  };
}

interface NavItem {
  label: string;
  /** Emoji string for internal links; React node for items needing SVG icons. */
  icon: React.ReactNode;
  href: string;
  external?: boolean;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "📊", href: "/admin/dashboard" },
  { label: "Listings", icon: "📋", href: "/admin/listings" },
  { label: "Users", icon: "👥", href: "/admin/users", superAdminOnly: true },
  {
    label: "Analytics",
    icon: <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />,
    href: process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || "https://cloud.umami.is",
    external: true,
    superAdminOnly: true,
  },
];

/** Extracts up to two initials from a full name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Formats the role enum value into a human-readable label. */
function formatRole(role: string): string {
  return role === "super_admin" ? "Super Admin" : "Admin";
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || user.role === "super_admin"
  );

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Redirect regardless of response — cookie is cleared server-side
      router.push("/admin/login");
    }
  }

  const sidebarContent = (
    <aside
      className="flex h-full w-60 flex-col border-r border-border bg-surface-raised"
      aria-label="Admin navigation"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-5 border-b border-border">
        <span className="font-display text-xl font-bold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
          BarHop
        </span>
        <span className="font-display text-xl font-medium text-content-muted">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="flex flex-col gap-1" role="list">
          {visibleNavItems.map((item) => {
            const isActive = !item.external && pathname === item.href;

            if (item.external) {
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-overlay hover:text-content"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {/* External link indicator */}
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-content-muted"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-label="opens in new tab"
                    >
                      <path d="M6 2H2.5A1.5 1.5 0 001 3.5v10A1.5 1.5 0 002.5 15h10A1.5 1.5 0 0014 13.5V10M10 2h4m0 0v4m0-4L7 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-neon-purple/15 text-neon-purple"
                      : "text-content-secondary hover:bg-surface-overlay hover:text-content"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + Logout */}
      <div className="shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar circle with initials */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-neon-purple text-sm font-semibold select-none"
            aria-hidden="true"
          >
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content">{user.name}</p>
            <span className="inline-flex items-center rounded-full bg-neon-purple/20 px-2 py-0.5 text-xs font-medium text-neon-purple">
              {formatRole(user.role)}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-lg px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-status-closed/15 hover:text-status-closed disabled:opacity-50 disabled:pointer-events-none text-left"
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile: hamburger top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center border-b border-border bg-surface-raised px-4 md:hidden">
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-content-secondary hover:bg-surface-overlay hover:text-content transition-colors"
        >
          {/* Hamburger / X icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </>
            )}
          </svg>
        </button>
        <span className="ml-3 font-display text-base font-bold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
          BarHop Admin
        </span>
      </div>

      {/* Mobile: overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-surface/80 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: slide-in sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        {sidebarContent}
      </div>

      {/* Desktop: always-visible sidebar */}
      <div className="hidden md:flex md:shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
