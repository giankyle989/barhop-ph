import { redirect, notFound } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserForm } from "@/components/admin/user-form";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "super_admin") redirect("/admin/dashboard");

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) notFound();

  return (
    <div>
      <h1 className="font-display text-display-sm mb-6">Edit User</h1>
      <UserForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
    </div>
  );
}
