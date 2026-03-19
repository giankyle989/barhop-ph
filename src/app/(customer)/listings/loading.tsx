import { Skeleton } from "@/components/ui";

export default function BrowseLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Skeleton className="h-4 w-32 mb-4" />

      {/* Page heading */}
      <Skeleton className="h-9 w-64 mb-8" />

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden md:block w-64 shrink-0 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>

        {/* Results grid */}
        <div className="flex-1">
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
      </div>
    </div>
  );
}
