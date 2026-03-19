import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { ListingForm } from "@/components/admin/listing-form";

export default async function NewListingPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard");
  }
  return (
    <div>
      <h1 className="font-display text-display-sm mb-6">Create New Listing</h1>
      <ListingForm />
    </div>
  );
}
