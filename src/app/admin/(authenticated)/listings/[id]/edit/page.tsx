import { redirect, notFound } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListingForm } from "@/components/admin/listing-form";

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
      <ListingForm listing={listing} isAdmin={session.role === "admin"} />
    </div>
  );
}
