import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListingsClient } from "./listings-client";

export default async function ListingsPage() {
  const session = await getSessionFromCookie();
  // Layout already guards auth, but we need role for data scoping.
  // If session is somehow null here, layout would have redirected already.
  const isSuperAdmin = session?.role === "super_admin";

  const listings = await db.listing.findMany({
    where: isSuperAdmin ? undefined : { ownerId: session?.userId },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
      isPromoted: true,
      imageUrl: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-display-sm text-content">
          Listings{" "}
          <span className="text-content-muted font-normal text-xl">
            ({listings.length})
          </span>
        </h1>
        {isSuperAdmin && (
          <Link
            href="/admin/listings/new"
            className="inline-flex items-center justify-center rounded font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface bg-neon-purple hover:bg-neon-purple/90 text-white shadow-glow active:shadow-none px-4 py-2 text-sm"
          >
            + Create Listing
          </Link>
        )}
      </div>

      <ListingsClient listings={listings} />
    </div>
  );
}
