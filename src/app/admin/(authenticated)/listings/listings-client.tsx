"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  status: "draft" | "published" | "archived";
  isPromoted: boolean;
  imageUrl: string | null;
  createdAt: Date;
}

interface ListingsClientProps {
  listings: ListingRow[];
}

// ─── Status badge mapping ─────────────────────────────────────────────────────

const STATUS_VARIANT: Record<ListingRow["status"], BadgeProps["variant"]> = {
  published: "open",
  draft: "featured",
  archived: "default",
};

const STATUS_LABEL: Record<ListingRow["status"], string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingsClient({ listings }: ListingsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Client-side filter — case-insensitive match on name or city
  const filtered = listings.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q);
  });

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete listing "${name}"? This cannot be undone.`)) return;

      setDeleteError(null);
      setDeletingId(id);

      try {
        const res = await fetch(`/api/admin/listings/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `Delete failed (${res.status})`);
        }
        // Refresh server component data without full navigation
        router.refresh();
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete listing."
        );
      } finally {
        setDeletingId(null);
      }
    },
    [router]
  );

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div>
        <input
          type="search"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search listings"
          className="w-full max-w-sm rounded border border-border bg-surface-raised px-3 py-2 text-sm text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-surface"
        />
      </div>

      {/* Error banner */}
      {deleteError && (
        <div
          role="alert"
          className="rounded bg-status-closed/10 border border-status-closed/30 px-4 py-3 text-sm text-status-closed"
        >
          {deleteError}
        </div>
      )}

      {/* Table — horizontally scrollable on mobile */}
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="px-4 py-3 text-left font-medium text-content-secondary w-14">
                Image
              </th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">
                City
              </th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-center font-medium text-content-secondary w-20">
                Promoted
              </th>
              <th className="px-4 py-3 text-right font-medium text-content-secondary w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-content-muted"
                >
                  {search ? "No listings match your search." : "No listings yet."}
                </td>
              </tr>
            ) : (
              filtered.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-raised/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={`${listing.name} thumbnail`}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-cover bg-surface-overlay flex-shrink-0"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-10 w-10 rounded bg-surface-overlay flex items-center justify-center text-content-muted text-xs"
                      >
                        ?
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-content">
                      {listing.name}
                    </span>
                    <span className="ml-2 text-xs text-content-muted hidden sm:inline">
                      {listing.slug}
                    </span>
                  </td>

                  {/* City */}
                  <td className="px-4 py-3 text-content-secondary capitalize">
                    {listing.city}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[listing.status]}>
                      {STATUS_LABEL[listing.status]}
                    </Badge>
                  </td>

                  {/* Promoted star */}
                  <td className="px-4 py-3 text-center">
                    {listing.isPromoted ? (
                      <span
                        aria-label="Promoted"
                        className="text-status-featured text-base leading-none"
                      >
                        ★
                      </span>
                    ) : (
                      <span aria-hidden="true" className="text-content-muted">
                        —
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/listings/${listing.id}/edit`}
                        className="text-sm font-medium text-neon-purple hover:text-neon-purple/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id, listing.name)}
                        disabled={deletingId === listing.id}
                        aria-label={`Delete ${listing.name}`}
                        className="text-sm font-medium text-status-closed hover:text-status-closed/80 transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-closed rounded"
                      >
                        {deletingId === listing.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
