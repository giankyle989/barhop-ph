import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { UserForm } from "@/components/admin/user-form";

export default async function NewUserPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "super_admin") redirect("/admin/dashboard");
  return (
    <div>
      <h1 className="font-display text-display-sm mb-6">Create New User</h1>
      <UserForm />
    </div>
  );
}
