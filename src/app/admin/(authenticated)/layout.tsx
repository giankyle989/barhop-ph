import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/admin/sidebar";

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/admin/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true },
  });

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: user.name, role: user.role }} />
      {/*
        pt-14 offsets the fixed mobile top bar (h-14).
        On md+ the top bar is hidden so the offset is removed.
      */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-14 md:pt-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
