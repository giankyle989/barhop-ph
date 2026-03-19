import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-display-sm mb-4">Page not found</h1>
        <p className="text-content-secondary mb-6">
          The admin page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/admin/login"
          className="inline-block bg-neon-purple text-white px-6 py-2 rounded-lg hover:bg-neon-purple/90 transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
