import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number;
  accent?: boolean;
}

function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm font-medium text-content-secondary">{label}</p>
        <p
          className={`mt-2 font-display text-5xl font-bold leading-none ${
            accent
              ? "bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent"
              : "text-content"
          }`}
        >
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [total, published, draft, archived, promoted] = await Promise.all([
    db.listing.count(),
    db.listing.count({ where: { status: "published" } }),
    db.listing.count({ where: { status: "draft" } }),
    db.listing.count({ where: { status: "archived" } }),
    db.listing.count({ where: { isPromoted: true } }),
  ]);

  return (
    <div className="max-w-5xl">
      {/* Page heading */}
      <h1 className="font-display text-display-sm font-bold text-content">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-content-secondary">
        Overview of your BarHop PH listings.
      </p>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Listings" value={total} />
        <StatCard label="Published" value={published} accent />
        <StatCard label="Draft" value={draft} />
        <StatCard label="Promoted" value={promoted} accent />
      </div>

      {/* Archived count — informational, not a primary metric */}
      <p className="mt-3 text-sm text-content-muted">
        {archived.toLocaleString()} archived listing{archived !== 1 ? "s" : ""} not shown above.
      </p>

      {/* Quick actions */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-content mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/listings/new"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium bg-neon-purple hover:bg-neon-purple/90 text-white shadow-glow active:shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Create Listing
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium bg-surface-card hover:bg-surface-overlay text-content border border-border hover:border-border-hover transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
