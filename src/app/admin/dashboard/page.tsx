import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="p-8">
      <h1 className="font-display text-3xl font-bold text-content">Dashboard</h1>
      <p className="mt-2 text-content-secondary">Welcome back.</p>
      <p className="mt-6 text-sm text-content-muted italic">
        Dashboard content will be built in Plan 2.
      </p>
    </main>
  );
}
