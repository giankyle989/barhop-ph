"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3X3, List } from "lucide-react";

import { SearchBar } from "@/components/customer/search-bar";
import { FilterSidebar } from "@/components/customer/filter-sidebar";
import { ListingCard } from "@/components/customer/listing-card";
import { Pagination } from "@/components/customer/pagination";
import { Skeleton } from "@/components/ui";
import type { ListingCardData } from "@/lib/listing-helpers";

interface BrowseClientProps {
  /** Initial URL search params from the server — used on first render to avoid a flash. */
  initialParams: Record<string, string>;
}

interface ApiResponse {
  listings: ListingCardData[];
  total: number;
  page: number;
  totalPages: number;
}

type ViewMode = "grid" | "list";

/** Number of skeleton cards to show while loading. */
const SKELETON_COUNT = 6;

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function GridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="Loading listings"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[16/9] w-full rounded-card" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-label="Loading listings"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-card bg-surface-card border border-border p-3">
          <Skeleton className="w-36 h-24 shrink-0 sm:w-48 rounded" />
          <div className="flex flex-col gap-2 flex-1 py-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4 mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <p className="text-4xl" aria-hidden="true">
        🍺
      </p>
      <h2 className="font-display text-xl font-semibold text-content">No venues found</h2>
      <p className="text-content-secondary text-sm max-w-sm">
        {hasFilters
          ? "Try adjusting your filters or search query to discover more venues."
          : "There are no published listings yet. Check back soon!"}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/listings")}
          className="mt-2 text-sm text-neon-purple hover:text-neon-purple/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results count
// ---------------------------------------------------------------------------

function ResultsCount({ total, page, totalPages }: { total: number; page: number; totalPages: number }) {
  if (total === 0) return null;
  return (
    <p className="text-sm text-content-secondary" aria-live="polite" aria-atomic="true">
      {total === 1 ? "1 venue" : `${total.toLocaleString()} venues`}
      {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BrowseClient({ initialParams }: BrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------------------------------------------------------------------
  // View mode — persisted in localStorage, not in URL (UI preference only)
  // ---------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("browse-view-mode") as ViewMode) ?? "grid";
    }
    return "grid";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("browse-view-mode", mode);
    }
  };

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (params: URLSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings?${params.toString()}`, {
        // Cache for 60 s in the browser; revalidate in background
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever URL search params change.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    fetchListings(params);
  }, [searchParams, fetchListings]);

  // On initial mount, use initialParams from server to avoid a blank flash before
  // useSearchParams hydrates (they should be identical, but belt-and-suspenders).
  useEffect(() => {
    fetchListings(new URLSearchParams(initialParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Determine whether any filters are active so we can show the right empty state
  const hasFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("region") ||
      searchParams.get("city") ||
      searchParams.get("category") ||
      searchParams.get("openNow")
  );

  // Build a plain searchParams object for Pagination (strips "page" internally)
  const searchParamsObj = Object.fromEntries(searchParams.entries());

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: Search + mobile filter trigger + view toggle */}
      <div className="flex items-center gap-3">
        {/* Search takes all available space */}
        <div className="flex-1">
          <SearchBar defaultValue={searchParams.get("q") ?? ""} />
        </div>

        {/* Mobile filter button is rendered inside FilterSidebar itself */}
        {/* View mode toggle */}
        <div
          className="flex items-center rounded-md border border-border overflow-hidden shrink-0"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => handleViewModeChange("grid")}
            className={`flex items-center justify-center h-9 w-9 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-inset ${
              viewMode === "grid"
                ? "bg-neon-purple text-white"
                : "bg-surface-card text-content-secondary hover:text-content hover:bg-surface-overlay"
            }`}
            aria-pressed={viewMode === "grid"}
            aria-label="Grid view"
          >
            <Grid3X3 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("list")}
            className={`flex items-center justify-center h-9 w-9 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-inset border-l border-border ${
              viewMode === "list"
                ? "bg-neon-purple text-white"
                : "bg-surface-card text-content-secondary hover:text-content hover:bg-surface-overlay"
            }`}
            aria-pressed={viewMode === "list"}
            aria-label="List view"
          >
            <List size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body: sidebar + results */}
      <div className="flex gap-8 items-start">
        {/* FilterSidebar handles both desktop static + mobile drawer */}
        <FilterSidebar />

        {/* Results column */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Mobile filter trigger row + results count */}
          <div className="flex items-center gap-3 md:justify-end">
            {/* FilterSidebar mobile button is shown via its own md:hidden block above */}
            {!loading && data && (
              <ResultsCount total={total} page={currentPage} totalPages={totalPages} />
            )}
          </div>

          {/* Error state */}
          {error && !loading && (
            <div
              role="alert"
              className="rounded-card bg-surface-card border border-red-500/40 p-6 text-center"
            >
              <p className="text-content-secondary text-sm">{error}</p>
              <button
                type="button"
                onClick={() => fetchListings(new URLSearchParams(searchParams.toString()))}
                className="mt-3 text-sm text-neon-purple hover:text-neon-purple/80 underline underline-offset-2 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (viewMode === "grid" ? <GridSkeleton /> : <ListSkeleton />)}

          {/* Results */}
          {!loading && !error && data && data.listings.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <ul
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0"
                  aria-label="Listings"
                >
                  {data.listings.map((listing) => (
                    <li key={listing.id}>
                      <ListingCard listing={listing} variant="grid" />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-4 list-none p-0 m-0" aria-label="Listings">
                  {data.listings.map((listing) => (
                    <li key={listing.id}>
                      <ListingCard listing={listing} variant="list" />
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl="/listings"
                    searchParams={searchParamsObj}
                  />
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !error && data && data.listings.length === 0 && (
            <EmptyState hasFilters={hasFilters} />
          )}
        </div>
      </div>
    </div>
  );
}
