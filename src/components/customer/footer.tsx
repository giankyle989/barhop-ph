import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-raised">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Branding */}
          <div>
            <p className="font-display text-lg font-bold">
              <span className="text-neon-purple">Bar</span>
              <span className="text-neon-pink">Hop</span>
              <span className="text-content"> PH</span>
            </p>
            <p className="mt-2 text-sm text-content-muted">
              Discover bars &amp; clubs across the Philippines.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-secondary">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/listings"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  Browse All
                </Link>
              </li>
              <li>
                <Link
                  href="/nearby"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  Nearby
                </Link>
              </li>
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-secondary">
              Regions
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/listings?region=ncr"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  NCR
                </Link>
              </li>
              <li>
                <Link
                  href="/listings?region=central-visayas"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  Central Visayas
                </Link>
              </li>
              <li>
                <Link
                  href="/listings?region=western-visayas"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  Western Visayas
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-content-muted">
            &copy; {currentYear} BarHop PH. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="text-xs text-content-muted transition-colors hover:text-content-secondary"
          >
            For Business Owners
          </Link>
        </div>
      </div>
    </footer>
  );
}
