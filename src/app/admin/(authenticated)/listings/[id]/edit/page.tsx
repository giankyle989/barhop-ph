import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListingForm } from "@/components/admin/listing-form";
import { ListingViewsWidget } from "@/components/admin/listing-views-widget";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionFromCookie();
  if (!session) redirect("/admin/login");

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  // Admin can only edit own listings
  if (session.role === "admin" && listing.ownerId !== session.userId) {
    redirect("/admin/dashboard");
  }

  return (
    <div>
      <h1 className="font-display text-display-sm mb-6">Edit Listing</h1>

      {/* Stats bar — Umami API may be slow, so render in a Suspense boundary */}
      <div className="mb-6 rounded-lg border border-border bg-surface-card px-4 py-3">
        <Suspense
          fallback={
            // Skeleton matching the two-stat layout
            <div className="flex gap-4 text-sm animate-pulse">
              <div className="h-4 w-32 rounded bg-surface-overlay" />
              <div className="h-4 w-36 rounded bg-surface-overlay" />
            </div>
          }
        >
          <ListingViewsWidget
            region={listing.region}
            city={listing.city}
            slug={listing.slug}
          />
        </Suspense>
      </div>

      <ListingForm listing={listing} isAdmin={session.role === "admin"} />
    </div>
  );
}
