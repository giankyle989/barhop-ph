"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Browse", href: "/listings" },
  { label: "Nearby", href: "/nearby" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Prevent background scroll while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold">
          <span className="text-neon-purple">Bar</span>
          <span className="text-neon-pink">Hop</span>
          <span className="text-content"> PH</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={
                isActive(href)
                  ? "font-medium text-neon-purple"
                  : "text-content-secondary transition-colors hover:text-content"
              }
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger — min 44×44px touch target (p-3 = 12px padding + 22px icon = 46px) */}
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-3 text-content-secondary transition-colors hover:text-content sm:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-border bg-surface-raised sm:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col px-4 py-3">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    isActive(href)
                      ? "block py-3 font-medium text-neon-purple"
                      : "block py-3 text-content-secondary transition-colors hover:text-content"
                  }
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
