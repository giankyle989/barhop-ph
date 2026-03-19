"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        alert(data.error ?? `Delete failed (${res.status})`);
        return;
      }

      // Refresh the server component to reflect the deletion
      router.refresh();
    } catch {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="danger"
      size="sm"
      isLoading={isDeleting}
      disabled={isDeleting}
      onClick={handleDelete}
    >
      Delete
    </Button>
  );
}
