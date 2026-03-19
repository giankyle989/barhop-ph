import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteUserButton } from "./delete-user-button";

export default async function UsersPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "super_admin") redirect("/admin/dashboard");

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { ownedListings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-display-sm font-bold text-content">
          Manage Users
        </h1>
        <Link href="/admin/users/new">
          <Button variant="primary" size="md">
            Create User
          </Button>
        </Link>
      </div>

      {/* Users table */}
      {users.length === 0 ? (
        <div className="rounded-card border border-border bg-surface-card px-6 py-12 text-center">
          <p className="text-content-secondary">No users found.</p>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="px-4 py-3 text-left font-medium text-content-secondary">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-content-secondary">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-content-secondary">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-content-secondary">
                    Listings
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-content-secondary">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-content-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border last:border-b-0 hover:bg-surface-overlay transition-colors ${
                      index % 2 === 0 ? "" : "bg-surface-raised/40"
                    }`}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-content">
                      {user.name}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-content-secondary">
                      {user.email}
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      {user.role === "super_admin" ? (
                        <Badge
                          variant="default"
                          className="bg-neon-purple/20 text-neon-purple"
                        >
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="neon">Admin</Badge>
                      )}
                    </td>

                    {/* Listings count */}
                    <td className="px-4 py-3 text-content-secondary">
                      {user._count.ownedListings}
                    </td>

                    {/* Created date */}
                    <td className="px-4 py-3 text-content-secondary">
                      {new Date(user.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
