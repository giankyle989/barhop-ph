import { Skeleton } from "@/components/ui";

export default function RegionLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Skeleton className="h-4 w-40 mb-6" />

      {/* Hero */}
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-4 w-56 mb-8" />

      {/* City pills */}
      <div className="mb-10">
        <Skeleton className="h-3 w-28 mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Listing grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-surface-card overflow-hidden">
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
