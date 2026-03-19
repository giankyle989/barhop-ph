import { Skeleton } from "@/components/ui";

export default function ListingDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Skeleton className="h-4 w-64 mb-4" />

      {/* Hero image */}
      <Skeleton className="mt-4 w-full aspect-[16/6] rounded-card" />

      {/* Venue header */}
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-10 w-80" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-7 w-24 flex-shrink-0" />
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-48 w-full" />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}
